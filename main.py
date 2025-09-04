import sys
import os
import logging

try:
	from utils.java_utils import JavaUtils
	from utils.github_api import GitHubAPI
	from utils.file_utils import FileUtils
except ImportError:
	logging.error("FATAL ERROR: Utility files (java_utils.py, github_api.py, file_utils.py) not found in the 'utils' directory.")
	logging.error("Please create them before running the application.")
	class JavaUtils:
		@staticmethod
		def check_java_version(): return False, "", 0
		@staticmethod
		def is_version_supported(v1, v2): return False
	class GitHubAPI:
		def __init__(self, *args): pass
		def get_download_url(self): return None
	class FileUtils:
		@staticmethod
		def create_directory(path): return True
		@staticmethod
		def copy_resource_file(src, dst): pass
		@staticmethod
		def write_text_file(path, content): pass

logging.basicConfig(filename="installer.log", level=logging.INFO, encoding="utf-8",
					format="%(asctime)s - %(levelname)s - %(message)s")

def get_resource_path(relative_path):
	try:
		base_path = sys._MEIPASS
	except AttributeError:
		base_path = os.path.abspath(".")
	return os.path.join(base_path, relative_path)

if __name__ == "__main__":
	from app.installer import InstallerApp

	app = InstallerApp()
	app.mainloop()