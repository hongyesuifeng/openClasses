/**
 * Signal - 类型安全的事件信号
 *
 * 用于模块间通信，支持类型推断和自动取消订阅
 */

type Listener<T extends any[]> = (...args: T) => void;

export class Signal<T extends any[] = []> {
  private listeners: Listener<T>[] = [];
  private onceListeners: Listener<T>[] = [];
  private dispatching: boolean = false;
  private pendingRemoves: Set<Listener<T>> = new Set();

  /**
   * 添加监听器
   * @returns 返回取消订阅函数
   */
  on(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => this.off(listener);
  }

  /**
   * 添加一次性监听器
   */
  once(listener: Listener<T>): () => void {
    this.onceListeners.push(listener);
    return () => {
      const index = this.onceListeners.indexOf(listener);
      if (index !== -1) this.onceListeners.splice(index, 1);
    };
  }

  /**
   * 移除监听器
   */
  off(listener: Listener<T>): void {
    if (this.dispatching) {
      this.pendingRemoves.add(listener);
      return;
    }

    let index = this.listeners.indexOf(listener);
    if (index !== -1) this.listeners.splice(index, 1);

    index = this.onceListeners.indexOf(listener);
    if (index !== -1) this.onceListeners.splice(index, 1);
  }

  /**
   * 发射事件
   */
  emit(...args: T): void {
    this.dispatching = true;

    // 普通监听器
    for (const listener of this.listeners) {
      if (this.pendingRemoves.has(listener)) continue;
      try {
        listener(...args);
      } catch (e) {
        console.error('Signal listener error:', e);
      }
    }

    // 一次性监听器
    const onceListeners = this.onceListeners;
    this.onceListeners = [];
    for (const listener of onceListeners) {
      if (this.pendingRemoves.has(listener)) continue;
      try {
        listener(...args);
      } catch (e) {
        console.error('Signal listener error:', e);
      }
    }

    this.dispatching = false;
    this.pendingRemoves.clear();
  }

  /**
   * 移除所有监听器
   */
  clear(): void {
    this.listeners = [];
    this.onceListeners = [];
    this.pendingRemoves.clear();
  }

  /**
   * 监听器数量
   */
  get count(): number {
    return this.listeners.length + this.onceListeners.length;
  }

  /**
   * 是否有监听器
   */
  get hasListeners(): boolean {
    return this.count > 0;
  }
}
