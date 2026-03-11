/**
 * Vector3 - 3D 向量类
 *
 * 用于表示 3D 空间中的点、方向或颜色 (RGB)。
 * 在游戏开发中广泛用于: 3D 位置、速度、法线、颜色等。
 */
export class Vec3 {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0
  ) {}

  // ========== 静态常量 ==========

  static readonly ZERO = new Vec3(0, 0, 0);
  static readonly ONE = new Vec3(1, 1, 1);
  static readonly UP = new Vec3(0, 1, 0);      // Y-up 坐标系
  static readonly DOWN = new Vec3(0, -1, 0);
  static readonly LEFT = new Vec3(-1, 0, 0);
  static readonly RIGHT = new Vec3(1, 0, 0);
  static readonly FORWARD = new Vec3(0, 0, -1); // OpenGL 约定
  static readonly BACK = new Vec3(0, 0, 1);

  // ========== 实例方法 ==========

  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: Vec3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  // ========== 基础运算 ==========

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  multiply(scalar: number): Vec3 {
    return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(scalar: number): Vec3 {
    if (scalar === 0) throw new Error('Division by zero');
    return new Vec3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  multiplyVec(v: Vec3): Vec3 {
    return new Vec3(this.x * v.x, this.y * v.y, this.z * v.z);
  }

  negate(): Vec3 {
    return new Vec3(-this.x, -this.y, -this.z);
  }

  // ========== 向量运算 ==========

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /** 叉积 (返回新的 Vec3) */
  cross(v: Vec3): Vec3 {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize(): Vec3 {
    const len = this.length();
    if (len === 0) return Vec3.ZERO.clone();
    return this.divide(len);
  }

  // ========== 距离和角度 ==========

  distance(v: Vec3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  distanceSquared(v: Vec3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  // ========== 工具方法 ==========

  lerp(target: Vec3, t: number): Vec3 {
    return new Vec3(
      this.x + (target.x - this.x) * t,
      this.y + (target.y - this.y) * t,
      this.z + (target.z - this.z) * t
    );
  }

  clamp(min: Vec3, max: Vec3): Vec3 {
    return new Vec3(
      Math.max(min.x, Math.min(max.x, this.x)),
      Math.max(min.y, Math.min(max.y, this.y)),
      Math.max(min.z, Math.min(max.z, this.z))
    );
  }

  reflect(normal: Vec3): Vec3 {
    const dot = 2 * this.dot(normal);
    return this.subtract(normal.multiply(dot));
  }

  project(v: Vec3): Vec3 {
    const dot = this.dot(v);
    const lenSq = v.lengthSquared();
    return v.multiply(dot / lenSq);
  }

  equals(v: Vec3, epsilon: number = 0.0001): boolean {
    return (
      Math.abs(this.x - v.x) < epsilon &&
      Math.abs(this.y - v.y) < epsilon &&
      Math.abs(this.z - v.z) < epsilon
    );
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  static fromArray(arr: number[]): Vec3 {
    return new Vec3(arr[0] ?? 0, arr[1] ?? 0, arr[2] ?? 0);
  }

  /** 从 Vec2 创建 (z = 0) */
  static fromVec2(v: { x: number; y: number }, z: number = 0): Vec3 {
    return new Vec3(v.x, v.y, z);
  }

  toString(): string {
    return `Vec3(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`;
  }
}
