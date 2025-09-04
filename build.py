import PyInstaller.__main__

MAIN_SCRIPT = "main.py"
OUTPUT_NAME = "LumiInstaller"

opts = [
	MAIN_SCRIPT,
	"--onefile",
	"--noconsole",
	"--clean",
	"--uac-admin",
	f"--name={OUTPUT_NAME}",
	"--icon=resources/assets/icon.ico",
	"--add-data=installer_config.json;.",
	"--add-data=resources;resources",
	"--version-file=version.txt"
]

if __name__ == "__main__":
	PyInstaller.__main__.run(opts)