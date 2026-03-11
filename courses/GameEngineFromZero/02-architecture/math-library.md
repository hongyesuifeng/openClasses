# 数学库设计 (@nova/math)

## 概述

数学库是游戏引擎的基础设施，为渲染、物理、动画等所有系统提供数学运算支持。设计目标是高性能、类型安全和易用性。

## 设计原则

1. **性能优先**: 使用 Float32Array 存储，避免对象创建
2. **不可变 vs 可变**: 提供两种 API 风格
3. **链式调用**: 支持流畅的 API 设计
4. **类型安全**: 完整的 TypeScript 类型定义

## 核心类型

### Vec2 - 二维向量

```typescript
// vec2.ts
export class Vec2 {
  // 存储方式：Float32Array (适合 WebGL 传参)
  private _data: Float32Array;

  // 静态常量 (避免重复创建)
  static readonly ZERO = Object.freeze(new Vec2(0, 0));
  static readonly ONE = Object.freeze(new Vec2(1, 1));
  static readonly UP = Object.freeze(new Vec2(0, -1));    // Y向下为正
  static readonly DOWN = Object.freeze(new Vec2(0, 1));
  static readonly LEFT = Object.freeze(new Vec2(-1, 0));
  static readonly RIGHT = Object.freeze(new Vec2(1, 0));

  constructor(x: number = 0, y: number = 0) {
    this._data = new Float32Array([x, y]);
  }

  // 属性访问
  get x(): number { return this._data[0]; }
  set x(value: number) { this._data[0] = value; }

  get y(): number { return this._data[1]; }
  set y(value: number) { this._data[1] = value; }

  // 用于 WebGL 的原始数据
  get data(): Float32Array { return this._data; }

  // 基础运算 (返回新实例)
  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mul(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  div(scalar: number): Vec2 {
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  // 向量运算
  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vec2): number {
    // 2D 叉积返回标量 (z 分量)
    return this.x * v.y - this.y * v.x;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return Vec2.ZERO;
    return this.div(len);
  }

  // 距离计算
  distanceTo(v: Vec2): number {
    return this.sub(v).length();
  }

  distanceToSquared(v: Vec2): number {
    return this.sub(v).lengthSquared();
  }

  // 角度计算
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  angleTo(v: Vec2): number {
    return Math.atan2(v.y - this.y, v.x - this.x);
  }

  // 线性插值
  lerp(target: Vec2, t: number): Vec2 {
    return new Vec2(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t
    );
  }

  // 旋转
  rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  // 垂直向量
  perpendicular(): Vec2 {
    return new Vec2(-this.y, this.x);
  }

  // 反射
  reflect(normal: Vec2): Vec2 {
    const d = 2 * this.dot(normal);
    return this.sub(normal.mul(d));
  }

  // 克隆
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  // 复制
  copyFrom(v: Vec2): this {
    this._data[0] = v.x;
    this._data[1] = v.y;
    return this;
  }

  // 设置值
  set(x: number, y: number): this {
    this._data[0] = x;
    this._data[1] = y;
    return this;
  }

  // 相等判断
  equals(v: Vec2, epsilon: number = 1e-6): boolean {
    return Math.abs(this.x - v.x) < epsilon &&
           Math.abs(this.y - v.y) < epsilon;
  }

  // 字符串
  toString(): string {
    return `Vec2(${this.x.toFixed(4)}, ${this.y.toFixed(4)})`;
  }

  // 静态工厂方法
  static fromAngle(angle: number, length: number = 1): Vec2 {
    return new Vec2(
      Math.cos(angle) * length,
      Math.sin(angle) * length
    );
  }

  static fromArray(arr: number[] | Float32Array): Vec2 {
    return new Vec2(arr[0], arr[1]);
  }

  static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
    return a.lerp(b, t);
  }

  static distance(a: Vec2, b: Vec2): number {
    return a.distanceTo(b);
  }

  static min(a: Vec2, b: Vec2): Vec2 {
    return new Vec2(Math.min(a.x, b.x), Math.min(a.y, b.y));
  }

  static max(a: Vec2, b: Vec2): Vec2 {
    return new Vec2(Math.max(a.x, b.x), Math.max(a.y, b.y));
  }
}
```

### Vec3 - 三维向量

```typescript
// vec3.ts
export class Vec3 {
  private _data: Float32Array;

  static readonly ZERO = Object.freeze(new Vec3(0, 0, 0));
  static readonly ONE = Object.freeze(new Vec3(1, 1, 1));
  static readonly UP = Object.freeze(new Vec3(0, 1, 0));
  static readonly DOWN = Object.freeze(new Vec3(0, -1, 0));
  static readonly FORWARD = Object.freeze(new Vec3(0, 0, -1)); // -Z 朝前
  static readonly BACK = Object.freeze(new Vec3(0, 0, 1));

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this._data = new Float32Array([x, y, z]);
  }

  get x(): number { return this._data[0]; }
  set x(value: number) { this._data[0] = value; }
  get y(): number { return this._data[1]; }
  set y(value: number) { this._data[1] = value; }
  get z(): number { return this._data[2]; }
  set z(value: number) { this._data[2] = value; }
  get data(): Float32Array { return this._data; }

  // 与 Vec2 的转换
  get xy(): Vec2 { return new Vec2(this.x, this.y); }
  get xz(): Vec2 { return new Vec2(this.x, this.z); }

  // 基础运算 (与 Vec2 类似，增加 z 分量)
  add(v: Vec3): Vec3 { /* ... */ }
  sub(v: Vec3): Vec3 { /* ... */ }
  mul(scalar: number): Vec3 { /* ... */ }

  // 3D 特有运算
  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  // 与 Vec2 转换
  toVec2(): Vec2 { return new Vec2(this.x, this.y); }

  static fromVec2(v: Vec2, z: number = 0): Vec3 {
    return new Vec3(v.x, v.y, z);
  }
}
```

### Vec4 - 四维向量

```typescript
// vec4.ts
export class Vec4 {
  private _data: Float32Array;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this._data = new Float32Array([x, y, z, w]);
  }

  // 齐次坐标支持
  get w(): number { return this._data[3]; }
  set w(value: number) { this._data[3] = value; }

  // 颜色表示
  static fromRGBA(r: number, g: number, b: number, a: number = 1): Vec4 {
    return new Vec4(r / 255, g / 255, b / 255, a);
  }

  // 转换为 WebGL uniform
  toUniform(): Float32Array { return this._data; }
}
```

### Mat4 - 4x4 矩阵

```typescript
// mat4.ts
export class Mat4 {
  // 列主序存储 (OpenGL 约定)
  private _data: Float32Array;

  static readonly IDENTITY = Object.freeze(Mat4.identity());

  constructor() {
    this._data = new Float32Array(16);
    this.identity();
  }

  get data(): Float32Array { return this._data; }

  // 索引访问 (列主序)
  at(row: number, col: number): number {
    return this._data[col * 4 + row];
  }

  setAt(row: number, col: number, value: number): void {
    this._data[col * 4 + row] = value;
  }

  // 单位矩阵
  identity(): this {
    this._data.fill(0);
    this._data[0] = 1;  // m00
    this._data[5] = 1;  // m11
    this._data[10] = 1; // m22
    this._data[15] = 1; // m33
    return this;
  }

  // 平移
  translate(x: number, y: number, z: number): this {
    this._data[12] += this._data[0] * x + this._data[4] * y + this._data[8] * z;
    this._data[13] += this._data[1] * x + this._data[5] * y + this._data[9] * z;
    this._data[14] += this._data[2] * x + this._data[6] * y + this._data[10] * z;
    this._data[15] += this._data[3] * x + this._data[7] * y + this._data[11] * z;
    return this;
  }

  // 缩放
  scale(x: number, y: number, z: number): this {
    this._data[0] *= x;
    this._data[1] *= x;
    this._data[2] *= x;
    this._data[3] *= x;
    this._data[4] *= y;
    this._data[5] *= y;
    this._data[6] *= y;
    this._data[7] *= y;
    this._data[8] *= z;
    this._data[9] *= z;
    this._data[10] *= z;
    this._data[11] *= z;
    return this;
  }

  // 旋转 (绕轴)
  rotateX(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    // ... 旋转矩阵乘法
    return this;
  }

  rotateY(angle: number): this { /* ... */ }
  rotateZ(angle: number): this { /* ... */ }
  rotateAxis(axis: Vec3, angle: number): this { /* ... */ }

  // 矩阵乘法
  multiply(m: Mat4): Mat4 {
    const result = new Mat4();
    const a = this._data;
    const b = m._data;
    const r = result._data;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        r[j * 4 + i] =
          a[i] * b[j * 4] +
          a[4 + i] * b[j * 4 + 1] +
          a[8 + i] * b[j * 4 + 2] +
          a[12 + i] * b[j * 4 + 3];
      }
    }
    return result;
  }

  // 向量变换
  transformPoint(v: Vec3): Vec3 { /* ... */ }
  transformVector(v: Vec3): Vec3 { /* ... */ }
  transformDirection(v: Vec3): Vec3 { /* ... */ }

  // 逆矩阵
  invert(): Mat4 { /* ... */ }

  // 转置
  transpose(): Mat4 {
    const result = new Mat4();
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result._data[j * 4 + i] = this._data[i * 4 + j];
      }
    }
    return result;
  }

  // 视图矩阵 (lookAt)
  static lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const z = eye.sub(target).normalize(); // 相机朝向 -Z
    const x = up.cross(z).normalize();
    const y = z.cross(x);

    const result = new Mat4();
    result._data[0] = x.x; result._data[1] = y.x; result._data[2] = z.x;
    result._data[4] = x.y; result._data[5] = y.y; result._data[6] = z.y;
    result._data[8] = x.z; result._data[9] = y.z; result._data[10] = z.z;
    result._data[12] = -x.dot(eye);
    result._data[13] = -y.dot(eye);
    result._data[14] = -z.dot(eye);
    result._data[15] = 1;
    return result;
  }

  // 透视投影
  static perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1.0 / Math.tan(fovY / 2);
    const nf = 1 / (near - far);

    const result = new Mat4();
    result._data.fill(0);
    result._data[0] = f / aspect;
    result._data[5] = f;
    result._data[10] = (far + near) * nf;
    result._data[11] = -1;
    result._data[14] = 2 * far * near * nf;
    return result;
  }

  // 正交投影
  static orthographic(left: number, right: number, bottom: number, top: number,
                      near: number, far: number): Mat4 {
    const result = new Mat4();
    result._data[0] = 2 / (right - left);
    result._data[5] = 2 / (top - bottom);
    result._data[10] = -2 / (far - near);
    result._data[12] = -(right + left) / (right - left);
    result._data[13] = -(top + bottom) / (top - bottom);
    result._data[14] = -(far + near) / (far - near);
    return result;
  }

  // TRS (Translation-Rotation-Scale) 矩阵
  static TRS(translation: Vec3, rotation: Quaternion, scale: Vec3): Mat4 { /* ... */ }

  // 克隆
  clone(): Mat4 {
    const result = new Mat4();
    result._data.set(this._data);
    return result;
  }

  // 复制
  copyFrom(m: Mat4): this {
    this._data.set(m._data);
    return this;
  }
}
```

### Quaternion - 四元数

```typescript
// quaternion.ts
export class Quaternion {
  private _data: Float32Array; // [x, y, z, w]

  static readonly IDENTITY = Object.freeze(new Quaternion(0, 0, 0, 1));

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this._data = new Float32Array([x, y, z, w]);
  }

  get x(): number { return this._data[0]; }
  get y(): number { return this._data[1]; }
  get z(): number { return this._data[2]; }
  get w(): number { return this._data[3]; }
  get data(): Float32Array { return this._data; }

  // 欧拉角转换 (ZYX 顺序)
  static fromEuler(x: number, y: number, z: number): Quaternion {
    const cx = Math.cos(x / 2), sx = Math.sin(x / 2);
    const cy = Math.cos(y / 2), sy = Math.sin(y / 2);
    const cz = Math.cos(z / 2), sz = Math.sin(z / 2);

    return new Quaternion(
      sx * cy * cz - cx * sy * sz,
      cx * sy * cz + sx * cy * sz,
      cx * cy * sz - sx * sy * cz,
      cx * cy * cz + sx * sy * sz
    );
  }

  toEuler(): Vec3 { /* ... */ }

  // 轴角转换
  static fromAxisAngle(axis: Vec3, angle: number): Quaternion {
    const half = angle / 2;
    const s = Math.sin(half);
    const normalized = axis.normalize();
    return new Quaternion(
      normalized.x * s,
      normalized.y * s,
      normalized.z * s,
      Math.cos(half)
    );
  }

  // 两个向量之间的旋转
  static fromToRotation(from: Vec3, to: Vec3): Quaternion { /* ... */ }

  // 基础运算
  multiply(q: Quaternion): Quaternion { /* ... */ }

  // 归一化
  normalize(): Quaternion {
    const len = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
    return new Quaternion(
      this.x / len, this.y / len, this.z / len, this.w / len
    );
  }

  // 共轭
  conjugate(): Quaternion {
    return new Quaternion(-this.x, -this.y, -this.z, this.w);
  }

  // 逆
  inverse(): Quaternion { /* ... */ }

  // 球面插值
  slerp(target: Quaternion, t: number): Quaternion {
    let dot = this.x * target.x + this.y * target.y +
              this.z * target.z + this.w * target.w;

    // 确保最短路径
    if (dot < 0) {
      dot = -dot;
      target = new Quaternion(-target.x, -target.y, -target.z, -target.w);
    }

    if (dot > 0.9995) {
      // 线性插值 (接近时)
      return new Quaternion(
        this.x + t * (target.x - this.x),
        this.y + t * (target.y - this.y),
        this.z + t * (target.z - this.z),
        this.w + t * (target.w - this.w)
      ).normalize();
    }

    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);

    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return new Quaternion(
      s0 * this.x + s1 * target.x,
      s0 * this.y + s1 * target.y,
      s0 * this.z + s1 * target.z,
      s0 * this.w + s1 * target.w
    );
  }

  // 向量旋转
  rotateVector(v: Vec3): Vec3 {
    const qv = new Quaternion(v.x, v.y, v.z, 0);
    const result = this.multiply(qv).multiply(this.conjugate());
    return new Vec3(result.x, result.y, result.z);
  }

  // 转换为矩阵
  toMatrix(): Mat4 { /* ... */ }
}
```

## 辅助类型

### Color - 颜色

```typescript
// color.ts
export class Color {
  private _data: Float32Array; // [r, g, b, a] 范围 0-1

  static readonly WHITE = Object.freeze(new Color(1, 1, 1, 1));
  static readonly BLACK = Object.freeze(new Color(0, 0, 0, 1));
  static readonly RED = Object.freeze(new Color(1, 0, 0, 1));
  static readonly GREEN = Object.freeze(new Color(0, 1, 0, 1));
  static readonly BLUE = Object.freeze(new Color(0, 0, 1, 1));
  static readonly TRANSPARENT = Object.freeze(new Color(0, 0, 0, 0));

  constructor(r: number = 0, g: number = 0, b: number = 0, a: number = 1) {
    this._data = new Float32Array([r, g, b, a]);
  }

  get r(): number { return this._data[0]; }
  get g(): number { return this._data[1]; }
  get b(): number { return this._data[2]; }
  get a(): number { return this._data[3]; }

  // 从十六进制创建
  static fromHex(hex: number): Color {
    return new Color(
      ((hex >> 16) & 0xFF) / 255,
      ((hex >> 8) & 0xFF) / 255,
      (hex & 0xFF) / 255,
      1
    );
  }

  // 从 CSS 字符串创建
  static fromCSS(css: string): Color {
    // 支持 #RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba()
    // ...
  }

  // 转换为十六进制
  toHex(): number {
    return (Math.round(this.r * 255) << 16) |
           (Math.round(this.g * 255) << 8) |
           Math.round(this.b * 255);
  }

  // 转换为 CSS 字符串
  toCSS(): string {
    return `rgba(${Math.round(this.r * 255)}, ${Math.round(this.g * 255)}, ` +
           `${Math.round(this.b * 255)}, ${this.a})`;
  }

  // 线性插值
  lerp(target: Color, t: number): Color {
    return new Color(
      this.r + (target.r - this.r) * t,
      this.g + (target.g - this.g) * t,
      this.b + (target.b - this.b) * t,
      this.a + (target.a - this.a) * t
    );
  }

  // HSL 转换
  static fromHSL(h: number, s: number, l: number, a: number = 1): Color { /* ... */ }
  toHSL(): { h: number; s: number; l: number } { /* ... */ }
}
```

### Rect - 矩形区域

```typescript
// rect.ts
export class Rect {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0
  ) {}

  get left(): number { return this.x; }
  get right(): number { return this.x + this.width; }
  get top(): number { return this.y; }
  get bottom(): number { return this.y + this.height; }
  get centerX(): number { return this.x + this.width / 2; }
  get centerY(): number { return this.y + this.height / 2; }

  contains(x: number, y: number): boolean {
    return x >= this.left && x <= this.right &&
           y >= this.top && y <= this.bottom;
  }

  containsRect(rect: Rect): boolean { /* ... */ }
  intersects(rect: Rect): boolean { /* ... */ }
  intersection(rect: Rect): Rect | null { /* ... */ }
  union(rect: Rect): Rect { /* ... */ }

  // 空间变换
  translate(dx: number, dy: number): Rect {
    return new Rect(this.x + dx, this.y + dy, this.width, this.height);
  }

  inflate(dx: number, dy: number): Rect {
    return new Rect(
      this.x - dx, this.y - dy,
      this.width + dx * 2, this.height + dy * 2
    );
  }
}
```

### AABB - 轴对齐包围盒

```typescript
// aabb.ts
export class AABB {
  constructor(
    public min: Vec3 = new Vec3(),
    public max: Vec3 = new Vec3()
  ) {}

  get center(): Vec3 {
    return this.min.add(this.max).mul(0.5);
  }

  get extents(): Vec3 {
    return this.max.sub(this.min).mul(0.5);
  }

  get size(): Vec3 {
    return this.max.sub(this.min);
  }

  // 点包含
  contains(point: Vec3): boolean {
    return point.x >= this.min.x && point.x <= this.max.x &&
           point.y >= this.min.y && point.y <= this.max.y &&
           point.z >= this.min.z && point.z <= this.max.z;
  }

  // 盒子相交
  intersects(other: AABB): boolean {
    return this.min.x <= other.max.x && this.max.x >= other.min.x &&
           this.min.y <= other.max.y && this.max.y >= other.min.y &&
           this.min.z <= other.max.z && this.max.z >= other.min.z;
  }

  // 合并
  merge(other: AABB): AABB {
    return new AABB(
      Vec3.min(this.min, other.min),
      Vec3.max(this.max, other.max)
    );
  }

  // 扩展以包含点
  expand(point: Vec3): AABB {
    return new AABB(
      Vec3.min(this.min, point),
      Vec3.max(this.max, point)
    );
  }

  // 2D 版本
  static fromRect(rect: Rect): AABB {
    return new AABB(
      new Vec3(rect.x, rect.y, 0),
      new Vec3(rect.x + rect.width, rect.y + rect.height, 0)
    );
  }
}
```

## 工具函数

### 数学常量

```typescript
// constants.ts
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const EPSILON = 1e-6;
export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;
```

### 工具函数

```typescript
// utils.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function degToRad(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

export function radToDeg(radians: number): number {
  return radians * RAD_TO_DEG;
}

export function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0 && value !== 0;
}

export function nextPowerOfTwo(value: number): number {
  value--;
  value |= value >> 1;
  value |= value >> 2;
  value |= value >> 4;
  value |= value >> 8;
  value |= value >> 16;
  return value + 1;
}
```

## 性能优化建议

### 1. 对象池

```typescript
// pool.ts
export class Vec2Pool {
  private pool: Vec2[] = [];

  acquire(): Vec2 {
    return this.pool.pop() || new Vec2();
  }

  release(v: Vec2): void {
    v.set(0, 0);
    this.pool.push(v);
  }
}
```

### 2. 避免频繁创建

```typescript
// 不推荐: 每帧创建新对象
function update(dt: number) {
  const direction = new Vec2(1, 0);
  position = position.add(direction.mul(speed * dt));
}

// 推荐: 复用对象
const direction = new Vec2(1, 0);
function update(dt: number) {
  position.x += direction.x * speed * dt;
  position.y += direction.y * speed * dt;
}
```

### 3. 使用 TypedArray 直传 WebGL

```typescript
// 直接使用 Float32Array，避免转换
const position = new Vec3(1, 2, 3);
gl.uniform3fv(location, position.data); // 无需转换
```

## 测试策略

```typescript
// vec2.test.ts
describe('Vec2', () => {
  test('add', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, 4);
    expect(a.add(b)).toEqual(new Vec2(4, 6));
  });

  test('normalize', () => {
    const v = new Vec2(3, 4);
    expect(v.normalize().length()).toBeCloseTo(1, 5);
  });

  test('dot product', () => {
    const a = new Vec2(1, 0);
    const b = new Vec2(0, 1);
    expect(a.dot(b)).toBe(0);
  });

  test('rotation', () => {
    const v = new Vec2(1, 0);
    const rotated = v.rotate(Math.PI / 2);
    expect(rotated.x).toBeCloseTo(0, 5);
    expect(rotated.y).toBeCloseTo(1, 5);
  });
});
```

## 参考资源

- [gl-matrix](https://github.com/toji/gl-matrix) - 高性能 WebGL 数学库
- [3D Math Primer](https://gamemath.com/) - 游戏数学基础
- [Handmade Math](https://github.com/HandmadeMath/Handmade-Math) - 简单的单文件数学库
