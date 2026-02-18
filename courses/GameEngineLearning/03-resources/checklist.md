# 核心知识点清单

> **使用说明**: 本清单涵盖了GAMES104课程的所有核心知识点，请按学习进度逐项检查掌握程度。

---

## 渲染系统

### Vulkan API
- [ ] Vulkan渲染管线完整流程
  - [ ] Instance创建和初始化
  - [ ] Physical Device选择和特性查询
  - [ ] Logical Device创建和Queue获取
  - [ ] SwapChain创建和管理
  - [ ] Image和ImageView
  - [ ] RenderPass和Framebuffer
  - [ ] CommandPool和CommandBuffer
  - [ ] Fence和Semaphore同步

- [ ] 命令缓冲区和队列提交
  - [ ] 命令缓冲区录制
  - [ ] 提交到队列
  - [ ] 同步原语（Fence, Semaphore, Barrier）

- [ ] Descriptor和DescriptorSet
  - [ ] DescriptorPool创建
  - [ ] DescriptorSetLayout
  - [ ] DescriptorSet分配和更新
  - [ ] Uniform Buffer, Storage Buffer, Image Sampler

- [ ] 渲染通道和帧缓冲
  - [ ] Render Pass创建
  - [ ] Subpass依赖
  - [ ] Framebuffer创建

- [ ] 图形管线状态对象（PSO）
  - [ ] Shader Stages (Vertex, Fragment, etc.)
  - [ ] Vertex Input State
  - [ ] Input Assembly State
  - [ ] Viewport and Scissor State
  - [ ] Rasterization State
  - [ ] Multisample State
  - [ ] Depth Stencil State
  - [ ] Color Blend State
  - [ ] Dynamic State

### 渲染技术
- [ ] Forward vs Deferred渲染
  - [ ] Forward Rendering路径
  - [ ] Deferred Rendering路径
  - [ ] G-Buffer设计
  - [ ] Lighting Pass

- [ ] 阴影映射技术
  - [ ] Shadow Mapping基础
  - [ ] Cascaded Shadow Maps (CSM)
  - [ ] Shadow Filtering (PCF, PCSS)

- [ ] PBR材质系统
  - [ ] 微表面模型
  - [ ] 能量守恒
  - [ ] BRDF (Cook-Torrance)
  - [ ] IBL (Image Based Lighting)

- [ ] 后处理效果
  - [ ] Tone Mapping (ACES, Reinhard)
  - [ ] Bloom
  - [ ] Depth of Field
  - [ ] Motion Blur
  - [ ] Screen Space Reflections (SSR)
  - [ ] Ambient Occlusion (SSAO)

---

## 物理系统

### 物理基础
- [ ] 刚体动力学基础
  - [ ] 牛顿运动定律
  - [ ] 力和扭矩
  - [ ] 质量和惯性张量
  - [ ] 积分方法（显式欧拉、半隐式欧拉、RK4）

- [ ] 碰撞检测算法
  - [ ] 宽相检测（Broad Phase）
    - [ ] Sweep and Prune
    - [ ] Bounding Volume Hierarchy (BVH)
    - [ ] Spatial Hashing
  - [ ] 窄相检测（Narrow Phase）
    - [ ] GJK算法
    - [ ] EPA算法
    - [ ] SAT算法

- [ ] 物理材质和形状
  - [ ] 碰撞形状（Box, Sphere, Capsule, Mesh）
  - [ ] 物理材质属性（摩擦、恢复系数）
  - [ ] 材质组合

- [ ] 约束求解器
  - [ ] 约束类型（距离、铰链、滑动）
  - [ ] 速度求解
  - [ ] 位置修正
  - [ ] 迭代求解器

- [ ] 物理调试绘制
  - [ ] 碰撞形状可视化
  - [ ] 约束可视化
  - [ ] 力和速度向量

---

## 动画系统

### 骨骼动画
- [ ] 骨骼动画原理
  - [ ] 骨骼层次结构
  - [ ] 关节和骨骼
  - [ ] 局部坐标 vs 世界坐标

- [ ] 蒙皮算法
  - [ ] 顶点混合
  - [ ] 骨骼权重
  - [ ] 矩阵调色板

- [ ] 动画混合
  - [ ] 线性插值（LERP）
  - [ ] 球面插值（SLERP）
  - [ ] 动画叠加
  - [ ] Additive Animation

- [ ] 动画状态机
  - [ ] 状态定义
  - [ ] 转换条件
  - [ ] 混合树
  - [ ] Blend Space

---

## 资源管理

### 资源系统架构
- [ ] 资源加载器设计
  - [ ] 异步加载
  - [ ] 多线程加载
  - [ ] 依赖管理

- [ ] 资源缓存策略
  - [ ] LRU缓存
  - [ ] 引用计数
  - [ ] 内存预算

- [ ] 引用计数管理
  - [ ] Shared_ptr使用
  - [ ] 循环引用处理
  - [ ] Weak_ptr应用

- [ ] 异步加载
  - [ ] 加载队列
  - [ ] 优先级系统
  - [ ] 进度回调

- [ ] 资源热更新
  - [ ] 文件监听
  - [ ] 资源重载
  - [ ] 运行时更新

---

## 架构设计

### ECS架构
- [ ] 组件-实体系统（ECS）
  - [ ] Entity设计
  - [ ] Component定义
  - [ ] System实现
  - [ ] 数据导向设计

- [ ] 场景管理
  - [ ] 场景图设计
  - [ ] 层次结构
  - [ ] 变换传播
  - [ ] 场景序列化

- [ ] 事件系统
  - [ ] 事件定义
  - [ ] 事件分发
  - [ ] 事件订阅
  - [ ] 异步事件

- [ ] 反射系统
  - [ ] 类型注册
  - [ ] 属性遍历
  - [ ] 序列化支持
  - [ ] 编辑器集成

- [ ] 序列化系统
  - [ ] JSON格式
  - [ ] 二进制格式
  - [ ] 版本兼容
  - [ ] 向后兼容

---

## 性能优化

### CPU优化
- [ ] 多线程任务系统
  - [ ] 任务图
  - [ ] 任务调度
  - [ ] 任务依赖
  - [ ] 工作窃取

- [ ] 内存池
  - [ ] 固定大小块
  - [ ] 可变大小块
  - [ ] 对齐分配
  - [ ] Arena分配器

- [ ] 对象缓存
  - [ ] 对象池
  - [ ] Free List
  - [ ] 预分配

### GPU优化
- [ ] 渲染批处理
  - [ ] 合同材质批处理
  - [ ] 排序优化
  - [ ] 减少状态切换

- [ ] GPU Instancing
  - [ ] 静态实例化
  - [ ] 动态实例化
  - [ ] 实例化缓冲区

- [ ] GPU Culling
  - [ ] Indirect Drawing
  - [ ] GPU驱动的渲染

---

## 编辑器系统

### 编辑器架构
- [ ] 编辑器-运行时分离
  - [ ] 运行时模块
  - [ ] 编辑器模块
  - [ ] 通信机制

- [ ] 反射系统应用
  - [ ] 属性编辑器
  - [ ] 类型检查
  - [ ] 动态创建

- [ ] 序列化系统
  - [ ] 场景保存/加载
  - [ ] 资源打包
  - [ ] 预制体系统

- [ ] 撤销/重做系统
  - [ ] 命令模式
  - [ ] 命令栈
  - [ ] 合并命令

---

## 工具和调试

### 图形调试
- [ ] RenderDoc使用
  - [ ] 捕获帧
  - [ ] 查看资源
  - [ ] 调试着色器
  - [ ] 性能分析

- [ ] Vulkan验证层
  - [ ] 标准验证
  - [ ] 最佳实践检查
  - [ ] 同步验证

### 性能分析
- [ ] CPU性能分析
  - [ ] Visual Studio Profiler
  - [ ] Intel VTune
  - [ ] perf (Linux)

- [ ] GPU性能分析
  - [ ] NVIDIA Nsight
  - [ ] AMD Radeon GPU Profiler
  - [ ] GPU验证工具

---

## 前沿技术

### 实时光线追踪
- [ ] 光线追踪管线
  - [ ] Acceleration Structure
  - [ ] Ray Generation Shader
  - [ ] Hit/ Miss Shader
  - [ ] Callable Shader

- [ ] 混合渲染
  - [ ] 光栅化 + RT混合
  - [ ] 反射
  - [ ] 阴影
  - [ ] 全局光照

### AI加速渲染
- [ ] DLSS (Deep Learning Super Sampling)
- [ ] FSR (FidelityFX Super Resolution)
- [ ] XeSS

### 程序化生成
- [ ] PCG基础
- [ ] 噪声函数（Perlin, Simplex, Worley）
- [ ] 地形生成
- [ ] 规则系统生成
- [ ] Wave Function Collapse

---

## 数学基础

### 向量和矩阵
- [ ] 向量运算
  - [ ] 点积（Dot Product）
  - [ ] 叉积（Cross Product）
  - [ ] 向量归一化
  - [ ] 投影和反射

- [ ] 矩阵运算
  - [ ] 矩阵乘法
  - [ ] 矩阵转置
  - [ ] 矩阵求逆
  - [ ] 矩阵分解

- [ ] 变换矩阵
  - [ ] 平移矩阵
  - [ ] 旋转矩阵
  - [ ] 缩放矩阵
  - [ ] 视图矩阵
  - [ ] 投影矩阵（正交、透视）

### 四元数
- [ ] 四元数基础
  - [ ] 四元数表示
  - [ ] 四元数运算
  - [ ] 单位四元数

- [ ] 四元数与旋转
  - [ ] 轴角到四元数
  - [ ] 欧拉角到四元数
  - [ ] 矩阵到四元数

- [ ] 四元数插值
  - [ ] 线性插值（LERP）
  - [ ] 球面插值（SLERP）
  - [ ] 样条插值（SQUAD）

---

## C++进阶

### 现代C++特性
- [ ] 智能指针
  - [ ] unique_ptr
  - [ ] shared_ptr
  - [ ] weak_ptr
  - [ ] make_shared, make_unique

- [ ] 移动语义
  - [ ] 右值引用
  - [ ] std::move
  - [ ] std::forward
  - [ ] 完美转发

- [ ] Lambda表达式
  - [ ] Lambda语法
  - [ ] 捕获列表
  - [ ] Lambda作为回调

- [ ] 模板编程
  - [ ] 函数模板
  - [ ] 类模板
  - [ ] 模板特化
  - [ ] constexpr if

- [ ] C++标准库
  - [ ] STL容器
  - [ ] STL算法
  - [ ] std::optional, std::variant
  - [ ] std::function

---

## 学习进度追踪

### 第一阶段：基础准备（第1-3周）
- [ ] 现代C++基础
- [ ] 环境搭建与图形学基础
- [ ] 编译引擎与代码导读

**验证**: 能成功编译并运行引擎

### 第二阶段：核心系统（第4-11周）
- [ ] 渲染系统（第4-5周）
- [ ] 场景管理（第6周）
- [ ] 物理系统（第7周）
- [ ] 动画系统（第8周）
- [ ] 资源管理（第9周）
- [ ] 输入与UI（第10周）
- [ ] 性能优化（第11周）

**验证**: 能解释各核心系统原理

### 第三阶段：高级应用（第12-16周）
- [ ] 编辑器架构（第12周）
- [ ] 粒子系统（第13周）
- [ ] 光照与阴影（第14周）
- [ ] 后期处理与前沿技术（第15周）
- [ ] 综合项目（第16周）

**验证**: 完成综合项目

---

## 掌握程度评估

每个知识点的掌握程度分为三级：
- **熟悉**: 理解概念，知道原理
- **掌握**: 能解释原理，能阅读相关代码
- **精通**: 能独立实现，能优化改进

请用不同符号标记：
- ⬜ 未学习
- 🟡 熟悉
- 🟠 掌握
- 🔴 精通
