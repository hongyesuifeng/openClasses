/**
 * Sprite Renderer Demo - 第4周示例
 *
 * 演示:
 * 1. 纹理加载
 * 2. Sprite 批处理
 * 3. 2D 相机
 * 4. 基础交互
 */

// 着色器
const VERTEX_SHADER = `#version 300 es
  in vec2 a_position;
  in vec2 a_texCoord;
  in vec4 a_color;

  uniform mat4 u_projection;

  out vec2 v_texCoord;
  out vec4 v_color;

  void main() {
    gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
    v_color = a_color;
  }
`;

const FRAGMENT_SHADER = `#version 300 es
  precision highp float;

  in vec2 v_texCoord;
  in vec4 v_color;

  uniform sampler2D u_texture;

  out vec4 fragColor;

  void main() {
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_color;
  }
`;

// Sprite 数据
interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  color: [number, number, number, number];
}

class SpriteDemo {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;

  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vertexBuffer: WebGLBuffer;
  private indexBuffer: WebGLBuffer;

  private sprites: Sprite[] = [];
  private texture: WebGLTexture | null = null;

  private cameraX = 0;
  private cameraY = 0;
  private cameraZoom = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
    });

    if (!gl) throw new Error('WebGL2 不可用');
    this.gl = gl;

    this.program = this.createProgram();
    this.vao = this.createBuffers();
    this.texture = this.createCheckerTexture();

    this.setupEvents();
  }

  private createProgram(): WebGLProgram {
    const gl = this.gl;

    // 顶点着色器
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      throw new Error(`VS Error: ${gl.getShaderInfoLog(vs)}`);
    }

    // 片元着色器
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      throw new Error(`FS Error: ${gl.getShaderInfoLog(fs)}`);
    }

    // 程序
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Link Error: ${gl.getProgramInfoLog(program)}`);
    }

    return program;
  }

  private createBuffers(): WebGLVertexArrayObject {
    const gl = this.gl;

    // 创建 VAO
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    // 顶点缓冲区 (动态，每帧更新)
    this.vertexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

    // 索引缓冲区
    this.indexBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // 设置索引数据 (四边形 x 6 个索引)
    const maxSprites = 1000;
    const indices = new Uint16Array(maxSprites * 6);
    for (let i = 0; i < maxSprites; i++) {
      const offset = i * 4;
      indices[i * 6] = offset;
      indices[i * 6 + 1] = offset + 1;
      indices[i * 6 + 2] = offset + 2;
      indices[i * 6 + 3] = offset;
      indices[i * 6 + 4] = offset + 2;
      indices[i * 6 + 5] = offset + 3;
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // 顶点属性
    const stride = 8 * 4; // 8 floats * 4 bytes

    // a_position
    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);

    // a_texCoord
    const texLoc = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 8);

    // a_color
    const colorLoc = gl.getAttribLocation(this.program, 'a_color');
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride, 16);

    gl.bindVertexArray(null);

    return vao;
  }

  private createCheckerTexture(): WebGLTexture {
    const gl = this.gl;
    const size = 64;
    const data = new Uint8Array(size * size * 4);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const checker = ((x >> 3) + (y >> 3)) % 2;

        if (checker) {
          data[i] = 100 + Math.random() * 50;
          data[i + 1] = 150 + Math.random() * 50;
          data[i + 2] = 200 + Math.random() * 50;
        } else {
          data[i] = 200 + Math.random() * 55;
          data[i + 1] = 200 + Math.random() * 55;
          data[i + 2] = 200 + Math.random() * 55;
        }
        data[i + 3] = 255;
      }
    }

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    return texture;
  }

  private setupEvents(): void {
    // 添加按钮
    document.getElementById('addBtn')?.addEventListener('click', () => {
      this.addRandomSprites(10);
    });

    // 清除按钮
    document.getElementById('clearBtn')?.addEventListener('click', () => {
      this.sprites = [];
    });

    // 鼠标拖拽
    let isDragging = false;
    let lastX = 0, lastY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.cameraX -= (e.clientX - lastX) / this.cameraZoom;
        this.cameraY -= (e.clientY - lastY) / this.cameraZoom;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // 滚轮缩放
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.cameraZoom *= delta;
      this.cameraZoom = Math.max(0.1, Math.min(5, this.cameraZoom));
    });
  }

  addRandomSprites(count: number): void {
    const colors: [number, number, number, number][] = [
      [1, 0.5, 0.5, 1],
      [0.5, 1, 0.5, 1],
      [0.5, 0.5, 1, 1],
      [1, 1, 0.5, 1],
      [1, 0.5, 1, 1],
      [0.5, 1, 1, 1],
    ];

    for (let i = 0; i < count; i++) {
      this.sprites.push({
        x: Math.random() * 1600 - 800,
        y: Math.random() * 1200 - 600,
        width: 30 + Math.random() * 70,
        height: 30 + Math.random() * 70,
        rotation: Math.random() * Math.PI * 2,
        velocityX: (Math.random() - 0.5) * 100,
        velocityY: (Math.random() - 0.5) * 100,
        rotationSpeed: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  update(dt: number): void {
    for (const sprite of this.sprites) {
      sprite.x += sprite.velocityX * dt;
      sprite.y += sprite.velocityY * dt;
      sprite.rotation += sprite.rotationSpeed * dt;

      // 边界反弹
      if (sprite.x < -900 || sprite.x > 900) sprite.velocityX *= -1;
      if (sprite.y < -700 || sprite.y > 700) sprite.velocityY *= -1;
    }
  }

  render(): void {
    const gl = this.gl;

    // 清除
    gl.clearColor(0.1, 0.1, 0.18, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (this.sprites.length === 0) return;

    // 构建顶点数据
    const vertexSize = 8; // 2 pos + 2 uv + 4 color
    const vertices = new Float32Array(this.sprites.length * 4 * vertexSize);

    for (let i = 0; i < this.sprites.length; i++) {
      const s = this.sprites[i];
      const cos = Math.cos(s.rotation);
      const sin = Math.sin(s.rotation);
      const hw = s.width / 2;
      const hh = s.height / 2;

      // 四个角的本地坐标
      const corners = [
        [-hw, -hh, 0, 0],
        [hw, -hh, 1, 0],
        [hw, hh, 1, 1],
        [-hw, hh, 0, 1],
      ];

      for (let j = 0; j < 4; j++) {
        const [lx, ly, u, v] = corners[j];
        const rx = lx * cos - ly * sin + s.x;
        const ry = lx * sin + ly * cos + s.y;

        const offset = (i * 4 + j) * vertexSize;
        vertices[offset] = rx;
        vertices[offset + 1] = ry;
        vertices[offset + 2] = u;
        vertices[offset + 3] = v;
        vertices[offset + 4] = s.color[0];
        vertices[offset + 5] = s.color[1];
        vertices[offset + 6] = s.color[2];
        vertices[offset + 7] = s.color[3];
      }
    }

    // 更新缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    // 使用着色器
    gl.useProgram(this.program);

    // 设置投影矩阵
    const hw = this.canvas.width / 2 / this.cameraZoom;
    const hh = this.canvas.height / 2 / this.cameraZoom;

    // 正交投影矩阵
    const projection = new Float32Array([
      1 / hw, 0, 0, 0,
      0, -1 / hh, 0, 0,
      0, 0, -1, 0,
      -this.cameraX / hw, this.cameraY / hh, 0, 1,
    ]);

    const projLoc = gl.getUniformLocation(this.program, 'u_projection');
    gl.uniformMatrix4fv(projLoc, false, projection);

    // 绑定纹理
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(gl.getUniformLocation(this.program, 'u_texture'), 0);

    // 绘制
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.sprites.length * 6, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
}

// 启动
const canvas = document.getElementById('game') as HTMLCanvasElement;
const demo = new SpriteDemo(canvas);

// 添加初始 sprites
demo.addRandomSprites(50);

let lastTime = performance.now();

function loop() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  demo.update(dt);
  demo.render();

  requestAnimationFrame(loop);
}

loop();

console.log('🎮 Sprite Renderer Demo running!');
