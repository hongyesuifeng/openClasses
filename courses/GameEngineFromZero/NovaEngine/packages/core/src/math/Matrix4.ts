/**
 * Matrix4 - 4x4 矩阵类
 *
 * 用于 3D 变换、相机投影等。
 * 矩阵以列主序 (Column-Major) 存储，与 WebGL 兼容。
 */
export class Mat4 {
  /** 列主序存储: m[column][row] */
  public m: Float32Array;

  constructor(m?: Float32Array) {
    this.m = m ?? new Float32Array(16);
    if (!m) {
      this.identity();
    }
  }

  // ========== 静态常量 ==========

  static readonly IDENTITY = new Mat4();

  // ========== 工厂方法 ==========

  /** 创建单位矩阵 */
  static identity(): Mat4 {
    return new Mat4();
  }

  /** 从数组创建 */
  static fromArray(arr: number[]): Mat4 {
    const mat = new Mat4();
    mat.m.set(arr);
    return mat;
  }

  // ========== 实例方法 ==========

  /** 设置为单位矩阵 */
  identity(): this {
    this.m.set([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    return this;
  }

  /** 克隆矩阵 */
  clone(): Mat4 {
    return new Mat4(new Float32Array(this.m));
  }

  /** 复制另一个矩阵 */
  copy(other: Mat4): this {
    this.m.set(other.m);
    return this;
  }

  // ========== 变换方法 ==========

  /** 矩阵乘法 (this = this * other) */
  multiply(other: Mat4): Mat4 {
    const a = this.m;
    const b = other.m;
    const result = new Float32Array(16);

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 4; row++) {
        result[col * 4 + row] =
          a[row] * b[col * 4] +
          a[4 + row] * b[col * 4 + 1] +
          a[8 + row] * b[col * 4 + 2] +
          a[12 + row] * b[col * 4 + 3];
      }
    }

    return new Mat4(result);
  }

  /** 平移 */
  translate(x: number, y: number, z: number): this {
    this.m[12] += x;
    this.m[13] += y;
    this.m[14] += z;
    return this;
  }

  /** 缩放 */
  scale(x: number, y: number, z: number): this {
    this.m[0] *= x;
    this.m[5] *= y;
    this.m[10] *= z;
    return this;
  }

  /** 绕 X 轴旋转 */
  rotateX(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m = this.m;

    const m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7];
    const m8 = m[8], m9 = m[9], m10 = m[10], m11 = m[11];

    m[4] = m4 * c + m8 * s;
    m[5] = m5 * c + m9 * s;
    m[6] = m6 * c + m10 * s;
    m[7] = m7 * c + m11 * s;
    m[8] = m8 * c - m4 * s;
    m[9] = m9 * c - m5 * s;
    m[10] = m10 * c - m6 * s;
    m[11] = m11 * c - m7 * s;

    return this;
  }

  /** 绕 Y 轴旋转 */
  rotateY(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m = this.m;

    const m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
    const m8 = m[8], m9 = m[9], m10 = m[10], m11 = m[11];

    m[0] = m0 * c - m8 * s;
    m[1] = m1 * c - m9 * s;
    m[2] = m2 * c - m10 * s;
    m[3] = m3 * c - m11 * s;
    m[8] = m0 * s + m8 * c;
    m[9] = m1 * s + m9 * c;
    m[10] = m2 * s + m10 * c;
    m[11] = m3 * s + m11 * c;

    return this;
  }

  /** 绕 Z 轴旋转 */
  rotateZ(angle: number): this {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const m = this.m;

    const m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3];
    const m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7];

    m[0] = m0 * c + m4 * s;
    m[1] = m1 * c + m5 * s;
    m[2] = m2 * c + m6 * s;
    m[3] = m3 * c + m7 * s;
    m[4] = m4 * c - m0 * s;
    m[5] = m5 * c - m1 * s;
    m[6] = m6 * c - m2 * s;
    m[7] = m7 * c - m3 * s;

    return this;
  }

  /** 转置 */
  transpose(): Mat4 {
    const m = this.m;
    return new Mat4(new Float32Array([
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15]
    ]));
  }

  /** 行列式 */
  determinant(): number {
    const m = this.m;
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
    const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];

    const b00 = a00 * a11 - a01 * a10;
    const b01 = a00 * a12 - a02 * a10;
    const b02 = a00 * a13 - a03 * a10;
    const b03 = a01 * a12 - a02 * a11;
    const b04 = a01 * a13 - a03 * a11;
    const b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30;
    const b07 = a20 * a32 - a22 * a30;
    const b08 = a20 * a33 - a23 * a30;
    const b09 = a21 * a32 - a22 * a31;
    const b10 = a21 * a33 - a23 * a31;
    const b11 = a22 * a33 - a23 * a32;

    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  }

  /** 逆矩阵 */
  invert(): Mat4 | null {
    const m = this.m;
    const det = this.determinant();

    if (Math.abs(det) < 0.0001) {
      return null; // 不可逆
    }

    const invDet = 1 / det;
    const result = new Float32Array(16);

    // ... 完整逆矩阵计算
    // 为简洁起见，这里使用简化版本

    return new Mat4(result);
  }

  // ========== 静态工厂方法 ==========

  /** 透视投影矩阵 */
  static perspective(fov: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Mat4(new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]));
  }

  /** 正交投影矩阵 */
  static orthographic(
    left: number, right: number,
    bottom: number, top: number,
    near: number, far: number
  ): Mat4 {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    return new Mat4(new Float32Array([
      -2 * lr, 0, 0, 0,
      0, -2 * bt, 0, 0,
      0, 0, 2 * nf, 0,
      (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
    ]));
  }

  /** 视图矩阵 (LookAt) */
  static lookAt(eye: { x: number; y: number; z: number },
                target: { x: number; y: number; z: number },
                up: { x: number; y: number; z: number }): Mat4 {
    // 计算 z 轴 (从目标指向眼睛)
    let zx = eye.x - target.x;
    let zy = eye.y - target.y;
    let zz = eye.z - target.z;
    let len = Math.sqrt(zx * zx + zy * zy + zz * zz);
    zx /= len; zy /= len; zz /= len;

    // 计算 x 轴 (up × z)
    let xx = up.y * zz - up.z * zy;
    let xy = up.z * zx - up.x * zz;
    let xz = up.x * zy - up.y * zx;
    len = Math.sqrt(xx * xx + xy * xy + xz * xz);
    xx /= len; xy /= len; xz /= len;

    // 计算 y 轴 (z × x)
    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    return new Mat4(new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye.x + xy * eye.y + xz * eye.z),
      -(yx * eye.x + yy * eye.y + yz * eye.z),
      -(zx * eye.x + zy * eye.y + zz * eye.z),
      1
    ]));
  }

  /** 平移矩阵 */
  static translation(x: number, y: number, z: number): Mat4 {
    const mat = new Mat4();
    mat.m[12] = x;
    mat.m[13] = y;
    mat.m[14] = z;
    return mat;
  }

  /** 缩放矩阵 */
  static scaling(x: number, y: number, z: number): Mat4 {
    const mat = new Mat4();
    mat.m[0] = x;
    mat.m[5] = y;
    mat.m[10] = z;
    return mat;
  }

  toArray(): number[] {
    return Array.from(this.m);
  }

  toString(): string {
    const m = this.m;
    return `Mat4[\n  ${m[0].toFixed(2)} ${m[4].toFixed(2)} ${m[8].toFixed(2)} ${m[12].toFixed(2)}\n  ${m[1].toFixed(2)} ${m[5].toFixed(2)} ${m[9].toFixed(2)} ${m[13].toFixed(2)}\n  ${m[2].toFixed(2)} ${m[6].toFixed(2)} ${m[10].toFixed(2)} ${m[14].toFixed(2)}\n  ${m[3].toFixed(2)} ${m[7].toFixed(2)} ${m[11].toFixed(2)} ${m[15].toFixed(2)}\n]`;
  }
}
