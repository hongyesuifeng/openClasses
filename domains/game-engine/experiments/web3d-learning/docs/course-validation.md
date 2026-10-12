# 系统课程：实现范围与校验记录

[版本] 2026-10-12。入口为 `?lab=course`，阶段 3—6 共 28 课。阶段 0—2 的历史边界仍见各自记录，不因新增课程自动通过。

[本轮结果] 43 项测试、TypeScript 类型检查与 Vite 生产构建通过；28 课入口和关键交互已检查，36 个资料与模型来源链接可访问。下面限定实际检查范围。

[接续复查] 2026-10-12，在代码提交 `2c869a67` 上重新运行以上检查，并逐项操作阶段 0 的帧循环实验、阶段 1 的 10 个原理动画、阶段 2 的 8 个运动原理及阶段 3—6 的 28 课。28 课均可步进与重置，无课程错误面板；模型恢复、角色混合、攻击停止、Shader 错误恢复、资源释放、池化、实例化、LOD 和采样导出均得到预期结果。操作方法和本轮证据见[开始测试](course-user-check.md)；原未实机覆盖边界继续保留。

## 本次交付范围

| 阶段 | 实际实现 | 模型条件 |
| --- | --- | --- |
| 3 | 本地 glTF 加载、顶点编号与索引、线框、棋盘 UV、法线辅助、两骨蒙皮、现成角色与可调混合 | 原创矩形、极简两骨样本和 CC0 RobotExpressive；无自动绑定、IK、重定向或外部压缩纹理 |
| 4 | 独立规则状态机、配置快照、时间窗口、命中去重、取消与死亡、Buff、单次吞噬成长、迟滞追逐 | 单目标与中心距离模型；无寻路、网络或完整物理 |
| 5 | 原生 WebGL2 缓冲、真实纹理采样、深度与透明顺序、解析球面光照、边缘光、溶解、反馈包络 | GLSL ES 3.00；解析球面是片元示意，无完整 PBR、阴影或后处理 |
| 6 | 异步共享租约、GPU 纹理生命周期、逻辑池、普通/实例化绘制、批次级 LOD、透明层、120 帧采样与 JSON 导出 | 数量与 CPU/RAF 指标；无 GPU timer、内存字节计量或跨设备结论 |

## 可重复的检查命令

[运行约定] 从仓库根目录执行，启动器选择隔离 Node 24，未修改系统默认 Node。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\domains\game-engine\experiments\web3d-learning\tools\run.ps1 test
powershell -NoProfile -ExecutionPolicy Bypass -File .\domains\game-engine\experiments\web3d-learning\tools\run.ps1 build
```

[维护命令] 在本实验目录、Node 24 进程中执行下列命令；课程讲义与浏览器共用内容数据。

```text
node tools/build-course-assets.mjs
node tools/build-course-docs.mjs
node tools/check-course-links.mjs
```

[测试覆盖] 原有时间、数学、运动测试，加上真实 GLTFLoader 解析与采样、绑定姿态/权重、攻击去重/大步/取消/死亡/配置/Buff/吞噬/AI、租约共享/失败/迟到结果、池化、采样统计、Shader 错误清理与讲义一致性。Shader 清理测试使用上下文替身；真实编译与画面另外通过浏览器验证。

[资产来源] RobotExpressive 由 Tomás Laulhé / Quaternius 制作，来源说明标注 CC0 1.0；已固定上游提交 `b924f0cad4058dc4dde71445c796980c3cd5b5ed`。本地保存 [许可说明](../public/assets/robot-expressive-license.md)、[来源和 SHA256](../public/assets/robot-expressive-source.json)。文件哈希、GLB 结构与 Idle/Walking Clip 纳入测试；可用 `node tools/download-learning-character.mjs` 从固定来源重取。

## 浏览器运行检查

[环境] Codex 内置浏览器。原始采样 UA 标识 Chromium/Chrome 155、Windows，画布 750×365、DPR=1；UA 不代表真实 GPU 型号。本机启动器实际使用 Node 24.12.0。依赖以 package-lock.json 为准。

| 检查 | 观察到的结果 |
| --- | --- |
| 全目录逐课进入 | 28 课均生成当前实验和中间数据，无页面错误面板；切换清理旧实验 |
| 模型正常/缺失/恢复 | 本地 tiny.gltf：4 顶点、2 三角形、1 Clip；错误明确显示失败，恢复可重新加载 |
| 动画播放控制 | 暂停、逐步、权重 0.5；两个有效权重均为 0.50，姿态与 Action 时间显示变化 |
| 现成角色对照 | 本地 CC0 GLB 正常加载，43 个骨骼、14 个 Clip；Idle/Walking 权重均可设为 0.50，能显示骨架并返回两骨样本 |
| 网格/UV/法线/权重 | 线框显示对角线；重复次数、材质/法线开关和硬/渐变权重由对应参数控制 |
| 玩法大步与停止 | 一步跨过 1 秒仍只扣 10 HP；前摇取消不扣血，死亡后请求被拒绝 |
| Shader 错误路径 | 故意编译非法片元源码，显示编译错误；有效 Program 保留，可继续渲染 |
| 实例化 | 相同 500 对象，calls 从 500 降为 1，triangles 均为 84000 |
| 批次 LOD | 距离 18→35 时，启用 LOD 的 triangles 从 84000→8000，calls 仍为 500 |
| 移除与释放 | 仅移除：calls=0，geometries=1；完整释放：geometries=0 |
| 共享租约 | 两个租约共享 1 张实际 GPU 纹理；全部释放后缓存为空、纹理计数回到 0 |
| 对象池 | 发射→返还→再发射仍只创建 5 个对象，返还时清零 age |
| 性能采样与导出 | 完成预热 30 帧及采样 120 帧；普通/实例化两份 JSON 含原始间隔、提交时间与条件 |
| 390×844 窄屏 | WebGL 画布适配宽度，玩法图示在局部容器横滑，页面无横向溢出；测试后恢复默认视口 |

[实际截图] [阶段 3](images/course-stage-3.jpg)、[阶段 4](images/course-stage-4.jpg)、[阶段 5](images/course-stage-5.jpg)、[阶段 6](images/course-stage-6.jpg)。

## 本次同条件原始采样

[测量记录] 普通 Mesh 与实例化均为 500 个对象、84000 三角形、750×365、DPR=1、相机距离 18。数据来自本次页面导出，保留 [普通 Mesh 原始 JSON](evidence/performance-mesh.json) 与 [实例化原始 JSON](evidence/performance-instanced.json)。

| 模式 | calls | RAF 均值 | RAF p95 | 样本数 |
| --- | --- | --- | --- | --- |
| 普通 Mesh | 500 | 17.665 ms | 18.300 ms | 120 |
| InstancedMesh | 1 | 17.743 ms | 18.200 ms | 120 |

[结论范围] 此次实例化确实减少提交次数；这组 RAF 分布接近，不能据此宣称帧率提高。CPU 提交数据仍保留在 JSON；它不是 GPU 执行时间，单次实验也不证明其他设备具有相同结果。

## 生命周期与异常边界

[实现检查] 每课拥有自己的资源；切换时停止/解除 Mixer，释放骨架、几何、材质、纹理、实例缓冲或 WebGL buffer/VAO/Program，断开 ResizeObserver。异步 glTF 请求用代次标识，失效结果只清理；异步租约在最后拥有者离开后清理迟到结果。

[实现检查] 页面只有一个课程 rAF 循环；隐藏时停止，恢复时重建时间基准并重新预热采样；暂停与手动步进不将停顿记入性能采样。重置销毁本课实验并按初始参数重建。减少动画偏好默认暂停；WebGL2 不可用或上下文丢失时提供可理解说明。

[未实机覆盖] 本次未切换操作系统的减少动画偏好，未在禁用 WebGL2 的浏览器环境及真实 GPU 上下文丢失后恢复设备中实测；这些防护路径有实现，不宣称设备级验收通过。原生 Cocos 运行、真机性能、自有资产与目标项目的导入流程、扩展主题留待相应学习实践；本包内置 RobotExpressive 角色的加载与动作混合已按上表验证。

[资料检查] 本轮修正五个失效手册路径；36 个去重后的官方资料与模型来源 URL 可访问。生成讲义的相对文件/图片链接与正文一致性由测试检查。

[理解状态] 这是教学内容与实验的交付记录，个人掌握程度未评定；不修改技能评分，也不将书签或测试通过等同于学完。
