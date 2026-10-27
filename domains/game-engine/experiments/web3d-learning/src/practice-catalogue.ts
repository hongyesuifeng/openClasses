import { foundationalPractices } from './practice-experiments.ts';
import { gamePractice } from './practice-game.ts';
import { vectorPractice } from './practice-vectors.ts';
import { followPractice } from './practice-follow.ts';
import { inputPractice } from './practice-input.ts';
import { cameraPractice } from './practice-camera.ts';
import type { CourseId } from './course-types.ts';
import type { PracticeCatalogueItem, PracticeDefinition, PracticeSource } from './practice-types.ts';

export const practiceDefinitions: PracticeDefinition[] = [vectorPractice, ...foundationalPractices, gamePractice, followPractice, inputPractice, cameraPractice].sort((a, b) => a.id.localeCompare(b.id));
export const findPractice = (id: string) => practiceDefinitions.find(item => item.id === id);
export const practiceStatistics = {
  runnableExperiments: practiceDefinitions.length,
  runnableTasks: practiceDefinitions.reduce((sum, definition) => sum + definition.tasks.length, 0),
  mappedSourceSections: new Set(practiceDefinitions.flatMap(definition => definition.sources.flatMap(ref =>
    ref.sectionIds.map(section => `${ref.course}/${ref.chapter}#${section}`)))).size,
};

export interface PracticeCoverage extends PracticeCatalogueItem {
  sources: PracticeSource[];
  tasks: string[];
  computation: string;
  limitation: string;
}
const source = (course: CourseId, chapter: string, sections: number[], label: string): PracticeSource =>
  ({ course, chapter, sectionIds: sections.map(n => `part-${n}`), label });
const g101 = (chapter: string, sections: number[]) => source('games101', chapter, sections, `GAMES101 第${Number(chapter)}讲`);
const g104 = (chapter: string, sections: number[]) => source('games104', chapter, sections, `GAMES104 第${Number(chapter)}讲`);
const unity = (chapter: string, sections: number[]) => source('unity', chapter, sections, `Unity ${chapter}`);
// Stable IDs describe learning mechanisms. A planned row is never a runnable link.
const groups = ['空间与坐标', '时间与控制', '光栅与采样', '插值与纹理', '光照与阴影', '几何处理', '射线与积分', '成像与颜色', '角色动画', '物理机制', '玩法流程', '人工智能', '引擎数据', '编辑工具', '粒子与声音', '地形与大气', '渲染流程', '几何管线', '全局光照', '网络机制'];
type Entry = [string, PracticeSource[], string[], string, string];
const entries: Entry[] = [
  ['点与向量', [g101('02', [2, 3, 5, 6, 7, 8, 9, 10])], ['点与单位方向', '点积与投影', '叉积与方向'], '解析向量计算', '不代替完整线性代数课程；零向量需明确无单位方向'],
  ['变换次序与齐次坐标', [g101('03', [7, 8, 11, 12, 13])], ['组合次序', '方向与指定旋转中心'], '解析坐标与矩阵结果', '固定列向量；首批仅二维仿射变换'],
  ['相机与投影', [g101('04', [5, 6, 7, 8, 9, 10, 11, 12, 13])], ['视图变换', '正交与透视'], 'CPU 坐标与投影', '保留原课看向负Z、n>f的坐标约定；不混同完整渲染管线'],
  ['时间与恒速运动', [unity('1.2', [3, 5])], ['时间累计与暂停'], '恒速解析结果', '输入为固定模拟时间线，不测真实刷新率'],
  ['输入与方向转换', [unity('1.4', [3, 4, 5, 6, 7]), unity('4.1', [8, 10, 11])], ['输入幅度与运动／转向', '随观察方向施力'], '离散输入与方向指令', '保留模拟输入幅度；施力方向不等于恒速位移，不要求掌握引擎输入接口'],
  ['相机跟随与更新顺序', [unity('1.3', [3, 4, 5])], ['跟随偏移', '更新先后'], '离散帧序列', '不模拟真实线程调度'],
  ['三角形覆盖', [g101('05', [8, 9, 10, 11])], ['边函数', '包围盒遍历'], 'CPU 离散覆盖', '明确边界约定'],
  ['深度比较', [g101('07', [1, 2, 3, 4, 5])], ['逐片元深度更新'], '离散深度表', '透明排序另行讨论'],
  ['亚像素覆盖与采样误差', [g101('06', [3, 13, 14])], ['中心采样、命中与平均'], '解析区间与有限采样', '一维窄带覆盖单位高度；不是通用抗锯齿器'],
  ['重心插值', [g101('09', [1, 2, 3])], ['属性插值', '透视修正'], '解析重心权重', '屏幕线性不等于世界线性'],
  ['纹理过滤', [g101('09', [4, 5, 6])], ['最近邻', '双线性'], '离散纹素查询', '不以模糊程度判断正确性'],
  ['纹理足迹与 Mipmap', [g101('09', [7, 8, 9, 10, 11, 12])], ['足迹与层级', '三线性与各向异性条件'], 'CPU 层级查询', '不实现硬件纹理单元'],
  ['光照与 BRDF', [g101('07', [10, 11, 12]), g101('15', [7, 8]), g104('05', [5, 6])], ['漫反射', 'BRDF 条件'], '数值方向响应', '区分经验模型与物理量'],
  ['阴影', [g101('12', [9, 10, 11, 12, 13])], ['光源深度比较', '偏移与分辨率'], 'CPU 深度查询', '不作为完整软阴影实现'],
  ['球谐与环境光预计算', [g104('05', [3, 4, 7])], ['低阶投影', '预计算查询'], '采样近似', '低频表示不能恢复尖锐高光'],
  ['几何表示', [g101('10', [8, 9, 10, 11, 12, 13]), g101('11', [1, 2])], ['显式与隐式查询'], '离散网格与距离查询', '只比较课内表示的局部取舍'],
  ['曲线与曲面', [g101('11', [3, 4, 5, 7, 8, 9, 11, 12])], ['递归插值', '曲面求值'], '解析参数与离散采样', '采样线段不等于连续曲线本身'],
  ['网格细分与简化', [g101('12', [2, 3, 4, 5, 6, 7, 8])], ['细分：新旧顶点', '简化：边坍缩与误差'], 'CPU 网格子算法', '两类算法独立输入与判定'],
  ['射线求交', [g101('13', [6, 7, 9, 10, 13, 14])], ['球与三角形', 'AABB 区间'], '解析几何', '说明平行与退化输入'],
  ['BVH', [g101('14', [8, 9, 10, 11])], ['构建划分', '最近命中遍历'], 'CPU 树查询', '以暴力查询核对，不以耗时单独判定'],
  ['蒙特卡洛与路径追踪', [g101('16', [1, 2, 3, 5, 7, 9, 10, 11, 12, 13])], ['采样权重', '路径终止与直接光'], '随机估计', '固定种子可复现；有限样本不等于真值'],
  ['透镜与曝光', [g101('19', [3, 5, 6, 7, 10, 11, 12, 13, 14, 15])], ['薄透镜', '曝光与景深'], '解析近似与采样', '几何薄透镜不包括波动光学'],
  ['光场', [g101('20', [1, 2, 3, 4, 5])], ['两平面参数', '重新聚焦'], '离散光线模型', '有限视角限制可恢复范围'],
  ['光谱、颜色与色域', [g101('20', [6, 7, 9, 10, 11, 12, 13, 14, 15])], ['光谱积分', '颜色转换与裁剪'], '离散光谱近似', '颜色通道不等于光谱'],
  ['骨骼蒙皮', [g104('08', [2, 3, 4, 5])], ['绑定空间', '权重混合'], 'CPU 蒙皮', '不替代完整动画资产流程'],
  ['关键帧与混合', [g101('21', [2, 3]), g104('09', [1, 2, 3, 5])], ['关键帧采样', '混合与相位'], '离散姿态计算', '权重和相位分别检查'],
  ['IK 与重定向', [g101('21', [12, 13, 14]), g104('09', [6, 8])], ['两骨骼 IK', '骨长与姿态映射'], '几何近似', '不可达目标需说明处理策略'],
  ['数值积分', [g101('22', [1, 2, 3, 4, 5, 7, 8, 9]), g104('10', [3])], ['显式与半隐式', '误差和稳定性'], '离散数值近似', '恒速结果不能证明一般积分稳定'],
  ['碰撞检测与响应', [g104('10', [2, 5, 6, 7])], ['宽窄阶段', '接触响应'], '简化刚体模型', '检测与求解分开；不代表 PhysX'],
  ['位置约束与粒子／网格', [g104('11', [4, 5, 8]), g101('22', [10, 12, 14])], ['PBD 位置投影', 'XPBD 柔度', '粒子—网格传递'], '离散简化仿真', '独立任务；不把位置约束等同于能量或动量守恒'],
  ['游戏状态与事件条件', [unity('5.2', [3, 4, 5]), unity('5.3', [3, 4, 6, 7]), unity('5.4', [4, 6])], ['开始、生成、计分、结束与重玩'], '事件序列状态表', '原课点击目标；不扩为完整游戏'],
  ['随机生成与波次', [unity('2.3', [3, 4, 5]), unity('4.4', [3, 4, 5])], ['随机区间', '波次条件'], '种子随机与事件', '统计频率不要求每次均匀'],
  ['计分、能力与重玩流程', [unity('4.3', [3, 4, 5]), unity('5.2', [3, 4, 5]), unity('5.3', [3, 4, 6, 7])], ['能力到期', '计分与场景重建'], '离散生命周期', '31 的门禁通过不代表能力系统已掌握'],
  ['A*', [g104('16', [1, 2, 3, 4])], ['代价与启发式', '路径恢复'], 'CPU 图搜索', '启发式条件决定最优性'],
  ['状态机与行为树', [g104('16', [7, 8])], ['状态切换', '选择与顺序节点'], '离散决策', '比较可追踪执行路径'],
  ['规划、模拟搜索与累计回报', [g104('17', [1, 2, 3, 4, 5, 6])], ['HTN／GOAP 条件', 'MCTS 回传', 'MDP 累计回报'], '离散状态与采样搜索', '任务分别验收；不扩写完整强化学习训练'],
  ['对象组件与句柄', [g104('03', [1, 2, 3, 4, 5, 6, 7, 8])], ['组件组合', '句柄有效性'], 'CPU 数据结构', '句柄是课内机制的教学实现'],
  ['资源生命周期', [g104('02', [2, 3, 4])], ['依赖持有', '加载与释放'], '离散引用模型', '不包含真实 IO 性能结论'],
  ['数据布局与任务依赖', [g104('20', [1, 2, 4, 5, 6, 7])], ['布局与访问', '任务图依赖'], 'CPU 访问计数模型', '不以网页计时冒充原生缓存或多线程基准'],
  ['序列化与版本', [g104('13', [3, 4, 5])], ['引用保存', '版本迁移'], '普通数据转换', '不涉及任意代码反序列化'],
  ['撤销重做', [g104('13', [6, 7])], ['命令逆操作', '分支后重做栈'], '离散命令历史', '外部副作用另作边界'],
  ['编辑／运行状态隔离', [g104('13', [8]), g104('14', [1, 5, 6, 7, 8])], ['状态副本', '编辑与预览'], '数据快照模型', '不实现完整编辑器'],
  ['粒子生命周期', [g104('12', [1, 2, 3, 4])], ['生成更新销毁', '透明排序'], 'CPU 粒子模型', '不称为 GPU 粒子实现'],
  ['声音采样量化', [g104('12', [6])], ['采样率', '量化误差'], '离散信号', '显示波形与试听各有范围'],
  ['空间声音', [g104('12', [7, 8])], ['距离与方向', '遮挡与混响条件'], '简化声学', '不称为完整 HRTF 或波动声场'],
  ['地形层级与接缝', [g104('06', [1, 2, 3])], ['层级选择', '接缝连接'], 'CPU 网格规则', '不是完整地形引擎'],
  ['虚拟纹理', [g104('06', [4, 5])], ['页表查询', '缺页与替换'], '离散页面模型', '不实现 GPU 稀疏资源接口'],
  ['大气与体积步进', [g104('06', [6, 7, 8])], ['透射率累计', '体积积分'], '数值近似', '步长误差与物理简化分别说明'],
  ['渲染阶段依赖', [g104('07', [6, 7, 8])], ['读写依赖', '排序与资源寿命'], 'CPU 依赖图', '不称为真实 GPU 管线'],
  ['HDR 与 Bloom', [g104('07', [4, 5])], ['亮度提取与扩散', '色调映射与显示'], 'CPU 图像运算', '运算空间与显示编码分开'],
  ['时域处理与屏幕信息限制', [g104('07', [1, 3]), g104('21', [3, 7])], ['历史重投影', '失效与屏幕外信息'], '离散帧模型', '不恢复屏幕中缺失的真实几何'],
  ['剔除与批次', [g104('04', [5, 6, 7]), g104('22', [1, 2, 3])], ['可见集合', '提交与排序'], 'CPU 子算法', '不称为完整 Nanite 或真实 GPU 基准'],
  ['簇层次选择', [g104('22', [4, 5])], ['有效层级切面', '误差与预算'], 'CPU 离散层次', '独立核对覆盖；不称为完整 Nanite'],
  ['几何量化与页面流送', [g104('04', [8]), g104('22', [8])], ['量化误差', '页面请求与驻留'], 'CPU 离散数据模型', '量化与流送分别验收；不包含实际 GPU IO'],
  ['直接／间接光', [g101('15', [8, 9, 10, 11, 12]), g104('21', [1, 2])], ['直接可见性', '反弹贡献'], '简化光传输', '不称为完整 Lumen'],
  ['光照缓存查询', [g104('21', [4, 5, 6])], ['空间表示', '缓存命中与插值'], 'CPU 离散缓存', '不称为完整 Lumen 或真实 GPU 光追'],
  ['缓存失效与更新预算', [g104('21', [5, 6, 7, 8])], ['场景变化失效', '优先级与预算'], 'CPU 调度模型', '新鲜度与误差分别记录；不称为完整 Lumen'],
  ['快照与插值', [g104('18', [3, 5]), g104('19', [1])], ['时间缓冲', '快照插值'], '固定网络时间线', '不宣称真实网络测量'],
  ['预测纠正重放', [g104('18', [6, 7, 8]), g104('19', [2])], ['输入预测', '确认与重放'], '离散状态模型', '输入顺序与时间约定固定'],
  ['同步、相关性与服务分工', [g104('18', [1, 2, 4, 6]), g104('19', [3, 4, 5, 6, 8])], ['同步方式', 'AOI 相关性', '服务职责与数据流'], '离散网络模型', '三个任务分别观察，不用单个网络动画代替'],
];
export const practiceCoverage: PracticeCoverage[] = entries.map(([title, sources, tasks, computation, limitation], index) => {
  const id = String(index + 1).padStart(2, '0');
  const ready = findPractice(id);
  return { id, title, group: groups[Math.floor(index / 3)], status: ready ? 'ready' : 'planned',
    sources: ready?.sources ?? sources, tasks: ready ? ready.tasks.map(task => task.title) : tasks, computation, limitation };
});
export const practicesForChapter = (course: string, chapter: string, sectionId?: string) => practiceDefinitions.filter(def =>
  def.sources.some(ref => ref.course === course && ref.chapter === chapter && (!sectionId || ref.sectionIds.includes(sectionId))));
export function practiceHref(id: string, from: 'classics' | 'chinese-reading', course: string, chapter: string, section?: string): string {
  const query = new URLSearchParams({ lab: 'practice', experiment: id, from, course, chapter });
  if (section) query.set('section', section);
  return `?${query}`;
}
