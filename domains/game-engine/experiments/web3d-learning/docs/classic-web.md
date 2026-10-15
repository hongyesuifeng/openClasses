# 三门经典课的 Web 交互学习

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
| [输入如何成为一帧画面](http://127.0.0.1:5173/?lab=classics&lesson=frame) | 手动切换五个阶段，比较世界位置与画面采用的位置；支持前后步进和重看 | GAMES104 引擎导论；Piccolo 固定源码作为旁证，Unity 1.4 输入机制作为原例 |
| [场景与相机](http://127.0.0.1:5173/?lab=classics&lesson=scene) | 前移车，再切换固定／跟随相机；观察相机世界位置与车的画面大小 | Unity 6.0 Create with Code，Lesson 1.1 第 3—6 步；相机跟随是联系 1.3 的辅助对照 |
| [距离与透视](http://127.0.0.1:5173/?lab=classics&lesson=projection) | 独立调整车的位置与 FOV；模型尺寸始终不变，支持单变量预设与恢复 | GAMES101 Lecture 04，课件标号第 12 页起的观测、相机与投影 |

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
