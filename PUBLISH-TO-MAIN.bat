@echo off
title QMOS — Publish Dev to Main
color 0E
cd /d "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system"

echo.
echo  ============================================
echo   QMOS — PUBLISH DEV TO MAIN (Safe Mode)
echo   Port 3000 = MAIN   Port 3001 = DEV
echo  ============================================
echo.

echo  [1/5] Saving dev changes...
git add -A
git commit -m "auto: publish snapshot %date%" >nul 2>&1

echo  [2/5] Switching to MAIN branch...
git checkout -f main
if %errorlevel% neq 0 ( echo ERROR: Cannot switch to main. & pause & exit /b 1 )

echo  [3/5] Merging dev into main...
git merge dev --no-edit
if %errorlevel% neq 0 ( echo ERROR: Merge conflict. Fix and try again. & git checkout dev & pause & exit /b 1 )

echo  [4/5] Building production (1-2 min)...
if exist .next (
  echo  Clearing .next cache to prevent OneDrive lock errors...
  rmdir /s /q .next
)
call npm run build
if %errorlevel% neq 0 ( echo BUILD FAILED. Fix errors first. & git checkout dev & pause & exit /b 1 )

echo  [5/5] Restarting main server (port 3000)...
pm2 delete qmos-main >nul 2>&1
pm2 start ecosystem.config.js
pm2 save

git checkout -f dev
echo.
echo  DONE! Main (3000) updated. Back on dev branch.
echo.
pause
