# 节点系统详解

本文档深入分析 Cocos Creator 引擎中最重要的类：`Node`。

## 目录

- [Node 类概述](#node-class-overview)
- [核心属性](#core-properties)
- [层级管理](#hierarchy-management)
- [空间变换](#spatial-transform)
- [世界矩阵计算](#world-matrix-calculation)
- [关键源码解析](#key-source-analysis)

---

## Node 类概述

### 文件位置

- `cocos/scene-graph/node.ts` (~108KB，引擎最大的文件之一)

### 类定义

```typescript
@ccclass('cc.Node')
export class Node extends CCObject implements ISchedulable {
    // ... 2000+ 行代码
}
```

### 继承关系

```
CCObject
    └── Node
          └── Scene
```

---

## 核心属性

### 基本信息

```typescript
@ccclass('cc.Node')
export class Node extends CCObject {
    // 节点名称
    @property
    _name: string = '';

    // 激活状态
    @property
    _active: boolean = true;

    // 层级（32位掩码）
    @property
    _layer: number = Layers.Enum.DEFAULT;

    // 世界坐标不变标志
    _static: boolean = false;
}
```

### 空间变换属性

```typescript
// 本地位置
@property
_lpos: Vec3 = new Vec3();

// 本地旋转（四元数）
@property
_lrot: Quat = new Quat();

// 本地缩放
@property
_lscale: Vec3 = new Vec3(1, 1, 1);

// 世界位置（缓存）
_worldPosition: Vec3 = new Vec3();

// 世界旋转（缓存）
_worldRotation: Quat = new Quat();

// 世界缩放（缓存）
_worldScale: Vec3 = new Vec3(1, 1, 1);

// 世界矩阵
_worldMatrix: Mat4 = new Mat4();

// 脏标志
_transformFlags: number = TransformBit.NONE;
```

### 层级关系

```typescript
// 父节点
_parent: Node | null = null;

// 子节点列表
_children: Node[] = [];

// 组件列表
_components: Component[] = [];
```

---

## 层级管理

### 添加子节点

```typescript
// cocos/scene-graph/node.ts

public addChild (child: Node): void {
    // 1. 检查是否已是子节点
    if (child._parent === this) {
        const index = this._children.indexOf(child);
        if (index !== -1) {
            // 已是子节点，移动到最后
            this._children.splice(index, 1);
            this._children.push(child);
        }
        return;
    }

    // 2. 从原父节点移除
    if (child._parent) {
        child.removeFromParent();
    }

    // 3. 设置父子关系
    child._parent = this;
    this._children.push(child);

    // 4. 更新世界变换
    child._updateWorldTransform();

    // 5. 派发事件
    child.emit(NodeEventType.CHILD_ADDED, child);
    this.emit(NodeEventType.CHILD_REORDER, child);
}

// 移除子节点
public removeChild (child: Node): void {
    const index = this._children.indexOf(child);
    if (index === -1) return;

    // 从列表移除
    this._children.splice(index, 1);

    // 清除父节点
    child._parent = null;

    // 派发事件
    child.emit(NodeEventType.CHILD_REMOVED, child);
}

// 从父节点移除自己
public removeFromParent (): void {
    if (this._parent) {
        this._parent.removeChild(this);
    }
}
```

### 遍历子节点

```typescript
// 获取子节点数量
public get children (): Node[] {
    return this._children;
}

// 按名称查找子节点
public getChildByName (name: string): Node | null {
    for (const child of this._children) {
        if (child.name === name) {
            return child;
        }
    }
    return null;
}

// 按路径查找子节点
public getChildByPath (path: string): Node | null {
    const parts = path.split('/');
    let current: Node | null = this;

    for (const part of parts) {
        current = current!.getChildByName(part);
        if (!current) return null;
    }

    return current;
}
```

---

## 空间变换

### 位置操作

```typescript
// 获取本地位置
public get position (): Vec3 {
    return this._lpos;
}

public set position (value: Vec3) {
    Vec3.copy(this._lpos, value);
    this.invalidateChildren(TransformBit.POSITION);
    this.emit(NodeEventType.TRANSFORM_CHANGED, TransformBit.POSITION);
}

// 获取世界位置
public get worldPosition (): Vec3 {
    this._updateWorldTransform();
    return this._worldPosition;
}

public set worldPosition (value: Vec3) {
    if (this._parent) {
        // 转换为本地坐标
        Mat4.invert(_mat, this._parent._worldMatrix);
        Vec3.transformMat4(this._lpos, value, _mat);
    } else {
        Vec3.copy(this._lpos, value);
    }
    this.invalidateChildren(TransformBit.POSITION);
}

// 设置位置（便捷方法）
public setPosition (x: number, y: number, z?: number): void {
    this._lpos.x = x;
    this._lpos.y = y;
    this._lpos.z = z ?? this._lpos.z;
    this.invalidateChildren(TransformBit.POSITION);
}
```

### 旋转操作

```typescript
// 获取本地旋转（四元数）
public get rotation (): Quat {
    return this._lrot;
}

public set rotation (value: Quat) {
    Quat.copy(this._lrot, value);
    this.invalidateChildren(TransformBit.ROTATION);
}

// 获取欧拉角（度数）
public get eulerAngles (): Vec3 {
    return Quat.toEuler(new Vec3(), this._lrot);
}

public set eulerAngles (value: Vec3) {
    Quat.fromEuler(this._lrot, value.x, value.y, value.z);
    this.invalidateChildren(TransformBit.ROTATION);
}

// 绕轴旋转
public rotate (rotation: Quat, ns?: NodeSpace): void {
    if (ns === NodeSpace.WORLD && this._parent) {
        // 世界空间旋转
        const worldRot = this.worldRotation;
        Quat.multiply(this._lrot, rotation, worldRot);
        Quat.invert(_quat, this._parent.worldRotation);
        Quat.multiply(this._lrot, _quat, this._lrot);
    } else {
        // 本地空间旋转
        Quat.multiply(this._lrot, this._lrot, rotation);
    }
    this.invalidateChildren(TransformBit.ROTATION);
}
```

### 缩放操作

```typescript
public get scale (): Vec3 {
    return this._lscale;
}

public set scale (value: Vec3) {
    Vec3.copy(this._lscale, value);
    this.invalidateChildren(TransformBit.SCALE);
}

public setScale (x: number, y?: number, z?: number): void {
    this._lscale.x = x;
    this._lscale.y = y ?? x;
    this._lscale.z = z ?? x;
    this.invalidateChildren(TransformBit.SCALE);
}
```

---

## 世界矩阵计算

### 脏标志系统

```typescript
// cocos/scene-graph/node-enum.ts

export const enum TransformBit {
    NONE = 0,
    POSITION = 1 << 0,
    ROTATION = 1 << 1,
    SCALE = 1 << 2,
    RS = ROTATION | SCALE,
    TRS = POSITION | ROTATION | SCALE,
    TR = POSITION | ROTATION,
    TS = POSITION | SCALE,
    WORLD = 1 << 3,
}
```

### 标记子节点脏

```typescript
protected invalidateChildren (dirtyBit: TransformBit): void {
    // 设置自己的脏标志
    this._transformFlags |= dirtyBit;

    // 递归标记所有子节点
    for (const child of this._children) {
        child._transformFlags |= TransformBit.WORLD;
        child.invalidateChildren(TransformBit.WORLD);
    }
}
```

### 更新世界变换

```typescript
protected _updateWorldTransform (): void {
    if (!(this._transformFlags & TransformBit.WORLD)) {
        return;  // 不脏，无需更新
    }

    if (this._parent) {
        // 有父节点：组合变换
        const parent = this._parent;

        // 确保父节点先更新
        parent._updateWorldTransform();

        // 计算世界矩阵
        Mat4.fromRTS(_mat, this._lrot, this._lpos, this._lscale);
        Mat4.multiply(this._worldMatrix, parent._worldMatrix, _mat);

        // 计算世界旋转
        Quat.multiply(this._worldRotation, parent._worldRotation, this._lrot);

        // 计算世界缩放
        Vec3.multiply(this._worldScale, parent._worldScale, this._lscale);

        // 计算世界位置
        Vec3.transformMat4(this._worldPosition, this._lpos, parent._worldMatrix);
    } else {
        // 无父节点：本地即世界
        Mat4.fromRTS(this._worldMatrix, this._lrot, this._lpos, this._lscale);
        Vec3.copy(this._worldPosition, this._lpos);
        Quat.copy(this._worldRotation, this._lrot);
        Vec3.copy(this._worldScale, this._lscale);
    }

    // 清除脏标志
    this._transformFlags &= ~TransformBit.WORLD;
}
```

---

## 关键源码解析

### 节点激活

```typescript
public get active (): boolean {
    return this._active;
}

public set active (value: boolean) {
    if (this._active === value) return;

    this._active = value;

    // 检查父节点是否激活
    const parentActive = this._parent ? this._parent.activeInHierarchy : true;

    if (parentActive) {
        // 状态改变，需要更新层级
        if (value) {
            this._onActiveInHierarchy();
        } else {
            this._onDeactiveInHierarchy();
        }
    }

    // 派发事件
    this.emit(NodeEventType.ACTIVE_CHANGED, this);
}

// 在层级中激活
protected _onActiveInHierarchy (): void {
    // 1. 激活所有组件
    for (const comp of this._components) {
        if (comp.enabled) {
            comp._onEnabled();
        }
    }

    // 2. 递归激活子节点
    for (const child of this._children) {
        if (child._active) {
            child._onActiveInHierarchy();
        }
    }
}
```

### 坐标转换

```typescript
// 世界坐标转本地坐标
public inverseTransformPoint (out: Vec3, worldPos: Vec3): Vec3 {
    this._updateWorldTransform();
    Mat4.invert(_mat, this._worldMatrix);
    Vec3.transformMat4(out, worldPos, _mat);
    return out;
}

// 获取向上方向
public get up (): Vec3 {
    const rot = this.worldRotation;
    Vec3.transformQuat(_v3, Vec3.UNIT_Y, rot);
    return _v3;
}

// 获取向前方向
public get forward (): Vec3 {
    const rot = this.worldRotation;
    Vec3.transformQuat(_v3, Vec3.UNIT_Z, rot);
    return _v3;
}
```

---

## 性能优化

### 1. 脏标志避免重复计算

```typescript
// ✅ 只有脏了才计算
if (this._transformFlags & TransformBit.WORLD) {
    this._updateWorldTransform();
}
```

### 2. 缓存临时变量

```typescript
// 模块级别的临时变量，避免每帧创建
const _mat = new Mat4();
const _v3 = new Vec3();
const _quat = new Quat();
```

### 3. 批量设置属性

```typescript
// ❌ 每次设置都会触发更新
node.position = new Vec3(1, 2, 3);
node.eulerAngles = new Vec3(0, 90, 0);
node.scale = new Vec3(2, 2, 2);

// ✅ 使用便捷方法批量设置
node.setPosition(1, 2, 3);
node.setRotationFromEuler(0, 90, 0);
node.setScale(2, 2, 2);
```

---

## 下一步

继续学习 [02-组件系统](./02-component-system.md)。
