import json
import logging
import os
import queue
import subprocess
import tarfile
import shutil
import stat
from tkinter import filedialog, messagebox
import customtkinter as ctk
import platform

from app.downloader_thread import DownloaderThread
from main import FileUtils, GitHubAPI, JavaUtils, get_resource_path


class InstallerApp(ctk.CTk):
	IS_WINDOWS = platform.system() == "Windows"
	IS_LINUX = platform.system() == "Linux"

	def __init__(self):
		from app.steps import Steps

		super().__init__()

		ctk.set_appearance_mode("System")
		ctk.set_default_color_theme("blue")

		self.FONT_TITLE = ctk.CTkFont(size=30, weight="bold")
		self.FONT_HEADER = ctk.CTkFont(size=16, weight="bold")
		self.FONT_BODY = ctk.CTkFont(size=14)
		self.PADDING_X = 20
		self.PADDING_Y = 10

		# ── Конфиг ────────────────────────────────────────────────────────────────
		try:
			with open(get_resource_path("installer_config.json"), "r", encoding="utf-8") as f:
				self.config = json.load(f)
		except (FileNotFoundError, json.JSONDecodeError) as e:
			messagebox.showerror("Ошибка конфигурации", f"Не удалось загрузить installer_config.json: {e}")
			self.after(10, self.destroy)
			return

		self.title(f"{self.config['app_name']} v{self.config['version']}")
		self.geometry("600x450")
		self.resizable(False, False)

		# Иконка (на Linux может не подойти .ico — оборачиваем в try)
		try:
			icon_path = get_resource_path("resources/assets/icon.ico")
			if os.path.exists(icon_path) and self.IS_WINDOWS:
				self.iconbitmap(icon_path)
		except Exception as e:
			logging.warning(f"Could not load icon: {e}")

		# Базовая папка установки в зависимости от ОС
		if self.IS_WINDOWS:
			self.install_path = self.config["default_install_path"]["windows"]
		elif self.IS_LINUX:
			self.install_path = self.config["default_install_path"]["linux"]
		else:
			system = platform.system()
			logging.error(f"Не поддерживаемая ОС: {system}")
			messagebox.showerror("Ошибка", f"ОС {system} пока не поддерживается.")
			self.after(10, self.destroy)
			return

		self.current_download = None   # "java" | "core" | None
		self.download_queue = queue.Queue()
		self.current_step_index = 0

		# ── Контейнер для шагов ──────────────────────────────────────────────────
		self.container = ctk.CTkFrame(self)
		self.container.pack(fill="both", expand=True, padx=10, pady=10)
		self.container.grid_rowconfigure(0, weight=1)
		self.container.grid_columnconfigure(0, weight=1)

		self.steps = []
		for create_step_func in [
			Steps.create_welcome_step, Steps.create_license_step,
			Steps.create_java_check_step, Steps.create_java_install_step,
			Steps.create_path_selection_step, Steps.create_core_download_step,
			Steps.create_file_creation_step, Steps.create_final_step
		]:
			frame = ctk.CTkFrame(self.container, fg_color="transparent")
			frame.grid(row=0, column=0, sticky="nsew")
			create_step_func(self, frame)
			self.steps.append(frame)

		self.go_to_step(0)
		self._check_download_queue()

		# Предупреждение, если utils-пакет заглушечный
		if "get_download_url" not in dir(GitHubAPI):
			messagebox.showwarning("Отсутствуют утилиты", "Вспомогательные файлы не найдены. Функциональность будет ограничена.")

	# ─────────────────────────────────────────────────────────────────────────────
	# Навигация по шагам
	# ─────────────────────────────────────────────────────────────────────────────
	def create_navigation_buttons(self, parent, back_func, next_func, next_text="Далее"):
		nav_frame = ctk.CTkFrame(parent, fg_color="transparent")
		nav_frame.pack(side="bottom", fill="x", padx=self.PADDING_X, pady=self.PADDING_Y)

		if back_func:
			back_button = ctk.CTkButton(nav_frame, text="Назад", command=back_func, width=100)
			back_button.pack(side="left")

		if next_func:
			next_button = ctk.CTkButton(nav_frame, text=next_text, command=next_func, width=100)
			next_button.pack(side="right")

		return nav_frame

	def go_to_step(self, index):
		if not (0 <= index < len(self.steps)):
			return

		self.current_step_index = index
		frame = self.steps[index]
		frame.tkraise()

		# Автоматические действия при входе на некоторые шаги
		if index == 2:  # Java check
			self._run_java_check()
		elif index == 5:  # Core download
			self._start_core_download()
		elif index == 6:  # Create files
			self._create_service_files()

	# ─────────────────────────────────────────────────────────────────────────────
	# Проверка Java
	# ─────────────────────────────────────────────────────────────────────────────
	def _run_java_check(self):
		found, version_str, major_version = JavaUtils.check_java_version()
		if found and JavaUtils.is_version_supported(major_version, self.config["required_java_version"]):
			logging.info(f"Найдена подходящая версия Java: {version_str}")
			messagebox.showinfo("Java найдена", f"Обнаружена Java версии {version_str}. Установка Java будет пропущена.")
			self.go_to_step(4)  # к выбору пути
		else:
			logging.warning("Подходящая версия Java не найдена.")
			if version_str:
				messagebox.showwarning(
					"Java не найдена",
					f"Найдена неподходящая версия Java ({version_str}). "
					f"Требуется версия {self.config['required_java_version']} или выше. Мы поможем это исправить!"
				)
			else:
				messagebox.showwarning(
					"Java не найдена",
					"У вас не установлена Java.\n"
					"Если вы уверены, что Java установлена, попробуйте перезапустить этот установщик. "
					"Либо же просто пропустите этот шаг."
				)
			self.go_to_step(3)  # шаг установки Java

	# ─────────────────────────────────────────────────────────────────────────────
	# Создание служебных файлов (start.cmd / start.sh)
	# ─────────────────────────────────────────────────────────────────────────────
	def _create_service_files(installer: "InstallerApp"):
		try:
			if installer.IS_WINDOWS:
				template = get_resource_path('resources/server_files/start.cmd')
				dst = os.path.join(installer.install_path, 'start.cmd')
			else:
				template = get_resource_path('resources/server_files/start.sh')
				dst = os.path.join(installer.install_path, 'start.sh')

			with open(template, 'r', encoding='utf-8') as f:
				content = (
					f.read()
					.replace('{MEMORY}', '4')
					.replace('{CORE_NAME}', installer.config['server_jar_name'])
				)

			FileUtils.write_text_file(dst, content)
			if installer.IS_LINUX:
				# Делает start.sh исполняемым
				st = os.stat(dst)
				os.chmod(dst, st.st_mode | stat.S_IEXEC)

			logging.info(f"{os.path.basename(dst)} создан.")
			installer.go_to_step(7)
		except Exception as e:
			logging.error(f"Ошибка при создании служебных файлов: {e}")
			messagebox.showerror("Ошибка", f"Не удалось создать файлы: {e}")
			installer.go_to_step(4)

	# ─────────────────────────────────────────────────────────────────────────────
	# UI-состояние блока установки Java
	# ─────────────────────────────────────────────────────────────────────────────
	def _set_java_ui_state(self, state: str):
		if state == "downloading":
			self.java_selection_frame.pack_forget()
			self.java_nav_frame.pack_forget()
			self.java_progress_frame.pack(pady=150, padx=self.PADDING_X, fill="x")
		else:
			self.java_progress_frame.pack_forget()
			self.java_selection_frame.pack(pady=self.PADDING_Y, padx=self.PADDING_X, fill="x")
			self.java_nav_frame.pack(side="bottom", fill="x", padx=self.PADDING_X, pady=self.PADDING_Y)

	# ─────────────────────────────────────────────────────────────────────────────
	# Скачивание Java (учёт ОС и архитектуры)
	# ─────────────────────────────────────────────────────────────────────────────
	def _download_java(self):
		version = self.java_version_var.get()

		if self.IS_WINDOWS:
			url = self.config["java_urls"]["windows"].get(version)
		elif self.IS_LINUX:
			arch = platform.machine().lower()
			if arch in ("x86_64", "amd64"):
				arch_key = "x64"
			elif arch in ("aarch64", "arm64"):
				arch_key = "aarch64"
			else:
				messagebox.showerror("Ошибка", f"Архитектура {arch} не поддерживается.")
				return
			url = self.config["java_urls"]["linux"][version].get(arch_key)
		else:
			messagebox.showerror("Ошибка", "Ваша ОС пока не поддерживается.")
			return

		if not url:
			logging.error(f"URL для Java {version} не найден в конфигурации.")
			messagebox.showerror("Ошибка", f"URL для Java {version} не найден в конфигурации.")
			return

		save_path = os.path.join(os.path.expanduser("~"), "Downloads", os.path.basename(url))

		self._set_java_ui_state("downloading")
		self.java_download_label.configure(text="Подготовка к скачиванию...")
		self.java_progress.set(0)
		self.current_download = "java"

		DownloaderThread(url, save_path, self.download_queue).start()

	# ─────────────────────────────────────────────────────────────────────────────
	# Установка Java (Windows: запускаем MSI; Linux: распаковываем tar.gz)
	# ─────────────────────────────────────────────────────────────────────────────
	def _install_java(self, installer_path):
		logging.info(f"Обработка установщика Java: {installer_path}")
		try:
			if self.IS_WINDOWS:
				# MSI/EXE запуск
				if installer_path.lower().endswith(".msi"):
					subprocess.Popen(["msiexec", "/i", installer_path])
				else:
					subprocess.Popen([installer_path])

				messagebox.showinfo(
					"Установка Java",
					"Установщик Java запущен.\n\n"
					"Пожалуйста, пройдите все шаги в окне установщика.\n\n"
					"Нажмите 'OK' здесь только после завершения установки."
				)
				self.go_to_step(2)

			elif self.IS_LINUX:
				# Для Linux качаем tar.gz и распаковываем в папку установки
				if not installer_path.endswith(".tar.gz"):
					messagebox.showerror("Ошибка", "Ожидался архив .tar.gz для Linux.")
					return

				java_dest = os.path.join(self.install_path, "java")
				os.makedirs(self.install_path, exist_ok=True)

				with tarfile.open(installer_path, "r:gz") as tar:
					# Имя корневой папки внутри архива (обычно zulu-xx-xx...)
					members = tar.getmembers()
					if not members:
						raise RuntimeError("Архив Java пуст.")
					root = members[0].name.split('/')[0].strip("/")
					tar.extractall(self.install_path)

				extracted_root = os.path.join(self.install_path, root)
				if not os.path.isdir(extracted_root):
					raise RuntimeError(f"Не найдена распакованная папка {extracted_root}")

				# Заменяем/создаём <install>/java
				if os.path.isdir(java_dest):
					shutil.rmtree(java_dest, ignore_errors=True)
				shutil.move(extracted_root, java_dest)

				messagebox.showinfo(
					"Готово",
					"Java распакована в подкаталог 'java' в папке установки.\n"
					"Запуск сервера будет использовать локальную Java при наличии."
				)
				self.go_to_step(2)

		except Exception as e:
			logging.error(f"Ошибка при установке Java: {e}")
			try:
				download_folder = os.path.dirname(installer_path)
				self._open_folder(download_folder)
				messagebox.showerror(
					"Ошибка установки",
					f"Не удалось автоматически установить Java: {e}\n\n"
					f"Мы открыли для вас папку '{download_folder}'.\n\n"
					f"Попробуйте установить/распаковать Java вручную, затем повторите проверку."
				)
				self.go_to_step(2)
			except Exception as e2:
				logging.error(f"Не удалось открыть папку с загрузками: {e2}")
				messagebox.showerror("Критическая ошибка", f"Не удалось установить Java: {e}\nИ открыть папку: {e2}")
		finally:
			self._set_java_ui_state("idle")

	# ─────────────────────────────────────────────────────────────────────────────
	# Выбор пути установки
	# ─────────────────────────────────────────────────────────────────────────────
	def _select_install_path(self):
		# initialdir должен быть не dict, а строка — берём текущий self.install_path
		path = filedialog.askdirectory(initialdir=self.install_path)
		if path:
			self.install_path = path
			self.path_entry.delete(0, "end")
			self.path_entry.insert(0, self.install_path)

	def _confirm_path(self):
		self.install_path = self.path_entry.get()
		if not FileUtils.create_directory(self.install_path):
			messagebox.showerror("Ошибка", "Не удалось создать директорию. Проверьте права доступа.")
			return
		logging.info(f"Папка для установки: {self.install_path}")
		self.go_to_step(5)

	# ─────────────────────────────────────────────────────────────────────────────
	# Скачивание ядра
	# ─────────────────────────────────────────────────────────────────────────────
	def _start_core_download(self):
		repo_owner, repo_name = self.config["github_repo"].split("/")
		github_api = GitHubAPI(repo_owner, repo_name)

		download_url = github_api.get_download_url()
		if not download_url:
			messagebox.showerror("Ошибка", "Не удалось получить ссылку на скачивание ядра с GitHub.")
			self.go_to_step(4)
			return

		save_path = os.path.join(self.install_path, self.config["server_jar_name"])
		self.current_download = "core"
		DownloaderThread(download_url, save_path, self.download_queue).start()
		logging.info(f"Начало скачивания ядра с {download_url}")

	# ─────────────────────────────────────────────────────────────────────────────
	# Обработка очереди прогресса загрузок
	# ─────────────────────────────────────────────────────────────────────────────
	def _check_download_queue(self):
		try:
			msg = self.download_queue.get_nowait()

			if msg["type"] == "progress":
				percentage = msg["percentage"]
				speed = msg["speed"]
				if self.current_download == "java":
					self.java_progress.set(percentage / 100)
					self.java_download_label.configure(text=f"Скачивание Java... {percentage}% ({speed})")
				elif self.current_download == "core":
					self.core_progress.set(percentage / 100)
					self.core_download_label.configure(text=f"Скачивание ядра... {percentage}% ({speed})")

			elif msg["type"] == "finished":
				if self.current_download == "java":
					self._install_java(msg["path"])
				elif self.current_download == "core":
					self.go_to_step(6)

			elif msg["type"] == "error":
				messagebox.showerror("Ошибка", msg["message"])
				if self.current_download == "java":
					self._set_java_ui_state("idle")
					self.go_to_step(3)
				else:
					self.go_to_step(4)

		except queue.Empty:
			pass
		finally:
			self.after(100, self._check_download_queue)

	# ─────────────────────────────────────────────────────────────────────────────
	# Утилиты
	# ─────────────────────────────────────────────────────────────────────────────
	def _open_folder(self, path: str):
		try:
			if self.IS_WINDOWS:
				os.startfile(path)
			elif self.IS_LINUX:
				subprocess.Popen(["xdg-open", path])
		except Exception as e:
			logging.warning(f"Не удалось открыть папку '{path}': {e}")
