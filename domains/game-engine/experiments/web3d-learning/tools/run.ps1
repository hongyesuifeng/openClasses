param(
    [Parameter(Position = 0)]
    [ValidateSet('install', 'dev', 'test', 'build', 'preview')]
    [string]$Command = 'dev',
    [string]$NodePath = ''
)

$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$taskNodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$taskNpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$taskCandidates = @(
    $NodePath,
    $env:WEB3D_NODE_PATH,
    $taskNodeCommand.Source,
    (Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')
)
if ($env:NVM_HOME -and (Test-Path -LiteralPath $env:NVM_HOME)) {
    $taskCandidates += Get-ChildItem -LiteralPath $env:NVM_HOME -Directory -Filter 'v24.*' |
        Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'node.exe' }
}
$taskNode = $null
foreach ($candidate in ($taskCandidates | Where-Object { $_ } | Select-Object -Unique)) {
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
    $taskVersion = [version]((& $candidate --version).TrimStart('v'))
    if ($taskVersion.Major -eq 24 -and $taskVersion -ge [version]'24.12.0') {
        $taskNode = (Resolve-Path -LiteralPath $candidate).Path
        break
    }
}
if (-not $taskNode) { throw 'Node 24.12+ is required. Pass -NodePath <absolute path to Node 24 node.exe> or set WEB3D_NODE_PATH.' }

$taskNodeDirectory = Split-Path -Parent $taskNode
$taskNpmCandidates = @(
    (Join-Path $taskNodeDirectory 'node_modules/npm/bin/npm-cli.js'),
    (Join-Path (Split-Path -Parent $taskNodeDirectory) 'node_modules/npm/bin/npm-cli.js')
)
if ($taskNpmCommand) { $taskNpmCandidates += Join-Path (Split-Path -Parent $taskNpmCommand.Source) 'node_modules/npm/bin/npm-cli.js' }
$taskNpmCli = $taskNpmCandidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $taskNpmCli) { throw 'npm-cli.js was not found. Use a Node 24 installation containing npm, or keep npm.cmd available on PATH.' }

$taskOriginalPath = $env:Path
Push-Location -LiteralPath $taskRoot
try {
    $env:Path = $taskNodeDirectory + [IO.Path]::PathSeparator + $taskOriginalPath
    Write-Host "Web3D runtime: $taskNode"
    & $taskNode --version
    if ($Command -eq 'install') { & $taskNode $taskNpmCli ci }
    else { & $taskNode $taskNpmCli run $Command }
    $taskExitCode = $LASTEXITCODE
} finally {
    $env:Path = $taskOriginalPath
    Pop-Location
}
exit $taskExitCode
