#!/bin/bash
# Сколько гигабайт ОЗУ выделить серверу
MEMORY={MEMORY}

CORE_NAME="{CORE_NAME}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"

JAVA_BIN="$SCRIPT_DIR/java/bin/java"
if [ ! -x "$JAVA_BIN" ]; then
	JAVA_BIN="java"
fi

echo "Запуск сервера..."
echo

while true; do
	"$JAVA_BIN" -Xmx${MEMORY}G -Xms${MEMORY}G -jar "$SCRIPT_DIR/$CORE_NAME" nogui

	echo
	echo "Сервер остановлен."
	read -p "Нажмите Enter для перезапуска или Ctrl+C для выхода..." _
done
