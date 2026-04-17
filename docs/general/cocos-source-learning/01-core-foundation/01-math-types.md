# 数学库与值类型

本文档详细介绍 Cocos Creator 引擎的数学库实现。

## 目录

- [向量系统](#向量系统)
- [矩阵系统](#矩阵系统)
- [四元数](#quaternion)
- [颜色系统](#color-system)
- [CCObject 基类](#ccobject-base-class)
- [技术原理](#technical-principles)

---

## 向量系统

### 核心文件

- `cocos/core/math/vec2.ts` - 二维向量
- `cocos/core/math/vec3.ts` - 三维向量 (~15KB)
- `cocos/core/math/vec4.ts` - 四维向量

### Vec3 源码解析

```typescript
// cocos/core/math/vec3.ts

export class Vec3 implements IVec3Like {
    // 静态常量
    public static readonly ZERO = Object.freeze(new Vec3(0, 0, 0));
    public static readonly ONE = Object.freeze(new Vec3(1, 1, 1));
    public static readonly UNIT_X = Object.freeze(new Vec3(1, 0, 0));
    public static readonly UNIT_Y = Object.freeze(new Vec3(0, 1, 0));
    public static readonly UNIT_Z = Object.freeze(new Vec3(0, 0, 1));

    // 分量
    public x: number;
    public y: number;
    public z: number;

    // 构造函数
    constructor (x?: number, y?: number, z?: number) {
        this.x = x === undefined ? 0 : x;
        this.y = y === undefined ? 0 : y;
        this.z = z === undefined ? 0 : z;
    }

    // 向量加法（实例方法）
    public add (other: Vec3): Vec3 {
        this.x += other.x;
        this.y += other.y;
        this.z += other.z;
        return this;
    }

    // 向量减法
    public subtract (other: Vec3): Vec3 {
        this.x -= other.x;
        this.y -= other.y;
        this.z -= other.z;
        return this;
    }

    // 向量乘法（标量）
    public multiplyScalar (scalar: number): Vec3 {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    // 向量长度
    public length (): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    // 归一化
    public normalize (): Vec3 {
        const len = this.length();
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    // 点积
    public static dot (a: Vec3, b: Vec3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    // 叉积
    public static cross (out: Vec3, a: Vec3, b: Vec3): Vec3 {
        const ax = a.x; const ay = a.y; const az = a.z;
        const bx = b.x; const by = b.y; const bz = b.z;
        out.x = ay * bz - az * by;
        out.y = az * bx - ax * bz;
        out.z = ax * by - ay * bx;
        return out;
    }

    // 线性插值
    public static lerp (out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
        out.x = a.x + t * (b.x - a.x);
        out.y = a.y + t * (b.y - a.y);
        out.z = a.z + t * (b.z - a.z);
        return out;
    }
}
```

### 设计特点

1. **实例方法 vs 静态方法**
   - 实例方法修改自身：`v.add(other)`
   - 静态方法输出到参数：`Vec3.add(out, a, b)`

2. **链式调用**
   ```typescript
   v.add(a).multiplyScalar(2).normalize();
   ```

3. **避免内存分配**
   ```typescript
   // ❌ 每次创建新对象（性能差）
   const result = new Vec3().add(a);

   // ✅ 复用对象（性能好）
   Vec3.add(out, a, b);
   ```

---

## 矩阵系统

### 核心文件

- `cocos/core/math/mat3.ts` - 3x3 矩阵
- `cocos/core/math/mat4.ts` - 4x4 矩阵 (~20KB)

### Mat4 源码解析

```typescript
// cocos/core/math/mat4.ts

export class Mat4 {
    // 列主序存储（与 WebGL 一致）
    public m00: number; public m01: number; public m02: number; public m03: number;
    public m04: number; public m05: number; public m06: number; public m07: number;
    public m08: number; public m09: number; public m10: number; public m11: number;
    public m12: number; public m13: number; public m14: number; public m15: number;

    // 单位矩阵
    public static identity (out: Mat4): Mat4 {
        out.m00 = 1; out.m01 = 0; out.m02 = 0; out.m03 = 0;
        out.m04 = 0; out.m05 = 1; out.m06 = 0; out.m07 = 0;
        out.m08 = 0; out.m09 = 0; out.m10 = 1; out.m11 = 0;
        out.m12 = 0; out.m13 = 0; out.m14 = 0; out.m15 = 1;
        return out;
    }

    // 平移矩阵
    public static fromTranslation (out: Mat4, v: Vec3): Mat4 {
        out.m00 = 1; out.m01 = 0; out.m02 = 0; out.m03 = 0;
        out.m04 = 0; out.m05 = 1; out.m06 = 0; out.m07 = 0;
        out.m08 = 0; out.m09 = 0; out.m10 = 1; out.m11 = 0;
        out.m12 = v.x; out.m13 = v.y; out.m14 = v.z; out.m15 = 1;
        return out;
    }

    // 旋转矩阵（四元数）
    public static fromQuat (out: Mat4, q: Quat): Mat4 {
        const x = q.x; const y = q.y; const z = q.z; const w = q.w;
        const x2 = x + x; const y2 = y + y; const z2 = z + z;
        // ... 旋转矩阵计算
        return out;
    }

    // 缩放矩阵
    public static fromScaling (out: Mat4, v: Vec3): Mat4 {
        out.m00 = v.x; out.m01 = 0; out.m02 = 0; out.m03 = 0;
        out.m04 = 0; out.m05 = v.y; out.m06 = 0; out.m07 = 0;
        out.m08 = 0; out.m09 = 0; out.m10 = v.z; out.m11 = 0;
        out.m12 = 0; out.m13 = 0; out.m14 = 0; out.m15 = 1;
        return out;
    }

    // 矩阵乘法
    public static multiply (out: Mat4, a: Mat4, b: Mat4): Mat4 {
        // ... 矩阵乘法实现
        return out;
    }

    // TRS 变换（平移-旋转-缩放）
    public static fromRTS (out: Mat4, q: Quat, v: Vec3, s: Vec3): Mat4 {
        // 组合平移、旋转、缩放
        return out;
    }

    // 逆矩阵
    public static invert (out: Mat4, a: Mat4): Mat4 {
        // ... 逆矩阵计算
        return out;
    }
}
```

### 矩阵在引擎中的应用

```typescript
// 节点的世界变换矩阵
// cocos/scene-graph/node.ts

protected _updateWorldMatrix (): void {
    // 本地矩阵 = TRS
    Mat4.fromRTS(this._mat, this._lrot, this._lpos, this._lscale);

    // 世界矩阵 = 父节点世界矩阵 × 本地矩阵
    if (this._parent) {
        Mat4.multiply(this._worldMatrix, this._parent._worldMatrix, this._mat);
    }
}
```

---

## 四元数

### 核心文件

- `cocos/core/math/quat.ts` (~12KB)

### 基本概念

四元数用于表示 3D 旋转，相比欧拉角：
- ✅ 避免万向节锁
- ✅ 插值更平滑
- ✅ 计算效率更高

### Quat 源码解析

```typescript
// cocos/core/math/quat.ts

export class Quat {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    // 单位四元数（无旋转）
    public static identity (out: Quat): Quat {
        out.x = 0; out.y = 0; out.z = 0; out.w = 1;
        return out;
    }

    // 从欧拉角创建
    public static fromEuler (out: Quat, x: number, y: number, z: number): Quat {
        const halfToRad = 0.5 * Math.PI / 180.0;
        x *= halfToRad; y *= halfToRad; z *= halfToRad;
        // ... 欧拉角转四元数
        return out;
    }

    // 从旋转轴和角度创建
    public static fromAxisAngle (out: Quat, axis: Vec3, rad: number): Quat {
        rad *= 0.5;
        const s = Math.sin(rad);
        out.x = s * axis.x;
        out.y = s * axis.y;
        out.z = s * axis.z;
        out.w = Math.cos(rad);
        return out;
    }

    // 球面线性插值（SLERP）
    public static slerp (out: Quat, a: Quat, b: Quat, t: number): Quat {
        // ... SLERP 实现
        return out;
    }

    // 四元数乘法（组合旋转）
    public static multiply (out: Quat, a: Quat, b: Quat): Quat {
        // ... 四元数乘法
        return out;
    }
}
```

---

## 颜色系统

### 核心文件

- `cocos/core/math/color.ts`

### Color 源码解析

```typescript
// cocos/core/math/color.ts

export class Color {
    // RGBA 分量（0-255）
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    // 常用颜色
    public static readonly WHITE = new Color(255, 255, 255, 255);
    public static readonly BLACK = new Color(0, 0, 0, 255);
    public static readonly RED = new Color(255, 0, 0, 255);
    public static readonly GREEN = new Color(0, 255, 0, 255);
    public static readonly BLUE = new Color(0, 0, 255, 255);
    public static readonly TRANSPARENT = new Color(0, 0, 0, 0);

    // 转换为十六进制
    public toHEX (): string {
        return (
            (this.r << 24 | this.g << 16 | this.b << 8 | this.a).toString(16)
        );
    }

    // 从十六进制创建
    public static fromHEX (out: Color, hex: string): Color {
        // ... 解析十六进制
        return out;
    }

    // RGB 转 HSV
    public static toHSV (out: IVec3Like, color: Color): IVec3Like {
        // ... 转换逻辑
        return out;
    }

    // HSV 转 RGB
    public static fromHSV (out: Color, h: number, s: number, v: number): Color {
        // ... 转换逻辑
        return out;
    }
}
```

---

## CCObject 基类

### 核心文件

- `cocos/core/data/object.ts`

### 源码解析

```typescript
// cocos/core/data/object.ts

@ccclass('CCObject')
export class CCObject {
    // 引用计数
    private _ref: number = 0;

    // 对象标志
    private _objFlags: number = 0;

    // 名称
    public get name (): string {
        return this._name;
    }
    public set name (value: string) {
        this._name = value;
    }

    // 是否有效
    public get isValid (): boolean {
        return !(this._objFlags & CCObjectFlags.Destroyed);
    }

    // 销毁
    public destroy (): void {
        if (this._objFlags & CCObjectFlags.Destroyed) {
            return;
        }
        this._objFlags |= CCObjectFlags.Destroyed;
        // 加入销毁队列
        deferredDestroy.push(this);
    }

    // 引用计数增加
    public addRef (): CCObject {
        this._ref++;
        return this;
    }

    // 引用计数减少
    public decRef (): CCObject {
        this._ref--;
        if (this._ref === 0) {
            this.destroy();
        }
        return this;
    }
}

// 对象标志位
export const enum CCObjectFlags {
    Destroyed = 1 << 0,
    DontDestroy = 1 << 1,
    Deactivating = 1 << 2,
    // ...
}
```

---

## 技术原理

### 1. 列主序存储

矩阵使用列主序存储，与 WebGL/OpenGL 一致：

```
| m00 m04 m08 m12 |     内存布局：m00, m01, m02, m03, m04, ...
| m01 m05 m09 m13 |
| m02 m06 m10 m14 |
| m03 m07 m11 m15 |
```

### 2. 避免内存分配

在性能关键代码中，避免创建新对象：

```typescript
// ❌ 每帧创建新向量（GC 压力）
update(dt: number) {
    const dir = new Vec3(1, 0, 0);
    Vec3.normalize(dir, dir);
}

// ✅ 复用临时变量
private _tempDir = new Vec3();
update(dt: number) {
    Vec3.set(this._tempDir, 1, 0, 0);
    Vec3.normalize(this._tempDir, this._tempDir);
}
```

### 3. 浮点数精度

引擎使用 `EPSILON` 常量处理浮点数比较：

```typescript
const EPSILON = 1e-6;

function approx(a: number, b: number): boolean {
    return Math.abs(a - b) < EPSILON;
}
```

---

## 下一步

继续学习 [02-事件系统](./02-event-system.md)。
