# 第11周: 3D 渲染基础

## 目标

- 透视相机
- 3D Mesh 渲染
- 基础光照 (Phong)
- 相机控制 (OrbitControls)
- Depth Test
- :video_game: **游戏 #4: Tower Defense**

## 任务清单

### 1. 透视相机 (@nova/render/camera)

```typescript
class PerspectiveCamera {
  fov: number;           // 视野角度 (弧度)
  aspect: number;        // 宽高比
  near: number;          // 近裁剪面
  far: number;           // 远裁剪面

  position: Vec3;
  target: Vec3;          // 观察目标
  up: Vec3;              // 上方向

  projectionMatrix: Mat4;
  viewMatrix: Mat4;
  viewProjectionMatrix: Mat4;

  update(): void {
    // 计算投影矩阵
    Mat4.perspective(this.projectionMatrix, this.fov, this.aspect, this.near, this.far);
    // 计算视图矩阵
    Mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    // 组合矩阵
    Mat4.multiply(this.viewProjectionMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
```

### 2. 3D Mesh

#### Mesh 数据结构

```typescript
interface MeshData {
  positions: Float32Array;    // vec3
  normals: Float32Array;      // vec3
  uvs: Float32Array;          // vec2
  indices: Uint16Array;       // 可选
}

class Mesh {
  private vao: VertexArray;
  private vertexBuffer: Buffer;
  private indexBuffer?: Buffer;
  indexCount: number;

  static createPlane(): Mesh;
  static createCube(): Mesh;
  static createSphere(segments: number): Mesh;
}
```

#### 基础几何体生成

- [ ] 立方体 (Cube)
- [ ] 平面 (Plane)
- [ ] 球体 (Sphere)
- [ ] 圆柱 (Cylinder)

### 3. 基础光照

#### Phong 光照模型

```glsl
// phong.vert
#version 300 es

in vec3 a_position;
in vec3 a_normal;
in vec2 a_uv;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat3 u_normalMatrix;

out vec3 v_normal;
out vec3 v_fragPos;
out vec2 v_uv;

void main() {
  v_fragPos = vec3(u_model * vec4(a_position, 1.0));
  v_normal = u_normalMatrix * a_normal;
  v_uv = a_uv;

  gl_Position = u_projection * u_view * vec4(v_fragPos, 1.0);
}
```

```glsl
// phong.frag
#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_fragPos;
in vec2 v_uv;

uniform vec3 u_lightPos;
uniform vec3 u_viewPos;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
  // Ambient
  vec3 ambient = u_ambientColor * 0.1;

  // Diffuse
  vec3 norm = normalize(v_normal);
  vec3 lightDir = normalize(u_lightPos - v_fragPos);
  float diff = max(dot(norm, lightDir), 0.0);
  vec3 diffuse = diff * u_lightColor;

  // Specular
  vec3 viewDir = normalize(u_viewPos - v_fragPos);
  vec3 reflectDir = reflect(-lightDir, norm);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
  vec3 specular = spec * u_lightColor * 0.5;

  vec3 result = (ambient + diffuse + specular) * texture(u_texture, v_uv).rgb;
  fragColor = vec4(result, 1.0);
}
```

### 4. 相机控制

```typescript
class OrbitControls {
  camera: PerspectiveCamera;
  domElement: HTMLElement;

  target: Vec3;
  distance: number = 5;
  minDistance: number = 1;
  maxDistance: number = 100;

  rotationSpeed: number = 0.005;
  zoomSpeed: number = 0.1;

  private phi: number = 0;    // 垂直角度
  private theta: number = 0;  // 水平角度

  update(): void {
    // 球坐标转笛卡尔坐标
    this.camera.position.x = this.target.x + this.distance * Math.sin(this.phi) * Math.cos(this.theta);
    this.camera.position.y = this.target.y + this.distance * Math.cos(this.phi);
    this.camera.position.z = this.target.z + this.distance * Math.sin(this.phi) * Math.sin(this.theta);

    this.camera.target.copy(this.target);
    this.camera.update();
  }

  onMouseMove(dx: number, dy: number): void {
    this.theta -= dx * this.rotationSpeed;
    this.phi -= dy * this.rotationSpeed;
    this.phi = clamp(this.phi, 0.1, Math.PI - 0.1);
  }

  onWheel(delta: number): void {
    this.distance += delta * this.zoomSpeed;
    this.distance = clamp(this.distance, this.minDistance, this.maxDistance);
  }
}
```

### 5. Depth Test

- [ ] 启用深度测试
- [ ] 深度缓冲区清理
- [ ] 深度写入控制

```typescript
// 启用深度测试
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

// 渲染循环中清理深度缓冲
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
```

### 6. 游戏项目: Tower Defense

```
games/04-tower-defense/
├── src/
│   ├── main.ts
│   ├── Game.ts
│   │
│   ├── components/
│   │   ├── Position.ts
│   │   ├── Health.ts
│   │   ├── Enemy.ts
│   │   ├── Tower.ts
│   │   ├── Projectile.ts
│   │   ├── PathFollower.ts    # 沿路径移动
│   │   └── Targetable.ts
│   │
│   ├── systems/
│   │   ├── PathSystem.ts      # 路径寻找
│   │   ├── TowerTargetingSystem.ts
│   │   ├── ShootingSystem.ts
│   │   ├── MovementSystem.ts
│   │   ├── HealthSystem.ts
│   │   ├── WaveSystem.ts      # 波次管理
│   │   └── RenderSystem.ts
│   │
│   ├── ai/
│   │   └── Pathfinder.ts      # A* 寻路
│   │
│   └── ui/
│       ├── HUD.ts
│       ├── TowerMenu.ts       # 建造塔菜单
│       └── WaveIndicator.ts
│
├── assets/
│   ├── maps/
│   │   └── level1.json
│   ├── towers/
│   ├── enemies/
│   └── ui/
│
└── index.html
```

**游戏功能**:
- [ ] 地图系统 (瓦片)
- [ ] 敌人沿路径移动
- [ ] 防御塔自动攻击
- [ ] 多种塔类型
- [ ] 波次系统
- [ ] 金币/升级系统
- [ ] 完整 UI

## 学习资源

- LearnOpenGL Lighting 章节
- Three.js OrbitControls 源码
- A* Pathfinding 教程

## 交付物

- 3D 渲染基础
- **可玩的 Tower Defense 游戏!**

## 验证标准

1. 能渲染 3D 立方体并正确应用光照
2. 相机可以旋转和缩放
3. Tower Defense 可以正常运行
