import type { ClassicLessonId } from './classic-core.ts';

export const courses = [
  { name: 'GAMES101', role: '像素怎样形成', path: '概述 → 线性代数 → 变换 → 光栅化', url: 'https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html' },
  { name: 'Unity Create with Code', role: '把场景变成可玩的原型', path: '1.1 场景 → 1.2 移动 → 1.3 相机 → 1.4 输入', url: 'https://learn.unity.com/course/create-with-code/unit/unit-1-driving-simulation?version=6.0' },
  { name: 'GAMES104', role: '引擎怎样组织这些工作', path: '引擎导论 → 基础架构 → 各系统机制', url: 'https://games-cn.org/games104/' },
];
export interface ClassicLesson {
  id: ClassicLessonId;
  course: string;
  chapter: string;
  title: string;
  short: string;
  question: string;
  takeaway: string;
  try: string;
  detail: string;
  formula: string;
  condition: string;
  next: string;
  sources: { label: string; url: string; note: string }[];
}
export const classicLessons: ClassicLesson[] = [
  {
    id: 'frame', course: 'GAMES104', chapter: '引擎导论 · 配套 Piccolo 源码',
    title: '输入如何成为一帧画面', short: '输入 → 世界 → 画面',
    question: '按下前进键后，究竟是谁先发生变化？沿着一帧走一遍。',
    takeaway: '输入提供意图，更新改变世界状态，渲染再根据状态生成画面。',
    try: '点“下一步”，留意：车的位置变了，右边的画面何时才采用新位置？',
    detail: '先假设车没有转向，车头与世界 +Z 一致。输入 1 表示前进意图；速度乘以时间，才得到本次位移。这里把一个教学时间步放大为 0.4 秒，便于观察 2 米的变化；它不代表真实帧率。',
    formula: '新 z = 旧 z + 输入 × 速度 × 时间\n0 + 1 × 5 m/s × 0.4 s = 2 m',
    condition: '这是依赖关系的分解。Piccolo 的该版实现先 logicalTick，再交换逻辑与渲染数据、rendererTick，最后收集窗口事件；概念图不是它逐行的执行顺序。真实 CPU、GPU 和显示还可能异步工作。',
    next: '回到 GAMES104 第一讲梳理引擎职责，再沿第二讲基础架构理解系统怎样分层。',
    sources: [
      { label: 'GAMES104 · 课程入口', url: 'https://games-cn.org/games104/', note: '第一讲引擎导论；后续按原课顺序进入基础架构。' },
      { label: 'Piccolo · engine.cpp', url: 'https://github.com/BoomingTech/Piccolo/blob/2bd7aa50ac4c21888b152c2bfcf321813a7ff8c9/engine/source/runtime/engine.cpp', note: '源码旁证，固定到文件提交 2bd7aa50；查看 run、tickOneFrame 与 logicalTick。' },
      { label: 'Unity · Lesson 1.4', url: 'https://learn.unity.com/course/create-with-code/unit/unit-1-driving-simulation/tutorial/lesson-1-4-use-user-input-to-control-the-vehicle?version=6.0', note: '输入与直接位移的原例。完整实践仍从 1.1 开始；输入分量不等于世界坐标。' },
    ],
  },
  {
    id: 'scene', course: 'Unity Create with Code', chapter: 'Unit 1 · Lesson 1.1 场景与相机',
    title: '车在移动，还是镜头在移动？', short: '场景与相机',
    question: '世界里车向前了，为什么画面中的车有时变小，有时却几乎不动？',
    takeaway: '画面取决于物体与相机的相对关系。跟随车的镜头，也在世界中移动。',
    try: '先用固定相机把车前移 2 米，再切换跟随相机。看左边谁移动、右边谁保持大小。',
    detail: 'Scene 视图用于编辑和观察场景，Game 视图显示相机看到的内容。这里用固定俯视图辅助观察世界；右图始终来自同一个透视相机。跟随时保持相机与车的偏移，所以车的画面位置与大小保持稳定，固定障碍物仍会相对移动。',
    formula: '固定相机：相机 z = −8\n跟随相机：相机 z = 车 z − 8\n相对位置 = 物体位置 − 相机位置',
    condition: 'Lesson 1.1 先摆放车辆、障碍与相机。跟随模式是为解释观察关系增加的辅助对照，原课在 1.3 继续实现相机跟随。这里只平移、不转向，也没有碰撞和车辆物理。',
    next: '在原课 1.1 完成场景后，依次进入 1.2 的运动、1.3 的相机和 1.4 的玩家输入。',
    sources: [
      { label: 'Unity · Lesson 1.1', url: 'https://learn.unity.com/course/create-with-code/unit/unit-1-driving-simulation/tutorial/lesson-1-1-start-your-3d-engines?version=6.0', note: 'Unity 6.0 版本，第 3—6 步：摆放车、障碍与相机，观察 Scene / Game。' },
      { label: 'Unity · Unit 1 目录', url: courses[1].url, note: '后续按 1.2、1.3、1.4 的原始顺序学习。' },
    ],
  },
  {
    id: 'projection', course: 'GAMES101', chapter: 'Lecture 04 · 观测与透视投影',
    title: '车没变小，为什么看起来变小了？', short: '距离与透视',
    question: '把车推远，或扩大相机视野，都能让画面里的车变小。它们分别改变了什么？',
    takeaway: '世界尺寸、相机距离、投影视野是三个不同的量。画面变小不等于模型缩小。',
    try: '先保持 50° 视野，只把车推远；恢复后只扩大视野。两次对照中，车的世界尺寸都保持不变。',
    detail: '先以相机为参照，把世界中的点换成相机空间中的位置，再投影到二维画面。透视投影用深度参与除法，因此远处的物体通常更小。视野角 FOV 越大，同样的画面要容纳越宽的范围，物体也会显得更小。',
    formula: '焦距 f = 画面高度 / (2 × tan(FOV / 2))\n屏幕 x = 画面中心 x + f × 相机空间 x / 深度',
    condition: '对应课件标号第 12 页起的相机、观测与投影。示意用相机前方的正深度表示除数；原课常用朝 −Z 的相机约定，符号需随坐标约定转换。此处不展开裁剪、光栅化和着色。',
    next: '这是当前问题的第 4 讲回看入口。主线仍从概述、线性代数、变换顺序复习，再进入光栅化。',
    sources: [
      { label: 'GAMES101 · Lecture 04 课件', url: 'https://sites.cs.ucsb.edu/~lingqi/teaching/resources/GAMES101_Lecture_04.pdf', note: '第 12 页起区分模型摆放、相机观察与投影；后续展开正交与透视。' },
      { label: 'GAMES101 · 原课程目录', url: courses[0].url, note: '按原课顺序复习；不以这个交互替代前置数学与完整推导。' },
    ],
  },
];
export const framePhases = [
  { title: '开始前', text: '世界中的车在 z = 0，屏幕显示的也是这个位置。相机固定在车后方。' },
  { title: '读取输入', text: '读到前进输入 1。它只表达意图；移动代码尚未执行，世界与画面都没有改变。' },
  { title: '更新位置', text: '移动代码把世界中的车更新到 z = 2。右边仍是旧画面：状态改变与图像生成是两件事。' },
  { title: '准备绘制', text: '把新位置、道路与相机等数据交给渲染环节。右边暂时保留旧画面，准备好数据还不等于显示完成。' },
  { title: '绘制画面', text: '新画面采用 z = 2 的位置。固定相机没有动，车驶向远处后，在画面中显得更小。' },
];
