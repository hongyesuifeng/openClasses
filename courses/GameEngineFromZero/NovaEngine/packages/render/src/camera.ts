/**
 * 2D 相机
 */

import { Vec2, Vec3, Mat4 } from '@nova/math';

export class Camera2D {
  position: Vec2 = new Vec2(0, 0);
  zoom: number = 1;
  rotation: number = 0;

  private width: number;
  private height: number;

  private viewMatrix: Mat4 = new Mat4();
  private projectionMatrix: Mat4 = new Mat4();
  private viewProjectionMatrix: Mat4 = new Mat4();
  private inverseViewProjectionMatrix: Mat4 = new Mat4();

  private dirty: boolean = true;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * 更新矩阵
   */
  update(): void {
    if (!this.dirty) return;

    // 视图矩阵: 先旋转，再缩放，最后平移
    this.viewMatrix = new Mat4();

    // 平移到相机位置 (注意: 移动相机等于反向移动世界)
    this.viewMatrix.translate(-this.position.x, -this.position.y, 0);

    // 旋转
    this.viewMatrix.rotateZ(-this.rotation);

    // 缩放
    this.viewMatrix.scale(this.zoom, this.zoom, 1);

    // 投影矩阵: 正交投影
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    this.projectionMatrix = Mat4.orthographic(
      -halfWidth, halfWidth,
      -halfHeight, halfHeight,
      -1, 1
    );

    // 视图-投影矩阵
    this.viewProjectionMatrix = this.projectionMatrix.multiply(this.viewMatrix);

    // 逆矩阵
    this.inverseViewProjectionMatrix = this.viewProjectionMatrix.invert();

    this.dirty = false;
  }

  /**
   * 获取视图-投影矩阵
   */
  getViewProjectionMatrix(): Mat4 {
    this.update();
    return this.viewProjectionMatrix;
  }

  /**
   * 屏幕坐标转世界坐标
   */
  screenToWorld(screenX: number, screenY: number): Vec2 {
    this.update();

    // 标准化设备坐标 (-1 到 1)
    const ndcX = (screenX / this.width) * 2 - 1;
    const ndcY = 1 - (screenY / this.height) * 2;

    // 变换到世界坐标
    const worldPos = this.inverseViewProjectionMatrix.transformPoint(
      new Vec3(ndcX, ndcY, 0)
    );

    return new Vec2(worldPos.x, worldPos.y);
  }

  /**
   * 世界坐标转屏幕坐标
   */
  worldToScreen(worldX: number, worldY: number): Vec2 {
    this.update();

    const clipPos = this.viewProjectionMatrix.transformPoint(
      new Vec3(worldX, worldY, 0)
    );

    const screenX = (clipPos.x + 1) / 2 * this.width;
    const screenY = (1 - clipPos.y) / 2 * this.height;

    return new Vec2(screenX, screenY);
  }

  /**
   * 设置视口大小
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.dirty = true;
  }

  /**
   * 移动相机
   */
  move(dx: number, dy: number): void {
    this.position.x += dx;
    this.position.y += dy;
    this.dirty = true;
  }

  /**
   * 设置位置
   */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
    this.dirty = true;
  }

  /**
   * 设置缩放
   */
  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, zoom);
    this.dirty = true;
  }

  /**
   * 缩放
   */
  zoomBy(delta: number, centerX?: number, centerY?: number): void {
    const oldZoom = this.zoom;
    this.zoom = Math.max(0.1, this.zoom * (1 + delta));

    if (centerX !== undefined && centerY !== undefined) {
      // 以指定点为中心缩放
      const factor = 1 - oldZoom / this.zoom;
      this.position.x += (centerX - this.position.x) * factor;
      this.position.y += (centerY - this.position.y) * factor;
    }

    this.dirty = true;
  }

  /**
   * 获取可见区域 (AABB)
   */
  getVisibleBounds(): { min: Vec2; max: Vec2 } {
    this.update();

    const halfWidth = this.width / 2 / this.zoom;
    const halfHeight = this.height / 2 / this.zoom;

    return {
      min: new Vec2(this.position.x - halfWidth, this.position.y - halfHeight),
      max: new Vec2(this.position.x + halfWidth, this.position.y + halfHeight),
    };
  }

  /**
   * 检查点是否可见
   */
  isPointVisible(x: number, y: number): boolean {
    const bounds = this.getVisibleBounds();
    return x >= bounds.min.x && x <= bounds.max.x &&
           y >= bounds.min.y && y <= bounds.max.y;
  }

  get viewportWidth(): number {
    return this.width;
  }

  get viewportHeight(): number {
    return this.height;
  }
}
