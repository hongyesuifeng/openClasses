import { Matrix4, OrthographicCamera, PerspectiveCamera, Quaternion, Vector3, Vector4 } from 'three';

export type Triple = [number, number, number];
export type SpaceMode = 'vectors' | 'transforms' | 'projection';
export const EPSILON = 1e-10;
export const vector = (v: Triple): Vector3 => new Vector3(...v);
export const triple = (v: Vector3): Triple => [v.x, v.y, v.z];

export function inspectVectors(a: Triple, b: Triple, reference: Triple) {
  const displacement = vector(b).sub(vector(a));
  const length = displacement.length();
  const v = vector(reference);
  const referenceLength = v.length();
  const dot = displacement.dot(v);
  // 零向量没有方向。库返回零值也不能代表一个单位方向。
  const unit = length > 0 ? displacement.clone().divideScalar(length) : null;
  const cosine = unit && referenceLength > 0
    ? Math.max(-1, Math.min(1, unit.dot(v.clone().divideScalar(referenceLength)))) : null;
  return {
    displacement, length, unit, dot, referenceLength,
    cross: displacement.clone().cross(v), cosine,
    angleDegrees: cosine === null ? null : Math.acos(cosine) * 180 / Math.PI,
  };
}

export interface TransformInput {
  translation: Triple;
  scale: Triple;
  axis: 'x' | 'y' | 'z';
  degrees: number;
  order: 'TRS' | 'RTS';
  child: Triple;
}

export function inspectTransform(input: TransformInput) {
  const axis = new Vector3(input.axis === 'x' ? 1 : 0, input.axis === 'y' ? 1 : 0, input.axis === 'z' ? 1 : 0);
  const quaternion = new Quaternion().setFromAxisAngle(axis, input.degrees * Math.PI / 180);
  const t = new Matrix4().makeTranslation(...input.translation);
  const r = new Matrix4().makeRotationFromQuaternion(quaternion);
  const s = new Matrix4().makeScale(...input.scale);
  // 列向量约定：最右侧的变换先作用。
  const parentMatrix = input.order === 'TRS' ? t.clone().multiply(r).multiply(s) : r.clone().multiply(t).multiply(s);
  const childMatrix = new Matrix4().makeTranslation(...input.child);
  const worldMatrix = parentMatrix.clone().multiply(childMatrix);
  const world = new Vector3().setFromMatrixPosition(worldMatrix);
  const determinant = parentMatrix.determinant();
  const recovered = Math.abs(determinant) > EPSILON ? world.clone().applyMatrix4(parentMatrix.clone().invert()) : null;
  // 使用 w=0，只变换方向向量，不加平移，也不自动归一化。
  const direction = new Vector4(1, 0, 0, 0).applyMatrix4(parentMatrix);
  return { parentMatrix, childMatrix, worldMatrix, world, recovered, determinant, quaternion, direction };
}

export interface ProjectionInput {
  point: Triple;
  translation: Triple;
  distance: number;
  kind: 'perspective' | 'orthographic';
  fov: number;
  near: number;
  far: number;
  width: number;
  height: number;
}

export function inspectProjection(input: ProjectionInput) {
  if (!(input.width > 0 && input.height > 0 && input.distance > 0 && input.near > 0 && input.far > input.near && input.fov > 0 && input.fov < 180)) {
    throw new RangeError('要求：尺寸、相机距离和 near 为正，far > near，0 < FOV < 180。');
  }
  const aspect = input.width / input.height;
  const camera = input.kind === 'perspective'
    ? new PerspectiveCamera(input.fov, aspect, input.near, input.far)
    : new OrthographicCamera(-3 * aspect, 3 * aspect, 3, -3, input.near, input.far);
  camera.position.set(0, 0, input.distance);
  camera.updateMatrixWorld(true);
  const modelMatrix = new Matrix4().makeTranslation(...input.translation);
  const local = new Vector4(...input.point, 1);
  const world = local.clone().applyMatrix4(modelMatrix);
  const view = world.clone().applyMatrix4(camera.matrixWorldInverse);
  // 保留 clip.w，不能用隐含透视除法的 Vector3.applyMatrix4 替代这一段。
  const clip = view.clone().applyMatrix4(camera.projectionMatrix);
  const ndc = Math.abs(clip.w) > EPSILON ? new Vector3(clip.x / clip.w, clip.y / clip.w, clip.z / clip.w) : null;
  const visible = ndc !== null && clip.w > 0 && ndc.toArray().every(n => n >= -1 - EPSILON && n <= 1 + EPSILON);
  const screen = ndc ? { x: (ndc.x + 1) * input.width / 2, y: (1 - ndc.y) * input.height / 2 } : null;
  const status = ndc === null ? 'w≈0，无法进行透视除法'
    : view.z >= 0 ? '位于相机平面或后方'
    : visible ? '在裁剪范围内' : '超出裁剪范围';
  return { camera, modelMatrix, local, world, view, clip, ndc, screen, visible, status };
}

export function matrixRows(matrix: Matrix4): number[][] {
  // Matrix4.elements 为列优先存储；面板按行展示，乘法仍用列向量。
  return Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => matrix.elements[column * 4 + row]));
}
