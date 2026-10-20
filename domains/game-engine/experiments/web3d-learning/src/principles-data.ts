import type { CourseDigest } from './course-types.ts';
import { games101AdditionalChapters } from './course-digests/games101.ts';
import { games104AdditionalChapters } from './course-digests/games104.ts';
import { unityPreludeChapters, unityAdditionalChapters } from './course-digests/unity.ts';
export type { CourseId, CourseChapter, CourseDigest } from './course-types.ts';
const g101 = (n: number) => `https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_${String(n).padStart(2, '0')}.pdf`;
const g104 = (n: number) => `https://games-1312234642.cos.ap-guangzhou.myqcloud.com/course/GAMES104/GAMES104_Lecture${String(n).padStart(2, '0')}.pdf`;
const unity = (slug: string) => `https://learn.unity.com/course/create-with-code/unit/unit-1-driving-simulation/tutorial/${slug}?version=6.0`;

// Original chapter order; source labels use one-based PDF pages or tutorial sections.
export const courseDigests: CourseDigest[] = [
  {
    id: 'games101', name: 'GAMES101', title: '现代计算机图形学入门', scope: '第 1—22 讲 · 原课重点',
    sourceLanguage: 'en',
    url: 'https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html',
    chapters: [
      {
        id: '01', number: '第 1 讲', title: '计算机图形学概述', originalTitle: 'Overview of Computer Graphics',
        source: g101(1), sourceLabel: 'Lecture 01 · PDF 第 9—36 页',
        points: [
          { title: '应用范围', text: '游戏、电影、动画、设计、可视化、VR／AR、仿真和图形界面，都是本讲展示的图形学应用。', source: '第 9—23 页' },
          { title: '技术内容', text: '投影、曲线与曲面、光照与着色、三维形状的表示和操作、动画与模拟。', source: '第 24—25 页' },
          { title: '光栅化', text: '将三维几何图元投影到屏幕，再将投影后的图元离散为片元；原课把它列为实时应用的重要方法。', source: '第 29 页' },
          { title: '曲线与网格', text: '讨论怎样表示几何形状，课件列出 Bézier 曲线与 Catmull–Clark 细分。', source: '第 30 页' },
          { title: '光线追踪', text: '从相机经过像素发射光线，计算相交与着色，并继续追踪光线的传播。', source: '第 31 页' },
          { title: '动画与模拟', text: '本课包括关键帧动画、质点弹簧系统等内容；课程重点是图形学原理。', source: '第 32—36 页' },
        ],
      },
      {
        id: '02', number: '第 2 讲', title: '向量与线性代数', originalTitle: 'Review of Linear Algebra',
        source: g101(2), sourceLabel: 'Lecture 02 · PDF 第 8—38 页',
        points: [
          { title: '向量', text: '向量具有方向和长度，没有固定的起点。单位向量的长度为 1，常用来表示方向。', source: '第 8—11 页' },
          { title: '点积', text: '结果是标量，可用于求向量夹角和投影；原课也用点积的正负区分前后方向。', source: '第 13—19 页' },
          { title: '叉积', text: '结果垂直于两个输入向量，方向按右手定则确定；可用于判断左右、点与三角形的关系。', source: '第 21—25 页' },
          { title: '坐标系', text: '正交单位基用于表示位置与方向；图形学经常需要在世界、物体和物体局部等坐标系之间变换。', source: '第 27—28 页' },
          { title: '矩阵', text: '矩阵用于表示变换。矩阵乘法一般不能交换顺序；本讲同时复习转置、单位矩阵与逆矩阵。', source: '第 30—38 页' },
        ],
      },
      {
        id: '03', number: '第 3 讲', title: '变换（二维与三维）', originalTitle: 'Transformation',
        source: g101(3), sourceLabel: 'Lecture 03 · PDF 第 5—40 页',
        points: [
          { title: '变换的用途', text: '建模需要平移、旋转和缩放；观察需要把三维内容投影到二维。', source: '第 5—9 页' },
          { title: '二维线性变换', text: '缩放、反射、错切和绕原点旋转，都可以用矩阵表示。', source: '第 11—19 页' },
          { title: '齐次坐标', text: '增加一个坐标后，可统一用矩阵表示平移与线性变换，并区分点与方向向量。', source: '第 24—28 页' },
          { title: '逆变换', text: '逆矩阵对应几何上的逆变换，可以撤销原来的变换。', source: '第 29 页' },
          { title: '组合变换', text: '变换顺序影响结果。多个变换可合成为一个矩阵；绕指定点旋转可拆成平移、旋转、平移回去。', source: '第 30—37 页' },
          { title: '三维变换', text: '三维点与向量同样使用齐次坐标，仿射变换用 4×4 矩阵表示。', source: '第 38—40 页' },
        ],
      },
      {
        id: '04', number: '第 4 讲', title: '变换（模型、视图、投影）', originalTitle: 'Transformation Cont.',
        source: g101(4), sourceLabel: 'Lecture 04 · PDF 第 5—36 页',
        points: [
          { title: '三维旋转', text: '介绍绕坐标轴的旋转、欧拉角，以及绕任意轴旋转的表示。', source: '第 5—10 页' },
          { title: '模型、视图、投影', text: '模型变换摆放物体，视图变换确定观察坐标系，投影变换完成三维到二维的成像。', source: '第 12 页' },
          { title: '相机与视图变换', text: '相机由位置、观察方向、向上方向定义；将相机和物体一起变换，使相机位于原点、朝向 −Z、向上为 Y。', source: '第 13—17 页' },
          { title: '正交投影', text: '将长方体观察区域平移、缩放到标准立方体；投影中物体不会因距离变远而缩小。', source: '第 19—25 页' },
          { title: '透视投影', text: '远处物体显得更小。课件先把视锥变为长方体，再进行正交投影。', source: '第 26—36 页' },
        ],
      },
      {
        id: '05', number: '第 5 讲', title: '光栅化（三角形的离散化）', originalTitle: 'Rasterization 1 (Triangles)',
        source: g101(5), sourceLabel: 'Lecture 05 · PDF 第 5—53 页',
        points: [
          { title: '视口变换', text: '视场角与宽高比可用于描述对称视锥；视口变换把标准区域映射到屏幕像素坐标。', source: '第 5—10 页' },
          { title: '屏幕与像素', text: '屏幕是像素数组，数组大小为分辨率；本讲将像素简化为颜色均匀的小方块。', source: '第 8—9、46—48 页' },
          { title: '三角形', text: '三角形必定共面，内部定义明确，便于插值；它是光栅化常用的基本图元。', source: '第 27—31 页' },
          { title: '像素中心采样', text: '逐个判断像素中心是否位于三角形内部，将连续的三角形覆盖关系离散为像素结果。', source: '第 32—39 页' },
          { title: '内部测试与遍历', text: '用三条边的叉积判断点是否在三角形内；包围盒可缩小需要检查的像素范围。', source: '第 40—44 页' },
          { title: '锯齿', text: '单点采样后的离散边缘出现阶梯状锯齿，本讲将其归为走样问题。', source: '第 49—53 页' },
        ],
      },
      {
        id: '06', number: '第 6 讲', title: '光栅化（深度测试与抗锯齿）', originalTitle: 'Rasterization 2 (Antialiasing and Z-Buffering)',
        source: g101(6), sourceLabel: 'Lecture 06 · PDF 第 10—70 页',
        note: '标题沿用官方目录。本讲 PDF 的实际内容集中在抗锯齿，以下重点按课件内容整理。',
        points: [
          { title: '走样现象', text: '锯齿、摩尔纹、车轮倒转分别体现空间、图像或时间采样的误差；信号变化过快而采样不足会产生走样。', source: '第 10—18 页' },
          { title: '先滤波，再采样', text: '抗锯齿先限制高频内容，再进行采样；先采样再模糊，与先滤波再采样的结果不同。', source: '第 19—26 页' },
          { title: '频域观察', text: '傅里叶变换把信号分解为不同频率；采样会重复频谱，频谱重叠形成走样。', source: '第 27—33、49—54 页' },
          { title: '滤波与卷积', text: '课件用局部加权平均介绍卷积，并展示高通、低通和盒式滤波器。', source: '第 34—48 页' },
          { title: '像素面积平均', text: '对三角形覆盖函数，一个像素范围内的平均值等于被三角形覆盖的面积比例。', source: '第 57—59 页' },
          { title: '多点采样近似', text: '在像素内取多个位置并平均结果，近似面积平均；更多采样会增加开销。课件末尾另列 FXAA、TAA 和超分辨率方法。', source: '第 60—70 页' },
        ],
      },
      ...games101AdditionalChapters,
    ],
  },
  {
    id: 'unity', name: 'Unity Create with Code', title: 'Create with Code · Unity 6.0',
    scope: '全目录 47 篇 · Unity 6.0',
    sourceLanguage: 'en',
    url: 'https://learn.unity.com/course/create-with-code?version=6.0',
    chapters: [
      ...unityPreludeChapters,
      {
        id: '1.1', number: 'Lesson 1.1', title: 'Start your 3D Engines', originalTitle: 'Unit 1 · Player Control',
        source: unity('lesson-1-1-start-your-3d-engines'), sourceLabel: '官方教程 · 第 1—8 节',
        points: [
          { title: '项目与资源', text: '创建 Universal 3D 项目，导入 Prototype 1 课程资源并打开场景。', source: '第 1—2 节' },
          { title: '车辆与障碍物', text: '把车辆放到道路起点，在前方摆放障碍物；通过 Transform 调整物体位置。', source: '第 3—4 节' },
          { title: '相机', text: '运行游戏检查相机画面，再把相机移到车辆后方并调整角度。', source: '第 5—6 节' },
          { title: '编辑器基础', text: '熟悉 Project、Hierarchy、Inspector、Scene 和 Game 窗口，以及三维空间中的观察、移动与旋转操作。', source: '第 3—8 节' },
          { title: '本讲成果', text: '道路上已有车辆和障碍物，相机位于车辆后方，编辑器布局已保存。', source: '第 8 节 Lesson Recap' },
        ],
      },
      {
        id: '1.2', number: 'Lesson 1.2', title: 'Pedal to the Metal', originalTitle: 'Unit 1 · Player Control',
        source: unity('1-2-move-the-vehicle-with-your-first-line-of-c'), sourceLabel: '官方教程 · 第 1—8 节',
        points: [
          { title: '脚本组件', text: '创建 PlayerController，并将它添加到车辆对象；在 Update 中持续更新车辆位置。', source: '第 1—3 节' },
          { title: '前进与速度', text: '用向量指定前进方向，借助 Time.deltaTime 和速度参数调整移动速度。', source: '第 4—5 节' },
          { title: '物理组件', text: '为车辆和障碍物添加 Rigidbody 并调整质量；本讲复习碰撞体与刚体的使用。', source: '第 6、8 节' },
          { title: '多个障碍物', text: '复制障碍物并沿道路摆放，形成一段可以测试碰撞的路面。', source: '第 7 节' },
          { title: '本讲成果', text: '车辆以恒定速度沿道路前进，碰到障碍物时会产生物理碰撞。', source: '第 8 节 Lesson Recap' },
        ],
      },
      {
        id: '1.3', number: 'Lesson 1.3', title: 'High Speed Chase', originalTitle: 'Unit 1 · Player Control',
        source: unity('1-3-make-the-camera-follow-the-vehicle-with-variables'), sourceLabel: '官方教程 · 第 1—7 节',
        points: [
          { title: '速度变量', text: '把车辆速度改为可调整的变量，并在 Inspector 中修改数值。', source: '第 1 节' },
          { title: '相机跟随', text: '为相机创建 FollowPlayer，引用车辆对象，并让相机位置随车辆位置更新。', source: '第 2 节' },
          { title: '跟随偏移', text: '用一个 Vector3 变量保存相机与车辆的位置偏移，使相机保持在车辆后上方。', source: '第 3—4 节' },
          { title: 'LateUpdate', text: '将相机跟随更新移到 LateUpdate，减少原课演示中出现的相机抖动。', source: '第 5 节' },
          { title: '本讲成果', text: '相机沿道路跟随车辆，并保持设定的偏移距离；本讲同时介绍变量、数据类型和访问修饰符。', source: '第 7 节 Lesson Recap' },
        ],
      },
      {
        id: '1.4', number: 'Lesson 1.4', title: 'Step into the Driver’s Seat', originalTitle: 'Unit 1 · Player Control',
        source: unity('lesson-1-4-use-user-input-to-control-the-vehicle'), sourceLabel: '官方教程 · 第 1—9 节 · Unity 6.0',
        points: [
          { title: '输入动作', text: '配置 Input System，为 Move Action 绑定方向键或 WASD；二维输入分别表示左右与前后。', source: '第 1、3—5 节' },
          { title: '输入驱动移动', text: '用前后输入控制车辆前进与后退，用左右输入测试横向移动。', source: '第 2、6 节' },
          { title: '转向', text: '将左右平移改为绕 Y 轴旋转，使车辆转向；前后移动沿车辆自身的前进方向进行。', source: '第 7 节' },
          { title: '整理', text: '为脚本添加注释，将内部使用的输入变量设为私有。', source: '第 8 节' },
          { title: '本讲成果', text: '上下键控制前进与后退，左右键控制转向；重点区分平移与旋转。', source: '第 9 节 Lesson Recap' },
        ],
      },
      ...unityAdditionalChapters,
    ],
  },
  {
    id: 'games104', name: 'GAMES104', title: '现代游戏引擎——从入门到实践', scope: '第 1—22 讲 · 已发布课件',
    sourceLanguage: 'en',
    url: 'https://games-cn.org/games104-slides/',
    note: '按官方已发布课件的讲次与实际内容整理；部分标题、顺序与早期课程大纲不同。',
    chapters: [
      {
        id: '01', number: '第 1 讲', title: '游戏引擎导论', originalTitle: 'Overview of Game Engine',
        source: g104(1), sourceLabel: 'Lecture 01 · PDF 第 6—47 页',
        points: [
          { title: '应用', text: '游戏引擎用于游戏，也用于数字人、影视动画、仿真和数字孪生。', source: '第 6—11 页' },
          { title: '发展', text: '从早期游戏介绍到 Wolfenstein 3D、Doom 和 Quake，讨论引擎功能与游戏内容的分离，以及引擎复用。', source: '第 12—19 页' },
          { title: '课程中的引擎定义', text: '构建虚拟世界的技术基础、支持内容创作的生产工具，以及对复杂系统的组织。', source: '第 22—23 页' },
          { title: '运行与创作', text: '引擎需要在实时条件下处理渲染、动画、物理等系统，并通过工具链和可扩展接口支持创作与团队协作。', source: '第 24—32 页' },
          { title: '学习方法', text: '先建立框架，抓住主要技术内容，再逐步深入各系统。', source: '第 33—35 页' },
          { title: '课程范围', text: '架构与数据组织，渲染、动画、物理、玩法、工具链和网络；后续还介绍面向数据设计及引擎新技术。', source: '第 36—47 页' },
        ],
      },
      {
        id: '02', number: '第 2 讲', title: '基础架构 1：引擎架构分层，整体 Pipeline', originalTitle: 'Layered Architecture of Game Engine',
        source: g104(2), sourceLabel: 'Lecture 02 · PDF 第 3—35 页',
        points: [
          { title: '五层结构', text: '从上到下为工具层、功能层、资源层、核心层、平台层；第三方库为各层提供支持。', source: '第 3—9 页' },
          { title: '资源层', text: '离线导入统一资源格式并预处理；运行时管理加载、卸载、引用与生命周期，使用 GUID 和句柄管理资源。', source: '第 12—14 页' },
          { title: '功能层', text: '提供渲染、动画、物理、相机、输入等模块。Game Loop 周期性更新系统；课件同时介绍多线程与任务系统的组织。', source: '第 15—19 页' },
          { title: '核心层', text: '提供数学库、容器和内存管理等通用能力；课件强调内存布局、缓存命中与分配策略对性能的影响。', source: '第 20—24 页' },
          { title: '平台层', text: '处理文件系统、图形接口和硬件差异，为上层提供平台无关的服务；RHI 封装图形硬件接口。', source: '第 25—27 页' },
          { title: '工具层', text: '提供关卡、动画、Shader 等编辑工具，并衔接 DCC 内容制作与资源处理流程。', source: '第 28—29 页' },
          { title: '分层原则', text: '底层不依赖上层，上层不必了解底层实现；上层变化较快，底层相对稳定。分层用于解耦并降低复杂度。', source: '第 30、35 页' },
        ],
      },
      {
        id: '03', number: '第 3 讲', title: '基础架构 2：数据组织和管理', originalTitle: 'How to Build a Game World',
        source: g104(3), sourceLabel: 'Lecture 03 · PDF 第 2—36 页',
        points: [
          { title: '游戏对象', text: '角色、环境以及触发区域等都可以表示为游戏对象；对象通过属性和行为描述。', source: '第 2—10 页' },
          { title: '组件组合', text: '单纯继承难以覆盖所有对象分类。课件改用 Transform、模型、动画、物理、AI 等组件组合描述对象。', source: '第 11—20 页' },
          { title: 'Tick 更新', text: '对象状态在 Tick 循环中更新。按对象更新简单直观、易调试；按组件更新有利于并行处理和减少缓存失效。', source: '第 21—24 页' },
          { title: '事件', text: '通过消息发送与处理实现对象交互，使事件发送方与处理方解耦。', source: '第 25—28 页' },
          { title: '场景管理', text: '场景管理游戏对象，可按唯一 ID 或空间位置查询；网格、四叉树、八叉树、BVH、BSP 等用于组织空间数据。', source: '第 29—35 页' },
          { title: '依赖与时机', text: '课件最后提出组件间依赖，以及事件是否立即发送的问题。', source: '第 36 页' },
        ],
      },
      ...games104AdditionalChapters,
    ],
  },
];
