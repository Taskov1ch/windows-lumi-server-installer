import subprocess
import re
from typing import Optional, Tuple

class JavaUtils:
	@staticmethod
	def check_java_version() -> Tuple[bool, Optional[str], Optional[int]]:
		try:
			result = subprocess.run(
				['java', '-version'],
				capture_output=True,
				text=True,
				timeout=10
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

	@staticmethod
	def get_java_executable_path() -> Optional[str]:
		try:
			result = subprocess.run(
				['where', 'java'],
				capture_output=True,
				text=True,
				shell=True
			)

			if result.returncode == 0:
				return result.stdout.strip().split('\n')[0]

		except Exception:
			pass

		return None