# Removes an ESTIMO Admin installation that the normal uninstaller refuses to
# remove (locked files, a broken uninstall entry, or a half-finished upgrade).
#
#   powershell -ExecutionPolicy Bypass -File desktop/scripts/remove-old-install.ps1
#
# It stops the app, deletes the program folder, and clears the per-user uninstall
# entry and shortcuts. Your settings and sign-in stay in %APPDATA%\estimo-admin-desktop.

$ErrorActionPreference = "SilentlyContinue"

$targets = @(
  (Join-Path $env:LOCALAPPDATA "Programs\ESTIMO Admin"),
  (Join-Path $env:LOCALAPPDATA "Programs\estimo-admin-desktop")
)

Write-Host "Stopping ESTIMO Admin..."
Get-Process -Name "ESTIMO Admin" | Stop-Process -Force
Start-Sleep -Seconds 2

foreach ($target in $targets) {
  if (-not (Test-Path $target)) { continue }
  Write-Host "Removing $target"
  Remove-Item -Recurse -Force $target
  if (Test-Path $target) {
    Write-Warning "Still present: $target (close the app and run this script again)"
  }
}

Write-Host "Clearing the uninstall entry..."
Remove-Item -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\ESTIMOAdmin" -Recurse -Force

$regRoots = @(
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
)
foreach ($root in $regRoots) {
  Get-ChildItem $root | ForEach-Object {
    $props = Get-ItemProperty $_.PSPath
    if ($props.DisplayName -like "*ESTIMO Admin*") {
      Write-Host "Removing registry entry $($props.DisplayName) at $($_.PSPath)"
      Remove-Item $_.PSPath -Recurse -Force
    }
  }
}

Write-Host "Removing shortcuts..."
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\ESTIMO" -Recurse -Force
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\ESTIMO Admin.lnk" -Force
Remove-Item "$env:USERPROFILE\Desktop\ESTIMO Admin.lnk" -Force
Remove-Item "$env:PUBLIC\Desktop\ESTIMO Admin.lnk" -Force

Write-Host ""
Write-Host "Done. Installed apps should no longer list ESTIMO Admin."
Write-Host "Install the new setup with: ESTIMO-Admin-Setup-1.2.1.exe"
