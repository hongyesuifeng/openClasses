# 第4周: Sprite 渲染 + 纹理系统

## 目标

- 图片加载与纹理创建
- Sprite 组件实现
- SpriteBatch 批量渲染
- 正交相机

## 任务清单

### 1. 纹理系统 (@nova/render/texture)

- [ ] Texture 类
  - [ ] 从 ImageBitmap 创建
  - [ ] 从 ImageData 创建
  - [ ] 参数配置 (wrap, filter, mipmap)
  - [ ] 槽位管理

- [ ] TextureManager
  - [ ] 纹理缓存
  - [ ] 批量加载

```typescript
const texture = await Texture.fromURL(renderer, 'sprite.png');
texture.setFilter(GL.LINEAR);
texture.setWrap(GL.CLAMP_TO_EDGE);
```

### 2. Sprite 组件

- [ ] Sprite 数据结构
  - [ ] texture 引用
  - [ ] sourceRect (纹理区域)
  - [ ] anchor (锚点)
  - [ ] tint (着色)

- [ ] Sprite Shader
  - [ ] 支持纹理采样
  - [ ] 支持颜色调制

```glsl
// sprite.frag
uniform sampler2D u_texture;
uniform vec4 u_tint;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_texture, v_uv) * u_tint;
}
```

### 3. SpriteBatch 批量渲染

- [ ] 动态 VBO
- [ ] 批次构建算法
  - [ ] 相同纹理合并
  - [ ] 顶点数据打包
- [ ] 实例化渲染 (可选，性能优化)

```typescript
// 批次渲染伪代码
const batch = new SpriteBatch(renderer);
batch.begin();
batch.draw(sprite1);
batch.draw(sprite2);
batch.draw(sprite3);
batch.end(); // 一次性提交 GPU
```

### 4. 正交相机 (@nova/render/camera)

- [ ] OrthographicCamera
  - [ ] left/right/top/bottom 设置
  - [ ] zoom 控制
  - [ ] 视图矩阵计算
  - [ ] 屏幕坐标转世界坐标

```typescript
const camera = new OrthographicCamera();
camera.setSize(canvas.width, canvas.height);
camera.zoom = 2.0;
camera.position.set(100, 50);
camera.update();

// 在着色器中使用
shader.setUniform('u_projection', camera.projectionMatrix);
shader.setUniform('u_view', camera.viewMatrix);
```

### 5. 纹理图集 (可选)

- [ ] TextureAtlas 数据结构
- [ ] JSON 格式解析 (如 TexturePacker 输出)
- [ ] 区域查询

## 示例项目

`examples/02-sprite-renderer/`:
- 加载精灵图片
- 在屏幕上绘制多个 Sprite
- 使用 SpriteBatch 批量渲染

## 学习资源

- Sprite Batching 技术文章
- PixiJS Sprite 源码
- Phaser 3 渲染系统

## 交付物

- 纹理系统
- Sprite 渲染能力
- 正交相机
- 精灵渲染示例

## 验证标准

```typescript
// 验证代码
const renderer = new WebGL2Renderer(canvas);
const camera = new OrthographicCamera();

// 加载纹理
const tex = await Texture.fromURL(renderer, 'player.png');

// 创建 Sprite
const sprite = new Sprite(tex);
sprite.position.set(100, 100);

// 渲染
const batch = new SpriteBatch(renderer);
batch.begin(camera);
batch.draw(sprite);
batch.end();
```

能够在屏幕上正确显示带纹理的精灵图片。
