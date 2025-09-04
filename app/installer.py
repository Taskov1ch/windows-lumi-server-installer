import json
import logging
import os
import queue
import subprocess
from tkinter import filedialog, messagebox
import customtkinter as ctk

from app.downloader_thread import DownloaderThread
from main import FileUtils, GitHubAPI, JavaUtils, get_resource_path

class InstallerApp(ctk.CTk):
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

		try:
			icon_path = get_resource_path("resources/assets/icon.ico")
			if os.path.exists(icon_path):
				self.iconbitmap(icon_path)
		except Exception as e:
			logging.warning(f"Could not load icon: {e}")

		self.install_path = self.config["default_install_path"]
		self.current_download = None
		self.download_queue = queue.Queue()
		self.current_step_index = 0

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

		if "get_download_url" not in dir(GitHubAPI):
			messagebox.showwarning("Отсутствуют утилиты", "Вспомогательные файлы не найдены. Функциональность будет ограничена.")

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

		def show_new_step():
			self.current_step_index = index
			frame = self.steps[index]
			frame.tkraise()

			if index == 2: self._run_java_check()
			if index == 5: self._start_core_download()
			if index == 6: self._create_service_files()

		show_new_step()

	def _run_java_check(self):
		found, version_str, major_version = JavaUtils.check_java_version()
		if found and JavaUtils.is_version_supported(major_version, self.config["required_java_version"]):
			logging.info(f"Найдена подходящая версия Java: {version_str}")
			messagebox.showinfo("Java найдена", f"Обнаружена Java версии {version_str}. Установка Java будет пропущена.")
			self.go_to_step(4)
		else:
			logging.warning("Подходящая версия Java не найдена.")
			if version_str:
				messagebox.showwarning("Java не найдена", f"Найдена неподходящая версия Java ({version_str}). Требуется версия {self.config['required_java_version']} или выше. Мы поможем это исправить!")
			else:
				messagebox.showwarning(
					"Java не найдена",
					"У вас не установлена Java.\n"
					"Если вы уверены, что Java установлена, попробуйте перезапустить этот установщик. "
					"Либо же просто пропустите этот шаг"
				)
			self.go_to_step(3)

	def _create_service_files(installer: "InstallerApp"):
		try:
			start_cmd_src_path = get_resource_path('resources/server_files/start.cmd')

			with open(start_cmd_src_path, 'r', encoding='utf-8') as f:
				start_cmd_content = f.read().replace('{MEMORY}', '4').replace('{CORE_NAME}', installer.config['server_jar_name'])

			start_cmd_dst = os.path.join(installer.install_path, 'start.cmd')
			FileUtils.write_text_file(start_cmd_dst, start_cmd_content)
			logging.info("start.cmd создан.")
			installer.go_to_step(7)
		except Exception as e:
			logging.error(f"Ошибка при создании служебных файлов: {e}")
			messagebox.showerror("Ошибка", f"Не удалось создать файлы: {e}")
			installer.go_to_step(4)

	def _set_java_ui_state(self, state):
		if state == "downloading":
			self.java_selection_frame.pack_forget()
			self.java_nav_frame.pack_forget()
			self.java_progress_frame.pack(pady=150, padx=self.PADDING_X, fill="x")
		else:
			self.java_progress_frame.pack_forget()
			self.java_selection_frame.pack(pady=self.PADDING_Y, padx=self.PADDING_X, fill="x")
			self.java_nav_frame.pack(side="bottom", fill="x", padx=self.PADDING_X, pady=self.PADDING_Y)

	def _download_java(self):
		version = self.java_version_var.get()
		url = self.config["java_urls"].get(version)
		if not url:
			messagebox.showerror("Ошибка", f"URL для Java {version} не найден в конфигурации.")
			return

		save_path = os.path.join(os.path.expanduser("~"), "Downloads", os.path.basename(url))

		self._set_java_ui_state("downloading")
		self.java_download_label.configure(text="Подготовка к скачиванию...")
		self.java_progress.set(0)
		self.current_download = "java"

		downloader = DownloaderThread(url, save_path, self.download_queue)
		downloader.start()

	def _install_java(self, installer_path):
		logging.info(f"Запуск установщика Java: {installer_path}")
		try:
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
		except Exception as e:
			logging.error(f"Ошибка при запуске установщика Java: {e}")
			try:
				download_folder = os.path.dirname(installer_path)
				os.startfile(download_folder)
				messagebox.showerror(
					"Ошибка запуска",
					f"Не удалось автоматически запустить установщик Java: {e}\n\n"
					f"Мы открыли для вас папку '{download_folder}'.\n\n"
					f"Пожалуйста, запустите '{os.path.basename(installer_path)}' вручную и завершите установку.\n\n"
					"После этого нажмите 'OK' здесь."
				)
				self.go_to_step(2)
			except Exception as e2:
				logging.error(f"Не удалось даже открыть папку с загрузками: {e2}")
				messagebox.showerror("Критическая ошибка", f"Не удалось запустить установщик: {e}\nИ не удалось открыть папку: {e2}")
		finally:
			self._set_java_ui_state("idle")

	def _select_install_path(self):
		path = filedialog.askdirectory(initialdir=self.config["default_install_path"])
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

		core_downloader = DownloaderThread(download_url, save_path, self.download_queue)
		core_downloader.start()
		logging.info(f"Начало скачивания ядра с {download_url}")

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