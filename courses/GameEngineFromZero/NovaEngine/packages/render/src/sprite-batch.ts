/**
 * Sprite 批处理器
 */

import { Vec2, Color } from '@nova/math';
import { WebGL2Renderer } from './renderer.js';

// 每个顶点的数据大小 (位置2 + UV2 + 颜色4 + 透明度1)
const VERTEX_SIZE = 9;
// 每个 Sprite 4 个顶点
const SPRITE_VERTEX_COUNT = 4;
// 每个 Sprite 6 个索引 (2 个三角形)
const SPRITE_INDEX_COUNT = 6;
// 最大批次大小
const MAX_BATCH_SIZE = 10000;

// 默认着色器
const SPRITE_VERTEX_SHADER = `#version 300 es
  in vec2 a_position;
  in vec2 a_uv;
  in vec4 a_color;

  uniform mat4 u_projection;

  out vec2 v_uv;
  out vec4 v_color;

  void main() {
    gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
    v_uv = a_uv;
    v_color = a_color;
  }
`;

const SPRITE_FRAGMENT_SHADER = `#version 300 es
  precision highp float;

  in vec2 v_uv;
  in vec4 v_color;

  uniform sampler2D u_texture;

  out vec4 fragColor;

  void main() {
    fragColor = texture(u_texture, v_uv) * v_color;
  }
`;

export interface SpriteData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  anchorX?: number;
  anchorY?: number;
  scaleX?: number;
  scaleY?: number;
  color?: Color;
  texture: WebGLTexture;
  // UV 坐标
  u0?: number;
  v0?: number;
  u1?: number;
  v1?: number;
}

export class SpriteBatch {
  private renderer: WebGL2Renderer;
  private gl: WebGL2RenderingContext;

  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vertexBuffer: WebGLBuffer;
  private indexBuffer: WebGLBuffer;

  private vertices: Float32Array;
  private indices: Uint16Array;
  private batchCount: number = 0;
  private currentTexture: WebGLTexture | null = null;

  private projectionLocation: WebGLUniformLocation | null;
  private textureLocation: WebGLUniformLocation | null;

  constructor(renderer: WebGL2Renderer) {
    this.renderer = renderer;
    this.gl = renderer.glContext;

    // 创建着色器程序
    this.program = renderer.createShader(SPRITE_VERTEX_SHADER, SPRITE_FRAGMENT_SHADER);

    // 获取 uniform 位置
    this.projectionLocation = renderer.getUniformLocation(this.program, 'u_projection');
    this.textureLocation = renderer.getUniformLocation(this.program, 'u_texture');

    // 创建顶点缓冲区
    this.vertices = new Float32Array(MAX_BATCH_SIZE * SPRITE_VERTEX_COUNT * VERTEX_SIZE);
    this.vertexBuffer = renderer.createBuffer(this.vertices);

    // 创建索引缓冲区
    this.indices = new Uint16Array(MAX_BATCH_SIZE * SPRITE_INDEX_COUNT);
    for (let i = 0; i < MAX_BATCH_SIZE; i++) {
      const offset = i * 4;
      const indexOffset = i * 6;
      this.indices[indexOffset] = offset;
      this.indices[indexOffset + 1] = offset + 1;
      this.indices[indexOffset + 2] = offset + 2;
      this.indices[indexOffset + 3] = offset;
      this.indices[indexOffset + 4] = offset + 2;
      this.indices[indexOffset + 5] = offset + 3;
    }
    this.indexBuffer = renderer.createBuffer(this.indices, this.gl.ELEMENT_ARRAY_BUFFER);

    // 创建 VAO
    this.vao = renderer.createVertexArray();
    renderer.bindVertexArray(this.vao);

    // 设置顶点属性
    renderer.useShader(this.program);
    const stride = VERTEX_SIZE * 4; // 9 floats * 4 bytes

    // a_position
    const posLoc = renderer.getAttribLocation(this.program, 'a_position');
    renderer.setVertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, stride, 0);

    // a_uv
    const uvLoc = renderer.getAttribLocation(this.program, 'a_uv');
    renderer.setVertexAttribPointer(uvLoc, 2, this.gl.FLOAT, false, stride, 8);

    // a_color
    const colorLoc = renderer.getAttribLocation(this.program, 'a_color');
    renderer.setVertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, stride, 16);

    renderer.bindVertexArray(null);
  }

  /**
   * 开始批次
   */
  begin(projection: Float32Array): void {
    this.renderer.useShader(this.program);
    this.renderer.setUniformMatrix4fv(this.projectionLocation, projection);
    this.renderer.setUniform1i(this.textureLocation, 0);

    this.currentTexture = null;
    this.batchCount = 0;
  }

  /**
   * 绘制 Sprite
   */
  draw(sprite: SpriteData): void {
    // 检查是否需要刷新
    if (this.batchCount >= MAX_BATCH_SIZE || (this.currentTexture && sprite.texture !== this.currentTexture)) {
      this.flush();
    }

    this.currentTexture = sprite.texture;

    // 计算顶点
    const {
      x, y, width, height,
      rotation = 0,
      anchorX = 0.5, anchorY = 0.5,
      scaleX = 1, scaleY = 1,
      color = Color.WHITE,
      u0 = 0, v0 = 0, u1 = 1, v1 = 1
    } = sprite;

    // 锚点偏移
    const ax = width * anchorX;
    const ay = height * anchorY;

    // 四个角的本地坐标
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const vertices = [
      // x, y, u, v
      -ax * scaleX, -ay * scaleY, u0, v0,
      (width - ax) * scaleX, -ay * scaleY, u1, v0,
      (width - ax) * scaleX, (height - ay) * scaleY, u1, v1,
      -ax * scaleX, (height - ay) * scaleY, u0, v1,
    ];

    // 旋转并添加到缓冲区
    const offset = this.batchCount * SPRITE_VERTEX_COUNT * VERTEX_SIZE;

    for (let i = 0; i < 4; i++) {
      const vx = vertices[i * 4];
      const vy = vertices[i * 4 + 1];
      const u = vertices[i * 4 + 2];
      const v = vertices[i * 4 + 3];

      // 旋转
      const rx = vx * cos - vy * sin + x;
      const ry = vx * sin + vy * cos + y;

      const idx = offset + i * VERTEX_SIZE;
      this.vertices[idx] = rx;
      this.vertices[idx + 1] = ry;
      this.vertices[idx + 2] = u;
      this.vertices[idx + 3] = v;
      this.vertices[idx + 4] = color.r;
      this.vertices[idx + 5] = color.g;
      this.vertices[idx + 6] = color.b;
      this.vertices[idx + 7] = color.a;
      this.vertices[idx + 8] = 1; // padding
    }

    this.batchCount++;
  }

  /**
   * 刷新批次
   */
  flush(): void {
    if (this.batchCount === 0) return;

    // 更新顶点缓冲区
    this.renderer.updateBuffer(this.vertexBuffer, this.vertices.subarray(0, this.batchCount * SPRITE_VERTEX_COUNT * VERTEX_SIZE));

    // 绑定纹理
    if (this.currentTexture) {
      this.renderer.bindTexture(this.currentTexture, 0);
    }

    // 绘制
    this.renderer.bindVertexArray(this.vao);
    this.renderer.drawElements(this.gl.TRIANGLES, this.batchCount * SPRITE_INDEX_COUNT);

    this.batchCount = 0;
  }

  /**
   * 结束批次
   */
  end(): void {
    this.flush();
    this.renderer.bindVertexArray(null);
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteBuffer(this.indexBuffer);
    this.gl.deleteVertexArray(this.vao);
  }
}
