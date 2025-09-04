import subprocess
import re
import os
from typing import Optional, Tuple

class JavaUtils:
	@staticmethod
	def _find_java_executable() -> Optional[str]:
		try:
			result = subprocess.run(
				['where', 'java'],
				capture_output=True,
				text=True,
				check=True,
				timeout=5,
				creationflags=subprocess.CREATE_NO_WINDOW
			)
			return result.stdout.strip().split('\n')[0]
		except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
			pass

		search_roots = []
		for key in ["ProgramFiles", "ProgramFiles(x86)"]:
			path = os.environ.get(key)
			if path and os.path.isdir(path):
				search_roots.append(path)

		for root_path in search_roots:
			try:
				for dir_name in os.listdir(root_path):
					potential_path = os.path.join(root_path, dir_name)
					if os.path.isdir(potential_path):
						for root, _, files in os.walk(potential_path):
							if "java.exe" in files and root.endswith("bin"):
								java_path = os.path.join(root, "java.exe")
								if "jre" not in java_path.lower():
									return java_path # nested hell :)

			except (FileNotFoundError, PermissionError):
				continue

		return None

	@staticmethod
	def check_java_version() -> Tuple[bool, Optional[str], Optional[int]]:
		java_exe_path = JavaUtils._find_java_executable()

		if not java_exe_path:
			return False, None, None

		try:
			result = subprocess.run(
				[java_exe_path, '-version'],
				capture_output=True,
				text=True,
				timeout=10,
				encoding='utf-8',
				errors='ignore',
				creationflags=subprocess.CREATE_NO_WINDOW
			)

			if result.returncode == 0:
				version_output = result.stderr
				version_match = re.search(r'version "([^"]+)"', version_output)
				if version_match:
					version_str = version_match.group(1)
					major_version = JavaUtils._extract_major_version(version_str)
					return True, version_str, major_version

			return False, None, None

		except (FileNotFoundError, subprocess.TimeoutExpired):
			return False, None, None

	@staticmethod
	def _extract_major_version(version_str: str) -> Optional[int]:
		if version_str.startswith('1.'):
			match = re.match(r'1\.(\d+)', version_str)
			if match:
				return int(match.group(1))
		else:
			match = re.match(r'(\d+)', version_str)
			if match:
				return int(match.group(1))

		return None

	@staticmethod
	def is_version_supported(major_version: int, required: int = 21) -> bool:
		return major_version >= required
