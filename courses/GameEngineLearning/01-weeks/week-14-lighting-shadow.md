# 第14周: 光照与阴影

> **学习目标**: 深入学习实时光照技术
>
> **时间安排**: 2026-06-01 ~ 2026-06-08
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. PBR光照
- [ ] 微表面模型
- [ ] 能量守恒
- [ ] BRDF（Cook-Torrance）
- [ ] IBL（基于图像的照明）

### 2. 阴影技术
- [ ] Shadow Mapping基础
- [ ] CSM（级联阴影映射）
- [ ] PCF/PCSS软阴影

### 3. 全局光照近似
- [ ] 环境光遮蔽（AO）
- [ ] 光照探针
- [ ] 反射探针

### 4. 实践任务
- [ ] 配置场景光照
- [ ] 调整阴影质量
- [ ] 实现简单PBR材质

---

## 核心知识点

### PBR光照模型

```glsl
// PBR材质参数
struct PBRMaterial {
    vec3 albedo;      // 反照率
    float metallic;   // 金属度
    float roughness;  // 粗糙度
    float ao;         // 环境光遮蔽
    vec3 emission;    // 自发光
};

// 常量
const float PI = 3.14159265359;

// 法线分布函数 (Trowbridge-Reitz GGX)
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

// 几何遮蔽函数 (Smith)
float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// 菲涅尔方程 (Schlick近似)
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Cook-Torrance BRDF
vec3 calculateBRDF(vec3 N, vec3 V, vec3 L, vec3 radiance, PBRMaterial material) {
    vec3 H = normalize(V + L);

    // 漫反射和镜面反射比率
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, material.albedo, material.metallic);

    // Cook-Torrance BRDF
    float NDF = distributionGGX(N, H, material.roughness);
    float G = geometrySmith(N, V, L, material.roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kS = F;  // 镜面反射
    vec3 kD = vec3(1.0) - kS;  // 漫反射
    kD *= 1.0 - material.metallic;

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    // 出射辐射率
    float NdotL = max(dot(N, L), 0.0);
    vec3 Lo = (kD * material.albedo / PI + specular) * radiance * NdotL;

    return Lo;
}

// IBL环境光照
vec3 calculateIBL(vec3 N, vec3 V, PBRMaterial material,
                  samplerCube irradiance_map,
                  samplerCube prefilter_map,
                  sampler2D brdf_lut) {
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, material.albedo, material.metallic);

    vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, material.roughness);

    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - material.metallic;

    // 漫反射IBL
    vec3 irradiance = texture(irradiance_map, N).rgb;
    vec3 diffuse = irradiance * material.albedo;

    // 镜面IBL
    const float MAX_REFLECTION_LOD = 4.0;
    vec3 R = reflect(-V, N);
    vec3 prefiltered = textureLod(prefilter_map, R, material.roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(brdf_lut, vec2(max(dot(N, V), 0.0), material.roughness)).rg;
    vec3 specular = prefiltered * (F * brdf.x + brdf.y);

    // 环境光遮蔽
    vec3 ambient = (kD * diffuse + specular) * material.ao;

    return ambient;
}

// 主光照函数
vec3 calculateLighting(vec3 world_pos, vec3 N, vec3 V,
                       PBRMaterial material,
                       vec3 light_positions[4],
                       vec3 light_colors[4]) {
    vec3 Lo = vec3(0.0);

    for (int i = 0; i < 4; i++) {
        vec3 L = normalize(light_positions[i] - world_pos);
        vec3 H = normalize(V + L);
        float distance = length(light_positions[i] - world_pos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = light_colors[i] * attenuation;

        Lo += calculateBRDF(N, V, L, radiance, material);
    }

    // 环境光照
    vec3 ambient = calculateIBL(N, V, material,
                                irradiance_map,
                                prefilter_map,
                                brdf_lut);

    // 自发光
    vec3 color = ambient + Lo + material.emission;

    // HDR色调映射
    color = color / (color + vec3(1.0));

    // Gamma校正
    color = pow(color, vec3(1.0 / 2.2));

    return color;
}
```

### Shadow Mapping

```glsl
// 阴影映射
layout(binding = 10) uniform sampler2D shadow_map;

float calculateShadow(vec3 frag_pos_light_space, vec3 N, vec3 L) {
    // 透视除法
    vec3 proj_coords = frag_pos_light_space.xyz / frag_pos_light_space.w;

    // 转换到[0,1]范围
    proj_coords = proj_coords * 0.5 + 0.5;

    // 超出光源范围
    if (proj_coords.z > 1.0)
        return 0.0;

    // PCF软阴影
    float shadow = 0.0;
    vec2 texel_size = 1.0 / textureSize(shadow_map, 0);

    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            float pcf_depth = texture(shadow_map,
                proj_coords.xy + vec2(x, y) * texel_size).r;
            shadow += (proj_coords.z > pcf_depth + 0.005) ? 1.0 : 0.0;
        }
    }

    shadow /= 9.0;

    // 阴影偏移，避免阴影痤疮
    float bias = max(0.05 * (1.0 - dot(N, L)), 0.005);

    return (proj_coords.z > 1.0) ? 1.0 : shadow;
}
```

### 级联阴影映射 (CSM)

```cpp
// CSM配置
struct CascadeShadowConfig {
    int num_cascades = 4;
    float lambda = 0.5f;  // 分割权重
    std::array<float, 4> split_distances = {5.0f, 15.0f, 40.0f, 100.0f};
};

class CascadedShadowMaps {
public:
    void update(const Camera& camera, const DirectionalLight& light) {
        // 计算级联分割
        updateCascades(camera);

        // 为每个级联创建阴影贴图
        for (int i = 0; i < m_config.num_cascades; i++) {
            calculateShadowMatrix(camera, light, i);
            renderShadowCascade(i);
        }
    }

    void bind(VkCommandBuffer cmd) {
        for (int i = 0; i < m_config.num_cascades; i++) {
            vkCmdBindDescriptorSets(cmd, ...);
        }
    }

private:
    void updateCascades(const Camera& camera) {
        float near_plane = camera.getNear();
        float far_plane = camera.getFar();

        // 使用对数或线性分割
        for (int i = 0; i < m_config.num_cascades; i++) {
            float factor = (float)i / (float)m_config.num_cascades;
            float log_dist = near_plane * pow(far_plane / near_plane, factor);
            float lin_dist = near_plane + (far_plane - near_plane) * factor;
            float dist = m_config.lambda * log_dist + (1.0f - m_config.lambda) * lin_dist;

            m_split_distances[i] = dist;
        }
    }

    void calculateShadowMatrix(const Camera& camera, const DirectionalLight& light, int cascade) {
        // 计算级联的视锥体
        float near_dist = (cascade == 0) ? camera.getNear() : m_split_distances[cascade - 1];
        float far_dist = m_split_distances[cascade];

        // 获取视锥体的8个角点
        std::array<vec3, 8> corners = getFrustumCorners(camera, near_dist, far_dist);

        // 计算包围盒
        vec3 center = calculateCenter(corners);
        vec3 extents = calculateExtents(corners, center);

        // 创建阴影视图投影矩阵
        mat4 shadow_proj = ortho(
            -extents.x, extents.x,
            -extents.y, extents.y,
            -extents.z, extents.z
        );

        vec3 light_dir = normalize(light.direction);
        mat4 shadow_view = lookAt(center, center - light_dir, vec3(0, 1, 0));

        m_shadow_matrices[cascade] = shadow_proj * shadow_view;
    }

    void renderShadowCascade(int cascade) {
        // 绑定阴影贴图
        m_shadow_framebuffers[cascade]->bind();

        // 渲染场景
        renderScene(m_shadow_matrices[cascade]);
    }

    CascadeShadowConfig m_config;
    std::array<mat4, 4> m_shadow_matrices;
    std::array<std::unique_ptr<Framebuffer>, 4> m_shadow_framebuffers;
    std::array<float, 4> m_split_distances;
};
```

### 环境光遮蔽 (SSAO)

```glsl
// SSAO着色器
layout(binding = 0) uniform sampler2D g_position;
layout(binding = 1) uniform sampler2D g_normal;
layout(binding = 2) uniform sampler2D tex_noise;

uniform vec3 samples[64];
uniform mat4 projection;

out float frag_color;

void main() {
    vec3 frag_pos = texture(g_position, tex_coord).xyz;
    vec3 normal = normalize(texture(g_normal, tex_coord).xyz);

    // 随机向量
    vec3 random_vec = texture(tex_noise, tex_coord * 4.0).xyz;

    // 切线空间变换
    vec3 tangent = normalize(random_vec - normal * dot(random_vec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    // SSAO计算
    float ao = 0.0;
    float radius = 0.5;
    int kernel_size = 64;

    for (int i = 0; i < kernel_size; i++) {
        // 获取样本位置（切线空间 -> 世界空间）
        vec3 sample_pos = TBN * samples[i];
        sample_pos = frag_pos + sample_pos * radius;

        // 投影
        vec4 offset = projection * vec4(sample_pos, 1.0);
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        // 采样深度
        float sample_depth = texture(g_position, offset.xy).z;

        // 范围检查
        float range_check = smoothstep(0.0, 1.0, radius / abs(frag_pos.z - sample_depth));
        ao += (sample_depth >= sample_pos.z + 0.025 ? 1.0 : 0.0) * range_check;
    }

    ao = 1.0 - (ao / kernel_size);

    frag_color = ao;
}
```

---

## 关键目录

```
runtime/function/render/
├── lighting/
│   ├── pbr_material.h
│   ├── light.h
│   └── lighting_system.h
├── shadows/
│   ├── shadow_map.h
│   ├── csm.h
│   └── shadow_renderer.h
└── post_processing/
    └── ssao.h
```

---

## 实践任务

### 任务1: 配置PBR材质

```cpp
// 创建金属材质
auto metal_material = std::make_shared<PBRMaterial>();
metal_material->albedo = vec3(0.8f, 0.8f, 0.8f);
metal_material->metallic = 1.0f;
metal_material->roughness = 0.2f;

// 创建塑料材质
auto plastic_material = std::make_shared<PBRMaterial>();
plastic_material->albedo = vec3(0.2f, 0.1f, 0.8f);
plastic_material->metallic = 0.0f;
plastic_material->roughness = 0.5f;
```

### 任务2: 设置光照

```cpp
// 主方向光（太阳）
auto sun_light = std::make_shared<DirectionalLight>();
sun_light->direction = normalize(vec3(0.3f, -1.0f, -0.5f));
sun_light->color = vec3(1.0f, 0.95f, 0.8f) * 5.0f;
sun_light->cast_shadow = true;

// 点光源（灯泡）
auto point_light = std::make_shared<PointLight>();
point_light->position = vec3(0, 3, 0);
point_light->color = vec3(1.0f, 0.8f, 0.6f) * 100.0f;
point_light->range = 10.0f;
```

---

## 下周预告

第15周: 后期处理与前沿技术
