/**
 * WebGL2 渲染器
 */

export interface RendererOptions {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  antialias?: boolean;
  alpha?: boolean;
  backgroundColor?: { r: number; g: number; b: number; a: number };
}

export class WebGL2Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;

  private width: number;
  private height: number;
  private backgroundColor = { r: 0.1, g: 0.1, b: 0.18, a: 1 };

  // 资源管理
  private shaders: Map<string, WebGLProgram> = new Map();
  private textures: Map<string, WebGLTexture> = new Map();

  constructor(options: RendererOptions = {}) {
    // 创建或获取 canvas
    this.canvas = options.canvas || document.createElement('canvas');

    // 设置尺寸
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // 获取 WebGL2 上下文
    const gl = this.canvas.getContext('webgl2', {
      antialias: options.antialias ?? true,
      alpha: options.alpha ?? false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      throw new Error('WebGL2 is not supported');
    }

    this.gl = gl;

    // 设置背景色
    if (options.backgroundColor) {
      this.backgroundColor = options.backgroundColor;
    }

    // 初始化 WebGL 状态
    this.initGL();
  }

  private initGL(): void {
    const gl = this.gl;

    // 设置视口
    gl.viewport(0, 0, this.width, this.height);

    // 启用混合
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // 设置背景色
    const bg = this.backgroundColor;
    gl.clearColor(bg.r, bg.g, bg.b, bg.a);
  }

  // ========== 帧操作 ==========

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  present(): void {
    // WebGL 会自动呈现
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  // ========== 着色器 ==========

  createShader(vertexSrc: string, fragmentSrc: string): WebGLProgram {
    const gl = this.gl;

    // 编译顶点着色器
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexSrc);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(vertexShader);
      gl.deleteShader(vertexShader);
      throw new Error(`Vertex shader error: ${error}`);
    }

    // 编译片元着色器
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentSrc);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(fragmentShader);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(`Fragment shader error: ${error}`);
    }

    // 链接程序
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(`Program link error: ${error}`);
    }

    // 清理着色器对象
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  useShader(program: WebGLProgram): void {
    this.gl.useProgram(program);
  }

  // ========== 缓冲区 ==========

  createBuffer(data: ArrayBuffer, target: number = this.gl.ARRAY_BUFFER): WebGLBuffer {
    const gl = this.gl;
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return buffer;
  }

  updateBuffer(buffer: WebGLBuffer, data: ArrayBuffer, offset: number = 0): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);
  }

  // ========== 纹理 ==========

  createTexture(image: HTMLImageElement | ImageData): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (image instanceof HTMLImageElement) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image.data);
    }

    return texture;
  }

  bindTexture(texture: WebGLTexture, slot: number = 0): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  // ========== 顶点数组 ==========

  createVertexArray(): WebGLVertexArrayObject {
    return this.gl.createVertexArray()!;
  }

  bindVertexArray(vao: WebGLVertexArrayObject | null): void {
    this.gl.bindVertexArray(vao);
  }

  setVertexAttribPointer(
    index: number,
    size: number,
    type: number = this.gl.FLOAT,
    normalized: boolean = false,
    stride: number = 0,
    offset: number = 0
  ): void {
    this.gl.enableVertexAttribArray(index);
    this.gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
  }

  // ========== 绘制 ==========

  drawArrays(mode: number, first: number, count: number): void {
    this.gl.drawArrays(mode, first, count);
  }

  drawElements(mode: number, count: number, type: number = this.gl.UNSIGNED_SHORT, offset: number = 0): void {
    this.gl.drawElements(mode, count, type, offset);
  }

  // ========== Uniform 设置 ==========

  setUniform1i(location: WebGLUniformLocation | null, value: number): void {
    this.gl.uniform1i(location, value);
  }

  setUniform1f(location: WebGLUniformLocation | null, value: number): void {
    this.gl.uniform1f(location, value);
  }

  setUniform2f(location: WebGLUniformLocation | null, x: number, y: number): void {
    this.gl.uniform2f(location, x, y);
  }

  setUniform4f(location: WebGLUniformLocation | null, x: number, y: number, z: number, w: number): void {
    this.gl.uniform4f(location, x, y, z, w);
  }

  setUniformMatrix4fv(location: WebGLUniformLocation | null, value: Float32Array): void {
    this.gl.uniformMatrix4fv(location, false, value);
  }

  getUniformLocation(program: WebGLProgram, name: string): WebGLUniformLocation | null {
    return this.gl.getUniformLocation(program, name);
  }

  getAttribLocation(program: WebGLProgram, name: string): number {
    return this.gl.getAttribLocation(program, name);
  }

  // ========== 属性 ==========

  get canvasElement(): HTMLCanvasElement {
    return this.canvas;
  }

  get glContext(): WebGL2RenderingContext {
    return this.gl;
  }

  get viewportWidth(): number {
    return this.width;
  }

  get viewportHeight(): number {
    return this.height;
  }

  // ========== 销毁 ==========

  destroy(): void {
    // 删除着色器
    for (const program of this.shaders.values()) {
      this.gl.deleteProgram(program);
    }

    // 删除纹理
    for (const texture of this.textures.values()) {
      this.gl.deleteTexture(texture);
    }

    this.shaders.clear();
    this.textures.clear();
  }
}
