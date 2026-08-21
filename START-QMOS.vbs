Dim shell
Set shell = CreateObject("WScript.Shell")

shell.Run "cmd /c cd /d C:\QMOS && node node_modules\next\dist\bin\next start -p 3000", 1, False
WScript.Sleep 15000
shell.Run "cmd /c cd /d C:\QMOS && node node_modules\next\dist\bin\next start -p 5000", 1, False
