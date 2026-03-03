下面这份清单按「入门 → 系统理论 → 实战项目 → 主流框架 → 论文与前沿」来整理，你可以按顺序或按兴趣挑选。
一、入门：从 0 到 1 理解 AI Agent
《AI Agents for Beginners – 微软官方入门课程（含中文）
类型：免费英文课程（有中文翻译）
链接：
GitHub 仓库：https://github.com/microsoft/ai-agents-for-beginners
学习指南：STUDY_GUIDE.md（课程要点总结）
特点：
16+ 节课，从“什么是 Agent”到多智能体、记忆、协议、生产部署都有覆盖。
使用 Microsoft Agent Framework + Azure AI Foundry，偏工程实战。
有简体中文翻译，适合零基础跟着做一遍。
《一文彻底搞懂大模型 Agent（智能体）》
类型：中文长文入门
链接：https://blog.csdn.net/aolan123/article/details/147896240
特点：
从 J.A.R.VIS 引入，通俗解释 LLM Agent 的“规划 / 记忆 / 工具 / 行动”四要素。
适合建立整体概念，再看英文文档会更轻松。
《一文读懂 AI 大模型中的 Agent 技术》
类型：中文技术文章
链接：https://juejin.cn/post/7494657593363005478
特点：
讲了 Agent 的类型（反射型、认知型、协作型、进化型、元认知型）等。
有简单代码示例，适合想“写第一行 Agent 代码”的人。
二、系统理论：LLM-based Agents 综述与论文
《A Survey on Large Language Model based Autonomous Agents》
类型：英文综述论文
链接：https://arxiv.org/abs/2308.11432
特点：
系统梳理了 LLM-based Autonomous Agents 的整体框架：构造、应用、评估。
提出了统一的 Agent 框架（profile / memory / planning / action 等模块）。
适合作为“系统理论”的主线阅读。
《Large Language Model Agent: A Survey on Methodology, Applications and Challenges》
类型：英文综述论文（偏方法论）
链接：https://arxiv.org/abs/2503.21460
特点：
从“方法论”角度拆解 LLM Agent 的架构、协作机制和演化路径。
覆盖 300+ 篇论文，资源也在 GitHub 持续更新。
《LLM-based Agents 综述（复旦 NLP 团队）》
类型：中文解读 + 论文链接
链接：
CSDN 解读：https://blog.csdn.net/2401_85378759/article/details/146630544
论文 PDF：https://arxiv.org/pdf/2309.07864.pdf
论文列表 GitHub：https://github.com/WooooDyy/LLM-Agent-Paper-List
特点：
86 页、600+ 参考文献，对单智能体、多智能体、人机协作和“智能体社会”都有讨论。
GitHub 仓库里每篇论文都有一句话概括，适合做“论文导航”。
《LLM-Agent-Survey（Paitesanshi）》
类型：GitHub 综述仓库
链接：https://github.com/Paitesanshi/LLM-Agent-Survey
特点：
对应上面的《A Survey on Large Language Model based Autonomous Agents》。
维护了表格：各 Agent 的 Profile / Memory / Planning / Action 等模块实现对比。
适合做“选型参考”。
三、实战项目 / 开源案例
《AI Agent 开源项目入门指南：从零开始参与 500 个 AI 智能体实践案例》
类型：中文教程 + 项目索引
链接：
CSDN 文章：https://blog.csdn.net/gitblog_00895/article/details/155963394
项目仓库：https://gitcode.com/GitHub_Trending/50/500-AI-Agents-Projects
特点：
汇集医疗、金融、教育、零售等多个行业的 500+ AI Agent 案例，每个都有开源项目链接。
文章手把手教你怎么贡献代码/文档，适合作为“第一个开源项目”的入口。
《2026 爆款 AI Agent OpenClaw 从入门到中级实操指南》
类型：中文实战教程
链接：https://blog.csdn.net/tigerjb/article/details/158383869
特点：
详细讲解如何部署 OpenClaw（一个本地执行、可操作文件/浏览器/日历等的 Agent 项目）。
包含飞书对接、多 Agent 管理、Docker 沙盒配置等企业级实操内容。
《用 DeepSeek 搭建 AI Agent 调用编程知识库工作流》
类型：中文实战教程
链接：https://www.163.com/dy/article/JS51GVT50519EA27.html
特点：
讲如何用 DeepSeek + Coze 平台搭建智能体，并调用 API 进行编程、构建个人知识库。
适合想“低代码/无代码”搭建 Agent 的用户。
四、主流框架 / 官方文档（实战向）
LangChain – Agents 文档
类型：英文官方文档
链接：
概念与教程：https://docs.langchain.com/oss/javascript/langchain/agents
中文概览：https://python.langchain.com.cn/docs/modules/agents/
特点：
核心概念：LLM 作为推理引擎，自主选择要调用的工具和动作序列。
适合作为“工具调用 / Agent 工作流”的标准实践入门。
AutoGen – 微软多智能体框架
类型：英文文档 + GitHub
链接：
文档：https://microsoft.github.io/autogen/stable//index.html
GitHub：https://github.com/microsoft/autogen
特点：
专为构建“多智能体协作”应用设计，支持 GroupChat 等模式。
如果你做多 Agent 协作系统，这是必看项目。
Microsoft Agent Framework & Azure AI Foundry Agent Service
类型：官方文档
链接：
Agent Framework：https://learn.microsoft.com/en-us/agent-framework/
迁移指南（从 AutoGen）：https://learn.microsoft.com/zh-cn/agent-framework/migration-guide/from-autogen/
特点：
微软当前主推的 Agent SDK 和托管服务，偏生产环境使用。
如果你在 Azure 上落地 Agent，可以按这个文档体系来。
Semantic Kernel Agent Framework
类型：英文官方文档
链接：
主文档：https://learn.microsoft.com/en-us/semantic-kernel/
Agent Framework：https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/
特点：
微软开源 SDK，支持 C# / Python / Java，把 LLM 当“技能编排引擎”。
适合 .NET / 企业开发背景的人做 Agent 集成。
OpenAI Agents SDK & Tools 文档
类型：英文官方文档
链接：
Agents 概念：https://openai.github.io/openai-agents-python/agents/
工具使用：https://openai.github.io/openai-agents-python/tools/
特点：
OpenAI 官方的 Agents SDK，把“模型 + 工具 + 指令”封装成 Agent。
适合直接基于 GPT-4 / GPT-4o 做 Agent 开发。
五、前沿研究与趋势
《The Real Barrier to LLM Agent Usability is Agentic ROI》
类型：英文论文
链接：https://arxiv.org/pdf/2505.17767
特点：
提出 “Agentic ROI” 概念，从信息质量、时间成本、经济成本衡量 Agent 是否“好用”。
对理解“为什么很多 Agent 看起来酷但实际没人用”很有启发。
LangChain – State of AI Agents 报告
类型：行业报告
链接：https://www.langchain.com/stateofaiagents
特点：
调研了 AI Agent 在生产中的落地现状、最大挑战（成本 / 质量 / 技能 / 延迟等）。
适合关注“产业落地”和趋势的人。
简单学习路径建议
如果你想系统学，可以按下面顺序：
概念建立（1–2 天）
先看：CSDN《一文彻底搞懂大模型 Agent（智能体）》
再看：掘金《一文读懂 AI 大模型中的 Agent 技术》
跟着课程动手（1–2 周）
走一遍微软《AI Agents for Beginners》课程，照着 README 跑通前几节。
选一个框架（LangChain / AutoGen / Semantic Kernel）写一个简单的工具调用 Agent。
读综述论文（1–2 周）
通读《A Survey on Large Language Model based Autonomous Agents》
用复旦的论文列表 GitHub 做扩展阅读。
做项目 / 贡献开源
在 500-AI-Agents-Projects 里找一个感兴趣的项目复现或改进。
或者用 DeepSeek / OpenAI / Azure 搭一个真正解决自己工作/学习问题的 Agent（比如知识库问答、自动整理日报等）。
如果你能简单说一下你目前的背景（学生 / 后端 / 前端 / 数据分析等）和想做的 Agent 类型（客服、个人助理、自动化运维、游戏 NPC 等），我可以帮你从上面这些资料里再挑一条更具体的学习路线。