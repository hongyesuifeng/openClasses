// Cocos Creator 引擎的 Jest mock
// 只模拟业务逻辑文件中用到的最小接口

export const ccclass = () => (target: any) => target;
export const property = () => () => {};
export const component = () => (target: any) => target;

export class Component {
  node: any = { name: 'mock' };
  onLoad() {}
  onEnable() {}
  onDisable() {}
  onDestroy() {}
}

export class Node {
  name: string = '';
  active: boolean = true;
  addComponent(cls: any) { return new cls(); }
  getComponent(cls: any) { return null; }
  destroy() {}
}

export const director = {
  loadScene: (name: string, cb?: Function) => { if (cb) cb(); },
  getScene: () => null,
  on: () => {},
  off: () => {},
};

export const game = {
  addPersistRootNode: (node: any) => {},
  removePersistRootNode: (node: any) => {},
};

export class EventTarget {
  private _listeners: Map<string, Function[]> = new Map();
  on(event: string, cb: Function) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event)!.push(cb);
  }
  off(event: string, cb: Function) {
    const arr = this._listeners.get(event);
    if (arr) {
      const i = arr.indexOf(cb);
      if (i >= 0) arr.splice(i, 1);
    }
  }
  emit(event: string, ...args: any[]) {
    const arr = this._listeners.get(event);
    if (arr) arr.forEach(cb => cb(...args));
  }
}

export const sys = {
  localStorage: {
    _store: {} as Record<string, string>,
    getItem(key: string) { return this._store[key] ?? null; },
    setItem(key: string, value: string) { this._store[key] = value; },
    removeItem(key: string) { delete this._store[key]; },
  }
};

export default {
  ccclass, property, component,
  Component, Node, director, game, EventTarget, sys
};
