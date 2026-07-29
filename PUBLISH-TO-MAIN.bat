@echo off
title QMOS — Publish Dev to Main
color 0E

cd /d "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system"

echo.
echo  ============================================
echo   QMOS — PUBLISH DEV TO MAIN
echo   Port 3000 = MAIN (users see this)
echo   Port 3001 = DEV  (testing only)
echo  ============================================
echo.

echo  [1/6] Committing any unsaved dev changes...
git add -A
git commit -m "auto: publish snapshot %date% %time%" >nul 2>&1
echo       Dev branch saved.

echo  [2/6] Switching to MAIN branch...
git checkout main
if %errorlevel% neq 0 (
  echo  ERROR: Could not switch to main branch. Aborting.
  pause & exit /b 1
)

echo  [3/6] Merging dev into main...
git merge dev --no-edit
if %errorlevel% neq 0 (
  echo  ERROR: Merge conflict. Fix conflicts, then run again.
  git checkout dev
  pause & exit /b 1
)

echo  [4/6] Building production version (1-2 min)...
call npm run build
if %errorlevel% neq 0 (
  echo  BUILD FAILED. Switching back to dev. Fix errors first.
  git checkout dev
  pause & exit /b 1
)

echo  [5/6] Restarting PM2 main server (port 3000)...
pm2 restart qmos-main
pm2 save
echo       Main site updated on port 3000.

echo  [6/6] Switching back to DEV branch...
git checkout dev
echo       Back on dev branch. Port 3001 dev server can now restart.

echo.
echo  ============================================
echo   DONE! Main (3000) updated. Dev (3001) safe.
echo   NEVER touch port 3000 from dev branch.
echo  ============================================
echo.
pause
