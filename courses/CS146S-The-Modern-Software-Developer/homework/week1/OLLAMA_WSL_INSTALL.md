# WSL 中安装 Ollama - 完整指南

由于网络连接问题，请按以下步骤操作：

## 方法 1：重启 WSL 使用镜像网络（推荐）

### 步骤 1：重启 WSL

在 Windows PowerShell 中运行：
```powershell
wsl --shutdown
```

然后重新打开 WSL 终端。

### 步骤 2：验证网络模式

```bash
# 检查是否使用镜像网络
cat /etc/resolv.conf
# 如果显示 nameserver 127.0.0.1，说明镜像网络已启用
```

### 步骤 3：安装 Ollama

```bash
# 安装 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 或手动下载
mkdir -p ~/.local/bin
curl -L https://ollama.com/download/ollama-linux-amd64 -o ~/.local/bin/ollama
chmod +x ~/.local/bin/ollama

# 添加到 PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 步骤 4：下载模型

```bash
# 启动 Ollama 服务
ollama serve &

# 下载所需模型
ollama pull llama3.1:8b
ollama pull mistral-nemo:12b
```

---

## 方法 2：手动下载（如果网络仍有问题）

### 步骤 1：在 Windows 浏览器中下载

访问以下链接下载 Linux 版本：
```
https://ollama.com/download/ollama-linux-amd64
```

### 步骤 2：复制到 WSL

```bash
# 创建目标目录
mkdir -p ~/.local/bin

# 复制文件（假设下载到 Windows 下载文件夹）
cp /mnt/c/Users/qq691/Downloads/ollama-linux-amd64 ~/.local/bin/ollama
chmod +x ~/.local/bin/ollama

# 添加到 PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 步骤 3：验证安装

```bash
ollama --version
```

---

## 步骤 5：运行测试

```bash
cd /mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week1

# 确保 Python 依赖已安装
pip install ollama python-dotenv --break-system-packages

# 运行测试
python tool_calling.py
```

---

## 故障排除

### 如果 ollama 命令找不到

```bash
# 检查文件是否存在
ls -la ~/.local/bin/ollama

# 手动添加到当前 PATH
export PATH=$HOME/.local/bin:$PATH
ollama --version
```

### 如果模型下载失败

```bash
# 使用较小的模型测试
ollama pull qwen2:0.5b
```

---

## 配置文件位置

已创建的配置文件：
- WSL 配置: `~/.wslconfig`（镜像网络模式）
- 安装目录: `~/.local/bin/ollama`
- 模型目录: `~/.ollama/models/`
