use once_cell::sync::Lazy;
use regex::Regex;
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
            } else {
                eprintln!("[RUST DEBUG] Regex НЕ нашел совпадения в stderr.");
            }
        }
        Err(_) => {
            result.is_installed = false;
        }
    }

    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![check_java_version])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
