/**
 * EventEmitter - 类型安全的事件发射器
 *
 * 支持泛型事件类型，提供 on/off/once/emit 等方法。
 */
export class EventEmitter<EventMap extends Record<string, (...args: any[]) => void>> {
  private listeners: Map<keyof EventMap, Set<(...args: any[]) => void>> = new Map();

  /**
   * 注册事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  on<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * 注册一次性事件监听器
   * @param event 事件名称
   * @param callback 回调函数
   */
  once<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    const wrapper = ((...args: any[]) => {
      this.off(event, wrapper as EventMap[K]);
      callback(...args);
    }) as EventMap[K];
    this.on(event, wrapper);
  }

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param callback 回调函数 (可选，不传则移除该事件所有监听器)
   */
  off<K extends keyof EventMap>(event: K, callback?: EventMap[K]): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(callback);
    }
  }

  /**
   * 触发事件
   * @param event 事件名称
   * @param args 事件参数
   */
  emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      }
    }
  }

  /**
   * 检查是否有监听器
   * @param event 事件名称 (可选)
   */
  hasListeners(event?: keyof EventMap): boolean {
    if (event) {
      const callbacks = this.listeners.get(event);
      return callbacks !== undefined && callbacks.size > 0;
    }
    for (const callbacks of this.listeners.values()) {
      if (callbacks.size > 0) return true;
    }
    return false;
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event?: keyof EventMap): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }
    let count = 0;
    for (const callbacks of this.listeners.values()) {
      count += callbacks.size;
    }
    return count;
  }
}
