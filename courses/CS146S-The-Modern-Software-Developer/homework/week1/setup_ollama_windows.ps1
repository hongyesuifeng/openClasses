# Ollama WSL 连接配置脚本 - Windows 端
# 请在 Windows PowerShell (管理员模式) 中运行此脚本

Write-Host "=== Ollama WSL 连接配置 ===" -ForegroundColor Cyan
Write-Host ""

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ 错误: 请以管理员身份运行此脚本!" -ForegroundColor Red
    Write-Host "   右键点击 PowerShell，选择'以管理员身份运行'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 管理员权限确认" -ForegroundColor Green
Write-Host ""

# 步骤 1: 检查 Ollama 是否正在运行
Write-Host "步骤 1: 检查 Ollama 进程..." -ForegroundColor Cyan
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "   发现 Ollama 进程正在运行 (PID: $($ollamaProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  未发现 Ollama 进程，请确保 Ollama 已安装并启动" -ForegroundColor Yellow
    Write-Host "   可以从 https://ollama.com/download 下载安装" -ForegroundColor Yellow
}

Write-Host ""

# 步骤 2: 设置环境变量
Write-Host "步骤 2: 配置 Ollama 监听所有网络接口..." -ForegroundColor Cyan

# 设置用户环境变量（需要重启 Ollama 应用才能生效）
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "User")
Write-Host "   ✅ 已设置用户环境变量: OLLAMA_HOST=0.0.0.0:11434" -ForegroundColor Green

# 设置当前会话环境变量
$env:OLLAMA_HOST = "0.0.0.0:11434"

Write-Host ""

# 步骤 3: 添加防火墙规则
Write-Host "步骤 3: 配置 Windows 防火墙..." -ForegroundColor Cyan

try {
    # 检查规则是否已存在
    $existingRule = Get-NetFirewallRule -DisplayName "Ollama" -ErrorAction SilentlyContinue
    if ($existingRule) {
        Write-Host "   防火墙规则已存在，更新中..." -ForegroundColor Yellow
        Remove-NetFirewallRule -DisplayName "Ollama" -Confirm:$false
    }

    # 添加入站规则
    New-NetFirewallRule -DisplayName "Ollama" `
                        -Direction Inbound `
                        -LocalPort 11434 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any `
                        -Description "Allow Ollama connections from WSL" | Out-Null

    Write-Host "   ✅ 防火墙规则已添加" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 添加防火墙规则失败: $_" -ForegroundColor Red
}

Write-Host ""

# 步骤 4: 重启 Ollama
Write-Host "步骤 4: 重启 Ollama..." -ForegroundColor Cyan

if ($ollamaProcess) {
    try {
        Stop-Process -Name "ollama" -Force
        Write-Host "   ✅ Ollama 进程已停止" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "   ⚠️  停止 Ollama 失败: $_" -ForegroundColor Yellow
    }
}

Write-Host "   正在启动 Ollama..." -ForegroundColor Yellow
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
Write-Host "   ✅ Ollama 已启动" -ForegroundColor Green

Write-Host ""

# 步骤 5: 等待 Ollama 就绪并测试
Write-Host "步骤 5: 测试 Ollama 是否正常运行..." -ForegroundColor Cyan
Write-Host "   等待 Ollama 启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✅ Ollama API 响应正常" -ForegroundColor Green

    $models = $response.Content | ConvertFrom-Json
    if ($models.models -and $models.models.Count -gt 0) {
        Write-Host ""
        Write-Host "   已安装的模型:" -ForegroundColor Cyan
        foreach ($model in $models.models) {
            Write-Host "      - $($model.name)" -ForegroundColor White
        }
    } else {
        Write-Host "   ⚠️  未发现已安装的模型" -ForegroundColor Yellow
        Write-Host "   请运行: ollama pull llama3.1:8b" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Ollama API 测试失败: $_" -ForegroundColor Red
    Write-Host "   请手动检查 Ollama 是否正常运行" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 配置完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "下一步: 在 WSL 中测试连接" -ForegroundColor Cyan
Write-Host "   运行: bash /tmp/check_ollama.sh" -ForegroundColor White
Write-Host ""
