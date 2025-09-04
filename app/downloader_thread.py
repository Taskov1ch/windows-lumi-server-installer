import threading
import time
import requests


class DownloaderThread(threading.Thread):
	def __init__(self, url, save_path, queue):
		super().__init__()
		self.url = url
		self.save_path = save_path
		self.queue = queue
		self.daemon = True

	def _format_speed(self, speed_bytes_per_sec):
		if speed_bytes_per_sec > 1024 * 1024:
			return f"{speed_bytes_per_sec / (1024 * 1024):.2f} MB/s"
		if speed_bytes_per_sec > 1024:
			return f"{speed_bytes_per_sec / 1024:.2f} KB/s"
		return f"{speed_bytes_per_sec:.2f} B/s"

	def run(self):
		try:
			response = requests.get(self.url, stream=True, timeout=30)
			response.raise_for_status()
			total_size = int(response.headers.get("content-length", 0))

			downloaded_size = 0
			last_time = time.time()
			chunk_downloaded = 0

			with open(self.save_path, "wb") as f:
				for chunk in response.iter_content(chunk_size=8192):
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

						if total_size > 0:
							percentage = int((downloaded_size / total_size) * 100)
							self.queue.put({"type": "progress", "percentage": percentage, "speed": speed_str})

			self.queue.put({"type": "finished", "path": self.save_path})
		except requests.RequestException as e:
			self.queue.put({"type": "error", "message": f"Ошибка скачивания: {e}"})
		except Exception as e:
			self.queue.put({"type": "error", "message": f"Неизвестная ошибка: {e}"})
