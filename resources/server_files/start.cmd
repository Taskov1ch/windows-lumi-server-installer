:: Сколько гигабайт ОЗУ выделить серверу
set MEMORY={MEMORY}
set CORE_NAME={CORE_NAME}

:: Дальше без знаний cmd windows не лезть :)

@echo off
chcp 65001 >nul

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
