/**
 * Time - 时间管理类
 *
 * 管理游戏时间、帧时间、时间缩放等。
 */
export class Time {
  /** 上一帧的时间戳 (毫秒) */
  private lastTime: number = 0;

  /** 累计时间 */
  private _totalTime: number = 0;

  /** 帧间隔时间 (秒) */
  private _deltaTime: number = 0;

  /** 时间缩放 (1.0 = 正常, 0.5 = 半速, 2.0 = 两倍速) */
  timeScale: number = 1.0;

  /** 固定时间步长 (秒) */
  fixedDeltaTime: number = 1 / 60;

  /** 累加器 (用于固定时间步长) */
  accumulator: number = 0;

  /** 帧计数 */
  private _frameCount: number = 0;

  /** FPS 计算用 */
  private fpsAccumulator: number = 0;
  private fpsFrameCount: number = 0;
  private _fps: number = 0;

  /**
   * 更新时间状态 (在每帧开始时调用)
   * @param timestamp 当前时间戳 (performance.now() 或 requestAnimationFrame 参数)
   */
  update(timestamp: number): number {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return 0;
    }

    const elapsed = (timestamp - this.lastTime) / 1000; // 转换为秒
    this.lastTime = timestamp;

    this._deltaTime = elapsed * this.timeScale;
    this._totalTime += this._deltaTime;
    this._frameCount++;

    // 固定时间步长累加
    this.accumulator += this._deltaTime;

    // FPS 计算
    this.fpsAccumulator += elapsed;
    this.fpsFrameCount++;
    if (this.fpsAccumulator >= 1.0) {
      this._fps = this.fpsFrameCount / this.fpsAccumulator;
      this.fpsAccumulator = 0;
      this.fpsFrameCount = 0;
    }

    return this._deltaTime;
  }

  /** 帧间隔时间 (秒，已应用 timeScale) */
  get deltaTime(): number {
    return this._deltaTime;
  }

  /** 未缩放的帧间隔时间 (秒) */
  get unscaledDeltaTime(): number {
    return this._deltaTime / this.timeScale;
  }

  /** 累计游戏时间 (秒) */
  get totalTime(): number {
    return this._totalTime;
  }

  /** 帧计数 */
  get frameCount(): number {
    return this._frameCount;
  }

  /** 当前 FPS */
  get fps(): number {
    return this._fps;
  }

  /**
   * 重置时间状态
   */
  reset(): void {
    this.lastTime = 0;
    this._totalTime = 0;
    this._deltaTime = 0;
    this.accumulator = 0;
    this._frameCount = 0;
    this.fpsAccumulator = 0;
    this.fpsFrameCount = 0;
    this._fps = 0;
  }

  /**
   * 暂停时间流逝
   */
  pause(): void {
    this.timeScale = 0;
  }

  /**
   * 恢复时间流逝
   * @param scale 时间缩放 (默认 1.0)
   */
  resume(scale: number = 1.0): void {
    this.timeScale = scale;
  }
}

/**
 * Clock - 计时器
 *
 * 用于测量特定代码块的执行时间。
 */
export class Clock {
  private startTime: number = 0;
  private _elapsed: number = 0;
  private _running: boolean = false;

  /**
   * 开始计时
   */
  start(): void {
    this.startTime = performance.now();
    this._running = true;
  }

  /**
   * 停止计时
   */
  stop(): number {
    if (this._running) {
      this._elapsed = performance.now() - this.startTime;
      this._running = false;
    }
    return this._elapsed;
  }

  /**
   * 重置计时器
   */
  reset(): void {
    this.startTime = 0;
    this._elapsed = 0;
    this._running = false;
  }

  /**
   * 重新开始计时
   */
  restart(): void {
    this.reset();
    this.start();
  }

  /**
   * 获取经过的时间 (毫秒)
   */
  get elapsed(): number {
    if (this._running) {
      return performance.now() - this.startTime;
    }
    return this._elapsed;
  }

  /**
   * 获取经过的时间 (秒)
   */
  get elapsedSeconds(): number {
    return this.elapsed / 1000;
  }

  /**
   * 是否正在运行
   */
  get running(): boolean {
    return this._running;
  }
}
