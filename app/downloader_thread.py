import threading
import time
import requests
import os
import hashlib


class DownloaderThread(threading.Thread):
	def __init__(self, url, save_path, queue, expected_sha256=None, version=None, max_retries=5):
		super().__init__()
		self.url = url
		self.save_path = save_path
		self.queue = queue
		self.daemon = True
		self.max_retries = max_retries
		self.expected_sha256 = expected_sha256
		self.version = version

	def _format_speed(self, speed_bytes_per_sec):
		if speed_bytes_per_sec > 1024 * 1024:
			return f"{speed_bytes_per_sec / (1024 * 1024):.2f} MB/s"
		if speed_bytes_per_sec > 1024:
			return f"{speed_bytes_per_sec / 1024:.2f} KB/s"
		return f"{speed_bytes_per_sec:.2f} B/s"

	def _calculate_sha256(self, file_path):
		sha256 = hashlib.sha256()
		with open(file_path, "rb") as f:
			for chunk in iter(lambda: f.read(8192), b""):
				sha256.update(chunk)
		return sha256.hexdigest()

	def run(self):
		try:
			if os.path.exists(self.save_path) and self.version:
				local_hash = self._calculate_sha256(self.save_path)
				if self.expected_sha256 and local_hash != self.expected_sha256:
					os.remove(self.save_path)

			total_size = None
			downloaded_size = 0

			if os.path.exists(self.save_path):
				downloaded_size = os.path.getsize(self.save_path)

			for attempt in range(1, self.max_retries + 1):
				headers = {}
				if downloaded_size > 0:
					headers["Range"] = f"bytes={downloaded_size}-"

				response = requests.get(self.url, stream=True, timeout=30, headers=headers)
				response.raise_for_status()

				if total_size is None:
					content_length = response.headers.get("content-length")
					if content_length is not None:
						total_size = downloaded_size + int(content_length)

				mode = "ab" if downloaded_size > 0 else "wb"
				with open(self.save_path, mode) as f:
					last_time = time.time()
					chunk_downloaded = 0

					for chunk in response.iter_content(chunk_size=8192):
						if not chunk:
							continue
						f.write(chunk)
						downloaded_size += len(chunk)
						chunk_downloaded += len(chunk)

						current_time = time.time()
						elapsed_time = current_time - last_time

						if elapsed_time >= 0.5:
							speed = chunk_downloaded / elapsed_time if elapsed_time > 0 else 0
							speed_str = self._format_speed(speed)
							chunk_downloaded = 0
							last_time = current_time

							if total_size:
								percentage = int((downloaded_size / total_size) * 100)
								self.queue.put({
									"type": "progress",
									"percentage": percentage,
									"speed": speed_str
								})

				if total_size and downloaded_size < total_size:
					time.sleep(1)
					continue

				if self.expected_sha256:
					file_hash = self._calculate_sha256(self.save_path)
					if file_hash.lower() != self.expected_sha256.lower():
						os.remove(self.save_path)
						downloaded_size = 0
						total_size = None
						time.sleep(1)
						continue

				self.queue.put({"type": "finished", "path": self.save_path})
				return

			self.queue.put({
				"type": "error",
				"message": f"Не удалось скачать файл за {self.max_retries} попыток"
			})

		except requests.RequestException as e:
			self.queue.put({"type": "error", "message": f"Ошибка скачивания: {e}"})
		except Exception as e:
			self.queue.put({"type": "error", "message": f"Неизвестная ошибка: {e}"})
