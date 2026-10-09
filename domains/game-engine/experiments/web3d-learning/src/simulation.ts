// 练习入口：模拟状态不依赖 Three.js，先算数值，再让视图展示它。
export const DEFAULT_SPEED = 45;
export const MAX_STEP_SECONDS = 0.1;
export const toRadians = (degrees: number) => degrees * Math.PI / 180;
export const toDegrees = (radians: number) => radians * 180 / Math.PI;

export interface Simulation {
  speedDegrees: number;
  simulatedSeconds: number;
  angleRadians: number;
  paused: boolean;
}

export function createSimulation(speedDegrees = DEFAULT_SPEED): Simulation {
  checkSpeed(speedDegrees);
  return { speedDegrees, simulatedSeconds: 0, angleRadians: 0, paused: false };
}

export function checkSpeed(speed: number): void {
  if (!Number.isFinite(speed) || speed < 0 || speed > 180) {
    throw new RangeError('角速度必须是 0 至 180 度／秒。');
  }
}

export function advance(simulation: Simulation, seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError('模拟步长必须是有限的非负秒数。');
  }
  if (simulation.paused) return 0;
  // 实践时重点解释这两行的单位，以及 speed 为 0 时为什么时间仍增加。
  simulation.simulatedSeconds += seconds;
  simulation.angleRadians += toRadians(simulation.speedDegrees) * seconds;
  return seconds;
}

export class FrameClock {
  private previous: number | undefined;

  reset(): void { this.previous = undefined; }

  consume(timestampMs: number): { actualSeconds: number; boundedSeconds: number } {
    const actualSeconds = this.previous === undefined
      ? 0 : Math.max(0, (timestampMs - this.previous) / 1000);
    this.previous = timestampMs;
    return { actualSeconds, boundedSeconds: Math.min(actualSeconds, MAX_STEP_SECONDS) };
  }
}

// 固定输入实验，不代表浏览器真的以该刷新率运行。
export function simulateTwoSeconds(speedDegrees: number, fps: number): Simulation {
  if (!Number.isInteger(fps) || fps < 10) {
    throw new RangeError('固定输入帧率必须是至少 10 的整数。');
  }
  const simulation = createSimulation(speedDegrees);
  for (let frame = 0; frame < fps * 2; frame++) advance(simulation, 1 / fps);
  simulation.paused = true;
  return simulation;
}
