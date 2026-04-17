# 第九讲：云服务器部署

> 实践教程：在云服务器部署 OpenClaw

## 本章概要

本章将指导你在云服务器上部署 OpenClaw，实现 7×24 小时稳定运行。

---

## 1. 为什么选择云服务器？

### 1.1 优势

```
云服务器优势
────────────────────────────────────────────────────────

✅ 7×24 小时运行
   本地电脑需要关机，云服务器持续运行

✅ 稳定可靠
   专业机房，网络稳定

✅ 公网访问
   可从任何地方访问

✅ 易于扩展
   随时升级配置

✅ 团队协作
   多人可同时使用
```

### 1.2 适用场景

| 场景 | 推荐方案 |
|------|---------|
| 个人使用 | 本地部署 |
| 团队使用 | 云服务器 |
| 企业生产 | 云服务器 + 负载均衡 |
| 成本敏感 | 本地 + Ollama |

---

## 2. 选择云服务商

### 2.1 国内云服务商

```
国内云服务器选择
────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│ 腾讯云 Lighthouse                                   │
│ • 价格便宜（24元/月起）                             │
│ • 有 OpenClaw 镜像                                 │
│ • 适合新手                                         │
│ https://cloud.tencent.com/                         │
├─────────────────────────────────────────────────────┤
│ 阿里云                                              │
│ • 稳定可靠                                          │
│ • 生态完善                                         │
│ • 企业首选                                         │
│ https://www.aliyun.com/                            │
├─────────────────────────────────────────────────────┤
│ 华为云                                              │
│ • 安全合规                                          │
│ • 政企首选                                         │
│ https://www.huaweicloud.com/                       │
└─────────────────────────────────────────────────────┘
```

### 2.2 海外云服务商

```
海外云服务器选择
────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│ AWS                                                 │
│ • 全球最大                                          │
│ • 服务最全                                          │
│ • 价格较高                                         │
├─────────────────────────────────────────────────────┤
│ DigitalOcean                                        │
│ • 简单易用                                          │
│ • 价格透明                                          │
│ • $4/月起                                          │
├─────────────────────────────────────────────────────┤
│ Vultr                                               │
│ • 全球节点                                          │
│ • 按小时计费                                        │
│ • $2.5/月起                                        │
└─────────────────────────────────────────────────────┘
```

### 2.3 配置推荐

```
服务器配置推荐
────────────────────────────────────────────────────────

基础版（个人使用）：
• CPU: 2 核
• 内存: 4 GB
• 硬盘: 40 GB SSD
• 带宽: 3 Mbps
• 价格: ~50-100 元/月

推荐版（小团队）：
• CPU: 4 核
• 内存: 8 GB
• 硬盘: 80 GB SSD
• 带宽: 5 Mbps
• 价格: ~150-300 元/月

高性能版（企业/多用户）：
• CPU: 8 核
• 内存: 16 GB
• 硬盘: 200 GB SSD
• 带宽: 10 Mbps
• 价格: ~500+ 元/月
```

---

## 3. 部署步骤（腾讯云 Lighthouse）

### 3.1 购买服务器

```
腾讯云 Lighthouse 购买步骤
────────────────────────────────────────────────────────

1. 登录腾讯云控制台
   https://console.cloud.tencent.com/

2. 进入轻量应用服务器
   产品 → 轻量应用服务器 → 新建

3. 选择镜像
   • 应用镜像 → 选择 "OpenClaw"
   • 或选择 "Ubuntu 22.04" 手动安装

4. 选择配置
   • CPU: 2核
   • 内存: 4GB
   • 带宽: 3Mbps

5. 购买并等待创建（约 1-2 分钟）
```

### 3.2 连接服务器

```bash
# 方式一：控制台 Web Shell
# 直接在腾讯云控制台点击 "登录"

# 方式二：SSH 连接
ssh root@your_server_ip

# 首次登录需要重置密码
```

### 3.3 配置 OpenClaw

```bash
# 如果使用 OpenClaw 镜像，跳过安装步骤
# 直接进入配置目录

cd /opt/openclaw

# 编辑配置文件
nano .env

# 配置 API Key
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here

# 保存并退出 (Ctrl+O, Enter, Ctrl+X)
```

### 3.4 启动服务

```bash
# 启动 OpenClaw
systemctl start openclaw

# 查看状态
systemctl status openclaw

# 设置开机自启
systemctl enable openclaw

# 查看日志
journalctl -u openclaw -f
```

---

## 4. 手动部署（Ubuntu）

### 4.1 系统准备

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证安装
node --version
npm --version

# 安装其他依赖
apt install -y git curl wget
```

### 4.2 安装 OpenClaw

```bash
# 创建目录
mkdir -p /opt/openclaw
cd /opt/openclaw

# 克隆代码
git clone https://github.com/clawdbot/openclaw.git .

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 4.3 配置 Systemd 服务

```bash
# 创建服务文件
nano /etc/systemd/system/openclaw.service
```

```ini
[Unit]
Description=OpenClaw AI Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/openclaw
ExecStart=/usr/bin/node /opt/openclaw/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 重载 systemd
systemctl daemon-reload

# 启动服务
systemctl start openclaw

# 设置开机自启
systemctl enable openclaw
```

---

## 5. 反向代理配置

### 5.1 安装 Nginx

```bash
# 安装 Nginx
apt install -y nginx

# 启动 Nginx
systemctl start nginx
systemctl enable nginx
```

### 5.2 配置 Nginx

```bash
# 创建配置文件
nano /etc/nginx/sites-available/openclaw
```

```nginx
server {
    listen 80;
    server_name your_domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用配置
ln -s /etc/nginx/sites-available/openclaw /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

### 5.3 配置 HTTPS（可选但推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your_domain.com

# 自动续期
certbot renew --dry-run
```

---

## 6. 安全配置

### 6.1 防火墙设置

```bash
# 使用 UFW 防火墙
apt install -y ufw

# 允许必要端口
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

### 6.2 安全加固

```bash
# 1. 禁用 root SSH 登录
nano /etc/ssh/sshd_config
# 设置: PermitRootLogin no

# 2. 创建普通用户
adduser openclaw
usermod -aG sudo openclaw

# 3. 修改 SSH 端口（可选）
# 在 /etc/ssh/sshd_config 中修改 Port

# 4. 安装 fail2ban
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 6.3 环境变量安全

```bash
# 设置文件权限
chmod 600 /opt/openclaw/.env

# 不要将 .env 文件提交到 Git
# 确保 .gitignore 包含 .env
```

---

## 7. 监控与维护

### 7.1 日志管理

```bash
# 查看实时日志
journalctl -u openclaw -f

# 查看最近日志
journalctl -u openclaw -n 100

# 日志轮转配置
nano /etc/logrotate.d/openclaw
```

```
/opt/openclaw/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

### 7.2 监控脚本

```bash
# 创建健康检查脚本
nano /opt/openclaw/healthcheck.sh
```

```bash
#!/bin/bash
# OpenClaw 健康检查

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ "$RESPONSE" != "200" ]; then
    echo "OpenClaw is down, restarting..."
    systemctl restart openclaw
    # 发送告警通知
    # curl -X POST your_webhook_url -d '{"text":"OpenClaw restarted"}'
fi
```

```bash
# 添加到 crontab
crontab -e

# 每 5 分钟检查一次
*/5 * * * * /opt/openclaw/healthcheck.sh
```

### 7.3 备份策略

```bash
# 创建备份脚本
nano /opt/openclaw/backup.sh
```

```bash
#!/bin/bash
# OpenClaw 备份脚本

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# 备份数据目录
tar -czf $BACKUP_DIR/openclaw-data-$DATE.tar.gz /opt/openclaw/data

# 备份配置
cp /opt/openclaw/.env $BACKUP_DIR/env-$DATE.bak

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# 每天备份
crontab -e
0 2 * * * /opt/openclaw/backup.sh
```

---

## 8. 更新升级

```bash
# 更新 OpenClaw
cd /opt/openclaw

# 备份当前版本
cp -r . ../openclaw-backup

# 拉取最新代码
git pull

# 安装新依赖
npm install

# 重新构建
npm run build

# 重启服务
systemctl restart openclaw
```

---

## 关键要点总结

1. **云服务器选择**：根据需求选择配置和厂商
2. **一键镜像**：腾讯云 Lighthouse 提供 OpenClaw 镜像
3. **安全配置**：防火墙、HTTPS、权限管理
4. **监控维护**：日志、健康检查、备份

---

*下一章：[平台接入](03-platform-integration.md)*
