$ws = New-Object -ComObject WScript.Shell
$batPath = $ws.SpecialFolders("Desktop") + "\..\OneDrive\Documents\Claude\Projects\Quality Head Agents " + [char]0x2013 + " Digital Quality Operating System\qmos-complaint-system\start-dev.bat"
$batPath = (Resolve-Path $batPath -ErrorAction SilentlyContinue).Path
if (-not $batPath) {
    $batPath = "C:\Users\beher\OneDrive\Documents\Claude\Projects\Quality Head Agents " + [char]0x2013 + " Digital Quality Operating System\qmos-complaint-system\start-dev.bat"
}
$lnk = [Environment]::GetFolderPath("Desktop") + "\QMOS - DEV.lnk"
$s = $ws.CreateShortcut($lnk)
$s.TargetPath = $batPath
$s.WorkingDirectory = Split-Path $batPath
$s.WindowStyle = 1
$s.Description = "QMOS DEV Server - Port 3001"
$s.Save()
Write-Host "Done! QMOS - DEV shortcut now points to start-dev.bat" -ForegroundColor Green
Write-Host $batPath
