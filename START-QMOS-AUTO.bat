@echo off
cd /d C:\QMOS
start "QMOS-MAIN-3000" /MIN node node_modules\next\dist\bin\next start -p 3000
timeout /t 15 /nobreak >nul
start "QMOS-BACKUP-5000" /MIN node node_modules\next\dist\bin\next start -p 5000
