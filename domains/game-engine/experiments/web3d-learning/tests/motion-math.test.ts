import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector2 } from 'three';
import { cameraAt, cameraDirection, dampingAlpha, follow, inputDirection, inspectPick, move, overlaps, pointerNdc, sweepBox, wallMove } from '../src/motion-math.ts';
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const wall = { min: { x: 0, z: -3 }, max: { x: 0.4, z: 3 } };

test('归一化使直走与斜走速度相同；无输入不移动', () => {
  for (const input of [{ x: 1, z: 0 }, { x: 1, z: 1 }]) {
    const position = move({ x: 0, z: 0 }, input, 2, 2); close(Math.hypot(position.x, position.z), 4);
  }
  assert.deepEqual(inputDirection({ x: 0, z: 0 }), { x: 0, z: 0 });
  assert.deepEqual(move({ x: 2, z: 3 }, { x: 0, z: 0 }, 2, 1), { x: 2, z: 3 });
});
test('30、60、120 步每秒，恒定速度两秒都走四单位', () => {
  for (const fps of [30, 60, 120]) {
    let p = { x: 0, z: 0 };
    for (let i = 0; i < fps * 2; i++) p = move(p, { x: 1, z: 0 }, 2, 1 / fps);
    close(p.x, 4); close(p.z, 0);
  }
  assert.throws(() => move({ x: 0, z: 0 }, { x: 1, z: 0 }, 2, -1), RangeError);
});
test('镜头旋转只改变输入方向，不改变速度；前进与右方保持垂直', () => {
  const forward = cameraDirection({ x: 0, z: 1 }, Math.PI / 2), right = cameraDirection({ x: 1, z: 0 }, Math.PI / 2);
  close(forward.x, 1); close(forward.z, 0); close(right.x, 0); close(right.z, -1);
  close(forward.x * right.x + forward.z * right.z, 0);
});
test('指数跟随在静止目标下按时间等效；固定每帧比例会因步数不同而分叉', () => {
  for (const fps of [30, 120]) {
    let camera = 0;
    for (let i = 0; i < fps; i++) camera = follow(camera, 4, 2, 1 / fps);
    close(camera, 4 * (1 - Math.exp(-2)));
  }
  for (const t of [1.25, 2, 4.5, 5]) close(cameraAt(t, 30), cameraAt(t, 120));
  assert.ok(cameraAt(1.25, 120, false) > cameraAt(1.25, 30, false));
  close(dampingAlpha(2, 0), 0); assert.throws(() => dampingAlpha(-1, 1), RangeError);
});
test('浏览器点击减去视口偏移，并把左上 Y 转成 NDC 向上', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };
  assert.deepEqual(pointerNdc(300, 150, rect).toArray(), [0, 0]);
  assert.deepEqual(pointerNdc(100, 50, rect).toArray(), [-1, 1]);
  assert.deepEqual(pointerNdc(500, 250, rect).toArray(), [1, -1]);
  assert.throws(() => pointerNdc(0, 0, { ...rect, width: 0 }), RangeError);
});
test('Three.js 射线按实际距离先命中近箱；侧箱可拾取，空白返回无命中', () => {
  const center = inspectPick(new Vector2(0, 0));
  assert.equal(center.hits[0].name, '近箱'); assert.equal(center.hits[1].name, '远箱');
  assert.ok(center.hits[0].distance < center.hits[1].distance);
  close(center.direction.length(), 1);
  const side = center.boxes.find(box => box.name === '右箱')!;
  assert.equal(inspectPick(new Vector2(side.ndc.x, side.ndc.y)).hits[0].name, '右箱');
  assert.equal(inspectPick(new Vector2(0.88, 0.8)).hits.length, 0);
});
test('扫掠方块在前沿接触墙，不只检查中心；响应可移除法线分量而保留切向', () => {
  const start = { x: -3, z: -1.5 }, delta = { x: 4, z: 2 };
  const stop = wallMove(start, delta, 0.3, wall, false), slide = wallMove(start, delta, 0.3, wall, true);
  close(stop.position.x, -0.3); close(stop.position.z, -0.15);
  close(slide.position.x, -0.3); close(slide.position.z, 0.5);
  close(slide.hit!.time, 0.675); assert.deepEqual(slide.hit!.normal, { x: -1, z: 0 });
  assert.equal(overlaps(slide.position, 0.3, wall), false);
});
test('离散终点会漏掉穿墙；扫掠捕获中途接触，支持贴边离开与无障碍路径', () => {
  const start = { x: -2, z: 0 }, delta = { x: 4, z: 0 };
  assert.equal(overlaps({ x: 2, z: 0 }, 0.3, wall), false);
  close(sweepBox(start, delta, 0.3, wall)!.time, 0.425);
  assert.equal(sweepBox({ x: -0.3, z: 0 }, { x: -1, z: 0 }, 0.3, wall), null);
  assert.equal(sweepBox({ x: -0.3, z: 0 }, { x: 0, z: 1 }, 0.3, wall), null);
  close(sweepBox({ x: -0.3, z: 0 }, { x: 1, z: 0 }, 0.3, wall)!.time, 0);
  assert.equal(sweepBox({ x: -2, z: 4 }, delta, 0.3, wall), null);
  assert.equal(sweepBox({ x: 0.2, z: 0 }, delta, 0.3, wall)!.startingInside, true);
  assert.equal(sweepBox(start, { x: 0, z: 0 }, 0.3, wall), null);
});
