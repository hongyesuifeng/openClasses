# OpenClaw 学习资源汇总

## 官方资源

### 项目地址

| 资源 | 链接 |
|------|------|
| **OpenClaw 主项目** | https://github.com/clawdbot/openclaw |
| **OpenClaw 中文文档** | https://github.com/yeuxuan/openclaw-docs |
| **DataWhale 学习教程** | https://github.com/datawhalechina/hello-claw |
| **ClawHub 插件市场** | https://clawhub.io |

### 视频教程

| 教程 | 链接 |
|------|------|
| **李宏毅 OpenClaw 原理拆解** | https://www.bilibili.com/video/BV1rAPfzFEYi/ |
| **OpenClaw 保姆级教程** | B站搜索 "OpenClaw 保姆级" |
| **吴恩达 Agent 教程** | B站搜索 "吴恩达 Agent" |

---

## 技术文档

### 大语言模型

| 主题 | 资源 |
|------|------|
| **Transformer 原理** | [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) |
| **Attention 论文** | [Attention Is All You Need](https://arxiv.org/abs/1706.03762) |
| **GPT 系列论文** | OpenAI 官网 |
| **LLM 训练指南** | [State of GPT](https://www.youtube.com/watch?v=bZQun8Y4L2A) |

### AI Agent

| 主题 | 资源 |
|------|------|
| **ReAct 论文** | [ReAct: Synergizing Reasoning and Acting](https://arxiv.org/abs/2210.03629) |
| **Tool Learning** | [Tool Learning with Foundation Models](https://arxiv.org/abs/2304.08354) |
| **LangChain 文档** | https://python.langchain.com/docs/ |
| **MCP 协议** | https://modelcontextprotocol.io/ |

### 进阶技术

| 主题 | 资源 |
|------|------|
| **Model Editing** | [EasyEdit](https://github.com/zjunlp/EasyEdit) |
| **Model Merging** | [mergekit](https://github.com/arcee-ai/mergekit) |
| **DeepSeek 技术报告** | https://arxiv.org/abs/2412.19437 |
| **RAG 技术** | [LangChain RAG](https://python.langchain.com/docs/tutorials/rag/) |

---

## 开发工具

### 本地部署

| 工具 | 用途 | 链接 |
|------|------|------|
| **Ollama** | 本地模型运行 | https://ollama.com/ |
| **LM Studio** | 图形化本地部署 | https://lmstudio.ai/ |
| **vLLM** | 高性能推理 | https://github.com/vllm-project/vllm |

### 向量数据库

| 工具 | 特点 | 链接 |
|------|------|------|
| **ChromaDB** | 轻量级，易上手 | https://www.trychroma.com/ |
| **Milvus** | 企业级，高性能 | https://milvus.io/ |
| **Pinecone** | 云服务，免维护 | https://www.pinecone.io/ |

### 其他工具

| 工具 | 用途 | 链接 |
|------|------|------|
| **Hugging Face** | 模型托管 | https://huggingface.co/ |
| **Weights & Biases** | 实验跟踪 | https://wandb.ai/ |
| **Gradio** | 快速构建 UI | https://www.gradio.app/ |

---

## 社区资源

### GitHub 项目

| 项目 | 描述 |
|------|------|
| [openclaw-onebot](https://github.com/LSTM-Kirigaya/openclaw-onebot) | OneBot 接入框架 |
| [OpenCray](https://github.com/CrayBotAGI/OpenCray) | 国产生态版本 |
| [openclaw-setup-cn](https://github.com/736773174/openclaw-setup-cn) | 一键部署教程 |

### 社区讨论

| 平台 | 链接 |
|------|------|
| **GitHub Discussions** | https://github.com/clawdbot/openclaw/discussions |
| **Discord** | OpenClaw 官方服务器 |
| **微信群** | 关注公众号获取 |

---

## API 服务商

### 商业 API

| 服务商 | 模型 | 价格参考 |
|--------|------|---------|
| **Anthropic** | Claude 3 | $0.25-15/1M tokens |
| **OpenAI** | GPT-4 | $0.5-30/1M tokens |
| **DeepSeek** | DeepSeek | ¥0.001-0.01/1K tokens |
| **阿里云** | 通义千问 | ¥0.008/1K tokens |
| **百度** | 文心一言 | ¥0.008/1K tokens |

### 开源模型

| 模型 | 参数量 | 特点 |
|------|--------|------|
| **Llama 3** | 8B-70B | Meta 开源，社区活跃 |
| **Qwen 2** | 7B-72B | 阿里开源，中文强 |
| **DeepSeek-V3** | 671B | 国产最强，推理强 |
| **Mistral** | 7B | 欧洲开源，效率高 |

---

## 学习路线总结

```
OpenClaw 学习路线
────────────────────────────────────────────────────────

Week 1-2: 基础入门
├── AI Agent 概念
├── LLM 基础
└── OpenClaw 介绍

Week 3-4: 核心原理
├── Transformer 架构
├── 模型训练方法
├── 工具调用机制
└── ReAct 范式

Week 5-6: 部署实践
├── 本地部署
├── 云服务器部署
└── 多平台接入

Week 7-8: Skill 开发
├── SKILL.md 编写
├── 脚本开发
└── 调试技巧

Week 9-10: 进阶专题
├── 记忆系统
├── Model Editing
└── Model Merging

Week 11-12: 实战项目
├── 个人助手
└── 企业应用

持续学习：
├── 关注社区动态
├── 参与开源贡献
└── 实践新想法
```

---

## 常见问题

### Q: 新手应该从哪里开始？
A: 建议顺序：
1. 观看李宏毅教授的视频教程
2. 本地部署 OpenClaw
3. 开发一个简单的 Skill
4. 逐步深入原理

### Q: 如何选择 LLM 后端？
A:
- **学习/测试**：Ollama + Llama 3（免费）
- **个人使用**：DeepSeek（便宜）
- **企业生产**：Claude/GPT-4（稳定）

### Q: Skill 开发难吗？
A: 不难！
- 基础 Skill 只需要 Markdown 文件
- 复杂功能可以用 Python/JavaScript
- 有大量示例可参考

### Q: 如何参与社区？
A:
- GitHub 提 Issue 和 PR
- 分享你的 Skills
- 参与讨论帮助他人

---

*最后更新：2026年4月*
