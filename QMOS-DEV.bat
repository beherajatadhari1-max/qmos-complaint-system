@echo off
title QMOS Dev Server - Port 3001
color 0A
cd /d "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system"
if exist ".next\dev" rmdir /s /q ".next\dev"
npx kill-port 3001 >nul 2>&1
echo Starting QMOS Dev Server on port 3001...
start cmd /c "timeout /t 8 /nobreak >nul && start http://localhost:3001"
npm run dev
pause
