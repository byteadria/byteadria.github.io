[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
Set-Location -LiteralPath $Root

$Port = 4321
$DevUrl = "http://localhost:$Port"
$script:DevProc = $null
$script:StartedServer = $false

function Get-DevError {
    param([string]$Message)
    Write-Host ""
    Write-Host "[start.ps1] ERROR: $Message" -ForegroundColor Red
    exit 1
}

function Get-ListenerProcessId {
    param([int]$ListenPort)
    try {
        $conn = Get-NetTCPConnection -LocalPort $ListenPort -State Listen -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($null -ne $conn) { return [int]$conn.OwningProcess }
    }
    catch {
        try {
            $line = netstat -ano |
                Select-String ("TCP\s+[^\s]+:" + $ListenPort + "\s+.*LISTENING") |
                Select-Object -First 1
            if ($null -ne $line) { return [int](($line.ToString() -split "\s+")[-1]) }
        }
        catch { }
    }
    return $null
}

function Get-ProcessCommandLine {
    param([int]$ProcessId)
    try {
        $p = Get-CimInstance -ClassName Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop
        if ($null -eq $p) { return $null }
        return $p.CommandLine
    }
    catch { return $null }
}

function Test-ProjectProcess {
    param([int]$ProcessId)
    $cmd = Get-ProcessCommandLine -ProcessId $ProcessId
    if ([string]::IsNullOrWhiteSpace($cmd)) { return $false }
    $rootPattern = [regex]::Escape($Root)
    return ($cmd -match $rootPattern)
}

function Test-DependenciesReady {
    $nodeModules = Join-Path $Root "node_modules"
    if (-not (Test-Path -LiteralPath $nodeModules)) { return $false }
    $lockFile = Join-Path $Root "package-lock.json"
    if (Test-Path -LiteralPath $lockFile) {
        $marker = Join-Path $nodeModules ".package-lock.json"
        if (-not (Test-Path -LiteralPath $marker)) { return $false }
        if ((Get-Item -LiteralPath $lockFile).LastWriteTimeUtc -gt (Get-Item -LiteralPath $marker).LastWriteTimeUtc) {
            return $false
        }
    }
    return $true
}

function Test-DevReachable {
    param([string]$Url)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { return $true }
    }
    catch { }
    return $false
}

function Stop-DevProcessTree {
    param([int]$ProcessId)
    try {
        $children = Get-CimInstance -ClassName Win32_Process -Filter "ParentProcessId = $ProcessId" -ErrorAction SilentlyContinue
        foreach ($child in $children) {
            Stop-DevProcessTree -ProcessId ([int]$child.ProcessId)
        }
    }
    catch { }
    try { Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue } catch { }
}

Write-Host ""
Write-Host "GitByte Development Environment"
Write-Host "=============================="
Write-Host "  Site:    $DevUrl"
Write-Host "  Command: npm run dev (Astro)"
Write-Host ""

if ($null -eq (Get-Command node -ErrorAction SilentlyContinue)) {
    Get-DevError "Node.js is not installed or not on PATH. Install Node.js 20+ (CI uses Node 22) and try again."
}
if ($null -eq (Get-Command npm -ErrorAction SilentlyContinue)) {
    Get-DevError "npm is not installed or not on PATH. Install Node.js 20+ (CI uses Node 22) and try again."
}

$listenerPid = Get-ListenerProcessId $Port
if ($null -ne $listenerPid) {
    if (Test-ProjectProcess -ProcessId $listenerPid) {
        Write-Host "The Astro dev server is already running at $DevUrl." -ForegroundColor Yellow
        Write-Host "Open it in your browser. No additional server will be started."
        exit 0
    }
    $conflicting = Get-ProcessCommandLine -ProcessId $listenerPid
    if ([string]::IsNullOrWhiteSpace($conflicting)) { $conflicting = "(unavailable)" }
    Write-Host "Port $Port is already in use." -ForegroundColor Red
    Write-Host "  Listening PID: $listenerPid"
    Write-Host "  Command line:  $conflicting"
    Write-Host "This does not appear to be this project's Astro dev server, so start.ps1 will not stop it."
    Write-Host "Free the port yourself (or change the port in astro.config.mjs) and re-run start.ps1."
    exit 1
}

if (-not (Test-DependenciesReady)) {
    Write-Host "Frontend dependencies are missing or out of date. Running 'npm install'..."
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Get-DevError "npm install failed with exit code $LASTEXITCODE."
    }
    Write-Host "Dependencies installed."
}

$pkg = Get-Content -Raw -LiteralPath (Join-Path $Root "package.json") | ConvertFrom-Json
$devScript = $null
if ($null -ne $pkg.scripts) { $devScript = $pkg.scripts.dev }
if ([string]::IsNullOrWhiteSpace($devScript)) {
    Get-DevError "package.json does not define a 'dev' script."
}

$devTokens = $devScript.Trim() -split "\s+"
$astroEntry = Join-Path $Root "node_modules\astro\astro.js"
$canUseNode = ($devTokens.Count -ge 2) -and ($devTokens[0] -eq "astro") -and (Test-Path -LiteralPath $astroEntry)

Write-Host "Starting dev server via 'npm run dev' -> '$devScript'..."
Write-Host ""

try {
    if ($canUseNode) {
        $argList = @($astroEntry)
        for ($i = 1; $i -lt $devTokens.Count; $i++) { $argList += $devTokens[$i] }
        $script:DevProc = Start-Process -FilePath "node" -ArgumentList $argList -WorkingDirectory $Root -NoNewWindow -PassThru
    }
    else {
        $script:DevProc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $Root -NoNewWindow -PassThru
    }
    $script:StartedServer = $true

    $started = [DateTime]::Now
    $ready = $false
    while (([DateTime]::Now - $started).TotalSeconds -lt 120) {
        if ($script:DevProc.HasExited) { break }
        if (Test-DevReachable -Url ($DevUrl + "/")) { $ready = $true; break }
        Start-Sleep -Milliseconds 1000
    }

    if ($ready) {
        Write-Host ""
        Write-Host "Dev server is ready." -ForegroundColor Green
        Write-Host "  $DevUrl"
        Write-Host ""
        Write-Host "Press Ctrl+C to stop the development server."
        Write-Host ""
        try { Wait-Process -Id $script:DevProc.Id } catch { }
    }
    elseif ($script:DevProc.HasExited) {
        $exitCode = $script:DevProc.ExitCode
        Get-DevError "The dev server exited before becoming ready (exit code $exitCode). See output above."
    }
    else {
        Write-Host ""
        Write-Host "The dev server process is running but did not respond within 120s." -ForegroundColor Yellow
        Write-Host "It may still be starting. Keeping it running; press Ctrl+C to stop."
        Write-Host ""
        try { Wait-Process -Id $script:DevProc.Id } catch { }
    }
}
finally {
    if ($script:StartedServer -and ($null -ne $script:DevProc)) {
        try {
            if (-not $script:DevProc.HasExited) {
                Stop-DevProcessTree -ProcessId $script:DevProc.Id
            }
        }
        catch { }
        Write-Host ""
        Write-Host "Development server stopped."
    }
}