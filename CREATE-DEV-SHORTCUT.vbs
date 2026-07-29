Set ws = CreateObject("WScript.Shell")
Set s = ws.CreateShortcut(ws.SpecialFolders("Desktop") & "\QMOS Dev 3001.lnk")
s.TargetPath = "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system\start-dev.bat"
s.WorkingDirectory = "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents – Digital Quality Operating System\qmos-complaint-system"
s.WindowStyle = 1
s.Description = "Start QMOS Dev Server on port 3001"
s.Save()
MsgBox "Shortcut 'QMOS Dev 3001' created on Desktop!", 64, "Done"
