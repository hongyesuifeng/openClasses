import * as THREE from 'three';

export interface GroundPoint { x: number; z: number }
export interface GroundBox { min: GroundPoint; max: GroundPoint }
export interface SweepHit { time: number; normal: GroundPoint; startingInside: boolean }
const finite = (...values: number[]) => {
  if (values.some(value => !Number.isFinite(value))) throw new RangeError('输入必须是有限数值');
};
export function inputDirection(input: GroundPoint): GroundPoint {
  finite(input.x, input.z);
  const length = Math.hypot(input.x, input.z);
  return length === 0 ? { x: 0, z: 0 } : { x: input.x / length, z: input.z / length };
}
export function move(position: GroundPoint, input: GroundPoint, speed: number, dt: number): GroundPoint {
  finite(position.x, position.z, speed, dt);
  if (speed < 0 || dt < 0) throw new RangeError('速度与步长不能为负');
  const direction = inputDirection(input);
  return { x: position.x + direction.x * speed * dt, z: position.z + direction.z * speed * dt };
}
export function cameraDirection(input: GroundPoint, heading: number): GroundPoint {
  finite(heading);
  // 俯视约定：镜头的前方 F=(sinθ,cosθ)，右方 R=(cosθ,-sinθ)。
  return inputDirection({ x: input.x * Math.cos(heading) + input.z * Math.sin(heading), z: -input.x * Math.sin(heading) + input.z * Math.cos(heading) });
}
export function dampingAlpha(lambda: number, dt: number): number {
  finite(lambda, dt);
  if (lambda < 0 || dt < 0) throw new RangeError('响应率与步长不能为负');
  return -Math.expm1(-lambda * dt);
}
export function follow(camera: number, target: number, lambda: number, dt: number): number {
  finite(camera, target);
  return camera + (target - camera) * dampingAlpha(lambda, dt);
}
// 同一时间线，用不同的离散步长计算；目标只在整秒切换，避免比较不同输入。
export function cameraAt(time: number, fps: number, useDelta = true): number {
  finite(time, fps);
  if (time < 0 || fps <= 0) throw new RangeError('时间非负，步数必须为正');
  let camera = 0;
  const steps = Math.floor(time * fps + 1e-9);
  const targetAt = (t: number) => t < 1 ? 0 : t < 4 ? 4 : 0;
  for (let i = 0; i < steps; i++) {
    const target = targetAt(i / fps);
    camera = useDelta ? follow(camera, target, 2, 1 / fps) : camera + (target - camera) * 0.1;
  }
  const remainder = time - steps / fps;
  if (useDelta && remainder > 1e-9) camera = follow(camera, targetAt(steps / fps), 2, remainder);
  return camera;
}
export function overlaps(position: GroundPoint, half: number, box: GroundBox): boolean {
  return position.x + half > box.min.x && position.x - half < box.max.x
    && position.z + half > box.min.z && position.z - half < box.max.z;
}
// 平移的轴对齐方块扫过静态盒：扩大障碍，再检查中心的线段（Minkowski 和）。
export function sweepBox(start: GroundPoint, delta: GroundPoint, half: number, box: GroundBox): SweepHit | null {
  finite(start.x, start.z, delta.x, delta.z, half, box.min.x, box.min.z, box.max.x, box.max.z);
  if (half < 0 || box.min.x >= box.max.x || box.min.z >= box.max.z) throw new RangeError('碰撞盒尺寸无效');
  if (overlaps(start, half, box)) return { time: 0, normal: { x: 0, z: 0 }, startingInside: true };
  let entry = -Infinity, exit = Infinity;
  let normal: GroundPoint = { x: 0, z: 0 };
  for (const axis of ['x', 'z'] as const) {
    const low = box.min[axis] - half, high = box.max[axis] + half;
    if (Math.abs(delta[axis]) < 1e-12) {
      // 贴边且沿边移动，允许滑动；没有向障碍内部运动。
      if (start[axis] <= low || start[axis] >= high) return null;
      continue;
    }
    const first = (low - start[axis]) / delta[axis], last = (high - start[axis]) / delta[axis];
    const near = Math.min(first, last), far = Math.max(first, last);
    if (near > entry) {
      entry = near;
      normal = { x: 0, z: 0 }; normal[axis] = delta[axis] > 0 ? -1 : 1;
    }
    exit = Math.min(exit, far);
  }
  if (entry > exit || exit < 0 || entry < -1e-10 || entry > 1) return null;
  return { time: Math.max(0, entry), normal, startingInside: false };
}
export function wallMove(start: GroundPoint, delta: GroundPoint, half: number, box: GroundBox, slide: boolean) {
  const hit = sweepBox(start, delta, half, box);
  if (!hit) return { position: { x: start.x + delta.x, z: start.z + delta.z }, hit, remaining: { x: 0, z: 0 } };
  if (hit.startingInside) return { position: { ...start }, hit, remaining: { x: 0, z: 0 } };
  const contact = { x: start.x + delta.x * hit.time, z: start.z + delta.z * hit.time };
  // 接触轴吸附到精确边界，避免浮点残差把贴边误判成穿入。
  for (const axis of ['x', 'z'] as const) if (hit.normal[axis] !== 0) contact[axis] = hit.normal[axis] < 0 ? box.min[axis] - half : box.max[axis] + half;
  const remaining = { x: delta.x * (1 - hit.time), z: delta.z * (1 - hit.time) };
  const inward = Math.min(0, remaining.x * hit.normal.x + remaining.z * hit.normal.z);
  const tangent = { x: remaining.x - inward * hit.normal.x, z: remaining.z - inward * hit.normal.z };
  return { position: slide ? { x: contact.x + tangent.x, z: contact.z + tangent.z } : contact, hit, remaining: tangent };
}

export function pointerNdc(x: number, y: number, rect: { left: number; top: number; width: number; height: number }): THREE.Vector2 {
  finite(x, y, rect.left, rect.top, rect.width, rect.height);
  if (rect.width <= 0 || rect.height <= 0) throw new RangeError('视口尺寸必须为正');
  return new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
}
export function inspectPick(ndc: THREE.Vector2) {
  finite(ndc.x, ndc.y);
  const camera = new THREE.PerspectiveCamera(55, 1.2, 0.1, 40);
  camera.position.set(0, 2, 8); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const geometry = new THREE.BoxGeometry(1.5, 2.4, 1.2);
  const material = new THREE.MeshBasicMaterial();
  const objects = [['近箱', 0, 3], ['远箱', 0, -1], ['右箱', 3, 0]].map(([name, x, z]) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = String(name); mesh.position.set(Number(x), 0, Number(z)); mesh.updateMatrixWorld(); return mesh;
  });
  try {
    const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(ndc, camera);
    const intersections = raycaster.intersectObjects(objects, false);
    // 一个盒的两片三角形可能在共有边上产生重复命中；图中每个物体只列一次。
    const seen = new Set<string>();
    const hits = intersections.filter(hit => { if (seen.has(hit.object.name)) return false; seen.add(hit.object.name); return true; })
      .map(hit => ({ name: hit.object.name, distance: hit.distance, point: hit.point.clone() }));
    const boxes = objects.map(mesh => {
      const points: THREE.Vector3[] = [];
      for (const x of [-0.75, 0.75]) for (const y of [-1.2, 1.2]) for (const z of [-0.6, 0.6]) points.push(new THREE.Vector3(x, y, z).add(mesh.position).project(camera));
      return { name: mesh.name, center: mesh.position.clone(), ndc: mesh.position.clone().project(camera), minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)), minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)) };
    });
    return { origin: raycaster.ray.origin.clone(), direction: raycaster.ray.direction.clone(), hits, boxes };
  } finally { geometry.dispose(); material.dispose(); }
}
