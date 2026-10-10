import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectProjection, inspectTransform, inspectVectors, matrixRows, type ProjectionInput, type TransformInput } from '../src/space-math.ts';

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const coordinates = (actual: { x: number; y: number; z: number }, expected: number[]) => {
  close(actual.x, expected[0]); close(actual.y, expected[1]); close(actual.z, expected[2]);
};
const transform: TransformInput = { translation: [2, 0, 0], scale: [1, 1, 1], axis: 'z', degrees: 90, order: 'TRS', child: [1, 0, 0] };
const projection: ProjectionInput = { point: [0, 0, 0], translation: [0, 0, 0], distance: 8, kind: 'perspective', fov: 60, near: 1, far: 20, width: 800, height: 400 };

test('两点平移不改变 3-4-5 位移、距离与单位方向', () => {
  for (const offset of [0, 7]) {
    const result = inspectVectors([1 + offset, 2 + offset, 0], [4 + offset, 6 + offset, 0], [1, 0, 0]);
    coordinates(result.displacement, [3, 4, 0]); close(result.length, 5);
    assert.ok(result.unit); coordinates(result.unit, [0.6, 0.8, 0]); close(result.cosine!, 0.6);
  }
});

test('非单位向量的点积不是余弦，交换叉积输入使方向反转', () => {
  const result = inspectVectors([0, 0, 0], [2, 0, 0], [0, 3, 0]);
  close(result.dot, 0); close(result.angleDegrees!, 90); coordinates(result.cross, [0, 0, 6]);
  coordinates(inspectVectors([0, 0, 0], [0, 3, 0], [2, 0, 0]).cross, [0, 0, -6]);
  const parallel = inspectVectors([0, 0, 0], [2, 0, 0], [3, 0, 0]);
  close(parallel.dot, 6); close(parallel.cosine!, 1); coordinates(parallel.cross, [0, 0, 0]);
  close(inspectVectors([0, 0, 0], [1, 0, 0], [-1, 0, 0]).angleDegrees!, 180);
});

test('重合点或零参考向量没有夹角，不能冒充单位方向', () => {
  const zero = inspectVectors([1, 2, 3], [1, 2, 3], [1, 0, 0]);
  assert.equal(zero.unit, null); assert.equal(zero.angleDegrees, null); close(zero.length, 0);
  assert.equal(inspectVectors([0, 0, 0], [1, 0, 0], [0, 0, 0]).cosine, null);
});

test('先绕 Z 转 90° 后平移，与先平移后旋转得到不同的世界位置', () => {
  const trs = inspectTransform(transform);
  coordinates(trs.world, [2, 1, 0]); coordinates(trs.recovered!, [1, 0, 0]);
  coordinates(inspectTransform({ ...transform, order: 'RTS' }).world, [0, 3, 0]);
  coordinates(trs.direction, [0, 1, 0]); // 平移不会加在 w=0 的方向上。
  close(trs.quaternion.z, Math.SQRT1_2); close(trs.quaternion.w, Math.SQRT1_2);
  close(matrixRows(trs.parentMatrix)[0][3], 2); // 检查面板没有误转置。
});

test('非均匀缩放可回到局部，零缩放必须拒绝逆变换', () => {
  const scaled = inspectTransform({ ...transform, scale: [2, 3, -1], child: [1, 2, 3] });
  coordinates(scaled.world, [-4, 2, -3]); coordinates(scaled.recovered!, [1, 2, 3]);
  const singular = inspectTransform({ ...transform, scale: [0, 1, 1] });
  assert.equal(singular.recovered, null); close(singular.determinant, 0);
});

test('原点落在屏幕中心，屏幕 Y 轴向下，clip.w 是正的相机距离', () => {
  const result = inspectProjection(projection);
  close(result.clip.w, 8); close(result.screen!.x, 400); close(result.screen!.y, 200); assert.equal(result.visible, true);
  assert.ok(inspectProjection({ ...projection, point: [0, 1, 0] }).screen!.y < 200);
  coordinates(inspectProjection({ ...projection, translation: [1, 2, 0] }).world, [1, 2, 0]);
});

test('透视的偏移随距离变小，正交投影的偏移不随距离变化', () => {
  const near = inspectProjection({ ...projection, point: [1, 0, 0] });
  const far = inspectProjection({ ...projection, point: [1, 0, -8] });
  close(near.ndc!.x, far.ndc!.x * 2);
  const orthographic = { ...projection, kind: 'orthographic' as const, point: [1, 0, 0] as [number, number, number] };
  close(inspectProjection(orthographic).ndc!.x, inspectProjection({ ...orthographic, point: [1, 0, -8] }).ndc!.x);
});

test('WebGL 的 near/far 对应 NDC -1/+1，范围外、后方和 w=0 要区分', () => {
  close(inspectProjection({ ...projection, point: [0, 0, 7] }).ndc!.z, -1);
  close(inspectProjection({ ...projection, point: [0, 0, -12] }).ndc!.z, 1);
  assert.equal(inspectProjection({ ...projection, point: [0, 0, 7.5] }).visible, false);
  assert.equal(inspectProjection({ ...projection, point: [0, 0, 9] }).status, '位于相机平面或后方');
  const plane = inspectProjection({ ...projection, point: [0, 0, 8] });
  assert.equal(plane.ndc, null); assert.equal(plane.screen, null); assert.equal(plane.visible, false);
  assert.equal(inspectProjection({ ...projection, point: [10, 0, 7] }).visible, false);
});

test('投影尺寸改变时重新计算 aspect；非法裁剪范围不污染结果', () => {
  const horizontal = inspectProjection({ ...projection, point: [1, 0, 0] });
  const square = inspectProjection({ ...projection, point: [1, 0, 0], width: 400 });
  close(square.ndc!.x, horizontal.ndc!.x * 2);
  assert.throws(() => inspectProjection({ ...projection, far: 0.5 }), RangeError);
  assert.throws(() => inspectProjection({ ...projection, width: 0 }), RangeError);
});
