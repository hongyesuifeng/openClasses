/**
 * Vector2 - 2D 向量类
 *
 * 用于表示 2D 空间中的点、方向或大小。
 * 在游戏开发中广泛用于: 位置、速度、UV 坐标等。
 */
export class Vec2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  // ========== 静态常量 ==========

  /** 零向量 (0, 0) */
  static readonly ZERO = new Vec2(0, 0);

  /** 单位向量 (1, 1) */
  static readonly ONE = new Vec2(1, 1);

  /** 向上 (0, -1) - 屏幕坐标系 Y 向下 */
  static readonly UP = new Vec2(0, -1);

  /** 向下 (0, 1) */
  static readonly DOWN = new Vec2(0, 1);

  /** 向左 (-1, 0) */
  static readonly LEFT = new Vec2(-1, 0);

  /** 向右 (1, 0) */
  static readonly RIGHT = new Vec2(1, 0);

  // ========== 实例方法 ==========

  /** 设置向量值 */
  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /** 从另一个向量复制 */
  copy(v: Vec2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  /** 克隆当前向量 */
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  // ========== 基础运算 ==========

  /** 向量加法 */
  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  /** 向量减法 */
  subtract(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  /** 标量乘法 */
  multiply(scalar: number): Vec2 {
    return new Vec2(this.x * scalar, this.y * scalar);
  }

  /** 标量除法 */
  divide(scalar: number): Vec2 {
    if (scalar === 0) {
      throw new Error('Division by zero');
    }
    return new Vec2(this.x / scalar, this.y / scalar);
  }

  /** 逐分量乘法 */
  multiplyVec(v: Vec2): Vec2 {
    return new Vec2(this.x * v.x, this.y * v.y);
  }

  /** 取反 */
  negate(): Vec2 {
    return new Vec2(-this.x, -this.y);
  }

  // ========== 向量运算 ==========

  /** 点积 (Dot Product) */
  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  /** 2D 叉积 (返回标量，表示 z 分量) */
  cross(v: Vec2): number {
    return this.x * v.y - this.y * v.x;
  }

  /** 向量长度 (Magnitude) */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** 长度的平方 (避免开方运算，用于比较) */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /** 归一化 (Normalize) */
  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) {
      return Vec2.ZERO.clone();
    }
    return this.divide(len);
  }

  // ========== 距离和角度 ==========

  /** 到另一个向量的距离 */
  distance(v: Vec2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** 距离的平方 */
  distanceSquared(v: Vec2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  /** 向量角度 (弧度) */
  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /** 到另一个向量的角度 */
  angleTo(v: Vec2): number {
    return Math.atan2(v.y - this.y, v.x - this.x);
  }

  // ========== 工具方法 ==========

  /** 线性插值 */
  lerp(target: Vec2, t: number): Vec2 {
    return new Vec2(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t
    );
  }

  /** 限制长度 */
  clampLength(max: number): Vec2 {
    const len = this.length();
    if (len > max) {
      return this.normalize().multiply(max);
    }
    return this.clone();
  }

  /** 旋转向量 */
  rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /** 向量投影 */
  project(v: Vec2): Vec2 {
    const dot = this.dot(v);
    const lenSq = v.lengthSquared();
    return v.multiply(dot / lenSq);
  }

  /** 反射 (基于法线) */
  reflect(normal: Vec2): Vec2 {
    const dot = 2 * this.dot(normal);
    return this.subtract(normal.multiply(dot));
  }

  /** 判断是否相等 */
  equals(v: Vec2, epsilon: number = 0.0001): boolean {
    return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
  }

  /** 转换为数组 */
  toArray(): [number, number] {
    return [this.x, this.y];
  }

  /** 从数组创建 */
  static fromArray(arr: number[]): Vec2 {
    return new Vec2(arr[0] ?? 0, arr[1] ?? 0);
  }

  /** 从角度和长度创建 */
  static fromAngle(angle: number, length: number = 1): Vec2 {
    return new Vec2(
      Math.cos(angle) * length,
      Math.sin(angle) * length
    );
  }

  /** 字符串表示 */
  toString(): string {
    return `Vec2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
