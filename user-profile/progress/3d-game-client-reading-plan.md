# 3D 客户端资料阅读与阶段学习计划

[计划] 将你提供的九个主要资料入口纳入[当前 24 周路线](../../learning-routes/topic-index/3d-game-client.md)，按周安排选读、问题、实验与读后产出。[近期四周计划](2026-10-08-project-review-and-next-plan.md)负责启动安排，[资料地图](../../learning-routes/resources/3d-game-client-resources.md)保留完整入口与适用范围。

[预算假设] 每周 15 小时中的 5 小时用于阅读、视频、源码对照与阅读整理，7 小时用于实验，3 小时用于验证与复盘缓冲。24 周阅读预算合计 120 小时；本页任务计入已有预算。实际开始日期和已读范围待登记，未完成任务按阶段验收结果顺延。

[计划] 下表均为指定主题选读。读到能画机制图、预测实验结果并说明 Cocos 对应职责时，转入实验；遇到卡点记录具体小节后回读。整门课程、整本书的完成情况另行登记。

## 原资料清单与阅读落点

| 编号 | 原始入口 | 安排的阅读任务 | 阅读状态 |
| --- | --- | --- | --- |
| O01 | [Scratchapixel](https://www.scratchapixel.com/) | [计划] 第 2 至 4 周读点与向量、矩阵、变换和投影，第 6 周配合相机回读 | [待登记] |
| O02 | [MIT 6.837 Computer Graphics](https://ocw.mit.edu/courses/6-837-computer-graphics-fall-2012/) | [计划] 第 2／3 周读讲义 03／04；第 7／8 周读 11／09／10；第 11 周读 06；第 17／19 周读 21／22／15／16 | [待登记] |
| O03 | [Blender 官方教程](https://www.blender.org/support/tutorials/) | [计划] 第 9 至 11 周选读视口、变换、网格、UV、材质与骨骼，配合 glTF 导出检查 | [待登记] |
| O04 | [Unity Learn 原动画入口](https://learn.unity.com/tutorial/animation) | [计划] 保留原入口；第 12 周使用下方 3D 动画课程、状态机与混合树资料，第 13 周比较玩法状态与动画状态 | [待登记] |
| O05 | [Mixamo](https://www.mixamo.com/) | [计划] 第 11 周先读官方 FAQ 的账号、角色与自动绑定条件，再选适合的人形练习资产 | [待登记] |
| O06 | [Cocos Creator 原手册入口](https://docs.cocos.com/creator/manual/zh/) | [计划] 全阶段使用[固定 3.8 手册](https://docs.cocos.com/creator/3.8/manual/zh/)与本地源码对照场景、动画、材质、资源和性能 | [待登记] |
| O07 | [The Book of Shaders](https://thebookofshaders.com/)／[中文目录](https://thebookofshaders.com/?lan=ch) | [计划] 第 17 周读起步，第 18 周选读 05 至 09，第 20 周选读 10 至 13 | [待登记] |
| O08 | [Catlike Coding](https://catlikecoding.com/unity/tutorials/) | [计划] 第 3 周读 Rendering 1 矩阵；第 18 至 20 周读 2／3／4／11；第 23 周读 18／19 | [待登记] |
| O09 | [Real-Time Rendering](https://www.realtimerendering.com/) | [计划] 第 19／20 周查着色、纹理与透明主题；第 22 至 24 周查管线、GPU 与优化主题 | [待登记] |

## 第 1 至 4 周 场景与空间数学

[计划] 这一阶段的实验与验收沿用[四周学习计划](2026-10-08-project-review-and-next-plan.md)。以下细化阅读时间，每周合计 5 小时。

| 周次 | 资料与停止范围 | 阅读预算 | 读后产出 |
| --- | --- | --- | --- |
| [计划] 1 | [Three.js 基础](https://threejs.org/manual/pages/fundamentals.html)、[帧回调](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)、安装与清理、Cocos 调度；按[第一周 R1 至 R6](3d-game-client-week-01.md)的停止位置阅读 | R1 45 分钟＋R2 60 分钟＋R3 45 分钟＋R4 45 分钟＋R5 45 分钟＋R6 回读 60 分钟 | 对象关系图、帧循环图、时间与角度预测、Cocos 职责对照 |
| [计划] 2 | [Scratchapixel Geometry](https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/geometry/points-vectors-and-normals.html) 的 Points、Coordinate Systems、Math Operations；[MIT 03](https://ocw.mit.edu/courses/6-837-computer-graphics-fall-2012/resources/mit6_837f12_lec03/)的坐标与变换图；[本地数学库](../../domains/game-engine/guides/cocos-source-learning/01-core-foundation/01-math-types.md)中的 Vec3 | Scratchapixel 3 小时＋MIT 1 小时＋Cocos 1 小时 | 点与方向的区别，长度、点积、叉积的计算例子和边界问题 |
| [计划] 3 | [Scratchapixel 4×4 变换](https://www.scratchapixel.com/lessons/3d-basic-rendering/transforming-objects-using-matrices/using-4x4-matrices-transform-objects-3D.html)的组合变换；[Catlike Rendering 1](https://catlikecoding.com/unity/tutorials/rendering/part-1/)的矩阵图；[MIT 04](https://ocw.mit.edu/courses/6-837-computer-graphics-fall-2012/resources/mit6_837f12_lec04/)的层级建模；本地 Mat4、Quat 与 Node 变换 | Scratchapixel 2 小时＋Catlike 0.5 小时＋MIT 1 小时＋Cocos 1.5 小时 | 父子变换图、乘法顺序与约定、局部／世界坐标对照 |
| [计划] 4 | [Scratchapixel 投影导论](https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/projection-matrix-introduction.html)的透视／正交主题；[Cocos 相机](https://docs.cocos.com/creator/3.8/manual/zh/editor/components/camera-component.html)的投影参数；回读前两周卡点 | 投影 2.5 小时＋Cocos 1.5 小时＋回读 1 小时 | 局部到屏幕的过程图、坐标空间与单位、固定输入的中间值 |

## 第 5 至 8 周 场景 摄像机与运动

| 周次 | 资料与停止范围 | 阅读预算 | 读后产出 |
| --- | --- | --- | --- |
| [计划] 5 | [Three.js Scene Graph](https://threejs.org/manual/pages/scenegraph.html)的父子对象例子；[Cocos 节点和组件](https://docs.cocos.com/creator/3.8/manual/zh/concepts/scene/node-component.html)、[生命周期](https://docs.cocos.com/creator/3.8/manual/zh/scripting/life-cycle-callbacks.html)与手册中的输入事件主题 | Three.js 2 小时＋Cocos 2 小时＋回读 1 小时 | 层级、输入、更新职责图；一个移动输入如何改变状态 |
| [计划] 6 | [Three.js Cameras](https://threejs.org/manual/pages/cameras.html)的透视与正交示例；[Cocos 相机](https://docs.cocos.com/creator/3.8/manual/zh/editor/components/camera-component.html)参数；Scratchapixel 投影回读 | Three.js 2 小时＋Cocos 2 小时＋回读 1 小时 | 镜头跟随问题与参数预测；视角、视口和宽高比记录 |
| [计划] 7 | [Raycaster](https://threejs.org/docs/pages/Raycaster.html)的输入和返回结果；[MIT 讲义目录](https://ocw.mit.edu/courses/6-837-computer-graphics-fall-2012/pages/lecture-notes/)中的 11 射线生成图；[Cocos 物理指南](../../domains/game-engine/guides/cocos-source-learning/04-functional-modules/02-physics-system.md)的查询机制 | Three.js 2 小时＋MIT 1 小时＋Cocos 1 小时＋回读 1 小时 | 屏幕输入到射线的图；拾取、遮挡和物理碰撞的职责区别 |
| [计划] 8 | MIT 09／10 的碰撞检测与响应部分，隐式积分推导留作扩展；Cocos 物理指南；回读时间步长与运动代码 | MIT 2 小时＋Cocos 1 小时＋时间步长 1 小时＋源码整理 1 小时 | 碰撞边界、响应顺序、同模拟时间下的运动预期 |

## 第 9 至 12 周 模型与动画资产

| 周次 | 资料与停止范围 | 阅读预算 | 读后产出 |
| --- | --- | --- | --- |
| [计划] 9 | [Blender Fundamentals 4.5 LTS](https://studio.blender.org/training/blender-fundamentals-45-lts/)的 First Steps 与 Modeling 中视口、选择、变换和基础网格；[Three.js 模型加载](https://threejs.org/manual/pages/loading-3d-models.html)；[Cocos 模型资源](https://docs.cocos.com/creator/3.8/manual/zh/asset/model/mesh.html)的结构与导入说明 | Blender 2 小时＋Three.js 2 小时＋Cocos 1 小时 | 模型层级、比例、方向、顶点与法线检查图 |
| [计划] 10 | Blender 官方教程中的 UV 与材质主题；[Blender glTF 手册](https://docs.blender.org/manual/en/5.1/addons/import_export/scene_gltf2.html)的网格、材质、动画导出与限制；Cocos 模型资源中的导入选项 | Blender 基础 2 小时＋glTF 2 小时＋Cocos 1 小时 | UV、材质、导出与客户端检查清单；一次导出前后的差异 |
| [计划] 11 | [MIT 06](https://ocw.mit.edu/courses/6-837-computer-graphics-fall-2012/pages/lecture-notes/)的蒙皮图；Blender 官方教程的骨骼与权重主题；[Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)的角色、绑定与使用条件；[AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html)的 update、播放与停止 | MIT 1 小时＋Blender 1 小时＋Mixamo 1 小时＋Three.js 2 小时 | 骨骼到顶点变形的图、资产适用条件、动画时间记录 |
| [计划] 12 | [Unity 3D Animation Systems](https://learn.unity.com/course/introduction-to-3d-animation-systems)的 Core Concepts 与 Animator 主题；[动画状态机](https://docs.unity3d.com/6000.0/Documentation/Manual/AnimationStateMachines.html)、[Blend Tree](https://docs.unity3d.com/6000.0/Documentation/Manual/class-BlendTree.html)的概念图；Cocos 3.8 手册中的动画剪辑与骨骼动画；Three.js 混合回读 | Unity 课程 1 小时＋状态机 1 小时＋混合树 1 小时＋Cocos 1 小时＋Three.js 1 小时 | Clip、状态、转移与权重对照；暂停、切换和混合的预期 |

[来源依据] Mixamo 的自动绑定面向双足人形；FAQ 还列出了账号使用条件。第 11 周先检查适用性，无法使用时以已有带骨骼 glTF 完成同样的蒙皮观察；史莱姆采用简单变形实验。[Adobe FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)

## 第 13 至 16 周 玩法规则与表现

| 周次 | 资料与停止范围 | 阅读预算 | 读后产出 |
| --- | --- | --- | --- |
| [计划] 13 | 回读 Unity 动画状态机概念；[软件架构](../../domains/software-engineering/guides/foundations/software-architecture.md)的分层与数据流；[Cocos 事件系统](https://docs.cocos.com/creator/3.8/manual/zh/engine/event/index.html)；[slayDemo 复盘](../../domains/game-engine/godotProjects/slayDemo/docs/project-retrospective.md) | Unity 1 小时＋架构 2 小时＋Cocos 1 小时＋复盘 1 小时 | 玩法状态与动画状态对照；规则结果到表现事件的图 |
| [计划] 14 | [slayDemo 设计资料](../../domains/game-engine/godotProjects/slayDemo/docs/design/)中攻击、状态结算与数据定义；复盘中的验证方法；Cocos 生命周期回读 | 玩法规则 2 小时＋数据定义 1 小时＋复盘 1 小时＋Cocos 1 小时 | 命中去重、取消、死亡与 Buff 的规则和边界用例 |
| [计划] 15 | [Cocos 3.8 手册](https://docs.cocos.com/creator/3.8/manual/zh/)中的 3D 粒子、音频系统、相机；回读动画状态图与 slayDemo 表现复盘 | 粒子 1 小时＋音频 1 小时＋相机 1 小时＋动画 1 小时＋复盘 1 小时 | 技能事件到动画、VFX、镜头与音效的顺序图 |
| [计划] 16 | [阶段验收规范](../../domains/game-engine/experiments/web3d-learning/docs/acceptance.md)与复盘中的失败分析；回读玩法设计、Cocos 组件职责及本阶段卡点 | 验证方法 2 小时＋玩法设计 1 小时＋Cocos 1 小时＋回读 1 小时 | 吞噬成长实验的边界用例、失败原因和个人解释 |

## 第 17 至 20 周 渲染 Shader 与表现

| 周次 | 资料与停止范围 | 阅读预算 | 读后产出 |
| --- | --- | --- | --- |
| [计划] 17 | [MDN WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial)中上下文、着色器、缓冲与三角形步骤；MIT 21／22 的管线与光栅化图；[Book of Shaders 中文目录](https://thebookofshaders.com/?lan=ch)的起步四节 | MDN 2 小时＋MIT 1.5 小时＋Book of Shaders 1.5 小时 | CPU 数据到最终像素的图；哪些步骤由 Three.js 代做 |
| [计划] 18 | [Book of Shaders 05](https://thebookofshaders.com/05/?lan=ch)至 09 的函数、颜色、形状、二维变换和图案；[Catlike Rendering 2](https://catlikecoding.com/unity/tutorials/rendering/part-2/)的 Shader 数据流；[Cocos Effect 创建与使用](https://docs.cocos.com/creator/3.8/manual/zh/shader/effect-inspector.html) | Book of Shaders 3 小时＋Catlike 1 小时＋Cocos 1 小时 | 一个参数如何改变片元颜色；函数与 UV 图案的预测 |
| [计划] 19 | MDN 的纹理步骤；[Catlike Rendering](https://catlikecoding.com/unity/tutorials/rendering/)的 3 纹理与 4 光照；MIT 15／16 的材质与纹理；[RTR 配套站](https://www.realtimerendering.com/)第 5／6 章主题资源 | MDN 1 小时＋Catlike 2 小时＋MIT 1 小时＋RTR 1 小时 | 纹理、法线、光照各自的输入与结果对照 |
| [计划] 20 | Book of Shaders 10 至 13 的随机／噪声选例；Catlike Rendering 11 透明；Cocos Effect 参数回读；RTR 第 14 章透明主题资源；本阶段问题回读 | Book of Shaders 1.5 小时＋Catlike 1 小时＋Cocos 1 小时＋RTR 0.5 小时＋回读 1 小时 | 溶解阈值、边缘光和透明状态的实验解释与适用边界 |

[来源依据] Book of Shaders 当前目录的纹理和部分 3D 主题没有正文链接，本计划用 MDN、MIT 与引擎文档覆盖相应阅读。Catlike 的 Rendering 系列面向 Unity，选读图和推导后再对照 WebGL2／Three.js／Cocos 的实际接口。[Book of Shaders 目录](https://thebookofshaders.com/?lan=ch)、[Catlike Rendering](https://catlikecoding.com/unity/tutorials/rendering/)

## 第 21 至 24 周 资源与性能

| 周次 | 资料与停止范围 | 阅读预算 | 读后产出 |
| --- | --- | --- | --- |
| [计划] 21 | [Three.js Cleanup](https://threejs.org/manual/pages/cleanup.html)的 dispose 与资源归属；Cocos 3.8 手册中的资源加载、Asset Bundle、资源释放；[本地资源指南](../../domains/game-engine/guides/cocos-source-learning/05-asset-management/README.md) | Three.js 2 小时＋Cocos 与源码 3 小时 | 加载、引用、共享与释放流程图；重置和退出的资源边界 |
| [计划] 22 | [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)的 info 统计；RTR 第 2／3 章管线与 GPU、第 18 章管线优化配套资源 | Three.js 1.5 小时＋RTR 管线与 GPU 1 小时＋RTR 优化 2 小时＋整理 0.5 小时 | 帧耗时、绘制次数与资源数量的单位、采样方式和解释范围 |
| [计划] 23 | [Catlike Rendering 19 GPU Instancing](https://catlikecoding.com/unity/tutorials/rendering/part-19/)与系列 18 LOD 主题；RTR 第 20 章 Efficient Shading；[本地高级主题](../../domains/game-engine/guides/cocos-source-learning/08-advanced-topics/README.md) | Catlike 实例化 2 小时＋LOD 1 小时＋RTR 1 小时＋Cocos 1 小时 | 批处理、实例化与 LOD 的条件，压力实验的对比方案 |
| [计划] 24 | Cocos 性能资料按手册目录选读；RTR 18／20 章回读；Catlike 透明主题与 Three.js 统计回读；复核阶段记录 | Cocos 1 小时＋RTR 1 小时＋透明开销 1 小时＋统计 1 小时＋记录 1 小时 | 同条件性能对比、原始数据、瓶颈解释和未验证条件 |

[来源依据] RTR 网站提供第四版按章配套资源，章节编号按该版本使用。计划先读站内相关资源；若已有可用书籍，再按同一主题选章阅读，并登记版本与实际页码。[RTR 配套站](https://www.realtimerendering.com/)

## 后续扩展阅读

[计划] 核心阶段通过后按实际问题选择以下任务，另外登记时间，不计入上述 120 小时阅读预算。

| 任务 | 资料入口与选读范围 | 参考预算与产出 |
| --- | --- | --- |
| [计划] 复杂动画 | Blender 官方骨骼与权重教程；Unity 动画资料和 Cocos 动画系统中的分层、IK、Root Motion 主题 | 3 小时起，先画要解决的问题与输入输出，再决定实验范围 |
| [计划] AI 资产流程 | [Hunyuan3D-2 README](https://github.com/Tencent-Hunyuan/Hunyuan3D-2)的输入、输出、要求与导出示例；[Meshy 官方文档](https://docs.meshy.ai/en)的生成与导出；[Tripo 图生 3D](https://www.tripo3d.ai/help/features/how-to-use-the-image-to-3d-feature)的输入和输出流程 | 三个入口各 1 小时＋比较整理 1 小时，产出客户端资产检查清单；具体运行方案另定 |
| [计划] 移动端与 Cocos 复现 | Cocos 3.8 手册中的目标平台构建、资源与性能主题，结合已验收 Web 实验 | 2 小时起，先登记设备、坐标与 API 差异，正式游戏整合按项目边界安排 |

## 阅读完成怎样登记

[计划] 每次学习在[进度表](3d-game-client-progress.md)和对应[实验记录](../../domains/game-engine/experiments/web3d-learning/docs/lab-template.md)中填写下面的字段。

| 字段 | 实际填写内容 |
| --- | --- |
| [记录要求] 资料与范围 | 编号、URL、教程／软件／书籍版本、章节或页码、停止位置 |
| [记录要求] 时间与状态 | 日期、实际分钟数、未开始／阅读中／已读待自测／自测通过／需回读 |
| [记录要求] 读后理解 | 自己的机制图、一个参数变化预测、一个 Cocos 对照或差异 |
| [记录要求] 实验关联 | 实验编号、预期与实际结果、关键中间数据 |
| [记录要求] 后续问题 | 卡住的小节、需回读的原因、下次范围与预算调整 |

[验收目标] 阅读完成需要留下自己的图或解释；个人理解通过还需要预测、实验观察和自测记录。阶段复盘时分别检查阅读任务、实验实现、运行验证与个人理解。

[核查范围] 核对日期为 2026-10-08。MIT、Cocos、Shader、Catlike、RTR 和 Adobe FAQ 的相应目录已读取；Blender 部分入口与 Unity Learn 课程直接抓取未成功，使用官方搜索索引核对并保留原站链接，开始对应课时复核页面与版本。尚未登记个人实际阅读完成情况。
