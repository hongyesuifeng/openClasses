#!/bin/bash
# WSL Ollama 连接配置脚本

echo "=== WSL Ollama 连接配置 ==="
echo ""

# 获取 Windows 主机 IP
WINDOWS_IP=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
echo "检测到 Windows 主机 IP: $WINDOWS_IP"

# 设置环境变量
export OLLAMA_HOST="http://$WINDOWS_IP:11434"
echo "设置 OLLAMA_HOST=$OLLAMA_HOST"

# 添加到 .bashrc
if ! grep -q "OLLAMA_HOST" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Ollama 连接到 Windows 主机" >> ~/.bashrc
    echo "export OLLAMA_HOST=\"http://$WINDOWS_IP:11434\"" >> ~/.bashrc
    echo "✅ 已添加到 ~/.bashrc"
else
    echo "⚠️  ~/.bashrc 中已有 OLLAMA_HOST 配置"
fi

# 测试连接
echo ""
echo "测试连接到 Windows Ollama..."
if curl -s --connect-timeout 5 "http://$WINDOWS_IP:11434/api/tags" > /dev/null 2>&1; then
    echo "✅ 成功连接到 Windows Ollama!"
    echo ""
    echo "已安装的模型:"
    curl -s "http://$WINDOWS_IP:11434/api/tags" | python3 -m json.tool 2>/dev/null | grep -A 1 '"name"' || curl -s "http://$WINDOWS_IP:11434/api/tags"
else
    echo "❌ 无法连接到 Windows Ollama"
    echo ""
    echo "请确保："
    echo "1. 在 Windows PowerShell (管理员) 中运行以下命令："
    echo "   [Environment]::SetEnvironmentVariable('OLLAMA_HOST', '0.0.0.0:11434', 'User')"
    echo "   \$env:OLLAMA_HOST = '0.0.0.0:11434'"
    echo "   Remove-NetFirewallRule -DisplayName 'Ollama' -ErrorAction SilentlyContinue"
    echo "   New-NetFirewallRule -DisplayName 'Ollama' -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow -Profile Any"
    echo "   taskkill /F /IM ollama.exe 2>\$null"
    echo "   ollama serve"
    echo ""
    echo "2. 下载所需模型："
    echo "   ollama pull mistral-nemo:12b"
    echo "   ollama pull llama3.1:8b"
fi

echo ""
echo "=== 配置完成 ==="
