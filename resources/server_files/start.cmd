@echo off
chcp 65001 >nul

:: Сколько гигабайт ОЗУ выделить серверу
set MEMORY={MEMORY}

:: Задержка перед перезапуском (в секундах)
set RESTART_DELAY=5

:: Дальше без знаний cmd windows не лезть :)
set CORE_NAME={CORE_NAME}

title Minecraft Lumi Server
echo Запуск сервера...
echo.

:start
java -Xmx%MEMORY%G -Xms%MEMORY%G -jar %CORE_NAME% nogui

echo.
echo Сервер остановлен.
echo Перезапуск через %RESTART_DELAY% секунд...
timeout /t %RESTART_DELAY% /nobreak >nul
goto start
