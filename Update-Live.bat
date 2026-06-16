@echo off
rem ============================================================
rem  Mafatlal Digital Team Task Tracker — push updates live
rem  Double-click this after making changes. It saves your work
rem  and pushes to GitHub; Vercel then redeploys automatically.
rem ============================================================
cd /d "%~dp0"
title Update Live — Mafatlal Task Tracker
color 0B
echo.
echo   Checking for changes...
echo.
git add -A
git diff --cached --quiet && (echo   Nothing changed since last push. & echo. & pause & exit /b 0)
set /p msg=  Describe this update (or just press Enter):
if "%msg%"=="" set msg=Update
echo.
echo   Saving and pushing live...
git commit -m "%msg%"
git push
echo.
echo   ============================================================
echo   Done. Vercel will redeploy your live site in ~30 seconds.
echo   ============================================================
echo.
pause
