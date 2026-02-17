# Hello-Agents 快速开始指南

欢迎来到 Hello-Agents 学习项目！这份指南将帮助你快速开始学习。

---

## 项目结构

```
Hello-Agents/
│
├── README.md                           # 项目总览
├── learning-path.md                    # 学习路径规划
├── QUICKSTART.md                       # 本文件 - 快速开始
│
├── part1-foundation/                   # 第一部分：基础理论
│   ├── ch01-intro/                     # 第1章：初识智能体
│   ├── ch02-history/                   # 第2章：智能体发展史
│   └── ch03-llm-basics/                # 第3章：大语言模型基础
│
├── part2-building-agents/              # 第二部分：构建智能体
│   ├── ch04-patterns/                  # 第4章：经典范式实现
│   ├── ch05-lowcode/                   # 第5章：低代码平台
│   ├── ch06-frameworks/                # 第6章：主流框架
│   └── ch07-custom-framework/          # 第7章：自研框架
│
├── part3-advanced/                     # 第三部分：高级知识
│   ├── ch08-memory/                    # 第8章：记忆与检索
│   ├── ch09-context/                   # 第9章：上下文工程
│   ├── ch10-protocols/                 # 第10章：通信协议
│   ├── ch11-training/                  # 第11章：Agentic-RL
│   └── ch12-evaluation/                # 第12章：性能评估
│
├── part4-cases/                        # 第四部分：综合案例
│   ├── ch13-travel-agent/              # 第13章：智能旅行助手
│   ├── ch14-research-agent/            # 第14章：深度研究智能体
│   └── ch15-cyber-town-game/           # 第15章：赛博小镇（游戏重点）
│
├── part5-graduation/                   # 第五部分：毕业设计
│   ├── ch16-project/                   # 第16章：毕业设计
│   └── extensions/                     # 拓展方向
│       ├── game-dev/                   # 游戏开发方向
│       └── ai-programming/             # AI编程方向
│
└── resources/                          # 资源文件
    ├── study-checklist.md              # 学习检查清单
    ├── study-resources.md              # 学习资源汇总
    ├── project-ideas.md                # 项目创意库
    └── code-templates/                 # 代码模板
        └── agent-framework-template.py # Agent框架模板
```

---

## 第一步：选择你的方向

在开始学习之前，请先选择你感兴趣的方向：

### 🎮 游戏开发方向
**适合人群**：
- 想开发游戏的
- 对游戏 AI 感兴趣的
- 喜欢创造虚拟世界的

**你将学到**：
- 智能 NPC 系统
- 动态剧情生成
- 游戏测试自动化
- 赛博小镇构建

**典型项目**：
- RPG 游戏智能 NPC
- 策略游戏 AI 对手
- 开放世界事件生成器

### 💻 AI 编程方向
**适合人群**：
- 想提高编程效率的
- 对开发工具感兴趣的
- 想做开发者工具的

**你将学到**：
- 代码生成技术
- 代码审查系统
- 测试自动生成
- 编程助手开发

**典型项目**：
- 智能代码生成器
- 代码审查系统
- 自动化测试工具

---

## 第二步：准备学习环境

### 必备条件

1. **Python 环境**（3.8+）
   ```bash
   python --version
   ```

2. **LLM API 访问权限**
   - OpenAI API：https://platform.openai.com/
   - Anthropic API：https://console.anthropic.com/
   - 或国内替代：DeepSeek、通义千问等

3. **基础编程知识**
   - Python 基础语法
   - 函数和类
   - 基本的 API 调用

### 可选工具

- **IDE**：VSCode、PyCharm
- **版本控制**：Git
- **笔记本**：Jupyter Notebook

---

## 第三步：开始学习

### 入门路线（8周快速版）

#### Week 1-2: 基础认知
- [ ] 阅读 [第1章](part1-foundation/ch01-intro/) - 理解智能体概念
- [ ] 阅读 [第2章](part1-foundation/ch02-history/) - 了解发展历史
- [ ] 阅读 [第3章](part1-foundation/ch03-llm-basics/) - 学习 LLM 基础
- [ ] **实践**：调用一个 LLM API

**作业**：
- 分析 3 个智能体应用
- 调用至少 2 个不同的 LLM API

#### Week 3-4: 核心范式
- [ ] 阅读 [第4章](part2-building-agents/ch04-patterns/) - 学习经典范式
- [ ] **实践**：实现 ReAct Agent
- [ ] **实践**：实现 Plan-and-Solve Agent
- [ ] **实践**：实现 Reflection Agent

**作业**：
- 完成三个范式的实现
- 选择一个方向的游戏/编程应用

#### Week 5-6: 框架与工具
- [ ] 阅读 [第5章](part2-building-agents/ch05-lowcode/) - 低代码平台
- [ ] 阅读 [第6章](part2-building-agents/ch06-frameworks/) - 主流框架
- [ ] **实践**：使用 Coze/Dify 创建一个 Agent
- [ ] **实践**：使用 LangChain/AutoGen

**作业**：
- 在 Coze 上创建一个智能体
- 使用框架实现一个简单应用

#### Week 7-8: 高级技术
- [ ] 阅读 [第8章](part3-advanced/ch08-memory/) - 记忆系统
- [ ] 阅读 [第9章](part3-advanced/ch09-context/) - 上下文工程
- [ ] **实践**：实现记忆系统
- [ ] **实践**：实现长对话管理

**作业**：
- 为你的智能体添加记忆
- 完成一个综合小项目

### 进阶路线（12周完整版）

在完成入门路线后，继续：

#### Week 9-10: 综合案例
- [ ] 阅读 [第15章](part4-cases/ch15-cyber-town-game/) - 赛博小镇（游戏方向必读）
- [ ] 或阅读 AI 编程扩展资料
- [ ] **实践**：完成一个综合项目

#### Week 11-12: 毕业设计
- [ ] 阅读 [第16章](part5-graduation/ch16-project/) - 毕业设计
- [ ] 选择并完成一个完整项目
- [ ] 准备项目展示

---

## 第四步：实践项目

### 推荐的学习路径

#### 🎮 游戏开发路径

```
第1步: 简单对话 NPC
├─ 使用 ReAct 范式
├─ 添加基础记忆
└─ 实现角色对话

第2步: 任务生成器
├─ 使用 Plan-and-Solve
├─ 生成任务描述
└─ 生成任务奖励

第3步: NPC 行为系统
├─ 实现决策系统
├─ 添加社交网络
└─ 实现记忆系统

第4步: 赛博小镇
├─ 多角色系统
├─ 社会模拟
└─ 动态事件生成

第5步: 完整游戏
├─ 整合所有系统
├─ 添加玩家交互
└─ 优化和测试
```

#### 💻 AI 编程路径

```
第1步: 代码解释器
├─ 理解代码
├─ 生成解释
└─ 生成示例

第2步: 测试生成器
├─ 分析函数
├─ 生成测试用例
└─ 生成 Mock 数据

第3步: 代码审查助手
├─ 检测问题
├─ 安全扫描
└─ 优化建议

第4步: 智能编程助手
├─ 整合功能
├─ 添加上下文理解
└─ 优化用户体验

第5步: VSCode 扩展
├─ 开发插件
├─ 集成 API
└─ 发布扩展
```

---

## 学习技巧

### 1. 理论与实践结合
- 每学完一个概念，立即动手实践
- 不要只看不做，代码要亲自运行
- 修改参数，观察结果变化

### 2. 循序渐进
- 先掌握基础，再挑战复杂项目
- 不要跳过基础章节
- 遇到困难时回顾前面的内容

### 3. 记录总结
- 建立学习笔记
- 记录遇到的问题和解决方案
- 分享学习心得

### 4. 社区交流
- 在 GitHub 提 Issue
- 参与讨论
- 贡献代码

### 5. 项目驱动
- 以完成项目为目标
- 选择你感兴趣的项目
- 从小项目开始

---

## 常见问题

### Q: 我没有编程基础，可以学吗？
A: 建议先学习 Python 基础。推荐：
- [Python 官方教程](https://docs.python.org/zh-cn/3/tutorial/)
- [廖雪峰 Python 教程](https://www.liaoxuefeng.com/wiki/1016959663602400)

### Q: LLM API 太贵怎么办？
A: 可以：
1. 使用国内替代（DeepSeek、通义千问等），价格更便宜
2. 使用开源模型 + Ollama 本地运行
3. 只在关键步骤使用 LLM

### Q: 学习需要多长时间？
A:
- 快速版：8 周掌握基础
- 完整版：12-16 周深入学习
- 持续学习：Agent 技术在快速发展

### Q: 学完能找到工作吗？
A: AI Agent 是新兴领域，需求增长快。掌握后可以从事：
- AI 工具开发
- 游戏开发
- 研发效能
- 技术咨询

### Q: 遇到问题怎么办？
A:
1. 查看官方文档
2. 在 GitHub 提 Issue
3. 参与社区讨论
4. Google 搜索问题

---

## 学习检查清单

使用 [学习检查清单](resources/study-checklist.md) 跟踪你的进度！

### 每周检查
- [ ] 完成本周章节学习
- [ ] 完成实践作业
- [ ] 运行示例代码
- [ ] 记录学习笔记

### 阶段检查
- [ ] 完成一个实践项目
- [ ] 总结所学知识
- [ ] 分享学习成果
- [ ] 规划下一步学习

---

## 资源导航

- [学习路径规划](learning-path.md)
- [学习资源汇总](resources/study-resources.md)
- [项目创意库](resources/project-ideas.md)
- [代码模板](resources/code-templates/)
- [官方教程](https://datawhalechina.github.io/hello-agents/#/)

---

## 开始你的学习之旅！

准备好了吗？让我们开始吧！

**第一步**：阅读 [第1章：初识智能体](part1-foundation/ch01-intro/)

**记住**：最重要的是**动手实践**！

祝你学习愉快！ 🚀

---

最后更新：2026-02-17
