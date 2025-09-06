import hashlib
import os
import shutil
import subprocess
import sys
import zipfile
import logging
from pathlib import Path
from typing import List

class FileUtils:
	@staticmethod
	def create_directory(path: str, exist_ok: bool = True) -> bool:
		try:
			os.makedirs(path, exist_ok=exist_ok)
			return True
		except OSError:
			return False

	@staticmethod
	def copy_resource_file(resource_path: str, destination: str) -> bool:
		try:
			if hasattr(sys, '_MEIPASS'):
				resource_path = os.path.join(sys._MEIPASS, resource_path)

			shutil.copy2(resource_path, destination)
			return True

		except (FileNotFoundError, PermissionError) as e:
			logging.error(f"Ошибка копирования файла: {e}")
			return False

	@staticmethod
	def write_text_file(filepath: str, content: str, encoding: str = 'utf-8') -> bool:
		try:
			with open(filepath, 'w', encoding=encoding) as f:
				f.write(content)
			return True

		except (IOError, UnicodeEncodeError) as e:
			return False

	@staticmethod
	def get_directory_size(path: str) -> int:
		total_size = 0
		for dirpath, dirnames, filenames in os.walk(path):
			for filename in filenames:
				filepath = os.path.join(dirpath, filename)
				if os.path.exists(filepath):
					total_size += os.path.getsize(filepath)
		return total_size

	@staticmethod
	def cleanup_temp_files(temp_dir: str) -> bool:
		try:
			if os.path.exists(temp_dir):
				shutil.rmtree(temp_dir)
			return True
		except OSError:
			return False

	@staticmethod
	def extract_zip(zip_path: str, extract_to: str) -> bool:
		try:
			with zipfile.ZipFile(zip_path, 'r') as zip_ref:
				zip_ref.extractall(extract_to)
			return True

		except (zipfile.BadZipFile, FileNotFoundError) as e:
			logging.error(f"Ошибка извлечения архива: {e}")
			return False

	@staticmethod
	def calculate_sha256(filepath: str) -> str:
		sha256 = hashlib.sha256()
		with open(filepath, "rb") as f:
			for chunk in iter(lambda: f.read(8192), b""):
				sha256.update(chunk)
		return sha256.hexdigest()
