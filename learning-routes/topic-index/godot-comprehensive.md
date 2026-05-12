# Godot 引擎完整学习、原理、源码与 Demo 实战总路线

> 面向学习者 `perry` 的正式版 Godot 总文档。目标不是零散地“学会一些 Godot 功能”，而是系统完成：**引擎使用 → 核心原理 → 核心模块技术原理 → AI 辅助搭建 Demo → 类《杀戮尖塔》Demo 制作 → Demo 发布上线 → 源码架构阅读**。

---

## 1. 文档定位

这份文档整合了仓库中已有的 Godot 学习路线与新增的专项路线图，作为**唯一主线版本**使用。

它解决四个问题：

1. **学什么**：Godot 4.x 应该按什么顺序学；
2. **为什么这样学**：先用、再懂、先用 AI 搭起来，再做项目，最后再读源码；
3. **怎么验证学会了**：每个阶段都有作业、产出和检查点；
4. **怎么收束成成果**：最终做出一个可玩的卡牌 Roguelike Demo，并具备发布能力。

---

## 2. 学习者上下文

### 2.1 学习者画像

- **学习者 ID**: perry
- **学习目标**: 掌握 AI Agent 与游戏开发的结合，构建智能游戏系统
- **学习风格**: 实践导向、项目驱动、喜欢结构化笔记
- **每周可用学习时间**: 15-20 小时
- **难度偏好**: 渐进式学习

### 2.2 当前技能状态

- ✅ 已掌握: Python（高级）、TypeScript（中级）、提示工程（高级）、LLM 基础（中级）、Agent 架构（中级）
- 🔄 学习中: C++（基础阶段）、游戏引擎基础（入门阶段）、Godot 引擎（核心基础阶段）

### 2.3 路线设计原则

因为你是明显的**实践型学习者**，所以这份路线不采用“先完整补理论再做项目”的方式，而采用：

1. **先建立手感**：用 Godot 做小原型；
2. **再理解结构**：搞懂 Scene / Node / Resource / Signal；
3. **再看引擎分层**：Scene / Server / Driver / Platform；
4. **先借助 AI 搭骨架**：用 AI 辅助搭建类《杀戮尖塔》Demo 的最小可玩结构；
5. **在做 Demo 的过程中补理解**：把产品理解、引擎理解和实现细节串起来；
6. **最后再回到源码**：用 Demo 反推 `main/`、`core/`、`scene/` 的真实调用链。

---

## 3. 总体规划总览

### 3.1 推荐总周期

| 阶段 | 内容 | 时间 | 每周建议投入 | 输出重点 |
|---|---|---:|---:|---|
| Phase 0 | 预备知识与环境固定 | 2 周 | 12-15h | 环境、工作流、基础试玩项目 |
| Phase 1 | Godot 使用指南 | 4-6 周 | 15h | 节点/场景/信号/资源/调试 |
| Phase 2 | Godot 主要原理 | 4 周 | 15h | 分层架构、主循环、Server 模式 |
| Phase 3 | 核心模块技术原理 | 4 周 | 15h | core / scene / server / editor 认知 |
| Phase 4 | AI + Godot 结合 | 2-4 周 | 10-15h | 用 AI 辅助搭建 Demo 骨架 |
| Phase 5 | 类杀戮尖塔 Demo 开发 | 8 周 | 15-20h | 可玩 Demo |
| Phase 6 | 打磨与上线 | 2-3 周 | 12-15h | 导出、测试、发布 |
| Phase 7 | 源代码架构解析 | 4 周 | 12-15h | 阅读路径、断点、调用链 |

**建议总计：28~33 周。**

如果只追求“先做出 Demo”，可压缩为 20~24 周；如果还要更扎实地读源码并做 AI 扩展，则按 30 周以上规划更合理。

### 3.2 推荐学习顺序

不推荐：

- 一开始就啃 Godot 全部源码；
- 一开始就做完整 Slay-like；
- 一开始就学渲染器实现；
- 同时并行推进 C++、图形学、Godot、游戏设计、AI 集成。

推荐：

1. **会用 Godot**；
2. **能做几个小原型**；
3. **理解 Godot 的分层和模块职责**；
4. **先用 AI 辅助搭起 Demo 骨架**；
5. **在 Demo 中反推产品结构和引擎原理**；
6. **最后再回到源码验证理解**。

---

## 4. 核心资料地图

### 4.1 官方主线资料

1. **Godot 官方文档首页**  
   https://docs.godotengine.org/en/stable/
2. **Getting Started**  
   https://docs.godotengine.org/en/stable/getting_started/introduction/index.html
3. **Step by Step**  
   https://docs.godotengine.org/en/stable/getting_started/step_by_step/index.html
4. **Your First 2D Game**  
   https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html
5. **GDScript 文档**  
   https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/index.html
6. **C# in Godot**  
   https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/index.html
7. **Debug / Profiler / Monitor**  
   https://docs.godotengine.org/en/stable/tutorials/debug/index.html
8. **Export / Deployment**  
   https://docs.godotengine.org/en/stable/tutorials/export/index.html
9. **Best Practices**  
   https://docs.godotengine.org/en/stable/tutorials/best_practices/index.html
10. **Instancing / PackedScene / Scene Organization**  
   建议连同 Step by Step、Best Practices 一起读，用来修正“场景只是文件夹替代品”的误解。

### 4.1.1 官方资料怎么用，才不会陷入“看很多、用很少”

- `Getting Started`：只负责让你上手，不负责替你建立项目边界。
- `Step by Step`：重点不是照抄示例，而是理解 Node / Scene / Signal / Script 的协作模式。
- `Best Practices`：这部分很容易被初学者跳过，但它对中型项目最重要，尤其是项目组织、场景拆分、耦合控制。
- `Debug` / `Export`：不要等到项目后期再看。你在第一个微原型阶段就应该至少跑一次断点、一次导出。

### 4.1.2 关于教程来源的取舍

- **优先看版本明确标注为 Godot 4.x 的内容**。
- 对 YouTube 或博客教程，若其主要内容仍在使用 Godot 3.x 的 API、编辑器布局或节点习惯，要把它们当作“思路参考”，不能直接照搬。
- 对 deckbuilder/card-game 教程，优先吸收其数据建模、状态流转、UI 表达方式，不要机械复制具体实现。

### 4.2 理解引擎原理的官方资料

1. **Architecture Diagram**  
   https://docs.godotengine.org/en/stable/engine_details/architecture/godot_architecture_diagram.html
2. **Engine Details**  
   https://docs.godotengine.org/en/stable/engine_details/index.html
3. **Optimization using Servers**  
   https://docs.godotengine.org/en/stable/tutorials/optimization/using_servers.html

### 4.3 高质量补充资源

1. **GDQuest** - https://www.gdquest.com/
2. **KidsCanCode** - https://kidscancode.org/godot_recipes/4.x/
3. **HeartBeast** - https://www.youtube.com/@uheartbeast
4. **Godot GitHub 源码仓库** - https://github.com/godotengine/godot

### 4.4 仓库内已有资料

- `docs/game-engine/godot-architecture.md`
- `docs/game-engine/godot-learning-guide.md`
- `docs/general/godot-source-learning/`

其中，本文件作为主路线，其他文档作为专题支撑。

---

## 5. 第一部分：Godot 引擎使用指南

> 目标：从“会启动编辑器”进入“能独立组织一个中小型 2D 项目”。

### 阶段 1.1：环境搭建与界面熟悉（第 1 周，8-10 小时）

**学习目标**

- 完成 Godot 4.x 开发环境配置
- 熟悉编辑器界面布局和基本操作
- 理解项目管理器、项目设置、输入映射

**学习内容**

1. 安装 Godot 4.x stable
2. 配置编辑器（VS Code / Rider）
3. 熟悉场景树、文件系统、检查器、输出、调试器
4. 学会项目设置、输入映射、Autoload 的入口位置

**实践任务**

- [ ] 创建 `HelloGodot` 项目
- [ ] 配置一套常用输入映射
- [ ] 创建 3 个测试场景并切换
- [ ] 导出一个桌面可运行版本

**检查点**

- [ ] 能独立创建和管理项目
- [ ] 知道常用面板位置和用途
- [ ] 能完成基本导出

---

### 阶段 1.2：核心概念理解（第 2-3 周，20-25 小时）

**核心概念**

1. **节点系统**

```text
Node
├── CanvasItem
│   ├── Node2D
│   └── Control
├── Node3D
├── Timer
└── AudioStreamPlayer
```

2. **场景系统**
   - 场景 = 节点树 + 资源
   - 支持实例化、继承、嵌套复用
   - `PackedScene` 是场景的序列化与复用载体

3. **信号系统**
   - 内置信号、自定义信号、参数传递、解耦通信

4. **资源系统**
   - `Resource`、预加载 / 延迟加载、缓存、导入设置

**实践任务**

- [ ] 创建一个完整角色场景（组合优于继承）
- [ ] 实现玩家与敌人的信号通信
- [ ] 创建自定义 `Resource`（如 `CardData`）
- [ ] 实现场景动态加载与卸载

**检查点**

- [ ] 能解释 Node、Scene、Signal、Resource 的关系
- [ ] 能用 Resource 做简单数据驱动

---

### 阶段 1.3：GDScript 与项目组织（第 4-5 周，25-30 小时）

**学习目标**

- 熟悉 GDScript 的常用语法和项目内使用方式
- 理解脚本、节点、资源之间的协作方式
- 建立适合中小项目的目录组织

**建议目录**

```text
project/
├── scenes/
├── scripts/
├── resources/
├── ui/
├── data/
├── autoload/
└── assets/
```

**重点能力**

- 生命周期方法：`_enter_tree()` / `_ready()` / `_process()` / `_physics_process()` / `_exit_tree()`
- 输入系统：`_input()` / `_unhandled_input()`
- Resource 数据设计
- Autoload 全局状态管理

**实践任务**

- [ ] 写一个带状态切换的角色或界面脚本
- [ ] 实现一个全局 `GameState` Autoload
- [ ] 完成卡牌数据结构最小原型

---

### 阶段 1.4：常用节点类型深入（第 6-7 周，25-30 小时）

重点理解：

- `Node2D`：位置、旋转、缩放
- `Control`：UI 布局、焦点、主题、输入
- `AnimationPlayer` / `Tween`
- `AudioStreamPlayer`
- `Area2D` / `CollisionShape2D`
- `TileMap`

**实践任务**

- [ ] 做一个 UI 卡牌 hover / click / drag 原型
- [ ] 做一个带动画反馈的伤害表现原型
- [ ] 做一个小地图或节点式流程界面原型

---

### 阶段 1.5：综合实践项目（第 8-10 周，30-40 小时）

做 3 个微原型：

1. 场景切换原型
2. 手牌拖拽与打出原型
3. Turn-based 战斗 UI 原型

**通过标准**

- [ ] 你已经不再只是“跟教程做”，而是能自己组合功能
- [ ] 你能把一个玩法需求拆成场景、节点、资源、脚本四层

---

## 6. 第二部分：Godot 引擎主要原理

> 目标：理解 Godot 为什么这样设计，而不是只会调用 API。

### 阶段 2.1：引擎架构概述（第 11 周，10-12 小时）

Godot 可粗略理解为如下分层：

```text
┌─────────────────────────────────────┐
│            Editor 编辑器层           │
├─────────────────────────────────────┤
│            Scene 场景层             │
├─────────────────────────────────────┤
│            Servers 服务器层         │
├─────────────────────────────────────┤
│            Drivers 驱动层           │
├─────────────────────────────────────┤
│            Core 核心基础层          │
├─────────────────────────────────────┤
│            Platform 平台层          │
└─────────────────────────────────────┘
```

**学习目标**

- 理解分层职责
- 理解 Scene 与 Server 的分离
- 理解模块化与平台抽象

---

### 阶段 2.2：Scene Layer 的核心思想（第 12 周，15 小时）

Scene Layer 是开发者日常最直接接触的层。

核心认知：

- Node 是行为单元
- Scene 是复用模板
- SceneTree 负责节点树生命周期
- PackedScene 负责保存、加载、实例化
- Resource 负责数据与资产复用

**必须真正理解的问题**

1. 为什么 Godot 强调“场景是可复用组合单元”？
2. 为什么大多数玩法逻辑天然适合放在 Scene/Node 层？
3. 为什么卡牌游戏尤其适合使用 Resource 做数据建模？

**需要补足的关键细节**

- `Node` 更像“带生命周期和通知机制的对象”，不是简单组件容器。
- `Scene` 的价值不仅是复用，更是把“结构 + 默认资源 + 节点关系”打包成可实例化模板。
- `PackedScene` 的意义不只是保存场景文件，而是把运行时可实例化的节点树模板以资源形式交给加载系统管理。
- 这也是 Godot 为什么非常适合内容型、数据型游戏：玩法对象、表现节点、配置资源之间天然可以分层。

---

### 阶段 2.3：Server 架构模式（第 13 周，20 小时）

**核心服务器**

| Server | 职责 |
|---|---|
| `RenderingServer` | 渲染、材质、光照、GPU 资源 |
| `PhysicsServer2D/3D` | 物理模拟、碰撞检测 |
| `AudioServer` | 音频混合、总线、效果 |
| `DisplayServer` | 窗口、输入、显示系统 |
| `NavigationServer` | 导航与寻路 |

**你要理解的不是具体 API 数量，而是模式：**

- Scene 层表达对象；
- Server 层执行后端逻辑；
- 两者通过抽象接口与 RID 协作。

**需要避免的过度简化**

- 不要把 Server 理解成“隐藏起来的底层 API 封装”；它更像 Godot 把后端状态统一管理、统一调度的执行边界。
- 不要把 RID 理解成普通 ID。它的价值是把场景对象与后端资源句柄解耦，让资源生命周期、线程边界和后端实现能够独立演化。
- 你平时主要写 Scene/Node 层逻辑，但当项目进入性能优化、批量对象管理、底层调试时，Server 层认知会突然变得重要。

---

### 阶段 2.4：SceneTree、主循环与生命周期（第 14 周，15 小时）

```text
SceneTree::iteration()
├── 处理输入
├── 物理步进
├── 帧更新
├── MessageQueue flush
└── 渲染
```

```text
_enter_tree() → _ready() → _process()/_physics_process() → _exit_tree()
```

你要能把日常写脚本的体验，与主循环时机绑定起来。

**这里最容易被教程讲浅的点**

- `_enter_tree()` 是**自上而下**进入；
- `_ready()` 是**自下而上**触发；
- `_exit_tree()` 也是先子后父。

这意味着：

- 父节点不能想当然地在 `_enter_tree()` 里依赖子节点已经准备好；
- 父节点通常更适合在 `_ready()` 中读取已就绪子节点；
- 当你做 UI 装配、战斗场景初始化、地图节点生成时，这个顺序差异常常是 bug 来源。

---

### 阶段 2.5：资源系统原理（第 15 周，10-12 小时）

**Godot 很适合卡牌 Demo 的原因之一，就是 Resource 系统非常适合内容驱动。**

适合抽成 Resource 的内容：

- `CardData`
- `EnemyData`
- `RelicData`
- `StatusData`
- `EncounterData`
- `EventData`

你要理解：

- 资源何时加载
- 是否缓存
- 如何避免玩法数据与 UI 脚本硬耦合

**深化理解**

- `Resource` 不只是“配置文件对象”，它是 Godot 统一资产体系的一部分，会参与加载、缓存、序列化与编辑器检查器暴露。
- `preload` 更适合明确且高频的依赖；`load` / `ResourceLoader` 更适合运行时决定的资源。
- 对卡牌项目，`CardData` / `EnemyData` / `EncounterData` 应该尽量保持“静态定义数据”；真正会变化的 run 状态要放进 `DeckState` / `BattleState` / `RunState` 一类运行时对象里。

---

### 阶段 2.6：渲染、物理、音频的边界认识（第 16 周，10-12 小时）

这一阶段不要求你吃透渲染器，而要求你知道：

- 节点为什么不是直接“画图”；
- 物理为什么在 Server 层实现；
- 音频为什么是总线与资源分离；
- UI 为什么归在 scene/gui 和 Control 体系。

---

## 7. 第三部分：各核心模块技术原理

> 目标：建立 Godot 模块地图，知道“出了一个问题应该去哪里看”。

### 7.1 模块学习顺序

1. `core/`
2. `main/`
3. `scene/`
4. `servers/`
5. `editor/`
6. `modules/`
7. `platform/`
8. `drivers/`

### 7.2 `core/`：基础设施层

重点内容：

- `Object`
- `RefCounted`
- `ClassDB`
- `Variant`
- 字符串、数学、容器、I/O、内存管理

你要回答：

1. Godot 如何做运行时类型注册？
2. GDScript 与 C++ 的数据桥梁为什么是 `Variant`？
3. 引擎为什么维护自己的基础设施层？

**建议重点补脑图，而不是全文细读**

- `Object`：提供通知、反射入口、信号与生命周期基础；
- `ClassDB`：保存类元信息，支撑脚本绑定、Inspector 暴露、方法注册；
- `Variant`：作为脚本与引擎交互的通用数据容器，是“动态层”和“静态 C++ 层”的桥梁；
- `RefCounted`：让大量资源对象以引用计数方式管理，而不是手工追踪所有权。

### 7.3 `main/`：引擎入口与生命周期

重点文件：

- `main/main.cpp`
- `main/main.h`

关键问题：

1. 引擎启动顺序是什么？
2. 主循环在哪里接入？
3. 编辑器模式与运行模式如何分流？

### 7.4 `scene/`：最值得优先理解的模块

重点内容：

- `Node`
- `SceneTree`
- `PackedScene`
- `Resource`
- `Control`
- `Node2D` / `Node3D`

这是最接近你游戏开发日常的源码区域。

**这里推荐你优先回答 4 个问题**

1. 一个场景实例化时，节点树是怎样被恢复出来的？
2. 一个节点进入树后，何时能安全访问其他子节点？
3. Resource 在场景与脚本之间怎样共享？
4. Control 的输入与布局为什么会让 UI 项目复杂度迅速上升？

### 7.5 `servers/`：后端系统抽象

重点不是一下子看懂渲染器，而是先理解：

- 节点如何向 Server 发送状态
- RID 为何存在
- 为什么前端对象与后端资源要分离

### 7.6 `editor/`：工具化与工作流能力

重点理解：

- Inspector 如何工作
- 属性暴露如何依赖 ClassDB
- `EditorPlugin` / Tool Script 如何扩展编辑器
- 导入/导出工作流如何接入

### 7.7 `modules/` / `platform/` / `drivers/`

这些目录适合第二轮阅读：

- `modules/`: GDScript、Mono/C#、glTF、Jolt 等
- `platform/`: Windows / Linux / Android / Web
- `drivers/`: 图形与音频底层驱动

---

## 8. 第四部分：AI 与 Godot 结合

> 目标：在已经掌握基础使用和技术原理之后，开始借助 AI 搭建类《杀戮尖塔》Demo，并在搭建过程中反过来深化对产品、引擎和实现细节的理解。

### 8.1 AI 在这个阶段的定位

AI 在这里不是“附加扩展”，而是进入 Demo 阶段前的加速器。你可以把它理解成：

1. 帮你更快把最小可玩结构搭出来；
2. 帮你更早暴露项目拆分、状态管理、UI 表达的问题；
3. 帮你把“学习 Godot”从看资料，切换成“带着具体问题做东西”。

### 8.2 适合 AI 先介入的环节

- Demo 范围收敛：先让 AI 帮你列出最小闭环，而不是直接生成整套方案；
- 目录与脚手架：让 AI 辅助生成项目结构、基础场景和数据模板；
- 数据样板：让 AI 辅助批量生成卡牌文案、敌人配置、事件草案；
- 测试辅助：让 AI 帮你补测试清单、边界条件和回归检查点。

### 8.3 使用原则

1. AI 负责“加速搭建”，不负责替你完成架构判断；
2. 每一次 AI 产出，都要落回到可运行的 Godot 项目里验证；
3. 如果 AI 让你更快做出可玩的东西，就用它；如果它让你更快暴露理解缺口，也要用它；
4. AI 不是替代源码阅读，而是把源码阅读推到更有问题意识的阶段。

### 8.4 典型工作流

1. 先用 AI 帮你搭最小战斗原型；
2. 在原型里补卡牌、敌人、回合和 UI；
3. 在这个过程中识别产品结构上的关键问题；
4. 再把这些问题映射回 Godot 的节点、资源、场景和调试机制；
5. 之后进入源码阅读时，关注点会更明确。

### 8.5 适合后续扩展的 AI 方向

当 Demo 主循环跑起来以后，可以把 AI 继续接到这些更具体的方向上：

- 智能 NPC / 对话系统：LLM 驱动对话、角色记忆与状态驱动响应、非关键玩法区域中的智能事件文本；
- 程序化内容生成：卡牌描述草案生成、事件文案与敌人设定生成、平衡测试用批量内容样本生成；
- AI 对手 / 辅助测试 Agent：自动跑局测试、自动检测软锁局与坏体验、自动记录胜率、平均回合数、构筑倾向；
- AI 辅助工具链：卡牌数据生成器、敌人行为配置检查器、存档分析器、自动回归测试 Agent。

---

## 9. 第五部分：类《杀戮尖塔》Demo 制作路径

> 目标不是复刻《杀戮尖塔》，而是做一个**结构相似、范围可控、可完整交付**的卡牌 Roguelike Demo。

### 9.1 Demo 范围控制

**首版建议范围：**

- 1 个角色
- 20~30 张卡牌
- 6~8 个敌人
- 1 个 Act
- 1 张带分支地图
- 2~3 个普通战、1 个 Elite、1 个 Boss
- 3~5 个基础被动/遗物效果（可选，但不要复杂）
- 1 套最小奖励流程（战后加卡或回血二选一即可）
- 仅桌面版

**首版不要做：**

- 多角色、多章节
- 大量剧情与美术定制
- 在线系统
- 完整 meta progression

**为什么要这样缩范围**

外部经验反复说明，deckbuilder 原型最容易失控的不是战斗本身，而是“奖励、商店、事件、遗物、升级、状态效果、地图分支”这些中层系统叠加。对学习型项目来说，必须优先保证：

1. 单场战斗可玩；
2. 地图推进闭环成立；
3. 数据驱动结构可扩展；
4. 版本可以真实导出并让别人试玩。

### 9.2 游戏核心机制分析

#### 1. 卡牌系统

```gdscript
class_name CardData extends Resource

@export var card_name: String
@export var description: String
@export var cost: int
@export var card_type: Enums.CardType
@export var rarity: Enums.Rarity
@export var target_type: Enums.TargetType
@export var effects: Array[CardEffect]
@export var artwork: Texture2D
```

```gdscript
class_name CardEffect extends Resource

enum EffectType {
    DAMAGE, BLOCK, HEAL, DRAW, DISCARD,
    APPLY_STATUS, GAIN_ENERGY, CUSTOM
}

@export var effect_type: EffectType
@export var base_value: int
@export var times: int = 1
```

#### 2. 战斗系统

```text
战斗开始
├── 初始化: 抽 5 张牌, 获得 3 能量
└── 回合循环:
    ├── 玩家回合
    ├── 敌人回合
    └── 检查战斗结束
```

```gdscript
class_name BattleManager extends Node

signal battle_started
signal turn_changed(is_player_turn: bool)
signal battle_ended(victory: bool)

var player: Player
var enemies: Array[Enemy]
var turn_count: int = 0
```

#### 3. 地图生成与流程

节点类型建议：

- `BATTLE`
- `ELITE`
- `BOSS`
- `EVENT`
- `SHOP`
- `REST`

#### 4. 成长系统

- 生命值与能量上限
- 卡组管理
- 遗物系统
- 金币系统

### 9.3 推荐技术架构

**数据层**

- `resources/cards/*.tres`
- `resources/enemies/*.tres`
- `resources/relics/*.tres`
- `resources/events/*.tres`

**运行时状态层**

- `BattleState`
- `RunState`
- `DeckState`
- `MapState`

**表现层**

- `CardView`
- `HandView`
- `EnemyView`
- `BattleHUD`
- `MapView`

**协调层**

- `BattleController`
- `MapController`
- `RewardController`
- `SaveController`

核心原则：**数据、状态、表现、协调分离。**

再强调一次职责边界：

- `CardData` 不保存“这局已经被升级过几次”；
- `RunState` 不直接持有 UI 节点引用；
- `BattleController` 负责流程推进，不负责具体卡面渲染；
- `CardView` 负责展示和交互，不负责定义卡牌规则。

### 9.4 分阶段开发计划（8-12 周）

#### 第一阶段：核心战斗原型（第 1-4 周）

**第 1 周 - 基础卡牌系统**

- [ ] 创建 `CardData` 资源类
- [ ] 实现卡牌 UI 组件
- [ ] 创建 5 张基础卡
- [ ] 实现手牌显示和交互

**第 2 周 - 战斗框架**

- [ ] 创建 `BattleManager`
- [ ] 实现回合制系统
- [ ] 创建能量系统
- [ ] 实现抽牌和弃牌机制

**第 3 周 - 敌人系统**

- [ ] 创建 `Enemy` 基类
- [ ] 实现意图系统
- [ ] 创建 2 种简单敌人
- [ ] 实现敌人 AI 行动

**第 4 周 - 伤害和效果**

- [ ] 实现伤害计算
- [ ] 添加格挡系统
- [ ] 实现状态效果框架
- [ ] 添加伤害动画

**检查点**

- [ ] 能完成完整战斗流程
- [ ] 玩家可以抽牌、出牌、结束回合

#### 第二阶段：卡组与角色系统（第 5-8 周）

- [ ] 牌库、弃牌堆管理
- [ ] 卡组编辑界面
- [ ] 玩家属性、金币、存档
- [ ] 最小奖励系统
- [ ] 轻量被动/遗物系统（若前面进度健康再加）

#### 第三阶段：地图与事件系统（第 9-10 周）

- [ ] 地图节点与分支路径
- [ ] 节点推进
- [ ] 事件节点
- [ ] Rest / Shop / Boss 前流程

#### 第四阶段：完善与扩展（第 11-12 周）

- [ ] 补到 20~30 张卡
- [ ] 补到 6~8 敌人
- [ ] 补 1 个 Boss
- [ ] 做基础平衡调优
- [ ] 打磨 UI 与反馈

### 9.5 技术难点

#### 1. 卡牌效果系统设计

难点：效果类型越来越多时，逻辑很容易膨胀。

建议：

- 先用 Resource + 参数化效果
- 少量特殊效果单独实现
- 不要一开始就过度抽象成复杂 DSL

#### 2. 敌人 AI 意图系统

难点：既要可读，又要可控。

建议：

- 首版采用固定序列或权重池
- UI 要先显示敌人意图
- AI 复杂度永远排在可玩性之后

#### 3. 状态效果管理

难点：叠层、持续时间、回合时机、触发顺序。

建议：

- 建立统一触发时机枚举
- 统一结算队列
- 明确玩家回合与敌人回合的处理边界

#### 4. 动画与结算顺序

难点：视觉反馈与逻辑结算容易错位。

建议：

- 逻辑层先得出结果
- 表现层排队播放反馈
- 用信号或事件队列隔离表现与逻辑

### 9.6 推荐项目结构

```text
slay_demo/
├── scenes/
│   ├── battle/
│   ├── map/
│   ├── ui/
│   └── common/
├── scripts/
│   ├── battle/
│   ├── cards/
│   ├── enemies/
│   ├── map/
│   ├── systems/
│   └── ui/
├── resources/
│   ├── cards/
│   ├── enemies/
│   ├── relics/
│   ├── statuses/
│   └── encounters/
├── autoload/
├── assets/
└── tests/
```

### 9.7 可复用模块的沉淀（放到后面再做）

这一版 Demo 的重点是先把“能玩起来”做出来；等它完成后，再把过程里反复出现的能力抽成可复用模块，留给下一个 Demo 直接用。

优先考虑沉淀的方向包括：

- 事件系统：把战斗、地图、奖励、UI 交互统一成事件流；
- UI 管理系统：统一界面切换、弹窗、层级与输入拦截；
- 状态机：统一角色、敌人、回合和流程状态切换；
- 资源管理模块：统一加载、缓存、释放和配置读取。

先不要把这些模块做成当前 Demo 的前置条件；它们更适合作为**下一个 Demo 的复用基础**，这样你会在真实项目里自然知道哪些能力值得抽象。

---

## 10. 第六部分：Demo 测试、打磨与上线

### 10.1 功能测试

- 回合切换是否稳定
- 弃牌 / 洗牌是否正确
- 卡牌目标判定是否一致
- 敌人意图与实际行为是否一致
- 存档恢复后当前 run 是否能继续推进
- 动画播放中是否会打断逻辑结算

### 10.2 平衡测试

- 初始卡组是否可过首轮战斗
- 奖励是否滚雪球过强
- Boss 是否把数值拉得过高

### 10.3 可用性测试

- 玩家能否看懂能量、格挡、意图
- 鼠标/键盘交互是否顺手
- 战斗日志与提示是否清楚

### 10.4 性能检查

- 是否有过多 redraw / layout 抖动
- 是否有资源重复加载
- 是否有不必要实例化或频繁销毁

### 10.5 发布建议

首发建议：

- 平台：**itch.io**
- 构建：Windows 桌面版优先
- 页面内容：
  - 项目简介
  - 控制方式
  - Demo 范围说明
  - 已知问题
  - 更新日志

**建议增加一个发布前检查清单**

- [ ] 从零开始可在 15~25 分钟内完成一轮演示流程
- [ ] 没有阻塞推进的已知软锁
- [ ] 首次进入游戏时能看懂基础操作
- [ ] 失败后能快速重新开始
- [ ] 导出包在目标机器上无需额外手工修复
- [ ] 页面截图真实反映当前完成度，而不是概念图

Steam Demo 可以作为下一阶段目标，但不适合作为第一次 Godot 项目的首发平台。

---

## 11. 第七部分：源代码架构解析与阅读路径

### 11.1 源码获取与调试构建

```bash
git clone https://github.com/godotengine/godot.git
cd godot
git checkout 4.2-stable

# Linux/macOS
scons platform=linuxbsd dev_build=yes -j$(nproc)

# Windows
scons platform=windows dev_build=yes -j%NUMBER_OF_PROCESSORS%
```

### 11.2 IDE 配置重点

- C/C++ 语言服务器可用
- 能跳转宏定义
- 能跟踪继承层次
- 能快速查找 `GDCLASS(`、`ClassDB::bind_method`

### 11.3 推荐阅读顺序

**第一轮：建立地图感**

1. 顶层目录结构
2. `main/main.cpp`
3. `core/object/`
4. `scene/main/`
5. `scene/resources/`

**第二轮：把编辑器操作映射到源码**

1. Node 生命周期
2. SceneTree 组织与通知
3. PackedScene 加载与实例化
4. ResourceLoader / ResourceSaver
5. Control 的输入与布局

**建议你在第二轮额外追 3 条具体调用链**

1. **引擎启动链**：`main()` → `Main::setup()` → `Main::setup2()` → `Main::start()`
2. **场景实例化链**：从加载 `PackedScene` 到节点树恢复、`_enter_tree()` / `_ready()` 触发
3. **输入分发链**：输入进入窗口/视图后，怎样一路传到 `SceneTree` 和具体 `Control` / `Node`

这三条链路比盲看目录更能建立真实理解。

**第三轮：理解后端系统**

1. `servers/rendering/`
2. `servers/physics_*`
3. `servers/audio/`
4. Display / Window 路径

**第四轮：脚本与扩展**

1. `modules/gdscript/`
2. `modules/mono/`
3. `editor/`
4. `core/extension/`

### 11.4 重点文件索引

| 目录 | 文件/区域 | 你要理解什么 |
|---|---|---|
| `main/` | `main.cpp` | 启动与主循环 |
| `core/object/` | `object.h` | 对象模型、通知、反射 |
| `core/variant/` | `variant.h` | 通用数据容器 |
| `scene/main/` | `node.h`, `scene_tree.h` | 节点树与生命周期 |
| `scene/resources/` | `packed_scene.*` | 场景序列化与实例化 |
| `scene/gui/` | `control.*` | UI 控件体系 |
| `servers/` | rendering / physics / audio | 后端抽象 |
| `editor/` | `editor_node.*` | 编辑器骨架 |
| `modules/gdscript/` | parser/runtime 相关 | 脚本语言实现 |

### 11.5 调试建议

```bash
# 内存检查
valgrind --leak-check=full ./bin/godot.linuxbsd.editor.dev.x86_64

# AddressSanitizer
scons sanitize=address
```

源码阅读原则：

1. 先看调用链，不先死抠实现细节
2. 先回答“谁调谁”，再回答“怎么做”
3. 每周只解决 1~2 个大问题
4. 用断点验证理解，而不是只做静态阅读
5. 先从与你当前 Demo 直接相关的路径入手，不要把源码学习和“阅读所有模块”混为一谈

---

## 12. 验证方法

### 12.1 阶段验证

每个阶段至少交付：

1. 一个可运行的小功能或原型
2. 一份结构化学习笔记
3. 一次自我复盘：这周真正搞懂了什么

### 12.2 项目验证

Demo 至少满足：

- [ ] 能完整完成一轮 run
- [ ] 有战斗、地图、奖励、商店/事件中的至少三类流程
- [ ] 有基础数值平衡
- [ ] 能导出桌面版
- [ ] 能被别人打开并试玩

### 12.3 源码学习验证

- [ ] 能描述 Godot 从启动到主循环的主要链路
- [ ] 能解释 Scene / Server 分离的意义
- [ ] 能定位 `Node`、`SceneTree`、`PackedScene`、`Resource` 的核心职责
- [ ] 能跟踪一个具体功能到对应源码目录

---

## 13. 每周固定学习节奏

考虑到你每周约 15-20 小时，建议固定为：

- **6 小时**：主线学习（官方文档 + 本仓库文档）
- **5-7 小时**：动手实现
- **2 小时**：源码阅读
- **1 小时**：复盘笔记
- **1 小时**：整理下周任务

每周至少完成：

- 1 个小功能
- 1 份笔记
- 1 个明确的问题闭环

---

## 14. 最容易踩的坑

1. **过早做完整游戏**  
   解决：先做最小循环，再补内容。

2. **把逻辑全塞进节点脚本**  
   解决：尽早建立 Data / State / View / Controller 分层。

3. **过早深挖渲染器**  
   解决：先读 `main`、`core`、`scene`，再去碰 `servers/rendering`。

4. **只看教程，不做项目**  
   解决：每学一个概念，都映射到 Demo 的一个子系统。

5. **没有版本化目标**  
   建议版本：
   - `v0.1` 卡牌交互原型
   - `v0.2` 单场战斗可玩
   - `v0.3` 地图与奖励流程
   - `v0.4` 可发布试玩版

---

## 15. 起步执行清单

### 本周开始

- [ ] 安装 Godot 4.x stable
- [ ] 完成 `Your First 2D Game`
- [ ] 阅读 Step by Step 前 3 节
- [ ] 阅读 `docs/game-engine/godot-architecture.md` 前 3 章
- [ ] 创建一个 `CardData` Resource 实验
- [ ] 创建一个卡牌 UI 原型场景

### 两周内完成

- [ ] 做出“抽牌 - 出牌 - 结束回合”微原型
- [ ] 画出一张 Godot 分层图
- [ ] 写一份 Scene / Node / Resource / Signal 关系笔记

### 一个月内完成

- [ ] 完成 3 个微原型
- [ ] 建立 Demo 的目录结构与命名规范
- [ ] 确定首版卡牌、敌人、地图范围

---

## 16. 关键文件清单

- 主路线文档：`learning-routes/topic-index/godot-comprehensive.md`
- 架构文档：`docs/game-engine/godot-architecture.md`
- 源码学习指南：`docs/game-engine/godot-learning-guide.md`
- 源码学习资料目录：`docs/general/godot-source-learning/`

---

## 17. 下一步建议

如果要把这份路线真正转成执行计划，最值得继续产出的不是再写一篇总览，而是继续拆成以下三份：

1. **第 1 个月周计划**：精确到每周读什么、做什么、交什么。
2. **类杀戮尖塔 Demo 技术设计文档**：场景结构、数据结构、系统边界、状态流转。
3. **Godot 项目目录结构与模板**：给你一个可直接开工的项目骨架。

这三份会把“路线”真正变成“可执行工程计划”。
