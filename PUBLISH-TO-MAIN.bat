@echo off
echo.
echo ============================================
echo   QMOS — Publishing Dev to MAIN
echo ============================================
echo.
echo Step 1: Stopping any running servers...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Cleaning old build...
rmdir /s /q .next 2>nul
timeout /t 1 /nobreak >nul

echo Step 3: Building MAIN version (this takes 1-2 min)...
call npm run build
if %errorlevel% neq 0 (
  echo.
  echo BUILD FAILED. Fix errors in Dev first, then run this again.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   SUCCESS! MAIN is now updated and frozen.
echo   Starting MAIN server on port 3000...
echo ============================================
echo.
call npm start
pause
