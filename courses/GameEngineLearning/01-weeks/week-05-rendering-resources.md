# 第5周: 渲染系统（二）- GPU资源管理与材质系统

> **学习目标**: 学习GPU资源管理和材质系统
>
> **时间安排**: 2026-03-22 ~ 2026-03-29
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. GPU资源管理
- [ ] Buffer管理（顶点缓冲、索引缓冲、Uniform缓冲）
- [ ] Texture管理（纹理加载、采样器、Mipmap）
- [ ] Descriptor和DescriptorSet
- [ ] 资源生命周期管理

### 2. 材质系统
- [ ] Shader系统架构
- [ ] 材质属性定义
- [ ] 着色器变体
- [ ] 材质实例化

### 3. 实践任务
- [ ] 查看shader目录下的着色器文件
- [ ] 理解材质配置文件格式
- [ ] 尝试修改简单着色器参数

---

## 核心知识点

### GPU Buffer管理

#### 顶点缓冲 (Vertex Buffer)

```cpp
// Vulkan顶点缓冲创建
struct Vertex {
    vec3 position;
    vec3 normal;
    vec2 texcoord;
};

// 1. 创建Staging Buffer（Host Visible）
VkBuffer staging_buffer;
VkDeviceMemory staging_memory;

VkBufferCreateInfo buffer_info = {};
buffer_info.sType = VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO;
buffer_info.size = sizeof(vertices[0]) * vertices.size();
buffer_info.usage = VK_BUFFER_USAGE_TRANSFER_SRC_BIT;
buffer_info.sharingMode = VK_SHARING_MODE_EXCLUSIVE;

vkCreateBuffer(device, &buffer_info, nullptr, &staging_buffer);

// 2. 分配内存
VkMemoryRequirements mem_requirements;
vkGetBufferMemoryRequirements(device, staging_buffer, &mem_requirements);

VkMemoryAllocateInfo alloc_info = {};
alloc_info.sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO;
alloc_info.allocationSize = mem_requirements.size;
alloc_info.memoryTypeIndex = findMemoryType(
    mem_requirements.memoryTypeBits,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
);

vkAllocateMemory(device, &alloc_info, nullptr, &staging_memory);
vkBindBufferMemory(device, staging_buffer, staging_memory, 0);

// 3. 复制数据到Staging Buffer
void* data;
vkMapMemory(device, staging_memory, 0, buffer_info.size, 0, &data);
memcpy(data, vertices.data(), buffer_info.size);
vkUnmapMemory(device, staging_memory);

// 4. 创建Device Local Buffer（GPU专用）
VkBuffer vertex_buffer;
VkDeviceMemory vertex_memory;

// ... 类似步骤，但使用 VK_BUFFER_USAGE_VERTEX_BUFFER_BIT | VK_BUFFER_USAGE_TRANSFER_DST_BIT

// 5. 复制Staging到Device Buffer
VkCommandBuffer cmd = beginSingleTimeCommands();
VkBufferCopy copy_region = {};
copy_region.srcOffset = 0;
copy_region.dstOffset = 0;
copy_region.size = size;
vkCmdCopyBuffer(cmd, staging_buffer, vertex_buffer, 1, &copy_region);
endSingleTimeCommands(cmd);
```

#### 索引缓冲 (Index Buffer)

```cpp
// 索引缓冲用于减少顶点重复
std::vector<uint32_t> indices = {
    0, 1, 2,  // 第一个三角形
    2, 3, 0   // 第二个三角形
};

// 创建流程与顶点缓冲类似
// usage: VK_BUFFER_USAGE_INDEX_BUFFER_BIT | VK_BUFFER_USAGE_TRANSFER_DST_BIT

// 绘制时使用
vkCmdBindIndexBuffer(cmd, index_buffer, 0, VK_INDEX_TYPE_UINT32);
vkCmdDrawIndexed(cmd, static_cast<uint32_t>(indices.size()), 1, 0, 0, 0);
```

#### Uniform缓冲 (Uniform Buffer)

```cpp
// Uniform Buffer用于传递着色器参数
struct UniformBufferObject {
    mat4 model;
    mat4 view;
    mat4 proj;
};

// 每帧更新UBO
void updateUniformBuffer(uint32_t current_image) {
    static auto startTime = std::chrono::high_resolution_clock::now();

    auto currentTime = std::chrono::high_resolution_clock::now();
    float time = std::chrono::duration<float, std::chrono::seconds::period>(
        currentTime - startTime).count();

    UniformBufferObject ubo = {};
    ubo.model = rotate(mat4(1.0f), time * glm::radians(90.0f), vec3(0.0f, 0.0f, 1.0f));
    ubo.view = lookAt(vec3(2.0f, 2.0f, 2.0f), vec3(0.0f, 0.0f, 0.0f), vec3(0.0f, 0.0f, 1.0f));
    ubo.proj = perspective(radians(45.0f), aspect, 0.1f, 100.0f);
    ubo.proj[1][1] *= -1;  // Vulkan的Y轴方向修正

    void* data;
    vkMapMemory(device, uniform_buffers_memory[current_image], 0, sizeof(ubo), 0, &data);
    memcpy(data, &ubo, sizeof(ubo));
    vkUnmapMemory(device, uniform_buffers_memory[current_image]);
}
```

---

### 纹理管理

#### 纹理加载流程

```cpp
// 1. 加载图像文件
int tex_width, tex_height, tex_channels;
stbi_uc* pixels = stbi_load("texture.png", &tex_width, &tex_height, &tex_channels, STBI_rgb_alpha);
VkDeviceSize image_size = tex_width * tex_height * 4;

if (!pixels) {
    throw std::runtime_error("failed to load texture image!");
}

// 2. 创建Staging Buffer
VkBuffer staging_buffer;
VkDeviceMemory staging_memory;
createBuffer(image_size, VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT,
    staging_buffer, staging_memory);

// 3. 复制图像数据
void* data;
vkMapMemory(device, staging_memory, 0, image_size, 0, &data);
memcpy(data, pixels, static_cast<size_t>(image_size));
vkUnmapMemory(device, staging_memory);
stbi_image_free(pixels);

// 4. 创建图像对象
VkImage texture_image;
createImage(tex_width, tex_height, VK_FORMAT_R8G8B8A8_SRGB, VK_IMAGE_TILING_OPTIMAL,
    VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT,
    VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, texture_image, texture_image_memory);

// 5. 过渡图像布局并复制数据
transitionImageLayout(texture_image, VK_FORMAT_R8G8B8A8_SRGB,
    VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL);
copyBufferToImage(staging_buffer, texture_image,
    static_cast<uint32_t>(tex_width), static_cast<uint32_t>(tex_height));
transitionImageLayout(texture_image, VK_FORMAT_R8G8B8A8_SRGB,
    VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL);

// 6. 创建纹理采样器
VkSampler texture_sampler;
VkSamplerCreateInfo sampler_info = {};
sampler_info.sType = VK_STRUCTURE_TYPE_SAMPLER_CREATE_INFO;
sampler_info.magFilter = VK_FILTER_LINEAR;
sampler_info.minFilter = VK_FILTER_LINEAR;
sampler_info.addressModeU = VK_SAMPLER_ADDRESS_MODE_REPEAT;
sampler_info.addressModeV = VK_SAMPLER_ADDRESS_MODE_REPEAT;
sampler_info.addressModeW = VK_SAMPLER_ADDRESS_MODE_REPEAT;
sampler_info.anisotropyEnable = VK_TRUE;
sampler_info.maxAnisotropy = 16.0f;
sampler_info.borderColor = VK_BORDER_COLOR_INT_OPAQUE_BLACK;
sampler_info.unnormalizedCoordinates = VK_FALSE;
sampler_info.compareEnable = VK_FALSE;
sampler_info.compareOp = VK_COMPARE_OP_ALWAYS;
sampler_info.mipmapMode = VK_SAMPLER_MIPMAP_MODE_LINEAR;
sampler_info.mipLodBias = 0.0f;
sampler_info.minLod = 0.0f;
sampler_info.maxLod = 0.0f;

vkCreateSampler(device, &sampler_info, nullptr, &texture_sampler);
```

#### Mipmap生成

```cpp
// Mipmap用于改善纹理质量和性能
void generateMipmaps(VkImage image, int32_t tex_width, int32_t tex_height, VkFormat image_format) {
    VkCommandBuffer command_buffer = beginSingleTimeCommands();

    VkImageMemoryBarrier barrier = {};
    barrier.sType = VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER;
    barrier.image = image;
    barrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
    barrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
    barrier.subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
    barrier.subresourceRange.baseArrayLayer = 0;
    barrier.subresourceRange.layerCount = 1;
    barrier.subresourceRange.levelCount = 1;

    int32_t mip_width = tex_width;
    int32_t mip_height = tex_height;

    for (uint32_t i = 1; i < mip_levels; i++) {
        // 过渡到传输源
        barrier.subresourceRange.baseMipLevel = i - 1;
        barrier.oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL;
        barrier.newLayout = VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL;
        barrier.srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
        barrier.dstAccessMask = VK_ACCESS_TRANSFER_READ_BIT;

        vkCmdPipelineBarrier(command_buffer,
            VK_PIPELINE_STAGE_TRANSFER_BIT, VK_PIPELINE_STAGE_TRANSFER_BIT, 0,
            0, nullptr,
            0, nullptr,
            1, &barrier);

        // 复制到下一级
        VkImageBlit blit = {};
        blit.srcOffsets[0] = {0, 0, 0};
        blit.srcOffsets[1] = {mip_width, mip_height, 1};
        blit.srcSubresource.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        blit.srcSubresource.mipLevel = i - 1;
        blit.srcSubresource.baseArrayLayer = 0;
        blit.srcSubresource.layerCount = 1;
        blit.dstOffsets[0] = {0, 0, 0};
        blit.dstOffsets[1] = {mip_width > 1 ? mip_width / 2 : 1, mip_height > 1 ? mip_height / 2 : 1, 1};
        blit.dstSubresource.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        blit.dstSubresource.mipLevel = i;
        blit.dstSubresource.baseArrayLayer = 0;
        blit.dstSubresource.layerCount = 1;

        vkCmdBlitImage(command_buffer,
            image, VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL,
            image, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
            1, &blit,
            VK_FILTER_LINEAR);

        // 过渡到着色器只读
        barrier.oldLayout = VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL;
        barrier.newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;
        barrier.srcAccessMask = VK_ACCESS_TRANSFER_READ_BIT;
        barrier.dstAccessMask = VK_ACCESS_SHADER_READ_BIT;

        vkCmdPipelineBarrier(command_buffer,
            VK_PIPELINE_STAGE_TRANSFER_BIT, VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, 0,
            0, nullptr,
            0, nullptr,
            1, &barrier);

        if (mip_width > 1) mip_width /= 2;
        if (mip_height > 1) mip_height /= 2;
    }

    // 最后一级mipmap过渡
    barrier.subresourceRange.baseMipLevel = mip_levels - 1;
    barrier.oldLayout = VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL;
    barrier.newLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;
    barrier.srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
    barrier.dstAccessMask = VK_ACCESS_SHADER_READ_BIT;

    vkCmdPipelineBarrier(command_buffer,
        VK_PIPELINE_STAGE_TRANSFER_BIT, VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, 0,
        0, nullptr,
        0, nullptr,
        1, &barrier);

    endSingleTimeCommands(command_buffer);
}
```

---

### Descriptor系统

#### Descriptor和DescriptorSet

```cpp
// Descriptor描述着色器如何访问资源
struct DescriptorInfo {
    VkDescriptorType type;           // 类型：UBO, Sampler, Storage Image等
    VkShaderStageFlags stage_flags;  // 着色器阶段
    uint32_t binding;                // 绑定点
    uint32_t descriptor_count;       // 数量
    VkDescriptorImageInfo image_info;    // 图像信息
    VkDescriptorBufferInfo buffer_info; // 缓冲信息
};

// 1. 创建Descriptor Set Layout
std::vector<VkDescriptorSetLayoutBinding> bindings = {
    // Binding 0: Uniform Buffer
    {
        .binding = 0,
        .descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
        .descriptorCount = 1,
        .stageFlags = VK_SHADER_STAGE_VERTEX_BIT,
        .pImmutableSamplers = nullptr
    },
    // Binding 1: Texture Sampler
    {
        .binding = 1,
        .descriptorType = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
        .descriptorCount = 1,
        .stageFlags = VK_SHADER_STAGE_FRAGMENT_BIT,
        .pImmutableSamplers = nullptr
    }
};

VkDescriptorSetLayoutCreateInfo layout_info = {};
layout_info.sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
layout_info.bindingCount = static_cast<uint32_t>(bindings.size());
layout_info.pBindings = bindings.data();

VkDescriptorSetLayout descriptor_set_layout;
vkCreateDescriptorSetLayout(device, &layout_info, nullptr, &descriptor_set_layout);

// 2. 创建Descriptor Pool
std::array<VkDescriptorPoolSize, 2> pool_sizes = {{
    {VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, 100},
    {VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, 100}
}};

VkDescriptorPoolCreateInfo pool_info = {};
pool_info.sType = VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO;
pool_info.poolSizeCount = static_cast<uint32_t>(pool_sizes.size());
pool_info.pPoolSizes = pool_sizes.data();
pool_info.maxSets = 100;
pool_info.flags = 0;  // 或 VK_DESCRIPTOR_POOL_CREATE_FREE_DESCRIPTOR_SET_BIT

VkDescriptorPool descriptor_pool;
vkCreateDescriptorPool(device, &pool_info, nullptr, &descriptor_pool);

// 3. 分配Descriptor Set
std::vector<VkDescriptorSetLayout> layouts(swap_chain_images.size(), descriptor_set_layout);
VkDescriptorSetAllocateInfo alloc_info = {};
alloc_info.sType = VK_STRUCTURE_TYPE_DESCRIPTOR_SET_ALLOCATE_INFO;
alloc_info.descriptorPool = descriptor_pool;
alloc_info.descriptorSetCount = static_cast<uint32_t>(swap_chain_images.size());
alloc_info.pSetLayouts = layouts.data();

std::vector<VkDescriptorSet> descriptor_sets(swap_chain_images.size());
vkAllocateDescriptorSets(device, &alloc_info, descriptor_sets.data());

// 4. 更新Descriptor Set
for (size_t i = 0; i < swap_chain_images.size(); i++) {
    VkDescriptorBufferInfo buffer_info = {};
    buffer_info.buffer = uniform_buffers[i];
    buffer_info.offset = 0;
    buffer_info.range = sizeof(UniformBufferObject);

    VkDescriptorImageInfo image_info = {};
    image_info.imageLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;
    image_info.imageView = texture_image_view;
    image_info.sampler = texture_sampler;

    std::array<VkWriteDescriptorSet, 2> descriptor_writes = {};

    // UBO
    descriptor_writes[0].sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
    descriptor_writes[0].dstSet = descriptor_sets[i];
    descriptor_writes[0].dstBinding = 0;
    descriptor_writes[0].dstArrayElement = 0;
    descriptor_writes[0].descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
    descriptor_writes[0].descriptorCount = 1;
    descriptor_writes[0].pBufferInfo = &buffer_info;

    // Texture
    descriptor_writes[1].sType = VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
    descriptor_writes[1].dstSet = descriptor_sets[i];
    descriptor_writes[1].dstBinding = 1;
    descriptor_writes[1].dstArrayElement = 0;
    descriptor_writes[1].descriptorType = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
    descriptor_writes[1].descriptorCount = 1;
    descriptor_writes[1].pImageInfo = &image_info;

    vkUpdateDescriptorSets(device,
        static_cast<uint32_t>(descriptor_writes.size()),
        descriptor_writes.data(),
        0, nullptr);
}

// 5. 绑定Descriptor Set（渲染时）
vkCmdBindDescriptorSets(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS,
    pipeline_layout, 0, 1, &descriptor_sets[image_index], 0, nullptr);
```

---

### 材质系统架构

#### 材质定义

```cpp
// 材质属性定义
struct MaterialProperty {
    enum class Type {
        Float,
        Vec2,
        Vec3,
        Vec4,
        Texture
    };

    std::string name;
    Type type;
    union {
        float float_value;
        vec2 vec2_value;
        vec3 vec3_value;
        vec4 vec4_value;
    };
    std::shared_ptr<Texture> texture_value;
};

// 材质类
class Material {
public:
    Material(std::string name) : m_name(name) {}

    void setShader(std::shared_ptr<Shader> shader) {
        m_shader = shader;
    }

    void setProperty(const std::string& name, float value) {
        m_properties[name] = {name, MaterialProperty::Type::Float};
        m_properties[name].float_value = value;
    }

    void setProperty(const std::string& name, const vec3& value) {
        m_properties[name] = {name, MaterialProperty::Type::Vec3};
        m_properties[name].vec3_value = value;
    }

    void setProperty(const std::string& name, std::shared_ptr<Texture> texture) {
        m_properties[name] = {name, MaterialProperty::Type::Texture};
        m_properties[name].texture_value = texture;
    }

    void apply(VkCommandBuffer cmd) {
        m_shader->bind(cmd);

        for (auto& [name, property] : m_properties) {
            switch (property.type) {
                case MaterialProperty::Type::Float:
                    m_shader->setUniform(name, property.float_value);
                    break;
                case MaterialProperty::Type::Vec3:
                    m_shader->setUniform(name, property.vec3_value);
                    break;
                case MaterialProperty::Type::Texture:
                    m_shader->setTexture(name, property.texture_value);
                    break;
            }
        }
    }

private:
    std::string m_name;
    std::shared_ptr<Shader> m_shader;
    std::unordered_map<std::string, MaterialProperty> m_properties;
};
```

#### 材质配置文件

```json
{
    "name": "StandardMaterial",
    "shader": "shaders/standard.glsl",
    "properties": {
        "albedo": {
            "type": "texture",
            "value": "textures/albedo.png"
        },
        "normal": {
            "type": "texture",
            "value": "textures/normal.png"
        },
        "metallic": {
            "type": "float",
            "value": 0.5
        },
        "roughness": {
            "type": "float",
            "value": 0.3
        },
        "emissive": {
            "type": "vec3",
            "value": [0.0, 0.0, 0.0]
        }
    }
}
```

#### 着色器变体

```cpp
// 着色器变体用于支持不同的材质配置
struct ShaderVariant {
    std::vector<std::string> defines;  // 预处理器定义
    VkPipeline pipeline;               // 编译后的管线
};

class Shader {
public:
    void addVariant(const std::vector<std::string>& defines) {
        ShaderVariant variant;
        variant.defines = defines;

        // 生成着色器代码
        std::string vert_code = preprocessShader(loadFile("vert.glsl"), defines);
        std::string frag_code = preprocessShader(loadFile("frag.glsl"), defines);

        // 创建Pipeline
        variant.pipeline = createPipeline(vert_code, frag_code);

        m_variants.push_back(variant);
    }

    VkPipeline getVariant(const std::vector<std::string>& defines) {
        // 查找已有变体
        for (auto& variant : m_variants) {
            if (variant.defines == defines) {
                return variant.pipeline;
            }
        }
        // 创建新变体
        addVariant(defines);
        return m_variants.back().pipeline;
    }

private:
    std::vector<ShaderVariant> m_variants;

    std::string preprocessShader(const std::string& source,
                                 const std::vector<std::string>& defines) {
        std::string result = "#version 450\n";
        for (auto& define : defines) {
            result += "#define " + define + "\n";
        }
        result += source;
        return result;
    }
};

// 使用示例
auto pipeline = shader->getVariant({"USE_NORMAL_MAP", "USE_PBR"});
```

---

## 关键目录

```
runtime/function/render/
├── resource/
│   ├── vertex_buffer.h
│   ├── index_buffer.h
│   ├── uniform_buffer.h
│   ├── texture.h
│   ├── texture_loader.h
│   ├── sampler.h
│   └── material.h
├── descriptor/
│   ├── descriptor_set_layout.h
│   ├── descriptor_pool.h
│   ├── descriptor_set.h
│   └── descriptor_manager.h
└── shader/
    ├── shader.h
    ├── shader_compiler.h
    └── shader_variant.h

engine/shader/
├── vert/
│   ├── mesh.vert.glsl        # 网格顶点着色器
│   └── skeletal_mesh.vert.glsl  # 骨骼网格顶点着色器
├── frag/
│   ├── standard.frag.glsl    # PBR材质
│   ├── unlit.frag.glsl       # 无光照材质
│   └── skybox.frag.glsl      # 天空盒
└── comp/
    └── compute.glsl          # 计算着色器
```

---

## 着色器代码示例

### 顶点着色器 (mesh.vert.glsl)

```glsl
#version 450

// 输入
layout(location = 0) in vec3 in_position;
layout(location = 1) in vec3 in_normal;
layout(location = 2) in vec2 in_texcoord;
layout(location = 3) in vec3 in_tangent;

// Uniform缓冲
layout(binding = 0) uniform UniformBufferObject {
    mat4 model;
    mat4 view;
    mat4 proj;
} ubo;

// 输出到片段着色器
layout(location = 0) out vec3 frag_position;
layout(location = 1) out vec3 frag_normal;
layout(location = 2) out vec2 frag_texcoord;
layout(location = 3) out vec3 frag_tangent;
layout(location = 4) out vec3 frag_bitangent;

void main() {
    vec4 world_position = ubo.model * vec4(in_position, 1.0);
    frag_position = world_position.xyz;

    // 法线变换（使用法线矩阵）
    mat3 normal_matrix = transpose(inverse(mat3(ubo.model)));
    frag_normal = normalize(normal_matrix * in_normal);
    frag_tangent = normalize(normal_matrix * in_tangent);
    frag_bitangent = cross(frag_normal, frag_tangent);

    frag_texcoord = in_texcoord;

    gl_Position = ubo.proj * ubo.view * world_position;
}
```

### 片段着色器 (standard.frag.glsl)

```glsl
#version 450

// 输入
layout(location = 0) in vec3 frag_position;
layout(location = 1) in vec3 frag_normal;
layout(location = 2) in vec2 frag_texcoord;
layout(location = 3) in vec3 frag_tangent;
layout(location = 4) in vec3 frag_bitangent;

// 纹理采样器
layout(binding = 1) uniform sampler2D albedo_map;
layout(binding = 2) uniform sampler2D normal_map;
layout(binding = 3) uniform sampler2D metallic_map;
layout(binding = 4) uniform sampler2D roughness_map;
layout(binding = 5) uniform sampler2D ao_map;

// 材质参数
layout(push_constant) uniform MaterialParams {
    vec4 albedo_color;
    float metallic;
    float roughness;
    float ao;
    int use_normal_map;
} material;

// 输出
layout(location = 0) out vec4 out_color;

// PBR计算
vec3 calculatePBR(vec3 N, vec3 V, vec3 albedo, float metallic, float roughness) {
    // 简化的PBR实现
    vec3 Lo = vec3(0.0);

    // 遍历光源（简化：单个方向光）
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));
    vec3 H = normalize(V + L);

    // 漫反射
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    // 镜面反射
    float NDF = distributionGGX(N, H, roughness);
    float G = geometrySmith(N, V, L, roughness);
    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    // 能量守恒
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;

    // Cook-Torrance BRDF
    float NdotL = max(dot(N, L), 0.0);
    Lo = (kD * albedo / PI + specular) * NdotL;

    // 环境光
    vec3 ambient = vec3(0.03) * albedo * material.ao;
    vec3 color = ambient + Lo;

    // HDR色调映射
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2));

    return color;
}

void main() {
    vec3 albedo = texture(albedo_map, frag_texcoord).rgb * material.albedo_color.rgb;
    vec3 N = normalize(frag_normal);

    // 法线贴图
    if (material.use_normal_map == 1) {
        vec3 tangent_normal = texture(normal_map, frag_texcoord).rgb * 2.0 - 1.0;
        mat3 TBN = mat3(frag_tangent, frag_bitangent, N);
        N = normalize(TBN * tangent_normal);
    }

    float metallic = texture(metallic_map, frag_texcoord).r * material.metallic;
    float roughness = texture(roughness_map, frag_texcoord).r * material.roughness;
    float ao = texture(ao_map, frag_texcoord).r;

    vec3 V = normalize(camera_position - frag_position);
    vec3 color = calculatePBR(N, V, albedo, metallic, roughness);

    out_color = vec4(color, 1.0);
}
```

---

## 实践任务

### 任务1: 理解材质系统

1. 查看材质配置文件
```bash
# 查看引擎中的材质定义
find engine/assets -name "*.mat" -type f
```

2. 修改材质参数
```json
// 修改一个材质文件，观察效果变化
{
    "albedo": [1.0, 0.0, 0.0],  // 红色
    "metallic": 0.9,            // 高金属度
    "roughness": 0.1            // 光滑表面
}
```

### 任务2: 创建新材质

```cpp
// 代码：创建一个新的发光材质
auto emissive_material = std::make_shared<Material>("Emissive");
emissive_material->setShader(emissive_shader);
emissive_material->setProperty("albedo", vec3(1.0, 0.5, 0.0));  // 橙色
emissive_material->setProperty("emissive", vec3(5.0, 2.5, 0.0)); // 高亮度
```

### 任务3: 着色器实验

1. 修改着色器代码
```glsl
// 在片段着色器中添加调试输出
void main() {
    vec3 normal = frag_normal * 0.5 + 0.5;  // 可视化法线
    out_color = vec4(normal, 1.0);
}
```

2. 添加新的着色器变体
```cpp
// 创建支持顶点颜色的材质变体
shader->addVariant({"USE_VERTEX_COLOR"});
```

---

## 验证标准

- [ ] 理解GPU资源管理
  - [ ] 能创建和销毁Buffer
  - [ ] 理解Staging Buffer的作用
  - [ ] 掌握纹理加载流程
  - [ ] 理解Mipmap的作用

- [ ] 掌握Descriptor系统
  - [ ] 理解Descriptor Set Layout
  - [ ] 能创建和更新Descriptor Set
  - [ ] 知道何时绑定Descriptor Set

- [ ] 理解材质系统
  - [ ] 能解释材质属性的作用
  - [ ] 理解着色器变体机制
  - [ ] 能创建和配置材质

- [ ] 实践完成
  - [ ] 查看着色器文件
  - [ ] 修改材质参数
  - [ ] 编写简单着色器代码

---

## 学习笔记

### 重点总结
<!-- 在此记录本周学习的重点内容 -->

### 疑问记录
<!-- 在此记录学习过程中的疑问 -->

### 代码实践记录
<!-- 在此记录编写的练习代码和遇到的问题 -->

---

## 下周预告

第6周将学习场景管理系统：
- 场景图组织
- 空间划分技术
- ECS架构深入
- 视锥体裁剪

**准备事项**:
- [ ] 复习数据结构（树、图）
- [ ] 了解空间数据结构
- [ ] 预习ECS模式
