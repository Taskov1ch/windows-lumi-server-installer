import os
import customtkinter as ctk

from app.installer import InstallerApp
from main import get_resource_path

class Steps:
	@staticmethod
	def create_welcome_step(installer: "InstallerApp", parent):
		title = ctk.CTkLabel(parent, text=installer.config['app_name'], font=installer.FONT_TITLE)
		title.pack(pady=(80, 0), padx=installer.PADDING_X)
		version = ctk.CTkLabel(parent, text=f"Версия {installer.config['version']}", font=installer.FONT_BODY)
		version.pack(pady=installer.PADDING_Y, padx=installer.PADDING_X)
		start_button = ctk.CTkButton(parent, text="Начать установку", command=lambda: installer.go_to_step(1), height=40)
		start_button.pack(pady=50, padx=installer.PADDING_X)

	@staticmethod
	def create_license_step(installer: "InstallerApp", parent):
		label = ctk.CTkLabel(parent, text="Лицензионное соглашение (LGPL-3.0):", font=installer.FONT_HEADER)
		label.pack(pady=(installer.PADDING_Y, 5), padx=installer.PADDING_X, anchor="w")
		license_box = ctk.CTkTextbox(parent, wrap="word")
		license_box.pack(fill="both", expand=True, padx=installer.PADDING_X)

		try:
			with open(get_resource_path('resources/license.txt'), 'r', encoding='utf-8') as f:
				license_box.insert("1.0", f.read())
		except FileNotFoundError:
			license_box.insert("1.0", "Ошибка: Файл license.txt не найден.")

		license_box.configure(state="disabled")
		installer.create_navigation_buttons(
			parent,
			back_func=lambda: installer.go_to_step(0),
			next_func=lambda: installer.go_to_step(2),
			next_text="Принимаю"
		)

	@staticmethod
	def create_java_check_step(installer: "InstallerApp", parent):
		installer.java_status_label = ctk.CTkLabel(parent, text="Проверяем наличие Java...", font=ctk.CTkFont(size=18))
		installer.java_status_label.pack(expand=True)

	@staticmethod
	def create_java_install_step(installer: "InstallerApp", parent):
		installer.java_selection_frame = ctk.CTkFrame(parent, fg_color="transparent")
		installer.java_selection_frame.pack(pady=installer.PADDING_Y, padx=installer.PADDING_X, fill="x")
		label = ctk.CTkLabel(installer.java_selection_frame, text="Выберите версию Java для установки:", font=installer.FONT_HEADER)
		label.pack(anchor="w")
		installer.java_version_var = ctk.StringVar(value="21")
		rb_java21 = ctk.CTkRadioButton(installer.java_selection_frame, text="Java 21 (рекомендуется)", variable=installer.java_version_var, value="21")
		rb_java21.pack(pady=5, padx=20, anchor="w")
		rb_java24 = ctk.CTkRadioButton(installer.java_selection_frame, text="Java 24", variable=installer.java_version_var, value="24")
		rb_java24.pack(pady=5, padx=20, anchor="w")
		installer.java_install_button = ctk.CTkButton(installer.java_selection_frame, text="Скачать и установить Java", command=installer._download_java)
		installer.java_install_button.pack(pady=20)
		installer.java_recheck_button = ctk.CTkButton(installer.java_selection_frame, text="Проверить Java заново", command=lambda: installer.go_to_step(2), fg_color="transparent", border_width=1)
		installer.java_recheck_button.pack(pady=(20, 0))
		installer.java_progress_frame = ctk.CTkFrame(parent, fg_color="transparent")
		installer.java_download_label = ctk.CTkLabel(installer.java_progress_frame, text="", font=installer.FONT_BODY)
		installer.java_download_label.pack(pady=5)
		installer.java_progress = ctk.CTkProgressBar(installer.java_progress_frame)
		installer.java_progress.set(0)
		installer.java_progress.pack(pady=5, fill="x")
		installer.java_nav_frame = installer.create_navigation_buttons(
			parent,
			back_func=lambda: installer.go_to_step(2),
			next_func=lambda: installer.go_to_step(4),
			next_text="Пропустить"
		)

	@staticmethod
	def create_path_selection_step(installer: "InstallerApp", parent):
		label = ctk.CTkLabel(parent, text="Выберите папку для установки сервера:", font=installer.FONT_HEADER)
		label.pack(pady=installer.PADDING_Y, padx=installer.PADDING_X)
		path_frame = ctk.CTkFrame(parent, fg_color=("gray90", "gray25"))
		path_frame.pack(fill="x", padx=installer.PADDING_X, pady=installer.PADDING_Y)
		installer.path_entry = ctk.CTkEntry(path_frame, font=installer.FONT_BODY)
		installer.path_entry.insert(0, installer.install_path)
		installer.path_entry.pack(side="left", fill="x", expand=True, padx=(10, 5), pady=10)
		browse_button = ctk.CTkButton(path_frame, text="Обзор...", command=installer._select_install_path, width=100)
		browse_button.pack(side="right", padx=(5, 10), pady=10)
		installer.create_navigation_buttons(
			parent,
			back_func=lambda: installer.go_to_step(2),
			next_func=installer._confirm_path
		)

	@staticmethod
	def create_file_creation_step(installer: "InstallerApp", parent):
		installer.file_status_label = ctk.CTkLabel(parent, text="Создаем служебные файлы...", font=ctk.CTkFont(size=18))
		installer.file_status_label.pack(expand=True)

	@staticmethod
	def create_final_step(installer: "InstallerApp", parent):
		congrats_label = ctk.CTkLabel(parent, text="Поздравляем! 🎉", font=installer.FONT_TITLE)
		congrats_label.pack(pady=(100, 10), padx=installer.PADDING_X)
		info_text = f"{installer.config['app_name']} успешно установлен.\nЗапускайте сервер через start.cmd."
		info_label = ctk.CTkLabel(parent, text=info_text, font=installer.FONT_BODY)
		info_label.pack(pady=installer.PADDING_Y, padx=installer.PADDING_X)
		finish_button = ctk.CTkButton(parent, text="Готово", command=lambda: Steps.close(installer), height=40)
		finish_button.pack(pady=40, padx=installer.PADDING_X)

	@staticmethod
	def create_core_download_step(installer: "InstallerApp", parent):
		installer.core_download_label = ctk.CTkLabel(parent, text="Идет загрузка ядра...", font=installer.FONT_BODY)
		installer.core_download_label.pack(pady=(150, 10), padx=installer.PADDING_X)
		installer.core_progress = ctk.CTkProgressBar(parent)
		installer.core_progress.set(0)
		installer.core_progress.pack(pady=installer.PADDING_Y, padx=40, fill="x")

	@staticmethod
	def close(inslaller: "InstallerApp"):
		inslaller.destroy()
		os.startfile(inslaller.install_path)
