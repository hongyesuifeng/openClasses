#!/bin/bash
# WSL代理配置脚本
# 使用方法：./setup_wsl_proxy.sh

echo "=== WSL代理配置工具 ==="
echo ""

# 1. 获取Windows主机IP
WINDOWS_IP=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}' | head -1)
echo "📍 检测到Windows主机IP: $WINDOWS_IP"
echo ""

# 2. 询问代理端口
echo "请输入你的Windows代理软件监听的端口号："
echo "常见代理软件默认端口："
echo "  - Clash: 7890 (HTTP) 或 7891 (SOCKS5)"
echo "  - V2rayN: 10808 (HTTP) 或 10809 (SOCKS5)"
echo "  - Shadowsocks: 1080"
echo "  - 其他代理软件请查看其设置界面"
echo ""
read -p "请输入端口号 [例如: 7890]: " PROXY_PORT

if [ -z "$PROXY_PORT" ]; then
    echo "❌ 未输入端口号，退出配置"
    exit 1
fi

PROXY_ADDR="$WINDOWS_IP:$PROXY_PORT"
echo ""
echo "🔧 配置代理地址: http://$PROXY_ADDR"
echo ""

# 3. 测试代理连接
echo "🧪 测试代理连接..."
if timeout 5 curl -x "http://$PROXY_ADDR" -s -I https://www.google.com > /dev/null 2>&1; then
    echo "✅ 代理连接成功！"
else
    echo "⚠️ 无法连接到代理，请检查："
    echo "1. 代理软件是否正在运行"
    echo "2. 端口号是否正确"
    echo "3. 代理软件是否开启了'允许局域网连接'或'Allow LAN'选项"
    echo ""
    read -p "是否继续配置? (y/n): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        exit 1
    fi
fi

echo ""

# 4. 写入代理配置到 ~/.bashrc
BASHRC="$HOME/.bashrc"
PROXY_CONFIG="# WSL代理配置（自动生成）"
PROXY_CONFIG+="
export http_proxy=\"http://$PROXY_ADDR\"
export https_proxy=\"http://$PROXY_ADDR\"
export HTTP_PROXY=\"http://$PROXY_ADDR\"
export HTTPS_PROXY=\"http://$PROXY_ADDR\"
export ALL_PROXY=\"http://$PROXY_ADDR\"
export NO_PROXY=\"localhost,127.0.0.1,192.168.*,::1\"
"

# 移除旧的代理配置
echo "📝 更新 ~/.bashrc..."
sed -i '/# WSL代理配置/,/NO_PROXY=/d' "$BASHRC"

# 添加新的代理配置
echo "$PROXY_CONFIG" >> "$BASHRC"

echo "✅ 代理配置已写入 ~/.bashrc"
echo ""

# 5. 应用配置
echo "🔄 应用代理配置..."
export http_proxy="http://$PROXY_ADDR"
export https_proxy="http://$PROXY_ADDR"
export HTTP_PROXY="http://$PROXY_ADDR"
export HTTPS_PROXY="http://$PROXY_ADDR"
export ALL_PROXY="http://$PROXY_ADDR"
export NO_PROXY="localhost,127.0.0.1,192.168.*,::1"

echo "✅ 代理已启用"
echo ""

# 6. 测试网络连接
echo "🧪 测试网络连接..."
echo ""

echo "1️⃣ 测试 Google:"
if curl -s -m 5 --connect-timeout 3 https://www.google.com > /dev/null 2>&1; then
    echo "   ✅ Google 可访问"
else
    echo "   ❌ Google 无法访问"
fi

echo ""
echo "2️⃣ 测试 HuggingFace:"
if curl -s -m 5 --connect-timeout 3 https://huggingface.co > /dev/null 2>&1; then
    echo "   ✅ HuggingFace 可访问"
else
    echo "   ❌ HuggingFace 无法访问"
fi

echo ""
echo "3️⃣ 测试 API:"
if curl -s -m 5 --connect-timeout 3 https://api-inference.huggingface.co > /dev/null 2>&1; then
    echo "   ✅ HuggingFace API 可访问"
else
    echo "   ❌ HuggingFace API 无法访问"
fi

echo ""
echo "=== 配置完成 ==="
echo ""
echo "📌 代理信息："
echo "   地址: http://$PROXY_ADDR"
echo ""
echo "📌 使用说明："
echo "   1. 新开的终端会自动应用代理配置"
echo "   2. 当前终端请运行: source ~/.bashrc"
echo "   3. 如需临时关闭代理: unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY"
echo ""
echo "📌 验证代理:"
echo "   curl https://www.google.com"
echo "   curl https://api-inference.huggingface.co"
