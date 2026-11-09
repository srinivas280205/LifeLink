param([switch]$Demo, [switch]$Lan)
$ErrorActionPreference='Stop'
$projectRoot=$PSScriptRoot
$node=(Get-Command node -ErrorAction Stop).Source
$logDir=Join-Path $projectRoot 'logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
foreach($port in @(3460,4180,58366)){if(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue){throw "Port $port is already in use. Close the previous LifeLink preview before starting another."}}
Start-Process -FilePath $node -ArgumentList $(if($Demo){@('dev-local.cjs','--demo')}else{@('dev-local.cjs')}) -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'backend.log') -RedirectStandardError (Join-Path $logDir 'backend-error.log')
Start-Process -FilePath $node -ArgumentList 'node_modules/vite/bin/vite.js','--host',$(if($Lan){'0.0.0.0'}else{'127.0.0.1'}),'--port','4180','--strictPort' -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'frontend.log') -RedirectStandardError (Join-Path $logDir 'frontend-error.log')
Write-Host 'LifeLink is starting. Open http://127.0.0.1:4180/ in your browser.'

if($Lan){Write-Host 'Same-Wi-Fi testing enabled on port 4180. On the second device open http://<this-PC-IPv4>:4180/. Use manual map locations on HTTP.'}
