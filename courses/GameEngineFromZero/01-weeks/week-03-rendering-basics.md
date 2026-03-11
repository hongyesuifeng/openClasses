# 第3周: 渲染基础 - 画出第一个三角形

## 目标

- WebGL2 上下文初始化
- 着色器编译与链接
- VBO/VAO 管理
- 渲染第一个三角形

## 任务清单

### 1. WebGL2 上下文初始化 (@nova/render/api)

- [ ] WebGL2Renderer 类
  - [ ] Canvas 获取与配置
  - [ ] WebGL2 上下文创建
  - [ ] 扩展获取
  - [ ] 状态管理

```typescript
const renderer = new WebGL2Renderer({
  canvas: document.getElementById('game'),
  antialias: true,
  alpha: false
});
```

### 2. 着色器系统 (@nova/render/shader)

- [ ] Shader 类
  - [ ] 顶点着色器编译
  - [ ] 片段着色器编译
  - [ ] 程序链接
  - [ ] uniform 位置缓存
  - [ ] attribute 位置缓存

- [ ] 基础着色器
  - [ ] 简单顶点着色器 (位置传递)
  - [ ] 简单片段着色器 (纯色)

```glsl
// basic.vert
#version 300 es
in vec3 a_position;
in vec3 a_color;
out vec3 v_color;
uniform mat4 u_modelViewProjection;

void main() {
  gl_Position = u_modelViewProjection * vec4(a_position, 1.0);
  v_color = a_color;
}

// basic.frag
#version 300 es
precision highp float;
in vec3 v_color;
out vec4 fragColor;

void main() {
  fragColor = vec4(v_color, 1.0);
}
```

### 3. 顶点数据管理 (@nova/render/mesh)

- [ ] Buffer 类
  - [ ] VBO 创建
  - [ ] 数据上传
  - [ ] subData 更新

- [ ] VertexArray 类
  - [ ] VAO 创建
  - [ ] attribute 配置

- [ ] 顶点格式定义
  - [ ] Position (vec3)
  - [ ] Color (vec3/vec4)
  - [ ] UV (vec2)

### 4. 渲染管线基础

- [ ] clear 方法 (color, depth, stencil)
- [ ] viewport 设置
- [ ] drawArrays 调用
- [ ] 状态设置 (blend, depth test)

### 5. Hello Triangle 示例

- [ ] 创建三角形顶点数据
- [ ] 创建着色器程序
- [ ] 渲染循环
- [ ] 颜色插值效果

## 学习资源

- WebGL2 Fundamentals
- LearnOpenGL - Hello Triangle
- PixiJS WebGL 设置代码

## 交付物

- `@nova/render` 基础版
- `examples/01-hello-triangle` 示例
- 第一个彩色三角形!

## 验证标准

打开 `examples/01-hello-triangle/index.html`，应该看到:
- 一个彩色三角形 (顶点颜色插值)
- 颜色平滑过渡
- 无 WebGL 错误

```typescript
// 验证代码结构
const renderer = new WebGL2Renderer(canvas);
const shader = new Shader(renderer.gl, vertexSrc, fragmentSrc);
const vao = new VertexArray(renderer.gl);

renderer.clear(0.1, 0.1, 0.1, 1.0);
shader.bind();
vao.bind();
renderer.drawArrays(3); // 绘制三角形
```

## 本周成就

:triangular_flag_on_post: **Hello World of Graphics!**

能够渲染第一个三角形是学习图形学的重要里程碑。这意味着:
- WebGL 上下文正确初始化
- 着色器编译链接成功
- 顶点数据正确传递
- 渲染管线工作正常
