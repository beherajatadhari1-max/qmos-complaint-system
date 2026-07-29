@echo off
title QMOS Dev Server — Port 3001
color 0A

cd /d "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system"

echo.
echo  ============================================
echo   QMOS Dev Server — Port 3001
echo   SAFE MODE: Main site (3000) is protected
echo   NEVER run taskkill /im node.exe here
echo  ============================================
echo.

echo  [1/3] Killing ONLY port 3001 process...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo       Port 3001 cleared. Main (3000) untouched.

echo  [2/3] Cleaning Next.js dev cache...
if exist ".next\dev" rmdir /s /q ".next\dev" >nul 2>&1
echo       Cache cleared.

echo  [3/3] Starting dev server...
echo.
start cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3001"

npm run dev -- --port 3001
pause
