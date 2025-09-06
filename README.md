# 🌟 LumiServer Installer

**Graphical installer for the Minecraft Bedrock Edition core [Lumi](https://github.com/KoshakMineDEV/Lumi).**  
A simple and convenient tool that automates the setup of your server and all required components.

---

## ⚠️ Disclaimer

This project is **not affiliated** with the official [Lumi project](https://github.com/KoshakMineDEV/Lumi) or its [contributors](https://github.com/KoshakMineDEV/Lumi/graphs/contributors).  
Any similarities are purely coincidental.

---

## 🌍 Language Notice

Currently, the installer is available **only in Russian**.  
Multi-language support (including English) will be added in a future release.

---

## 🚀 Features

- Automatic check and installation of Java (21+)
- Fetching the latest Lumi core release from GitHub
- Choose installation directory
- Detailed installation logs for troubleshooting
- Pre-configured server start scripts (Windows `.cmd` and Linux `.sh`)

---

## 📦 Installation

### Requirements

- Python 3.8 or newer
- Windows 7 / 8 / 10 / 11  
  (Linux support is experimental)

### Install dependencies

```bash
pip install -r requirements.txt
````

### Run the installer (source)

```bash
python main.py
```

### Build executable

```bash
python build.py
```

After building, an executable file will be created:

* **Windows:** `LumiInstaller.exe`
* **Linux:** `LumiInstaller`

These can be run without Python installed.

---

## 🔧 Development

### Main dependencies

* [`customtkinter`](https://github.com/TomSchimansky/CustomTkinter) – modern GUI framework
* [`requests`](https://pypi.org/project/requests/) – HTTP client for downloads
* [`pyinstaller`](https://pyinstaller.org/) – build standalone executables

### Build system

All PyInstaller options are already configured inside `build.py`.
The final application bundles all required resources and is ready to launch.

---

## 🚀 Running the server

After installation:

1. Go to your server folder
2. Run `start.cmd` (Windows) or `start.sh` (Linux)
3. By default, the server uses **4 GB RAM**. You can change this in the start script.

---

## 📝 License

This project does not have a separate license.
The Lumi core is distributed under **LGPL-3.0**.

---

## 🤝 Support

If you run into issues:

1. Make sure **Java 21+** is installed
2. Check your internet connection
3. Verify you have write permissions in the selected folder
4. Check `installer.log` for detailed error messages

---

**Created for the youngest players, and the [Talk 24Serv](https://talk.24serv.pro/) community ❤️**
