# OpenClaw 常见问题 FAQ

## 安装与配置

### Q: Node.js 版本要求？
A: 需要 Node.js 18.0 或更高版本。推荐使用 LTS 版本。

### Q: 安装时报错 EACCES 怎么办？
A: 这是权限问题，可以：
```bash
# 方式一：修改 npm 目录权限
sudo chown -R $(whoami) ~/.npm

# 方式二：使用 nvm 管理 Node.js
nvm install 18
nvm use 18
```

### Q: 如何更新 OpenClaw？
A:
```bash
# npm 全局安装的
npm update -g openclaw

# 源码安装的
cd openclaw
git pull
npm install
npm run build
```

---

## LLM 配置

### Q: 支持哪些 LLM 后端？
A: OpenClaw 支持：
- **商业 API**: Claude, GPT-4, DeepSeek, 通义千问, 文心一言
- **开源模型**: Llama, Qwen, Mistral
- **本地部署**: Ollama, vLLM, LM Studio

### Q: API Key 如何获取？
A:
| 服务商 | 获取地址 |
|--------|---------|
| Anthropic | https://console.anthropic.com/ |
| OpenAI | https://platform.openai.com/ |
| DeepSeek | https://platform.deepseek.com/ |
| 阿里云 | https://dashscope.console.aliyun.com/ |

### Q: 本地部署需要什么配置？
A:
| 模型规模 | 最低显存 | 推荐显存 |
|---------|---------|---------|
| 7B | 8GB | 12GB |
| 13B | 16GB | 24GB |
| 70B | 48GB | 80GB |

没有 GPU 也可以用 CPU 运行，但速度较慢。

### Q: DeepSeek 和 Claude 怎么选？
A:
| 需求 | 推荐 |
|------|------|
| 成本敏感 | DeepSeek |
| 能力最强 | Claude 3 Opus |
| 中文场景 | DeepSeek / 通义千问 |
| 代码生成 | Claude / GPT-4 |

---

## Skill 开发

### Q: Skill 必须用 Python 吗？
A: 不是。Skill 支持：
- Shell 命令
- Python 脚本
- JavaScript/Node.js
- HTTP 请求
- 任何可执行程序

### Q: 如何调试 Skill？
A:
```bash
# 1. 直接测试脚本
cd skills/my-skill
python script.py --param value

# 2. 查看 OpenClaw 日志
tail -f /var/log/openclaw/app.log

# 3. 使用 CLI 测试
openclaw skill test my-skill --params '{"key":"value"}'
```

### Q: Skill 没有被触发怎么办？
A: 检查：
1. SKILL.md 格式是否正确
2. 触发条件描述是否清晰
3. skills 目录路径是否正确
4. 查看日志确认是否被识别

### Q: 如何分享我的 Skill？
A:
1. 发布到 GitHub
2. 提交到 ClawHub 插件市场
3. 在社区分享

---

## 平台接入

### Q: 支持哪些平台？
A:
| 国内 | 海外 |
|------|------|
| 微信（个人/企业） | Telegram |
| QQ | Discord |
| 钉钉 | WhatsApp |
| 飞书 | Slack |

### Q: 飞书接入失败怎么办？
A: 检查：
1. App ID 和 Secret 是否正确
2. 权限是否开启
3. 事件订阅 URL 是否可访问
4. 应用是否已发布

### Q: 可以同时接入多个平台吗？
A: 可以！在 .env 中配置：
```
CHANNELS=feishu,dingtalk,wework
```

---

## 性能与优化

### Q: 响应速度慢怎么办？
A:
1. 使用更快的模型（如 DeepSeek-V3）
2. 减少 max_tokens
3. 使用缓存
4. 考虑本地部署

### Q: 如何降低 API 成本？
A:
1. 使用 DeepSeek 等低成本 API
2. 本地部署开源模型
3. 添加缓存层
4. 优化 prompt 长度

### Q: 支持高并发吗？
A: 支持。建议：
- 使用云服务器部署
- 配置负载均衡
- 使用 Redis 缓存
- 水平扩展多个实例

---

## 安全问题

### Q: API Key 安全吗？
A:
- 不要提交到 Git
- 使用环境变量
- 定期更换密钥
- 设置使用限额

### Q: 本地部署数据安全吗？
A: 是的。本地部署：
- 数据不出本地
- 完全自主控制
- 适合敏感场景

### Q: Skill 执行安全吗？
A: OpenClaw 有沙箱机制：
- 文件系统隔离
- 网络访问控制
- 资源限制
- 危险操作需确认

---

## 其他问题

### Q: OpenClaw 和 LangChain 有什么区别？
A:
| 特性 | OpenClaw | LangChain |
|------|----------|-----------|
| 定位 | 开箱即用的 Agent 框架 | 底层开发框架 |
| 上手难度 | 简单 | 中等 |
| 多平台接入 | 原生支持 | 需开发 |
| Skill 系统 | Markdown 驱动 | 代码驱动 |

### Q: 如何贡献代码？
A:
1. Fork 项目
2. 创建分支
3. 提交 PR
4. 等待审核

### Q: 在哪里寻求帮助？
A:
- GitHub Issues
- GitHub Discussions
- 官方 Discord
- 社区微信群

---

*如有其他问题，请在 GitHub Issues 中提问*
