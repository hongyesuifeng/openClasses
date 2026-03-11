# 第12周: 3D 高级特性

## 目标

- 模型加载 (GLTF)
- 阴影 (Shadow Mapping)
- 天空盒
- 后处理 (Bloom, FXAA)
- PBR 材质 (基础版)

## 任务清单

### 1. GLTF 模型加载 (@nova/resource/parsers)

- [ ] GLTF 文件解析
- [ ] 网格数据提取
- [ ] 材质信息
- [ ] 骨骼数据 (后期)
- [ ] 动画数据 (后期)

```typescript
class GLTFParser {
  async parse(buffer: ArrayBuffer): Promise<GLTFModel> {
    const gltf = JSON.parse(new TextDecoder().decode(buffer));

    // 解析 buffers
    // 解析 bufferViews
    // 解析 accessors
    // 解析 meshes
    // 解析 materials
    // 解析 nodes
    // 解析 scenes

    return model;
  }
}

interface GLTFModel {
  scenes: Scene[];
  meshes: Mesh[];
  materials: Material[];
  textures: Texture[];
}
```

### 2. 阴影映射 (Shadow Mapping)

- [ ] 深度纹理 (Depth Texture)
- [ ] 光源视角渲染
- [ ] 阴影采样

```glsl
// shadow_mapping.frag
uniform sampler2D u_shadowMap;
uniform mat4 u_lightSpaceMatrix;

float calculateShadow(vec4 fragPosLightSpace) {
  // 透视除法
  vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
  projCoords = projCoords * 0.5 + 0.5;

  // 采样深度
  float closestDepth = texture(u_shadowMap, projCoords.xy).r;
  float currentDepth = projCoords.z;

  // 阴影偏差
  float bias = 0.005;
  float shadow = currentDepth - bias > closestDepth ? 1.0 : 0.0;

  return shadow;
}
```

### 3. 天空盒

- [ ] Cubemap 纹理
- [ ] 天空盒着色器
- [ ] 优先渲染

```typescript
class Skybox {
  private cubemap: Texture;
  private mesh: Mesh;
  private shader: Shader;

  render(camera: Camera): void {
    // 禁用深度写入
    gl.depthMask(false);

    // 移除相机位移 (天空盒无限远)
    const viewNoTranslation = camera.viewMatrix.clone();
    viewNoTranslation.setTranslation(0, 0, 0);

    this.shader.bind();
    this.shader.setMat4('u_view', viewNoTranslation);
    this.shader.setMat4('u_projection', camera.projectionMatrix);
    this.shader.setTexture('u_skybox', this.cubemap, 0);

    this.mesh.bind();
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    gl.depthMask(true);
  }
}
```

### 4. 后处理

#### Bloom

```glsl
// bloom_bright.frag
uniform float u_threshold;

void main() {
  vec3 color = texture(u_texture, v_uv).rgb;
  float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
  if (brightness > u_threshold) {
    fragColor = vec4(color, 1.0);
  } else {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}

// bloom_blur.frag (高斯模糊)
uniform vec2 u_direction;

void main() {
  vec2 texelSize = 1.0 / textureSize(u_texture, 0);
  vec3 result = vec3(0.0);

  // 5x1 高斯核
  float weights[5] = float[](0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  result += texture(u_texture, v_uv).rgb * weights[0];

  for (int i = 1; i < 5; i++) {
    vec2 offset = u_direction * texelSize * float(i);
    result += texture(u_texture, v_uv + offset).rgb * weights[i];
    result += texture(u_texture, v_uv - offset).rgb * weights[i];
  }

  fragColor = vec4(result, 1.0);
}

// bloom_composite.frag
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_intensity;

void main() {
  vec3 scene = texture(u_scene, v_uv).rgb;
  vec3 bloom = texture(u_bloom, v_uv).rgb;
  fragColor = vec4(scene + bloom * u_intensity, 1.0);
}
```

#### FXAA

```glsl
// fxaa.frag
uniform vec2 u_resolution;
uniform sampler2D u_texture;

void main() {
  vec2 uv = v_uv;
  vec2 texel = 1.0 / u_resolution;

  vec3 rgbNW = texture(u_texture, uv + vec2(-1.0, -1.0) * texel).rgb;
  vec3 rgbNE = texture(u_texture, uv + vec2(1.0, -1.0) * texel).rgb;
  vec3 rgbSW = texture(u_texture, uv + vec2(-1.0, 1.0) * texel).rgb;
  vec3 rgbSE = texture(u_texture, uv + vec2(1.0, 1.0) * texel).rgb;
  vec3 rgbM = texture(u_texture, uv).rgb;

  // FXAA 算法...
  // (简化版，实际实现更复杂)

  fragColor = vec4(rgbM, 1.0);
}
```

### 5. PBR 材质 (基础版)

```glsl
// pbr.frag
uniform vec3 u_albedo;
uniform float u_metallic;
uniform float u_roughness;
uniform vec3 u_lightPos;
uniform vec3 u_lightColor;

const float PI = 3.14159265359;

vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = max(dot(N, H), 0.0);
  float NdotH2 = NdotH * NdotH;

  float nom = a2;
  float denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;

  return nom / denom;
}

void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(u_viewPos - v_fragPos);
  vec3 L = normalize(u_lightPos - v_fragPos);
  vec3 H = normalize(V + L);

  // Cook-Torrance BRDF
  float NDF = distributionGGX(N, H, u_roughness);
  vec3 F = fresnelSchlick(max(dot(H, V), 0.0), vec3(0.04));
  // ... 更多计算

  vec3 Lo = (NDF * F /* ... */) * u_lightColor;

  vec3 ambient = vec3(0.03) * u_albedo;
  vec3 color = ambient + Lo;

  // HDR tonemapping
  color = color / (color + vec3(1.0));
  // Gamma correction
  color = pow(color, vec3(1.0 / 2.2));

  fragColor = vec4(color, 1.0);
}
```

## 文件结构

```
@nova/render/
├── src/
│   ├── postprocess/
│   │   ├── PostProcessPipeline.ts
│   │   ├── BloomPass.ts
│   │   ├── FXAAPass.ts
│   │   └── ShadowPass.ts
│   ├── skybox/
│   │   └── Skybox.ts
│   └── pbr/
│       └── PBRMaterial.ts
```

## 示例项目

`examples/07-3d-advanced/`:
- 加载 GLTF 模型
- 动态阴影
- 天空盒背景
- Bloom 后处理

## 学习资源

- LearnOpenGL PBR 章节
- WebGL2 Shadows 教程
- three.js 后处理源码

## 交付物

- GLTF 加载器
- 阴影系统
- 后处理管线
- PBR 材质

## 验证标准

1. 能加载并渲染 GLTF 模型
2. 物体有正确的阴影
3. 后处理效果正确应用
