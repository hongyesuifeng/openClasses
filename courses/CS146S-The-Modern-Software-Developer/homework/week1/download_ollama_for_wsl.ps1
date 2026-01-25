# Windows PowerShell 脚本 - 为 WSL 下载 Ollama
# 在普通 PowerShell 中运行即可（不需要管理员权限）

Write-Host "=== 为 WSL 下载 Ollama ===" -ForegroundColor Cyan
Write-Host ""

# 创建 WSL 目录
$wslHome = wsl echo "~"
$targetDir = "$wslHome/.local/bin"
Write-Host "目标目录: $targetDir" -ForegroundColor Yellow

# 下载 Ollama Linux 二进制文件
Write-Host "正在下载 Ollama for Linux..." -ForegroundColor Cyan
$ollamaUrl = "https://ollama.com/download/ollama-linux-amd64"
$localPath = "$env:TEMP\ollama-linux-amd64"

try {
    Invoke-WebRequest -Uri $ollamaUrl -OutFile $localPath -UseBasicParsing
    Write-Host "✅ 下载完成: $localPath" -ForegroundColor Green

    # 复制到 WSL
    Write-Host "正在复制到 WSL..." -ForegroundColor Cyan
    wsl mkdir -p "$targetDir"
    wsl cp "`$(wslpath '$localPath')" "$targetDir/ollama"
    wsl chmod +x "$targetDir/ollama"

    # 添加到 PATH
    Write-Host "配置 WSL 环境..." -ForegroundColor Cyan
    $bashrcCmd = "export PATH=`$HOME/.local/bin:`$PATH"
    wsl bash -c "grep -q '.local/bin' ~/.bashrc || echo '$bashrcCmd' >> ~/.bashrc"

    Write-Host ""
    Write-Host "=== 安装完成 ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "请在 WSL 中运行以下命令:" -ForegroundColor Yellow
    Write-Host "  source ~/.bashrc" -ForegroundColor White
    Write-Host "  ollama --version" -ForegroundColor White
    Write-Host "  ollama serve &" -ForegroundColor White
    Write-Host "  ollama pull llama3.1:8b" -ForegroundColor White
    Write-Host "  ollama pull mistral-nemo:12b" -ForegroundColor White

} catch {
    Write-Host "❌ 下载失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动访问以下链接下载:" -ForegroundColor Yellow
    Write-Host "  https://ollama.com/download/ollama-linux-amd64" -ForegroundColor White
    Write-Host "然后将下载的文件放到 WSL 的 ~/.local/bin/ 目录" -ForegroundColor White
}
