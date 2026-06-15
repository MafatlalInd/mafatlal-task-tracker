@echo off
title Mafatlal Digital Team Task Tracker  -  KEEP THIS WINDOW OPEN
color 0B
echo.
echo   ==================================================
echo      Mafatlal Digital Team Task Tracker
echo   ==================================================
echo.
echo   Starting the local server...
echo.
echo   IMPORTANT: Keep this window OPEN while you use the
echo   Tracker. Closing it stops the app. To stop the
echo   server, just close this window.
echo.
echo   The app will open in your browser in a moment at:
echo      http://localhost:8777/
echo.
echo   ==================================================
echo.
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8777/"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.claude\serve.ps1" -Port 8777
echo.
echo   Server stopped. You can close this window.
pause
