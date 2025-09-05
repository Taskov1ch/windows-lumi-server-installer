@echo off
chcp 65001 >nul

:: Сколько гигабайт ОЗУ выделить серверу
set MEMORY={MEMORY}

:: Дальше без знаний cmd windows не лезть :)
set CORE_NAME={CORE_NAME}

title Minecraft Lumi Server
echo Запуск сервера...
echo.

:start
java -Xmx%MEMORY%G -Xms%MEMORY%G -jar %CORE_NAME% nogui

echo.
echo Сервер остановлен.
echo Нажмите любую клавишу для перезапуска или закройте окно для выхода.
pause >nul
goto start
