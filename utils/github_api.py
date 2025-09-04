import requests
import logging
from typing import Dict, Optional

class GitHubAPI:
	def __init__(self, repo_owner: str, repo_name: str):
		self.repo_owner = repo_owner
		self.repo_name = repo_name
		self.base_url = "https://api.github.com"

	def get_latest_release(self) -> Optional[Dict]:
		url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/releases/latest"

		try:
			response = requests.get(url, timeout=10)
			response.raise_for_status()
			return response.json()

		except requests.RequestException as e:
			logging.error(f"Ошибка получения данных о релизе: {e}")
			return None

	def get_download_url(self) -> Optional[str]:
		release_data = self.get_latest_release()

		if not release_data:
			return None

		assets = release_data.get("assets", [])

		if not assets:
			return None

		for asset in assets:
			if asset["name"].endswith(".jar") and asset["name"].startswith("Lumi"):
				return asset["browser_download_url"]

		return None

	def get_release_info(self) -> Dict[str, str]:
		release_data = self.get_latest_release()

		if not release_data:
			return {}

		return {
			"version": release_data.get("tag_name", "Unknown"),
			"name": release_data.get("name", "Unknown"),
			"description": release_data.get("body", ""),
			"published_at": release_data.get("published_at", ""),
			"download_count": sum(asset.get("download_count", 0)
								for asset in release_data.get("assets", []))
		}