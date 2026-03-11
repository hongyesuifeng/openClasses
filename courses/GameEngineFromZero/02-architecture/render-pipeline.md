# 渲染管线设计

## 概述

渲染管线是游戏引擎的核心，负责将游戏世界转换为屏幕上的像素。NovaEngine 采用 WebGL2 作为渲染后端，设计上抽象了图形 API 以便未来支持 WebGPU。

## 架构层次

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  (Scene, Sprite, Camera, UI Components)                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Renderer Layer                        │
│  (SpriteBatch, MeshRenderer, PostProcessManager)         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Graphics API Layer                    │
│  (WebGL2Renderer / WebGPURenderer)                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Platform Layer                        │
│  (WebGL2 Context / WebGPU Device)                        │
└─────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. Renderer (渲染器抽象)

```typescript
interface Renderer {
  // 初始化
  init(options: RendererOptions): Promise<void>;

  // 状态管理
  clear(r: number, g: number, b: number, a: number): void;
  setViewport(x: number, y: number, width: number, height: number): void;

  // 着色器
  createShader(vertexSrc: string, fragmentSrc: string): Shader;
  destroyShader(shader: Shader): void;

  // 缓冲区
  createBuffer(type: BufferType, data: ArrayBuffer): Buffer;
  updateBuffer(buffer: Buffer, data: ArrayBuffer, offset?: number): void;

  // 纹理
  createTexture(options: TextureOptions): Texture;
  updateTexture(texture: Texture, data: ImageData): void;

  // 顶点数组
  createVertexArray(attributes: AttributeDesc[]): VertexArray;

  // 绘制
  draw(drawCall: DrawCall): void;

  // 属性
  readonly width: number;
  readonly height: number;
  readonly capabilities: Capabilities;
}
```

### 2. Shader (着色器)

```typescript
class Shader {
  private program: WebGLProgram;
  private uniformLocations: Map<string, WebGLUniformLocation>;
  private attributeLocations: Map<string, number>;

  // Uniform 设置
  setInt(name: string, value: number): void;
  setFloat(name: string, value: number): void;
  setVec2(name: string, value: Vec2): void;
  setVec3(name: string, value: Vec3): void;
  setVec4(name: string, value: Vec4): void;
  setMat4(name: string, value: Mat4): void;
  setTexture(name: string, texture: Texture, slot: number): void;

  // 使用
  bind(): void;
  unbind(): void;
}
```

### 3. Buffer (缓冲区)

```typescript
enum BufferType {
  Vertex = 'vertex',
  Index = 'index',
  Uniform = 'uniform'  // UBO
}

class Buffer {
  readonly type: BufferType;
  readonly usage: BufferUsage;  // Static, Dynamic, Stream
  readonly byteLength: number;

  bind(): void;
  unbind(): void;
  setData(data: ArrayBuffer, offset?: number): void;
}
```

### 4. Texture (纹理)

```typescript
enum TextureFormat {
  RGBA8,
  RGB8,
  R8,
  Depth16,
  Depth24,
  Depth24Stencil8
}

enum TextureFilter {
  Nearest,
  Linear,
  NearestMipmapNearest,
  LinearMipmapLinear
}

enum TextureWrap {
  Repeat,
  ClampToEdge,
  MirroredRepeat
}

class Texture {
  readonly width: number;
  readonly height: number;
  readonly format: TextureFormat;

  static fromImage(image: HTMLImageElement): Texture;
  static fromURL(url: string): Promise<Texture>;

  setFilter(min: TextureFilter, mag: TextureFilter): void;
  setWrap(u: TextureWrap, v: TextureWrap): void;
  generateMipmaps(): void;

  bind(slot: number): void;
}
```

### 5. VertexArray (顶点数组)

```typescript
interface VertexAttribute {
  name: string;
  type: AttributeType;  // Float, Int, etc.
  size: number;         // 1, 2, 3, 4
  normalized: boolean;
  stride: number;
  offset: number;
}

class VertexArray {
  private vao: WebGLVertexArrayObject;
  private vertexBuffer: Buffer;
  private indexBuffer?: Buffer;

  bind(): void;
  unbind(): void;
  setVertexBuffer(buffer: Buffer, attributes: VertexAttribute[]): void;
  setIndexBuffer(buffer: Buffer): void;
}
```

## 渲染流程

### 2D 渲染流程

```
┌─────────────────────────────────────────────────────────┐
│                      2D Render Flow                      │
└─────────────────────────────────────────────────────────┘

1. BeginFrame
   ├── Clear color/depth buffer
   ├── Set viewport
   └── Update camera matrices

2. Scene Culling (可选)
   ├── Frustum culling
   └── Occlusion culling (简单版)

3. Sprite Batch
   ├── Collect visible sprites
   ├── Sort by texture/depth
   ├── Build batch data
   └── Submit draw calls

4. UI Layer
   ├── Render UI components
   └── Apply screen-space transform

5. EndFrame
   └── Present (swap buffers / requestAnimationFrame)
```

### 批处理 (SpriteBatch)

```typescript
class SpriteBatch {
  private batchBuffer: Float32Array;  // 顶点数据
  private indexBuffer: Uint16Array;   // 索引数据
  private batchCount: number = 0;
  private currentTexture: Texture | null = null;

  begin(camera: Camera): void {
    this.shader.bind();
    this.shader.setMat4('u_viewProjection', camera.viewProjectionMatrix);
  }

  draw(sprite: Sprite): void {
    // 检查是否需要刷新批次
    if (this.batchCount >= MAX_BATCH_SIZE ||
        sprite.texture !== this.currentTexture) {
      this.flush();
    }

    // 添加顶点数据
    this.addQuad(sprite);
    this.batchCount++;
  }

  end(): void {
    this.flush();
  }

  private flush(): void {
    if (this.batchCount === 0) return;

    // 上传数据
    this.vertexBuffer.setData(this.batchBuffer);

    // 绘制
    this.renderer.drawIndexed(this.batchCount * 6);

    // 重置
    this.batchCount = 0;
  }
}
```

## 着色器管理

### Shader Library

```typescript
// shader/library.ts
export const SHADERS = {
  basic: {
    vertex: `
      #version 300 es
      in vec3 a_position;
      uniform mat4 u_mvp;
      void main() {
        gl_Position = u_mvp * vec4(a_position, 1.0);
      }
    `,
    fragment: `
      #version 300 es
      precision highp float;
      uniform vec4 u_color;
      out vec4 fragColor;
      void main() {
        fragColor = u_color;
      }
    `
  },

  sprite: {
    vertex: `
      #version 300 es
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
    `,
    fragment: `
      #version 300 es
      precision highp float;

      in vec2 v_uv;
      in vec4 v_color;

      uniform sampler2D u_texture;

      out vec4 fragColor;

      void main() {
        fragColor = texture(u_texture, v_uv) * v_color;
      }
    `
  }
};
```

### Uniform Buffer (WebGL2)

```typescript
// 使用 UBO 提高性能
class UniformBuffer {
  private buffer: WebGLBuffer;
  private bindPoint: number;

  constructor(renderer: Renderer, layout: UniformLayout) {
    this.buffer = renderer.createBuffer(BufferType.Uniform);
    this.bindPoint = layout.bindPoint;
  }

  setMat4(name: string, value: Mat4): void {
    // 更新缓冲区特定偏移
  }

  bind(shader: Shader): void {
    shader.bindUniformBlock(name, this.bindPoint);
    this.buffer.bindBase(this.bindPoint);
  }
}

// 相机 UBO 示例
const cameraUBO = new UniformBuffer(renderer, {
  bindPoint: 0,
  uniforms: {
    u_view: 'mat4',
    u_projection: 'mat4',
    u_viewProjection: 'mat4',
    u_cameraPosition: 'vec3'
  }
});
```

## 后处理管线

```typescript
class PostProcessPipeline {
  private passes: PostProcessPass[] = [];

  addPass(pass: PostProcessPass): void {
    this.passes.push(pass);
  }

  render(input: Texture, output: Framebuffer): void {
    let currentInput = input;

    for (const pass of this.passes) {
      pass.render(currentInput, output);
      currentInput = output.texture;
    }
  }
}

// 后处理效果示例
const bloom = new BloomPass({
  threshold: 0.8,
  intensity: 1.0,
  radius: 5
});

const fxaa = new FXAAPass();

pipeline.addPass(bloom);
pipeline.addPass(fxaa);
```

## 性能优化

### 状态排序

```typescript
// 渲染命令排序，减少状态切换
renderCommands.sort((a, b) => {
  // 1. Shader
  if (a.shader !== b.shader) return a.shader.id - b.shader.id;
  // 2. Texture
  if (a.texture !== b.texture) return a.texture.id - b.texture.id;
  // 3. Depth
  return a.depth - b.depth;
});
```

### 实例化渲染

```glsl
// instanced.vert
#version 300 es

in vec2 a_position;
in vec2 a_uv;

// 实例化属性
in vec2 a_offset;      // 每个 sprite 一个
in vec4 a_color;       // 每个 sprite 一个
in vec2 a_scale;       // 每个 sprite 一个

uniform mat4 u_projection;

out vec2 v_uv;
out vec4 v_color;

void main() {
  vec2 pos = a_position * a_scale + a_offset;
  gl_Position = u_projection * vec4(pos, 0.0, 1.0);
  v_uv = a_uv;
  v_color = a_color;
}
```

## 参考资源

- WebGL2 Fundamentals
- PixiJS v8 渲染架构
- LearnOpenGL 渲染管线章节
