# 三门经典课的 Web 交互学习

## 当前版本：原课重点摘记

2026-10-15，按最新反馈直接精简课程内容。当前页面只保留原讲标题、课内要点和可定位的出处，沿原课程讲次阅读；移除先前问题地图、自编模拟、类比和跨课程阐述。无公式推导与代码分步。

| 课程 | 本批范围 | 阅读入口 | 原始材料 |
| --- | --- | --- | --- |
| GAMES101 | 第 1—6 讲 | [第 1 讲](http://127.0.0.1:5173/?lab=classics&course=games101&chapter=01) | [官方大纲与课件](https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html) |
| Unity Create with Code | Unit 1，Lesson 1.1—1.4，Unity 6.0 | [Lesson 1.1](http://127.0.0.1:5173/?lab=classics&course=unity&chapter=1.1) | [官方 Unit 1 教程](https://learn.unity.com/course/create-with-code/unit/unit-1-driving-simulation?version=6.0) |
| GAMES104 | 第 1—3 讲 | [第 1 讲](http://127.0.0.1:5173/?lab=classics&course=games104&chapter=01) | [官方课件列表](https://games-cn.org/games104-slides/) |

### 材料核对

本轮实际读取 GAMES101 的六份 PDF、GAMES104 的三份 PDF，以及 Unity 四讲的官方教程正文和 Lesson Recap。GAMES104 课件列表可通过 HTTP 正常访问，本轮使用该列表指向的官方 CDN PDF，不再以配套源码推断讲课内容。PDF 与提取缓存位于 Git 忽略的 `.tmp/course-sources/`，不随仓库分发。

每条要点标注 PDF 页码或教程小节；PDF 链接定位到对应起始页。章节内部归并重复内容，中文为精简整理，并非逐字讲稿；Unity 原编程教学保留内容要点，不展示代码操作步骤。GAMES101 第 6 讲标题沿用官方目录，PDF 内容实际集中在抗锯齿，已在该讲显式注明。

### 阅读与运行

默认首页与 `?lab=classics` 进入摘记。支持课程／章节切换、上一讲／下一讲、浏览器前进后退、外链原文和本机阅读位置保存。`course` 指定课程，`chapter` 使用原讲次 ID；三门课分别保存阅读位置。新书签独立于历史模拟／问题地图，旧 `lesson=frame/scene/projection` 链接仍映射到对应课程。

从仓库根目录执行 `powershell -NoProfile -File domains/game-engine/experiments/web3d-learning/tools/run.ps1 dev`，打开上方本地入口。使用隔离 Node 24，不修改全局 Node 18。

### 本轮验证

隔离 Node 24.19.0 执行 `tools/run.ps1 test`：54 项通过；`tools/run.ps1 build`：类型检查与 Vite 构建通过。新增两项验证原讲次独立书签、URL 优先级、损坏／历史书签与非法链接的恢复。其余测试覆盖历史实验，不作为原课内容准确性的证明。

浏览器实际检查了三门课的章节切换、上一讲／下一讲、刷新恢复及课程间独立阅读位置。320 像素视口下三门课均无横向溢出；第 6 讲的课件范围提示可见，当前页面没有旧地图、模拟案例、代码或画布节点，检查时 error／warn 日志为空。临时视口已恢复。

![原课重点摘记实际页面](../../../../../docs/game-engine/classic-courses/images/original-notes-desktop.png)

[320 像素页面证据](../../../../../docs/game-engine/classic-courses/images/original-notes-mobile.png)

材料整理与网页交付不代表个人已经理解，也不代表原生 Unity／Piccolo 实践已经完成。后续沿原课程顺序继续提炼。

## 历史版本：主线、动机与因果（已替代）

2026-10-15，学习者反馈首版过浅、核心内容未提取、讲述含糊，并进一步明确卡点为：不明白原理为什么成立、设计为什么有必要，以及缺少整门课的主线。当前不需要公式推导与代码步骤。

新版入口为 [GAMES101](http://127.0.0.1:5173/?lab=classics&course=games101)、[Unity Create with Code](http://127.0.0.1:5173/?lab=classics&course=unity)、[GAMES104](http://127.0.0.1:5173/?lab=classics&course=games104)。默认首页自动恢复本机阅读课程与地图章节；旧 `lesson=frame/scene/projection` 分别映射到对应课程。

### 学习内容怎样组织

1. 用一句核心问题与具体矛盾建立整门课的主线。
2. 按原课顺序给出问题地图，点击每段可看“为什么需要、核心思路、放回整门课的意义”。
3. 通过有结果差异的案例观察核心矛盾，保留可重置操作与直接的因果解释。
4. 提炼可以迁移到其他问题的判断方法，再说明三门课怎样联系、怎样回到原课。

正文不提供公式推导与代码步骤。地图是本页对原课章节关系的归纳，案例为辅助示意；本轮完成主线导读与三个核心案例，不代表所有原课内容均已深入讲授。

| 课程 | 主线提炼 | 当前核心案例与原因 |
| --- | --- | --- |
| GAMES101 | 表示、采样与近似怎样共同形成图像；理解信息在哪一步损失 | 相同宽度的细线轻微移动，单点结果会漏掉或填满整列；多点覆盖保留部分覆盖信息，用来解释有限采样的损失与代价 |
| Unity Create with Code | 操作、规则、状态与反馈组成一致的可玩循环 | 两边都显示 Game Over，只改界面的一边仍允许生成和计分；遵守状态的一边阻止这些行为，解释界面与规则的分工 |
| GAMES104 | 系统职责、数据归属与交接时机支撑可靠协作 | 世界、交接包、渲染侧分别保留自己的版本；漏交接、接收方未消费、随后消费和追上最新变化有不同结果，解释分工带来的同步成本 |

### 这轮实际核对的原材料

- [GAMES101 官方目录](https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html)：四大组成部分与原始讲次；[Lecture 05 课件](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_05.pdf)第 31—39 页讨论三角形、像素中心与采样。多点覆盖为本页进一步构造的对照，不声称复刻原课图像或完整抗锯齿算法。
- [Unity 6.0 官方课程目录](https://learn.unity.com/course/create-with-code)：五个单元与原型安排；[Lesson 5.3 Game Over](https://learn.unity.com/course/create-with-code/unit/unit-5-user-interface/tutorial/lesson-5-3-game-over-2?version=6.0)第 2—4 节明确从文字显示走向游戏状态、停止生成与限制计分。此处采用规则模型，不逐行讲代码。原课程附带的 2019 教学大纲只用于交叉核对原型安排，不替代 6.0 原文。
- [GAMES104 官方大纲](https://games-cn.org/games104/)：架构、数据及各系统的原始讲次；配套 [engine.cpp](https://github.com/BoomingTech/Piccolo/blob/2bd7aa50ac4c21888b152c2bfcf321813a7ff8c9/engine/source/runtime/engine.cpp)、[render_swap_context.h](https://github.com/BoomingTech/Piccolo/blob/2bd7aa50ac4c21888b152c2bfcf321813a7ff8c9/engine/source/runtime/function/render/render_swap_context.h)与[交换实现](https://github.com/BoomingTech/Piccolo/blob/2bd7aa50ac4c21888b152c2bfcf321813a7ff8c9/engine/source/runtime/function/render/render_swap_context.cpp)，固定到 `2bd7aa50`，核对逻辑／渲染交接和待处理数据检查。官方课件列表本轮访问失败，未据此声称读过第二讲完整课件；设计含义明确为本页基于大纲与源码的提炼。

### 运行验证（深度修订版）

隔离 Node 24.19.0 执行 `tools/run.ps1 test`：52 项通过；`tools/run.ps1 build`：类型检查与 Vite 构建通过。新增五项检查覆盖交接前后隔离、未消费包的保护与后续追赶、游戏状态约束与重复计分、采样遗漏与覆盖、损坏或越界课程书签。

浏览器已检查：单点结果在“漏掉／填满”之间改变，多点覆盖保持 25%；Game Over 后生成使目标数为 2／1，计分后分数为 10／0；世界版本 1、画面版本 0 的漏交接状态，以及世界版本 2、待消费包版本 1 的阻塞和随后逐步追赶。章节切换与刷新恢复可用，当前学习页没有公式／代码展示节点。

320 像素下三门课均无横向溢出，并可实际切换、执行对照；736 像素下采样对照与排版正常。三门课的联系另用五个职责节点、因果箭头与玩家反馈回路表示，手机布局已检查。核对了旧 `lesson=scene` 的课程映射和非法旧参数的恢复；检查时浏览器 error／warn 日志为空。临时视口已恢复默认。

![新版课程的问题地图](../../../../../docs/game-engine/classic-courses/images/principles-map.jpg)

![细线形状、单点结果与多点覆盖的实际对照](../../../../../docs/game-engine/classic-courses/images/principles-sampling.jpg)

[320 像素完整页面证据](../../../../../docs/game-engine/classic-courses/images/principles-mobile.jpg)

源模型边界：采样只处理平面覆盖；Unity 只处理离散规则，未复现协程与引擎等待时序；引擎案例只呈现单物体变化交接，未复现完整队列、GPU 或显示。个人理解与原生项目实践仍未评定。

## 首版记录：场景现象示意（已由上方入口替代）

2026-10-15，按学习者最新要求，将三门原课的问题拆解整理到现有 Web 工程，不再添加 Cocos 对照。首页进入经典课拆解，历史阶段 0—6 从独立入口保留。当前交付以下三个问题，不代表三门完整课程已经全部拆解或个人已经掌握。

## 打开与操作

从仓库根目录启动：

```powershell
powershell -NoProfile -File .\domains\game-engine\experiments\web3d-learning\tools\run.ps1 dev
```

启动器使用隔离 Node 24.12+，保留系统 Node 18。首次缺少依赖时，将命令末尾的 `dev` 换为 `install` 安装工程锁定依赖，再启动。

打开 [Web 学习首页](http://127.0.0.1:5173/)。默认恢复当前浏览器的阅读位置；直接链接优先选择指定问题。只记录阅读与实验参数，不自动评定理解或课程完成率。

| 当前问题 | 交互与观察 | 原课依据 |
| --- | --- | --- |
| [输入如何成为一帧画面](http://127.0.0.1:5173/?lab=classics-demo&lesson=frame) | 手动切换五个阶段，比较世界位置与画面采用的位置；支持前后步进和重看 | GAMES104 引擎导论；Piccolo 固定源码作为旁证，Unity 1.4 输入机制作为原例 |
| [场景与相机](http://127.0.0.1:5173/?lab=classics-demo&lesson=scene) | 前移车，再切换固定／跟随相机；观察相机世界位置与车的画面大小 | Unity 6.0 Create with Code，Lesson 1.1 第 3—6 步；相机跟随是联系 1.3 的辅助对照 |
| [距离与透视](http://127.0.0.1:5173/?lab=classics-demo&lesson=projection) | 独立调整车的位置与 FOV；模型尺寸始终不变，支持单变量预设与恢复 | GAMES101 Lecture 04，课件标号第 12 页起的观测、相机与投影 |

每个问题保留一句关键结论、操作观察提示、按需展开的计算与条件、原课链接和沿原章节接续的位置。三个问题围绕同一场景建立联系，不替代各课原始章节顺序。

## 来源与简化范围

- [GAMES104 官方课程](https://games-cn.org/games104/)与配套 [Piccolo engine.cpp](https://github.com/BoomingTech/Piccolo/blob/2bd7aa50ac4c21888b152c2bfcf321813a7ff8c9/engine/source/runtime/engine.cpp)：区分逻辑更新、数据交换、渲染和事件收集。该版在帧末收集窗口事件，网页阶段表达依赖关系，不能当作源码逐行顺序。
- [Unity Lesson 1.1](https://learn.unity.com/course/create-with-code/unit/unit-1-driving-simulation/tutorial/lesson-1-1-start-your-3d-engines?version=6.0)：Scene／Game 与场景摆放；[Lesson 1.4](https://learn.unity.com/course/create-with-code/unit/unit-1-driving-simulation/tutorial/lesson-1-4-use-user-input-to-control-the-vehicle?version=6.0)用于输入到直接位移的例子。原课实践依次学习 1.1—1.4。
- [GAMES101 Lecture 04 课件](https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_04.pdf)：三维物体摆放、相机观察与投影；数学前置仍沿[原课程](https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html)复习。

图示是自行实现的几何与软件透视投影，没有复制原课图片。车未旋转时沿世界 +Z 移动；示意以相机前方的正深度表示透视除数，和原课相机看向 −Z 的符号约定要分别理解。未运行原生 Unity／Piccolo，没有惯性、碰撞、完整光栅化或着色管线。0.4 秒为放大的教学时间步，不是实际帧率。

## 本轮验证

2026-10-15，隔离 Node 24.19.0 下执行 `tools/run.ps1 test`：47 项通过；`tools/run.ps1 build`：TypeScript 检查与 Vite 构建通过。新增检查覆盖分阶段状态、零输入与时间步、跟随相机投影不变、距离和 FOV 的独立影响、损坏或越界书签恢复。

内置浏览器已检查：

| 操作 | 实际结果 |
| --- | --- |
| 读取输入 → 更新 → 准备绘制 → 绘制 | 世界先变为 z=2，旧画面仍用 z=0；绘制后采用 z=2 |
| 刷新与 Enter 重播 | 恢复绘制阶段；键盘重播回到初始状态 |
| 固定相机下车前移 2 米，再切跟随 | 相机 z 从 −8 变为 −6；车的投影顶点与初始状态一致，障碍相对变化 |
| 距离与 FOV 预设、键盘滑杆边界 | 分别得到车 z=4／FOV=50°、车 z=0／FOV=80°；键盘可达 z=6／FOV=35°，SVG 没有非有限坐标 |
| 资料与公式展开 | 对应章节、计算、简化范围和资料链接正确出现；当前问题没有 Cocos 对照 |
| 320、736 像素宽度 | 320 下图示上下排列，可切小节与阶段；两种宽度均没有横向溢出 |
| 默认首页与历史入口往返 | 默认地址恢复阅读阶段；历史网格入口可打开，返回后新的分步交互仍可操作 |

检查时浏览器 error／warn 日志为空；已将临时视口恢复默认，并将第一节恢复到开始前供学习者操作。本轮没有自动播放或持续动画循环。历史原生 WebGL 与 Three.js 实验继续保留原验证边界，未据本次检查扩大其结论。个人理解与原课项目实践尚未评定。

![Web 更新阶段：世界已经移动，画面保留旧状态](../../../../../docs/game-engine/classic-courses/images/web-frame-update.jpg)

[320 像素页面完整截图](../../../../../docs/game-engine/classic-courses/images/web-frame-mobile.jpg)
