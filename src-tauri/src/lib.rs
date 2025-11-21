use fs2::FileExt;
use once_cell::sync::Lazy;
use regex::Regex;
use std::fs::{self, OpenOptions};
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

#[derive(serde::Serialize, Default, Clone)]
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
    Valid {
        config: ServerInfo,
        jars: Vec<String>,
    },
    NoSettings,
    NoJars,
    NeedCoreSelection {
        jars: Vec<String>,
        config: ServerInfo,
    },
}

#[tauri::command]
async fn scan_server_folder(server_path: String) -> Result<ScanResult, String> {
    let path = Path::new(&server_path);

    let mut jar_files: Vec<String> = Vec::new();

    if !path.exists() {
        return Ok(ScanResult::NoSettings);
    }

    let entries = fs::read_dir(path).map_err(|e| format!("Read dir error: {}", e))?;
    for entry in entries.flatten() {
        let p = entry.path();
        if p.is_file() {
            if let Some(ext) = p.extension().and_then(|s| s.to_str()) {
                if ext.eq_ignore_ascii_case("jar") {
                    if let Some(name) = p.file_name().and_then(|n| n.to_str()) {
                        jar_files.push(name.to_string());
                    }
                }
            }
        }
    }

    if jar_files.is_empty() {
        return Ok(ScanResult::NoJars);
    }

    let settings_path = path.join("settings.yml");

    if !settings_path.exists() {
        return Ok(ScanResult::NoSettings);
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings.yml: {}", e))?;

    let config: LumiConfig =
        serde_yaml::from_str(&content).map_err(|e| format!("YAML parse error: {}", e))?;

    let server_info = ServerInfo {
        motd: config.general.motd,
        server_port: config.general.server_port,
        max_players: config.general.max_players,
        core_jar: String::new(),
    };

    if jar_files.len() == 1 {
        let mut chosen = server_info.clone();
        chosen.core_jar = jar_files[0].clone();
        return Ok(ScanResult::Valid {
            config: chosen,
            jars: jar_files,
        });
    }

    Ok(ScanResult::NeedCoreSelection {
        jars: jar_files,
        config: server_info,
    })
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
async fn launch_server_terminal(path: String, core_jar: String) -> Result<u32, String> {
    let server_path = Path::new(&path);
    let jar_path = server_path.join(&core_jar);

    if !jar_path.exists() {
        return Err(format!(
            "Core file not found: {}\nPlease check server settings or select another core.",
            jar_path.display()
        ));
    }

    #[cfg(target_os = "windows")]
    {
        let java_cmd = format!("java -Xmx2G -Xms2G -jar \"{}\" nogui", core_jar);

        let ps_script = format!(
            "$host.UI.RawUI.WindowTitle = 'Minecraft Server'; Set-Location -Path '{}'; {}; Read-Host 'Press Enter to exit...'",
            path,
            java_cmd
        );

        let child = Command::new("powershell")
            .args(["-NoLogo", "-NoExit", "-Command", &ps_script])
            .spawn()
            .map_err(|e| e.to_string())?;

        Ok(child.id())
    }

    #[cfg(target_os = "linux")]
    {
        let shell_cmd = format!(
            "cd \"{}\" && {}; exec bash",
            path,
            format!("java -Xmx2G -Xms2G -jar \"{}\" nogui", core_jar)
        );

        let terminals = [
            ("gnome-terminal", vec!["--", "bash", "-c"]),
            ("konsole", vec!["-e", "bash", "-c"]),
            ("xfce4-terminal", vec!["-x", "bash", "-c"]),
            ("xterm", vec!["-e", "bash", "-c"]),
            ("kitty", vec!["-e", "bash", "-c"]),
            ("alacritty", vec!["-e", "bash", "-c"]),
        ];

        for (term, args) in terminals {
            let mut cmd = Command::new(term);
            cmd.args(&args).arg(&shell_cmd);

            if let Ok(child) = cmd.spawn() {
                return Ok(child.id());
            }
        }

        let child = Command::new("x-terminal-emulator")
            .args(["-e", "bash", "-c", &shell_cmd])
            .spawn()
            .map_err(|_| "No supported terminal emulator found.".to_string())?;

        Ok(child.id())
    }
}

#[tauri::command]
async fn stop_server(pid: u32) -> Result<(), String> {
    println!("Force killing server process with PID: {}", pid);

    #[cfg(target_os = "windows")]
    {
        let output = Command::new("taskkill")
            .args(["/PID", &pid.to_string(), "/F", "/T"])
            .output()
            .map_err(|e| e.to_string())?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            println!(
                "Taskkill warning (process might be already dead): {}",
                stderr
            );
        }
    }

    #[cfg(target_os = "linux")]
    {
        let output = Command::new("kill").args(["-9", &pid.to_string()]).output();

        if let Err(e) = output {
            println!("Kill command failed (process might be already dead): {}", e);
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
            launch_server_terminal,
            stop_server
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
