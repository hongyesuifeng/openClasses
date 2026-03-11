/**
 * 系统基类
 */

import { World } from './world.js';

export abstract class System {
  protected world!: World;

  // 系统优先级 (数字越小越先执行)
  priority: number = 0;

  // 是否启用
  enabled: boolean = true;

  // 系统名称
  get name(): string {
    return this.constructor.name;
  }

  /**
   * 初始化 (添加到 World 时调用)
   */
  init(world: World): void {
    this.world = world;
  }

  /**
   * 每帧更新
   */
  abstract update(dt: number): void;

  /**
   * 固定时间步长更新 (用于物理)
   */
  fixedUpdate?(dt: number): void;

  /**
   * 销毁
   */
  destroy?(): void;

  /**
   * 创建查询
   */
  protected createQuery(options: { all?: any[]; any?: any[]; none?: any[] }) {
    return this.world.createQuery(options);
  }
}
