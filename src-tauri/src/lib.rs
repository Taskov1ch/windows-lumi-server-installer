use fs2::FileExt;
use once_cell::sync::Lazy;
use regex::Regex;
use std::fs::{self, OpenOptions};
use std::io::BufReader;
use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(serde::Serialize, Clone)]
struct JavaCheckResult {
    is_installed: bool,
    version: Option<String>,
    major_version: Option<u32>,
    is_compatible: bool,
    required_version: String,
}

static JAVA_VERSION_REGEX: Lazy<Regex> =
    Lazy::new(|| Regex::new(r#"(?s).*version "(\d+)(?:.(\d+))?.*""#).unwrap());

#[tauri::command]
async fn check_java_version(required_version_str: String) -> JavaCheckResult {
    let required_major: u32 = required_version_str.parse().unwrap_or(21);

    let mut result = JavaCheckResult {
        is_installed: false,
        version: None,
        major_version: None,
        is_compatible: false,
        required_version: required_version_str.clone(),
    };

    let mut cmd = Command::new("java");
    cmd.arg("-version");

    #[cfg(target_os = "windows")]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let output = cmd.output();

    match output {
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);

            if let Some(captures) = JAVA_VERSION_REGEX.captures(&stderr) {
                result.is_installed = true;

                let major_str = captures.get(1).map_or("", |m| m.as_str());
                let mut major_ver: u32 = 0;

                if major_str == "1" {
                    if let Some(minor_match) = captures.get(2) {
                        major_ver = minor_match.as_str().parse().unwrap_or(0);
                    }
                } else {
                    major_ver = major_str.parse().unwrap_or(0);
                }

                result.major_version = Some(major_ver);

                if let Some(full_version_match) = stderr.split('"').nth(1) {
                    result.version = Some(full_version_match.to_string());
                }

                if major_ver >= required_major {
                    result.is_compatible = true;
                }
            }
        }
        Err(_) => {
            result.is_installed = false;
        }
    }

    result
}

#[derive(serde::Deserialize, Debug)]
struct GeneralSettings {
    motd: String,
    #[serde(rename = "server-port")]
    server_port: u16,
    #[serde(rename = "max-players")]
    max_players: u32,
}

#[derive(serde::Deserialize, Debug)]
struct LumiConfig {
    general: GeneralSettings,
}

#[derive(serde::Serialize, Default)]
struct ServerInfo {
    motd: String,
    server_port: u16,
    max_players: u32,
    core_jar: String,
}

#[derive(serde::Serialize)]
#[serde(tag = "status", content = "data")]
#[allow(dead_code)]
enum ScanResult {
    Valid(ServerInfo),
    NoSettings,
    NoJars,
    NeedCoreSelection {
        jars: Vec<String>,
        config: ServerInfo,
    },
}

#[tauri::command]
async fn scan_server_folder(server_path: String) -> ScanResult {
    let path = Path::new(&server_path);

    let mut jar_files: Vec<String> = Vec::new();

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension() {
                    if ext == "jar" {
                        if let Some(name) = p.file_name() {
                            jar_files.push(name.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
    }

    if jar_files.is_empty() {
        return ScanResult::NoJars;
    }

    let settings_path = path.join("settings.yml");

    if !settings_path.exists() {
        return ScanResult::NoSettings;
    }

    let file = match fs::File::open(&settings_path) {
        Ok(f) => f,
        Err(_) => return ScanResult::NoSettings,
    };
    let reader = BufReader::new(file);

    let config: LumiConfig = match serde_yaml::from_reader(reader) {
        Ok(c) => c,
        Err(e) => {
            println!("YAML Parse Error: {:?}", e);
            return ScanResult::NoSettings;
        }
    };

    let server_info = ServerInfo {
        motd: config.general.motd,
        server_port: config.general.server_port,
        max_players: config.general.max_players,
        core_jar: String::new(),
    };

    ScanResult::NeedCoreSelection {
        jars: jar_files,
        config: server_info,
    }
}

#[tauri::command]
async fn check_server_status(server_path: String) -> String {
    let path = Path::new(&server_path).join("players").join("LOCK");

    if !path.exists() {
        return "unknown".to_string();
    }

    let file = match OpenOptions::new().write(true).open(&path) {
        Ok(f) => f,
        Err(_) => return "unknown".to_string(),
    };

    match file.try_lock_exclusive() {
        Ok(_) => "offline".to_string(),
        Err(_) => "online".to_string(),
    }
}

#[tauri::command]
fn launch_server_terminal(path: String, core_jar: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let java_cmd = format!("java -Xmx2G -Xms2G -jar \"{}\" nogui", core_jar);

        let ps_script = format!(
        "$host.UI.RawUI.WindowTitle = 'Minecraft Server'; Set-Location -Path '{}'; {}; Read-Host 'Нажмите Enter для выхода...'",
        path,
        java_cmd
    );

        Command::new("powershell")
            .args(["-NoLogo", "-NoExit", "-Command", &ps_script])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        let shell_cmd = format!("cd \"{}\" && {}; exec bash", path, java_cmd);

        let terminals = [
            ("gnome-terminal", vec!["--", "bash", "-c"]),
            ("konsole", vec!["-e", "bash", "-c"]),
            ("xfce4-terminal", vec!["-x", "bash", "-c"]),
            ("xterm", vec!["-e", "bash", "-c"]),
            ("kitty", vec!["-e", "bash", "-c"]),
            ("alacritty", vec!["-e", "bash", "-c"]),
        ];

        let mut launched = false;

        for (term, args) in terminals {
            let mut cmd = Command::new(term);
            cmd.args(&args).arg(&shell_cmd);

            if cmd.spawn().is_ok() {
                launched = true;
                break;
            }
        }

        if !launched {
            Command::new("x-terminal-emulator")
                .args(["-e", "bash", "-c", &shell_cmd])
                .spawn()
                .map_err(|_| "No supported terminal emulator found. Please install gnome-terminal, konsole, or xterm.".to_string())?;
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_java_version,
            scan_server_folder,
            check_server_status,
            launch_server_terminal
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
