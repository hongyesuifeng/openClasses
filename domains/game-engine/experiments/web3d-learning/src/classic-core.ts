export const lessonIds = ['frame', 'scene', 'projection'] as const;
export type ClassicLessonId = typeof lessonIds[number];
export interface ClassicState {
  version: 1;
  lesson: ClassicLessonId;
  phase: number;
  sceneZ: number;
  follow: boolean;
  projectionZ: number;
  fov: number;
}
export const initialState: ClassicState = {
  version: 1, lesson: 'frame', phase: 0, sceneZ: 0, follow: false, projectionZ: 0, fov: 50,
};
export function isLesson(value: unknown): value is ClassicLessonId {
  return lessonIds.some(id => id === value);
}
function bounded(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
export function restoreState(raw: string | null): ClassicState {
  try {
    const value: unknown = JSON.parse(raw || 'null');
    if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return { ...initialState };
    const saved = value as Record<string, unknown>;
    return {
      version: 1, lesson: isLesson(saved.lesson) ? saved.lesson : 'frame',
      phase: Math.round(bounded(saved.phase, 0, 4, 0)), sceneZ: bounded(saved.sceneZ, 0, 4, 0),
      follow: saved.follow === true, projectionZ: bounded(saved.projectionZ, 0, 6, 0),
      fov: bounded(saved.fov, 35, 80, 50),
    };
  } catch { return { ...initialState }; }
}
export function frameSnapshot(phase: number, input = 1, speed = 5, dt = 0.4) {
  const displacement = input * speed * dt;
  return {
    input: phase >= 1 ? input : 0,
    worldZ: phase >= 2 ? displacement : 0,
    imageZ: phase >= 4 ? displacement : 0,
  };
}
export function sceneSnapshot(carZ: number, follow: boolean) {
  return { worldZ: carZ, imageZ: carZ, cameraZ: -8 + (follow ? carZ : 0) };
}
// Camera height 4 m; fixed orientation toward a point 12 m forward on the road.
// Positive depth means in front of this camera, independent of engine axis conventions.
export function projectPoint(point: readonly [number, number, number], cameraZ: number, fov: number, width: number, height: number) {
  const [x, y, z] = point;
  const norm = Math.hypot(4, 12), forwardY = -4 / norm, forwardZ = 12 / norm;
  const depth = forwardY * (y - 4) + forwardZ * (z - cameraZ);
  if (depth <= 0.1) return null;
  const up = forwardZ * (y - 4) - forwardY * (z - cameraZ);
  const focal = height / (2 * Math.tan(fov * Math.PI / 360));
  return { x: width / 2 + focal * x / depth, y: height / 2 - focal * up / depth, depth };
}
