#!/bin/bash
# 快速设置WSL代理
# 请根据你的代理软件修改端口号

WINDOWS_IP="192.168.2.1"
PROXY_PORT="7890"  # 修改为你的代理端口

echo "设置代理: http://$WINDOWS_IP:$PROXY_PORT"
export http_proxy="http://$WINDOWS_IP:$PROXY_PORT"
export https_proxy="http://$WINDOWS_IP:$PROXY_PORT"
export HTTP_PROXY="http://$WINDOWS_IP:$PROXY_PORT"
export HTTPS_PROXY="http://$WINDOWS_IP:$PROXY_PORT"
export ALL_PROXY="http://$WINDOWS_IP:$PROXY_PORT"
export NO_PROXY="localhost,127.0.0.1,192.168.*,::1"

echo "✅ 代理已设置"
echo ""
echo "测试连接："
curl -s -I https://www.google.com | head -3
echo ""
curl -s -I https://api-inference.huggingface.co | head -3

# 永久保存到 ~/.bashrc
echo ""
echo "是否永久保存到 ~/.bashrc? (y/n)"
read answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    sed -i '/# WSL代理配置/,/NO_PROXY=/d' ~/.bashrc
    cat >> ~/.bashrc << EOF

# WSL代理配置（自动生成）
export http_proxy="http://$WINDOWS_IP:$PROXY_PORT"
export https_proxy="http://$WINDOWS_IP:$PROXY_PORT"
export HTTP_PROXY="http://$WINDOWS_IP:$PROXY_PORT"
export HTTPS_PROXY="http://$WINDOWS_IP:$PROXY_PORT"
export ALL_PROXY="http://$WINDOWS_IP:$PROXY_PORT"
export NO_PROXY="localhost,127.0.0.1,192.168.*,::1"
EOF
    echo "✅ 已保存到 ~/.bashrc"
fi
