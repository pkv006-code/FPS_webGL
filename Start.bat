@echo off
setlocal

set PORT=8080
set SCRIPT_DIR=%~dp0

echo Запуск локального сервера на порту %PORT%...

REM Окно PowerShell не закрывается даже при ошибке, можно увидеть сообщение
start "GameServer" powershell -NoExit -ExecutionPolicy Bypass -File "%SCRIPT_DIR%server.ps1"

REM Пауза, чтобы сервер успел подняться
timeout /t 2 /nobreak >nul

echo Открываем игру в браузере...
start "" "http://localhost:%PORT%/"

endlocal
