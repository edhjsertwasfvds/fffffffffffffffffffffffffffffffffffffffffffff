@echo off
chcp 65001 >nul
title VDF Checker
echo ==========================================
echo    VDF Checker - Server Launch
echo ==========================================
echo.

cd /d "%~dp0"

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found! Install Python 3.11+
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

echo OK: Python found:
python --version
echo.

if not exist "venv" (
    echo INFO: Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo INFO: Installing dependencies...
pip install -q fastapi==0.104.1 uvicorn[standard]==0.24.0 httpx==0.25.2 python-multipart==0.0.6

echo.

set PORT=8080
:check_port
python -c "import socket; s=socket.socket(); s.bind(('0.0.0.0',%PORT%)); s.close()" >nul 2>&1
if errorlevel 1 (
    set /a PORT+=1
    goto check_port
)

echo ==========================================
echo    SERVER STARTED!
echo.
echo    Open in browser:
echo    http://localhost:%PORT%
echo.
echo    Press Ctrl+C to stop
echo ==========================================
echo.

python -m uvicorn backend.app:app --host 0.0.0.0 --port %PORT% --app-dir .

echo.
echo INFO: Server stopped.
pause
