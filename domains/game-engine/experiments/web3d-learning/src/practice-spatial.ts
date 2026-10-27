import type { PracticeRecord, PracticeValue } from './practice-types.ts';
import { escapeHtml as esc } from './workbench.ts';

const fmt = (value: number) => Number(value.toPrecision(5)).toString();
const triple = (value: PracticeValue) => (value as number[]).map(fmt).join(', ');
interface Series { label: string; points: number[][]; color: string; arrows?: boolean }
const green = '#20846c', orange = '#c17536', gray = '#8e9fa5';
export function spatialStepCount(output: PracticeRecord): number {
  const rows = output.cameraPositions ?? output.frames ?? output.forces ?? output.cameraPoints ?? output.projected;
  return Array.isArray(rows) ? rows.length : 1;
}
function views(series: Series[], title: string): string {
  const max = Math.max(1, ...series.flatMap(row => row.points.flatMap(point => point.map(Math.abs))));
  const scale = 96 / max;
  return `<p>${esc(title)} · 两幅正交坐标图，共用比例；数值见下表。</p>` + [[0, 1, 'XY'], [0, 2, 'XZ']].map(([a, b, label]) => {
    const x = (p: number[]) => 280 + p[Number(a)] * scale;
    const y = (p: number[]) => 125 - p[Number(b)] * scale;
    return `<svg viewBox="0 0 560 250" role="img" aria-label="${label} 坐标图，来自你的实际返回值"><path d="M20 125H535M280 20V230" fill="none" stroke="#d1ddd7"/><text x="510" y="148">X</text><text x="290" y="28">${label === 'XY' ? 'Y' : 'Z'}</text>${series.map((row, i) => `<text x="18" y="${24 + i * 20}" fill="${row.color}" font-size="12">${esc(row.label)}</text>${row.arrows ? row.points.map(point => `<line x1="280" y1="125" x2="${x(point)}" y2="${y(point)}" stroke="${row.color}" stroke-width="2"/>`).join('') : `<polyline points="${row.points.map(p => `${x(p)},${y(p)}`).join(' ')}" stroke="${row.color}" fill="none" stroke-width="2"/>`}${row.points.map((point, j) => `<circle cx="${x(point)}" cy="${y(point)}" r="${j === row.points.length - 1 ? 6 : 3}" fill="${row.color}"/>`).join('')}`).join('')}</svg>`;
  }).join('');
}
function table(headings: string[], rows: string[][], cursor = -1): string {
  return `<div class="practice-table-scroll"><table><thead><tr>${headings.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((row, i) => `<tr ${i === cursor ? 'aria-current="step"' : ''}>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
/** Called only after task output validation; the oracle is never used to draw the learner result. */
export function renderSpatialPractice(id: string, output: PracticeRecord, input: PracticeRecord, cursor: number): string {
  if (id === '01') {
    const series: Series[] = [];
    const rows: string[][] = [];
    if (Object.hasOwn(output, 'displacement')) {
      series.push({ label: '你的位移', points: [output.displacement as number[]], color: green, arrows: true });
      if (output.direction !== null) series.push({ label: '你的单位方向', points: [output.direction as number[]], color: orange, arrows: true });
      rows.push(['位移', triple(output.displacement)], ['长度', fmt(Number(output.length))], ['单位方向', output.direction === null ? '未定义（null）' : triple(output.direction)]);
    } else if (Object.hasOwn(output, 'projection')) {
      series.push({ label: '输入 a / b', points: [input.a as number[], input.b as number[]], color: gray, arrows: true });
      if (output.projection !== null) series.push({ label: '你的投影向量', points: [output.projection as number[]], color: green, arrows: true });
      rows.push(['点积', fmt(Number(output.dot))], ['夹角余弦', output.cosine === null ? '未定义（null）' : fmt(Number(output.cosine))], ['a 在 b 上的投影', output.projection === null ? '参考轴未定义（null）' : triple(output.projection)]);
    } else {
      series.push({ label: '输入 a / b', points: [input.a as number[], input.b as number[]], color: gray, arrows: true }, { label: '你的 a×b', points: [output.cross as number[]], color: green, arrows: true });
      rows.push(['叉积', triple(output.cross)], ['平行四边形面积', fmt(Number(output.area))]);
    }
    return `<p>实际输入 a=(${esc(triple(input.a))})，b=(${esc(triple(input.b))})。</p>` + views(series, '线段由原点指向向量终点，圆点标出终点') + table(['量', '你的结果'], rows);
  }
  if (id === '06') {
    const points = output.cameraPositions as number[][], players = input.positions as number[][];
    return views([{ label: '输入玩家轨迹', points: players.slice(0, cursor + 1), color: gray }, { label: '你的相机轨迹', points: points.slice(0, cursor + 1), color: green }], `第 ${cursor + 1} 帧（输入快照）`) + `<p>本帧玩家 (${esc(triple(players[cursor]))}) → 你的相机 (${esc(triple(points[cursor]))})</p><p>实际位置差：(${esc(triple(points[cursor].map((v, i) => v - players[cursor][i])))})</p>` + table(['帧', '玩家输入', '你的相机'], points.map((p, i) => [String(i + 1), triple(players[i]), triple(p)]), cursor);
  }
  if (id === '05') {
    if (Array.isArray(output.frames)) {
      const frames = output.frames as PracticeRecord[];
      const positions = frames.map(row => row.position as number[]);
      const steps = input.steps as PracticeRecord[];
      return views([{ label: '你的驾驶轨迹', points: [input.position as number[], ...positions.slice(0, cursor + 1)], color: green }], `第 ${cursor + 1} 步 · 你的车头角 ${fmt(Number(frames[cursor].yaw))}°`) + table(['步', '水平 / 纵向 / 秒', '你的位置', '车头角°'], frames.map((row, i) => [String(i + 1), `${steps[i].horizontal} / ${steps[i].vertical} / ${steps[i].dt}`, triple(row.position), fmt(Number(row.yaw))]), cursor);
    }
    const forces = output.forces as number[][], steps = input.steps as PracticeRecord[];
    return views([{ label: '本步输入焦点 forward', points: [steps[cursor].forward as number[]], color: gray, arrows: true }, { label: '你的施力请求', points: [forces[cursor]], color: green, arrows: true }], `第 ${cursor + 1} 步 · 纵向输入 ${String(steps[cursor].vertical)}`) + '<p>力指令的单位与方向不是物体位置；本图不积分速度或位移。</p>' + table(['步', '焦点 forward', '输入幅度', '你的力指令'], forces.map((p, i) => [String(i + 1), triple(steps[i].forward), String(steps[i].vertical), triple(p)]), cursor);
  }
  if (Array.isArray(output.cameraPoints)) {
    const points = output.cameraPoints as number[][], world = input.points as number[][];
    return views([{ label: '你的相机坐标点', points: [points[cursor]], color: green }], `第 ${cursor + 1} 个点 · 相机坐标系（前方为-Z）`) + table(['点', '世界输入坐标', '你的相机坐标'], points.map((p, i) => [String(i + 1), triple(world[i]), triple(p)]), cursor);
  }
  const projected = output.projected as PracticeRecord[], world = input.points as number[][];
  const regions: Record<string, string> = { inside: '视域内', outside: '视域外', behind: '相机后方', undefined: '无法定义（w=0）' };
  // Fixed NDC domain: out-of-frame points remain in the table instead of rescaling the canonical square.
  const order = projected.map((_, i) => i).filter(i => i !== cursor).concat(cursor);
  const marks = order.map(i => {
    const row = projected[i];
    if (row.ndc === null) return '';
    const [x, y] = row.ndc as number[];
    if (Math.abs(x) > 1.5 || Math.abs(y) > 1.2) return '';
    return `<circle cx="${280 + x * 100}" cy="${140 - y * 100}" r="${i === cursor ? 8 : 4}" fill="${row.region === 'inside' ? green : orange}"/>${i === cursor ? `<text x="${289 + x * 100}" y="${134 - y * 100}" font-size="12">${i + 1}</text>` : ''}`;
  }).join('');
  return `<svg viewBox="0 0 560 280" role="img" aria-label="你的规范坐标XY投影，方框为负一到一"><rect x="180" y="40" width="200" height="200" fill="none" stroke="#99b7a7"/><path d="M110 140H450M280 10V265" stroke="#d1ddd7"/><text x="390" y="237">+1 X</text><text x="288" y="30">+1 Y</text>${marks}</svg><p>框内为XY的[-1,1]²；颜色来自你的分类，正确性由独立基准判断。超出图框的点与w=0结果保留在表中。重合圆点用回放编号区分。</p>` + table(['点', '相机输入坐标', '你的NDC', 'w', '你的分类'], projected.map((row, i) => [String(i + 1), triple(world[i]), row.ndc === null ? 'null：无法除法' : triple(row.ndc), fmt(Number(row.w)), regions[String(row.region)] ?? String(row.region)]), cursor);
}
