import type { PracticeRecord, PracticeTask, PracticeValue } from './practice-types.ts';

export const practiceCodeHelp = '答案就是下方深色代码框里的代码。直接修改带 TODO 的规则，再点击“运行当前条件”；不需要另填数字答案。';
export const practiceParameterHelp = '右侧参数用于换条件验证，不是作答位置；下方个人解释可选填写。';

/** One presentation for all tasks; older tasks remain usable without a new template. */
export function practiceGuidanceRows(task: PracticeTask): { label: string; text: string }[] {
  const guidance = task.guidance;
  if (!guidance) return [{ label: '你要修改', text: task.question }];
  return [
    { label: '给定条件', text: guidance.given },
    { label: '初始错误', text: guidance.issue },
    { label: '你要修改', text: guidance.edit },
    { label: '运行后观察', text: guidance.observe },
    ...(guidance.terms ? [{ label: '本题符号', text: guidance.terms }] : []),
  ];
}

const formatValue = (value: unknown): string => {
  const text = JSON.stringify(value);
  if (text === undefined) return '缺失';
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
};
function atPath(value: PracticeValue, path: string): unknown {
  let current: unknown = value;
  for (const part of path.match(/[A-Za-z_]\w*|\d+/g) ?? []) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
const eventLabels: Record<string, string> = { start: '开始', restart: '重玩', schedule: '登记生成', spawn: '生成回调', click: '点击', miss: '漏接', end: '结束' };
const fields: Record<string, string> = {
  phase: '阶段', score: '分数', targets: '场上目标数', targetIds: '场上目标标识', session: '本局标识',
  interval: '生成间隔', baseInterval: '基础生成间隔', pending: '待生成数', pendingIds: '待生成票据',
};
const vectorFieldLabels: Record<string, string> = { displacement: '从 A 到 B 的位移', direction: '单位方向', projection: 'a 在 b 上的投影', cross: 'a×b 叉积', length: '位移长度', dot: '点积', cosine: '夹角余弦', area: '平行四边形面积' };
const component = (axis: string | undefined): string => axis === undefined ? '坐标' : `${['x', 'y', 'z'][Number(axis)] ?? '未知'} 分量`;

/** Describe the actual comparator path; do not invent a diagnosis or a reference result. */
export function explainPracticeDifference(experimentId: string, rawMessage: string, expected: PracticeValue, actual: PracticeValue, input: PracticeRecord): string {
  const match = /^output((?:\.[A-Za-z_]\w*|\[\d+\])*)/.exec(rawMessage);
  if (!match) return rawMessage;
  const path = match[1];
  let label = '';
  let item = /^\.(displacement|direction|projection|cross|length|dot|cosine|area)(?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '01' && item) label = `${vectorFieldLabels[item[1]]}${item[2] === undefined ? '' : `的 ${component(item[2])}`}`;
  item = /^\.cameraPoints\[(\d+)\](?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '03' && item) label = `第 ${Number(item[1]) + 1} 个点的相机${component(item[2])}`;
  item = /^\.projected\[(\d+)\](?:\.(ndc|w|region))?(?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '03' && item) {
    const field = item[2] === 'ndc' ? `规范${component(item[3])}` : item[2] === 'w' ? '齐次 w' : item[2] === 'region' ? '视域分类' : '投影结果';
    label = `第 ${Number(item[1]) + 1} 个点的${field}`;
  }
  item = /^\.frames\[(\d+)\](?:\.(position|yaw))?(?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '05' && item) label = `第 ${Number(item[1]) + 1} 步驾驶后的${item[2] === 'yaw' ? '车头角度（度）' : item[2] === 'position' ? `位置${component(item[3])}` : '状态'}`;
  item = /^\.forces\[(\d+)\](?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '05' && item) label = `第 ${Number(item[1]) + 1} 步施力指令的${item[2] === undefined ? '向量' : component(item[2])}`;
  item = /^\.cameraPositions\[(\d+)\](?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '06' && item) label = `第 ${Number(item[1]) + 1} 帧相机位置的${component(item[2])}`;
  item = /^\.points\[(\d+)\](?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '02' && item) {
    const index = Number(item[1]), component = item[2] === undefined ? '坐标' : ['x', 'y', 'w'][Number(item[2])] ?? '分量';
    const point = Array.isArray(input.points) ? input.points[index] : null;
    const kind = Array.isArray(point) && point[2] === 0 ? '方向' : '点';
    label = `第 ${index + 1} 个${kind}的 ${component}`;
  }
  item = /^\.(positions|times)\[(\d+)\]$/.exec(path);
  if (experimentId === '04' && item) {
    const index = Number(item[2]);
    label = `${index === 0 ? '初始状态' : `第 ${index} 步${Array.isArray(input.paused) && input.paused[index - 1] === true ? '（暂停）' : ''}`}的${item[1] === 'positions' ? '位置' : '有效模拟时间（秒）'}`;
  }
  item = /^\.(coverage|hits|sampleX)\[(\d+)\](?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '09' && item) {
    label = `像素 ${item[2]} 的${item[1] === 'coverage' ? '采样覆盖率' : item[1] === 'hits' ? '采样命中数' : item[3] === undefined ? '采样位置列表' : `第 ${Number(item[3]) + 1} 个采样位置`}`;
  }
  item = /^\.states\[(\d+)\](?:\.([A-Za-z_]\w*))?(?:\[(\d+)\])?$/.exec(path);
  if (experimentId === '31' && item) {
    const index = Number(item[1]);
    const event = Array.isArray(input.events) ? input.events[index] as PracticeRecord | undefined : undefined;
    const eventName = event ? eventLabels[String(event.type)] ?? String(event.type) : '';
    label = `第 ${index + 1} 个事件${event ? `「${eventName} · ${String(event.id)}」` : ''}后的${fields[item[2]] ?? item[2] ?? '状态'}${item[3] === undefined ? '' : `（第 ${Number(item[3]) + 1} 项）`}`;
  }
  if (!label) return rawMessage;
  const suffix = rawMessage.includes('数组长度不同') ? '列表长度或内容不同' : '存在差异';
  return `${label}${suffix}：你的结果 ${formatValue(atPath(actual, path))}；独立基准 ${formatValue(atPath(expected, path))}。`;
}
