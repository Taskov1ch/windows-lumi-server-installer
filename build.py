import PyInstaller.__main__
import sys
import os

MAIN_SCRIPT = "main.py"
OUTPUT_NAME = "LumiInstaller"

def data_arg(src, dest):
	return f"--add-data={src}{os.pathsep}{dest}"

common_opts = [
	MAIN_SCRIPT,
	"--onefile",
	"--clean",
	f"--name={OUTPUT_NAME}",
	data_arg("installer_config.json", "."),
	data_arg("resources", "resources")
]

if __name__ == "__main__":
	target = sys.argv[sys.argv.index("--target") + 1] if "--target" in sys.argv else "exe"

	opts = common_opts.copy()

	if target == "exe":
		opts += [
			"--noconsole",
			"--uac-admin",
			"--icon=resources/assets/icon.ico"
		]
	elif target == "linux":
		pass
	else:
		print(f"Unknown target: {target}")
		sys.exit(1)

	PyInstaller.__main__.run(opts)
