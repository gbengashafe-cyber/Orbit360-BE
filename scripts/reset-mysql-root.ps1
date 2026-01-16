# reset-mysql-root.ps1
# Usage: Run as Administrator in PowerShell.
# This script will:
#  - stop the MySQL92 service if running
#  - start mysqld with --skip-grant-tables
#  - run SQL to set the root password
#  - stop the manual mysqld and restart the service

param(
  [string]$ServiceName = 'MySQL92',
  [string]$BaseDir = 'C:\Program Files\MySQL\MySQL Server 9.2',
  [string]$DefaultsFile = 'C:\ProgramData\MySQL\MySQL Server 9.2\my.ini',
  [string]$InitFilePath = "$env:USERPROFILE\Documents\mysql-init.txt",
  [string]$NewPassword
)

function Require-Admin {
  $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
  if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator. Open PowerShell as Administrator and re-run."
    exit 1
  }
}

Require-Admin

$mysqld = Join-Path $BaseDir 'bin\mysqld.exe'
$mysql = Join-Path $BaseDir 'bin\mysql.exe'

if (-not (Test-Path $mysqld)) {
  Write-Error "mysqld not found at $mysqld. Update BaseDir parameter to your MySQL installation path."; exit 1
}
if (-not (Test-Path $mysql)) {
  Write-Error "mysql client not found at $mysql. Update BaseDir parameter to your MySQL installation path."; exit 1
}
if (-not (Test-Path $DefaultsFile)) {
  Write-Error "defaults-file not found at $DefaultsFile. Check your MySQL configuration."; exit 1
}

if (-not $NewPassword) {
  $NewPassword = Read-Host -Prompt 'Enter new root password (will echo)'
}

Write-Host "Stopping service $ServiceName (if running)..."
Try { Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue -Force } Catch {}
Start-Sleep -Seconds 1
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Starting mysqld with --skip-grant-tables (manual) using defaults-file: $DefaultsFile"
$arg = "--defaults-file=\"$DefaultsFile\" --skip-grant-tables --console"
$proc = Start-Process -FilePath $mysqld -ArgumentList $arg -PassThru

# wait for mysqld to appear
$wait = 0
while ($wait -lt 20) {
  if (Get-Process mysqld -ErrorAction SilentlyContinue) { break }
  Start-Sleep -Seconds 1; $wait++
}
if ($wait -ge 20) { Write-Error 'mysqld did not start in time. Check error log and try again.'; exit 1 }

Write-Host 'Running password update SQL via mysql client...'
# Use -e to run commands non-interactively
$escapedPass = $NewPassword.Replace("'", "''")
$sql = "FLUSH PRIVILEGES; ALTER USER 'root'@'localhost' IDENTIFIED BY '$escapedPass'; FLUSH PRIVILEGES;"
& $mysql -u root -e $sql
if ($LASTEXITCODE -ne 0) {
  Write-Error 'Failed to run SQL to reset password. Check server output and logs.'
  Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  exit 1
}

Write-Host 'Password updated. Stopping manual mysqld and restarting service...'
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-Service -Name $ServiceName
Start-Sleep -Seconds 2

Write-Host 'Verifying new password by connecting to server...'
& $mysql -u root -p$NewPassword -e "SELECT VERSION();"
if ($LASTEXITCODE -eq 0) { Write-Host 'Success: root password updated and service restarted.' } else { Write-Warning 'Could not verify with mysql client. Try connecting manually.' }

Write-Host 'Done.'
