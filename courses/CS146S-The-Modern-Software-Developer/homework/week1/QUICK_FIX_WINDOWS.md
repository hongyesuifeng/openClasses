# Windows Ollama 配置快速指南

## 方法 1: 使用自动化脚本 (推荐)

在 WSL 中运行:
```bash
bash /tmp/fix_ollama_wsl.sh
```

脚本会自动在 Windows 上执行配置。

---

## 方法 2: 手动配置 (PowerShell 管理员)

### 步骤 1: 打开 PowerShell 管理员

- 按 `Win + X`
- 选择 "Windows PowerShell (管理员)" 或 "终端 (管理员)"

### 步骤 2: 复制粘贴以下命令

```powershell
# 设置环境变量
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "User")

# 添加防火墙规则
Remove-NetFirewallRule -DisplayName "Ollama" -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow -Profile Any

# 重启 Ollama
Get-Process ollama -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden

# 等待启动
Start-Sleep -Seconds 3

# 测试
Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | Select-Object -ExpandProperty models | Select-Object -ExpandProperty name
```

### 步骤 3: 在 WSL 中测试

```bash
curl http://10.255.255.254:11434/api/tags
```

---

## 方法 3: 使用配置文件

我已创建了完整的配置脚本:
`setup_ollama_windows.ps1`

在 Windows PowerShell (管理员) 中运行:
```powershell
cd D:\openClass\openClasses\courses\CS146S-The-Modern-Software-Developer\homework\week1
.\setup_ollama_windows.ps1
```

---

## 验证成功

配置成功后，在 WSL 中运行:
```bash
export OLLAMA_HOST="http://10.255.255.254:11434"
curl http://10.255.255.254:11434/api/tags
```

应该能看到模型列表输出。

---

## 故障排除

### 问题 1: 端口仍无法访问
**解决**: 确保 Ollama 完全停止后再启动
```powershell
taskkill /F /IM ollama.exe
ollama serve
```

### 问题 2: 防火墙阻止
**解决**: 临时关闭防火墙测试
```powershell
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
# 测试后记得重新启用
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

### 问题 3: IP 地址变化
如果 WSL 重启后 IP 变化，运行:
```bash
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
```
更新 `~/.bashrc` 中的 IP 地址。
