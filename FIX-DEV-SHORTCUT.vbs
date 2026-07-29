Set ws = CreateObject("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")

Set s = ws.CreateShortcut(desktop & "\QMOS - DEV.lnk")
s.TargetPath = "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe"
s.Arguments = "-NoExit -Command ""cd 'C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system'; if (Test-Path '.next\dev') { Remove-Item -Recurse -Force '.next\dev'; Write-Host 'Lock cleared.' }; npx kill-port 3001 2>$null; Start-Process 'http://localhost:3001'; npm run dev"""
s.WorkingDirectory = "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system"
s.WindowStyle = 1
s.Description = "QMOS DEV Server - Port 3001 (with auto lock cleanup)"
s.Save()

MsgBox "QMOS - DEV shortcut updated! It will now auto-clean lock and start fresh.", 64, "Done"
