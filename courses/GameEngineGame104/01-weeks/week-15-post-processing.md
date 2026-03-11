# 第15周: 后期处理与前沿技术

> **学习目标**: 学习后期处理管线和前沿技术
>
> **时间安排**: 2026-06-09 ~ 2026-06-16
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 后期处理管线
- [ ] Tone Mapping（色调映射）
- [ ] Bloom（辉光）
- [ ] Depth of Field（景深）
- [ ] Motion Blur（运动模糊）
- [ ] Color Grading（色彩分级）

### 2. 屏幕空间技术
- [ ] SSAO（屏幕空间环境光遮蔽）
- [ ] SSR（屏幕空间反射）
- [ ] Volumetric Fog（体积雾）

### 3. 前沿技术
- [ ] 实时光线追踪
- [ ] DLSS/FSR（超分辨率）
- [ ] 程序化生成（PCG）

### 4. 实践任务
- [ ] 配置后期处理效果
- [ ] 调整色调映射曲线
- [ ] 添加Bloom效果

---

## 核心知识点

### Tone Mapping（色调映射）

```glsl
// ACES Tone Mapping
vec3 toneMapACES(vec3 color) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;

    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

// Reinhard Tone Mapping
vec3 toneMapReinhard(vec3 color) {
    return color / (color + vec3(1.0));
}

// Filmic Tone Mapping
vec3 toneMapFilmic(vec3 color) {
    vec3 x = max(vec3(0.0), color - 0.004);
    return (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
}

// 使用示例
layout(binding = 0) uniform sampler2D hdr_image;

in vec2 tex_coord;
out vec4 frag_color;

void main() {
    vec3 hdr_color = texture(hdr_image, tex_coord).rgb;

    // 曝光调整
    float exposure = 1.0;
    hdr_color *= exposure;

    // Tone Mapping
    vec3 ldr_color = toneMapACES(hdr_color);

    // Gamma校正
    ldr_color = pow(ldr_color, vec3(1.0 / 2.2));

    frag_color = vec4(ldr_color, 1.0);
}
```

### Bloom（辉光）

```cpp
// Bloom Pass
class BloomPass {
public:
    BloomPass(int blur_iterations = 5)
        : m_blur_iterations(blur_iterations) {

        // 创建中间纹理
        for (int i = 0; i < blur_iterations; i++) {
            // 下采样
            auto downsampled_tex = createTexture(
                width >> (i + 1),
                height >> (i + 1),
                VK_FORMAT_R16G16B16A16_SFLOAT
            );
            m_downsample_textures.push_back(downsampled_tex);

            // 上采样
            auto upsampled_tex = createTexture(
                width >> (i + 1),
                height >> (i + 1),
                VK_FORMAT_R16G16B16A16_SFLOAT
            );
            m_upsample_textures.push_back(upsampled_tex);
        }
    }

    void render(VkCommandBuffer cmd, VkImageView input_image) {
        // 提取亮部
        renderExtractBright(cmd, input_image);

        // 下采样
        for (int i = 0; i < m_blur_iterations; i++) {
            VkImageView input = (i == 0) ? m_bright_texture : m_downsample_textures[i - 1];
            renderDownsample(cmd, input, m_downsample_textures[i]);
        }

        // 上采样并混合
        for (int i = m_blur_iterations - 1; i >= 0; i--) {
            VkImageView base_texture = (i == m_blur_iterations - 1) ?
                m_downsample_textures[i] : m_upsample_textures[i + 1];

            renderUpsample(cmd, base_texture, m_downsample_textures[i], m_upsample_textures[i]);
        }

        // 最终合成
        renderComposite(cmd, input_image, m_upsample_textures[0]);
    }

private:
    void renderExtractBright(VkCommandBuffer cmd, VkImageView input) {
        // 使用阈值提取亮部
        const float threshold = 1.0;
        // ...
    }

    void renderDownsample(VkCommandBuffer cmd, VkImageView input, VkImageView output) {
        // 13-tap高斯下采样
        // ...
    }

    void renderUpsample(VkCommandBuffer cmd, VkImageView base, VkImageView input, VkImageView output) {
        // 13-tap高斯上采样并与base混合
        // ...
    }

    void renderComposite(VkCommandBuffer cmd, VkImageView scene, VkImageView bloom) {
        // 混合场景和bloom
        // ...
    }

    int m_blur_iterations;
    std::vector<VkImageView> m_downsample_textures;
    std::vector<VkImageView> m_upsample_textures;
    VkImageView m_bright_texture;
};
```

### Depth of Field（景深）

```glsl
// Circle of Confusion (CoC) 计算
float calculateCoC(float depth, float focal_depth, float aperture) {
    // depth: 当前像素深度
    // focal_depth: 对焦距离
    // aperture: 光圈大小

    float coc = (depth - focal_depth) / depth * aperture;
    return abs(coc);
}

// DoF模糊
vec3 depthOfField(sampler2D color_buffer, sampler2D depth_buffer,
                  vec2 tex_coord, vec2 pixel_size) {
    float depth = texture(depth_buffer, tex_coord).r;
    float coc = calculateCoC(depth, focal_depth, aperture);

    if (coc < 0.5) {
        return texture(color_buffer, tex_coord).rgb;
    }

    vec3 color = vec3(0.0);
    float total_weight = 0.0;

    int samples = int(coc * 20.0);

    for (int i = 0; i < samples; i++) {
        vec2 offset = randomInCircle() * coc * pixel_size;
        float sample_depth = texture(depth_buffer, tex_coord + offset).r;
        float sample_coc = calculateCoC(sample_depth, focal_depth, aperture);

        vec3 sample_color = texture(color_buffer, tex_coord + offset).rgb;
        float weight = sample_coc;

        color += sample_color * weight;
        total_weight += weight;
    }

    return color / total_weight;
}
```

### Motion Blur（运动模糊）

```glsl
// 速度缓冲区Motion Blur
layout(binding = 0) uniform sampler2D color_buffer;
layout(binding = 1) uniform sampler2D velocity_buffer;

in vec2 tex_coord;
out vec4 frag_color;

void main() {
    vec2 velocity = texture(velocity_buffer, tex_coord).xy;

    float speed = length(velocity);
    if (speed < 0.001) {
        frag_color = texture(color_buffer, tex_coord);
        return;
    }

    vec3 result = vec3(0.0);
    int samples = int(min(speed, 16.0));

    for (int i = 0; i <= samples; i++) {
        vec2 offset = velocity * (float(i) / float(samples));
        result += texture(color_buffer, tex_coord + offset).rgb;
    }

    frag_color = vec4(result / float(samples + 1), 1.0);
}
```

### 后期处理管线

```cpp
// 后期处理管线
class PostProcessingPipeline {
public:
    void initialize(int width, int height) {
        m_width = width;
        m_height = height;

        // 创建各种Pass
        m_tone_mapping_pass = std::make_unique<ToneMappingPass>();
        m_bloom_pass = std::make_unique<BloomPass>(5);
        m_dof_pass = std::make_unique<DepthOfFieldPass>();
        m_motion_blur_pass = std::make_unique<MotionBlurPass>();
        m_ssao_pass = std::make_unique<SSAOPass>();
        m_ssr_pass = std::make_unique<SSRPass>();
    }

    void render(VkCommandBuffer cmd, const FrameInput& input) {
        // SSAO
        if (m_settings.enable_ssao) {
            m_ssao_pass->render(cmd, input.depth_buffer, input.normal_buffer);
        }

        // SSR
        if (m_settings.enable_ssr) {
            m_ssr_pass->render(cmd, input.color_buffer, input.depth_buffer,
                             input.normal_buffer, m_ssao_pass->getOutput());
        }

        // DoF
        if (m_settings.enable_dof) {
            m_dof_pass->render(cmd, input.color_buffer, input.depth_buffer);
        }

        // Bloom
        if (m_settings.enable_bloom) {
            m_bloom_pass->render(cmd, input.color_buffer);
        }

        // Motion Blur
        if (m_settings.enable_motion_blur) {
            m_motion_blur_pass->render(cmd, input.color_buffer, input.velocity_buffer);
        }

        // Tone Mapping (最后)
        m_tone_mapping_pass->render(cmd, input.color_buffer);
    }

    struct Settings {
        bool enable_ssao = true;
        bool enable_ssr = false;
        bool enable_dof = false;
        bool enable_bloom = true;
        bool enable_motion_blur = true;
        float exposure = 1.0f;
        float bloom_intensity = 0.5f;
        float dof_focal_depth = 10.0f;
    };

    void setSettings(const Settings& settings) {
        m_settings = settings;
    }

private:
    int m_width, m_height;
    Settings m_settings;

    std::unique_ptr<ToneMappingPass> m_tone_mapping_pass;
    std::unique_ptr<BloomPass> m_bloom_pass;
    std::unique_ptr<DepthOfFieldPass> m_dof_pass;
    std::unique_ptr<MotionBlurPass> m_motion_blur_pass;
    std::unique_ptr<SSAOPass> m_ssao_pass;
    std::unique_ptr<SSRPass> m_ssr_pass;
};
```

---

## 前沿技术

### 实时光线追踪

```cpp
// Vulkan光线追踪
class RayTracingPass {
public:
    void initialize() {
        // 创建加速结构
        createTopLevelAccelerationStructure();
        createBottomLevelAccelerationStructure();

        // 创建SBT (Shader Binding Table)
        createShaderBindingTable();

        // 创建光线追踪管线
        createRayTracingPipeline();
    }

    void render(VkCommandBuffer cmd) {
        // vkCmdTraceRaysKHR
        VkStridedDeviceAddressRegionKHR raygen_sbt = getSBTAddress(VK_RAY_TRACING_SHADER_GROUP_TYPE_GENERAL_KHR, 0);
        VkStridedDeviceAddressRegion_MISS_KHR miss_sbt = getSBTAddress(VK_RAY_TRACING_SHADER_GROUP_TYPE_GENERAL_KHR, 1);
        VkStridedDeviceAddressRegion_HIT_KHR hit_sbt = getSBTAddress(VK_RAY_TRACING_SHADER_GROUP_TYPE_TRIANGLES_HIT_GROUP_KHR, 2);
        VkStridedDeviceAddressRegion_CALLABLE_KHR callable_sbt = {};

        vkCmdTraceRaysKHR(
            cmd,
            &raygen_sbt,
            &miss_sbt,
            &hit_sbt,
            &callable_sbt,
            m_width, m_height, 1
        );
    }

private:
    void createTopLevelAccelerationStructure() {
        // 顶层加速结构（实例）
    }

    void createBottomLevelAccelerationStructure() {
        // 底层加速结构（几何体）
    }

    void createShaderBindingTable() {
        // 着色器绑定表
    }

    void createRayTracingPipeline() {
        // 光线追踪管线
    }
};
```

### DLSS/FSR支持

```cpp
// DLSS集成
class DLSSSupport {
public:
    bool initialize(IDXGIOutput* output) {
        // 初始化NGX SDK
        NVSDK_NGX_Parameter* init_params = createInitParams();

        NVSDK_NGX_Result result = NVSDK_NGX_VULKAN_Init(
            getProjectId(),
            "PiccoloEngine",
            vulkan_instance,
            vulkan_physical_device,
            vulkan_device,
            vulkan_queue,
            init_params
        );

        return result == NVSDK_NGX_Result_Success;
    }

    void evaluateDLSS(VkCommandBuffer cmd,
                      VkImageView input_color,
                      VkImageView input_depth,
                      VkImageView input_motion_vectors,
                      VkImageView output) {
        NVSDK_NGX_Parameter* params = createFeatureParams(
            input_color, input_depth, input_motion_vectors, output
        );

        NVSDK_NGX_VULKAN_EvaluateFeature(
            cmd, "DLSS", params, nullptr
        );
    }

private:
    const char* getProjectId() {
        return "piccolo-engine";
    }
};
```

---

## 关键目录

```
runtime/function/render/
├── post_processing/
│   ├── tone_mapping_pass.h
│   ├── bloom_pass.h
│   ├── dof_pass.h
│   ├── motion_blur_pass.h
│   └── post_processing_pipeline.h
├── ray_tracing/
│   ├── ray_tracing_pass.h
│   ├── acceleration_structure.h
│   └── shader_binding_table.h
└── upscaling/
    ├── dlss_support.h
    └── fsr_support.h
```

---

## 实践任务

### 任务1: 配置后期处理

```cpp
// 配置后期处理管线
auto pp_pipeline = std::make_shared<PostProcessingPipeline>();
pp_pipeline->initialize(1920, 1080);

PostProcessingPipeline::Settings settings;
settings.enable_bloom = true;
settings.bloom_intensity = 0.3f;
settings.enable_motion_blur = true;
settings.exposure = 1.2f;

pp_pipeline->setSettings(settings);
```

---

## 下周预告

第16周: 综合项目实践 - 整合所学知识完成最终项目
