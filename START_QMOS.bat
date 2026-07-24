@echo off
title QMOS — Quality Management Operating System
color 1F
echo.
echo  ============================================================
echo   QMOS — Quality Management Operating System
echo   Starting server... please wait
echo  ============================================================
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules" (
  echo  Installing dependencies first...
  npm install
)

:: Build for production if .next/BUILD_ID does not exist
if not exist ".next\BUILD_ID" (
  echo  Building application for first time... this takes 1-2 minutes
  call npm run build
)

echo  Starting QMOS server...
echo.
echo  ----------------------------------------------------------
echo   Access QMOS at:  http://localhost:3000
echo  ----------------------------------------------------------
echo.
echo  DO NOT CLOSE THIS WINDOW while using QMOS.
echo  To stop: press Ctrl+C and then Y
echo.

:: Open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start production server
npm start
