import json
print(json.load(open("installer_config.json")).get("version", "Unknown"))