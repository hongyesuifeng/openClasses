/**
 * Hello Triangle - 第1周示例
 *
 * 这个示例演示了:
 * 1. WebGL2 上下文初始化
 * 2. 着色器编译
 * 3. 顶点缓冲区创建
 * 4. 绘制一个三角形
 */

// 顶点着色器
const vertexShaderSource = `#version 300 es
  // 输入属性
  in vec3 a_position;
  in vec3 a_color;

  // 输出到片元着色器
  out vec3 v_color;

  void main() {
    gl_Position = vec4(a_position, 1.0);
    v_color = a_color;
  }
`;

// 片元着色器
const fragmentShaderSource = `#version 300 es
  precision highp float;

  in vec3 v_color;
  out vec4 fragColor;

  void main() {
    fragColor = vec4(v_color, 1.0);
  }
`;

// 三角形顶点数据 (位置 x,y,z + 颜色 r,g,b)
const vertices = new Float32Array([
  // 位置            // 颜色
   0.0,  0.5, 0.0,  1.0, 0.0, 0.0,  // 顶部 - 红色
  -0.5, -0.5, 0.0,  0.0, 1.0, 0.0,  // 左下 - 绿色
   0.5, -0.5, 0.0,  0.0, 0.0, 1.0,  // 右下 - 蓝色
]);

class HelloTriangle {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;

  constructor(canvas: HTMLCanvasElement) {
    // 1. 获取 WebGL2 上下文
    const gl = canvas.getContext('webgl2', {
      antialias: true,
      alpha: false,
    });

    if (!gl) {
      throw new Error('WebGL2 不可用，请使用现代浏览器');
    }

    this.gl = gl;

    // 2. 创建着色器程序
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);

    // 3. 创建顶点数据
    this.vao = this.createVertexArray();

    // 4. 设置视口
    gl.viewport(0, 0, canvas.width, canvas.height);

    console.log('WebGL2 初始化成功');
    console.log('渲染器:', gl.getParameter(gl.RENDERER));
    console.log('GL 版本:', gl.getParameter(gl.VERSION));
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`着色器编译失败: ${error}`);
    }

    return shader;
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl;

    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`程序链接失败: ${error}`);
    }

    return program;
  }

  private createVertexArray(): WebGLVertexArrayObject {
    const gl = this.gl;

    // 创建 VAO
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    // 创建顶点缓冲区
    const vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 设置顶点属性
    // 位置属性 (location = 0)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(
      0,                // location
      3,                // 每个顶点 3 个分量
      gl.FLOAT,         // 类型
      false,            // 不归一化
      24,               // 步长: 6 * 4 = 24 字节
      0                 // 偏移: 0
    );

    // 颜色属性 (location = 1)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(
      1,                // location
      3,                // 每个顶点 3 个分量
      gl.FLOAT,         // 类型
      false,            // 不归一化
      24,               // 步长: 6 * 4 = 24 字节
      12                // 偏移: 3 * 4 = 12 字节
    );

    // 解绑
    gl.bindVertexArray(null);

    return vao;
  }

  render(): void {
    const gl = this.gl;

    // 清除颜色缓冲区
    gl.clearColor(0.1, 0.1, 0.18, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 使用着色器程序
    gl.useProgram(this.program);

    // 绑定 VAO
    gl.bindVertexArray(this.vao);

    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 解绑
    gl.bindVertexArray(null);
  }
}

// 启动
const canvas = document.getElementById('game') as HTMLCanvasElement;
const app = new HelloTriangle(canvas);
app.render();

console.log('🎉 Hello Triangle 渲染完成!');
