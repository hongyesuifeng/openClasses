/**
 * ObjectPool - 对象池
 *
 * 复用对象以减少 GC 压力，适用于频繁创建销毁的场景
 */

export interface Poolable {
  reset(): void;
}

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    resetFn: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // 预热池
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 从池中获取对象
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /**
   * 将对象归还到池中
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  /**
   * 预热池
   */
  warmup(count: number): void {
    const toAdd = Math.min(count, this.maxSize - this.pool.length);
    for (let i = 0; i < toAdd; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool = [];
  }

  /**
   * 当前池大小
   */
  get size(): number {
    return this.pool.length;
  }

  /**
   * 可用数量
   */
  get available(): number {
    return this.pool.length;
  }
}

/**
 * 简单对象池 (用于基本类型)
 */
export class SimplePool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, initialSize: number = 10, maxSize: number = 100) {
    this.factory = factory;
    this.maxSize = maxSize;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  get(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  get size(): number {
    return this.pool.length;
  }
}

// 常用对象池
export class Vec2Pool extends ObjectPool<{ x: number; y: number }> {
  constructor(initialSize: number = 100) {
    super(
      () => ({ x: 0, y: 0 }),
      (v) => { v.x = 0; v.y = 0; },
      initialSize,
      1000
    );
  }
}
