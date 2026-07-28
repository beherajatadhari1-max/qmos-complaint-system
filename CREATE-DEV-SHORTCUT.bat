@echo off
echo Creating QMOS DEV shortcut on Desktop...

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%USERPROFILE%\Desktop\QMOS - DEV.lnk'); $s.TargetPath = 'powershell.exe'; $s.Arguments = '-NoExit -Command \"cd ''C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents - Digital Quality Operating System\qmos-complaint-system''; Start-Process ''http://localhost:3001''; npm run dev\"'; $s.WorkingDirectory = 'C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents - Digital Quality Operating System\qmos-complaint-system'; $s.IconLocation = 'powershell.exe'; $s.Description = 'QMOS DEV Server - Port 3001'; $s.Save()"

echo.
echo Done! "QMOS - DEV" shortcut created on your Desktop.
echo Double-click it to start Dev server on port 3001.
pause
