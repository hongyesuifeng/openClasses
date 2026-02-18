# 第4周: 渲染系统（一）- 渲染管线基础

> **学习目标**: 理解现代渲染管线架构
>
> **时间安排**: 2026-03-14 ~ 2026-03-21
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 渲染管线概述
- [ ] 应用阶段 → 几何阶段 → 光栅化阶段
- [ ] Vulkan渲染管线特点
- [ ] 图形管线状态对象（PSO）

### 2. Piccolo渲染系统
- [ ] `runtime/function/render/` 模块结构
- [ ] RenderDevice抽象
- [ ] 交换链和帧缓冲
- [ ] 命令缓冲区和队列提交

### 3. Vulkan API基础
- [ ] Instance、Device、Queue
- [ ] Render Pass和Frame Buffer
- [ ] Pipeline和Shader

### 4. 实践任务
- [ ] 运行Piccolo编辑器，查看渲染输出
- [ ] 使用RenderDoc分析一帧的渲染过程
- [ ] 理解Forward vs Deferred渲染路径
- [ ] 查看着色器文件 (`engine/shader/`)

---

## 核心知识点

### Vulkan渲染管线流程

```
1. Application (应用层)
   └── Piccolo引擎
       └── High-level rendering API

2. Render Device (设备层)
   ├── Logical Device
   ├── Physical Device
   ├── Queues (Graphics, Present, Transfer)
   └── Command Pools

3. Command Buffer (命令层)
   ├── Recording commands
   ├── Submitting to queue
   └── Synchronization (Fences, Semaphores)

4. GPU Execution (执行层)
   ├── Vertex Processing
   ├── Rasterization
   ├── Fragment Processing
   └── Framebuffer Output
```

### Vulkan初始化

```cpp
// 1. 创建Instance
VkApplicationInfo app_info = {};
app_info.sType = VK_STRUCTURE_TYPE_APPLICATION_INFO;
app_info.pApplicationName = "Piccolo Engine";
app_info.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
app_info.pEngineName = "Piccolo Engine";
app_info.engineVersion = VK_MAKE_VERSION(1, 0, 0);
app_info.apiVersion = VK_API_VERSION_1_3;

VkInstanceCreateInfo create_info = {};
create_info.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
create_info.pApplicationInfo = &app_info;

// 启用验证层（Debug模式）
#ifdef ENABLE_VALIDATION_LAYERS
create_info.enabledLayerCount = validation_layers.size();
create_info.ppEnabledLayerNames = validation_layers.data();
#endif

// 扩展
uint32_t glfw_extension_count = 0;
const char** glfw_extensions = glfwGetRequiredInstanceExtensions(&glfw_extension_count);

create_info.enabledExtensionCount = glfw_extension_count;
create_info.ppEnabledExtensionNames = glfw_extensions;

VkInstance instance;
vkCreateInstance(&create_info, nullptr, &instance);

// 2. 选择物理设备
uint32_t device_count = 0;
vkEnumeratePhysicalDevices(instance, &device_count, nullptr);

std::vector<VkPhysicalDevice> devices(device_count);
vkEnumeratePhysicalDevices(instance, &device_count, devices.data());

// 选择合适的物理设备
for (const auto& device : devices) {
    if (isDeviceSuitable(device)) {
        physical_device = device;
        break;
    }
}

// 3. 创建逻辑设备
QueueFamilyIndices indices = findQueueFamilies(physical_device);

std::vector<VkDeviceQueueCreateInfo> queue_create_infos;
std::set<uint32_t> unique_queue_families = {
    indices.graphics_family.value(),
    indices.present_family.value()
};

float queue_priority = 1.0f;
for (uint32_t queue_family : unique_queue_families) {
    VkDeviceQueueCreateInfo queue_create_info = {};
    queue_create_info.sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO;
    queue_create_info.queueFamilyIndex = queue_family;
    queue_create_info.queueCount = 1;
    queue_create_info.pQueuePriorities = &queue_priority;
    queue_create_infos.push_back(queue_create_info);
}

VkPhysicalDeviceFeatures device_features = {};
device_features.samplerAnisotropy = VK_TRUE;
device_features.fillModeNonSolid = VK_TRUE;  // 线框渲染

VkDeviceCreateInfo device_create_info = {};
device_create_info.sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO;
device_create_info.queueCreateInfoCount = queue_create_infos.size();
device_create_info.pQueueCreateInfos = queue_create_infos.data();
device_create_info.pEnabledFeatures = &device_features;
device_create_info.enabledExtensionCount = device_extensions.size();
device_create_info.ppEnabledExtensionNames = device_extensions.data();

VkDevice device;
vkCreateDevice(physical_device, &device_create_info, nullptr, &device);

// 4. 获取队列
vkGetDeviceQueue(device, indices.graphics_family.value(), 0, &graphics_queue);
vkGetDeviceQueue(device, indices.present_family.value(), 0, &present_queue);

// 5. 创建交换链
VkSurfaceKHR surface;
glfwCreateWindowSurface(instance, window, nullptr, &surface);

SwapChainSupportDetails swap_chain_support = querySwapChainSupport(physical_device, surface);

VkSurfaceFormatKHR surface_format = chooseSwapSurfaceFormat(swap_chain_support.formats);
VkPresentModeKHR present_mode = chooseSwapPresentMode(swap_chain_support.present_modes);
VkExtent2D extent = chooseSwapExtent(swap_chain_support.capabilities, window);

uint32_t image_count = swap_chain_support.capabilities.minImageCount + 1;
if (swap_chain_support.capabilities.maxImageCount > 0 &&
    image_count > swap_chain_support.capabilities.maxImageCount) {
    image_count = swap_chain_support.capabilities.maxImageCount;
}

VkSwapchainCreateInfoKHR swap_chain_create_info = {};
swap_chain_create_info.sType = VK_STRUCTURE_TYPE_SWAPCHAIN_CREATE_INFO_KHR;
swap_chain_create_info.surface = surface;
swap_chain_create_info.minImageCount = image_count;
swap_chain_create_info.imageFormat = surface_format.format;
swap_chain_create_info.imageColorSpace = surface_format.colorSpace;
swap_chain_create_info.imageExtent = extent;
swap_chain_create_info.imageArrayLayers = 1;
swap_chain_create_info.imageUsage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;

uint32_t queue_family_indices[] = {
    indices.graphics_family.value(),
    indices.present_family.value()
};

if (indices.graphics_family != indices.present_family) {
    swap_chain_create_info.imageSharingMode = VK_SHARING_MODE_CONCURRENT;
    swap_chain_create_info.queueFamilyIndexCount = 2;
    swap_chain_create_info.pQueueFamilyIndices = queue_family_indices;
} else {
    swap_chain_create_info.imageSharingMode = VK_SHARING_MODE_EXCLUSIVE;
}

swap_chain_create_info.preTransform = swap_chain_support.capabilities.currentTransform;
swap_chain_create_info.compositeAlpha = VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR;
swap_chain_create_info.presentMode = present_mode;
swap_chain_create_info.clipped = VK_TRUE;
swap_chain_create_info.oldSwapchain = VK_NULL_HANDLE;

VkSwapchainKHR swap_chain;
vkCreateSwapchainKHR(device, &swap_chain_create_info, nullptr, &swap_chain);
```

### 渲染通道（Render Pass）

```cpp
// 颜色附件
VkAttachmentDescription color_attachment = {};
color_attachment.format = swap_chain_image_format;
color_attachment.samples = VK_SAMPLE_COUNT_1_BIT;
color_attachment.loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR;
color_attachment.storeOp = VK_ATTACHMENT_STORE_OP_STORE;
color_attachment.stencilLoadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE;
color_attachment.stencilStoreOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
color_attachment.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
color_attachment.finalLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR;

VkAttachmentReference color_attachment_ref = {};
color_attachment_ref.attachment = 0;
color_attachment_ref.layout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;

// 深度附件
VkAttachmentDescription depth_attachment = {};
depth_attachment.format = findDepthFormat();
depth_attachment.samples = VK_SAMPLE_COUNT_1_BIT;
depth_attachment.loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR;
depth_attachment.storeOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
depth_attachment.stencilLoadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE;
depth_attachment.stencilStoreOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
depth_attachment.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
depth_attachment.finalLayout = VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL;

VkAttachmentReference depth_attachment_ref = {};
depth_attachment_ref.attachment = 1;
depth_attachment_ref.layout = VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL;

// Subpass
VkSubpassDescription subpass = {};
subpass.pipelineBindPoint = VK_PIPELINE_BIND_POINT_GRAPHICS;
subpass.colorAttachmentCount = 1;
subpass.pColorAttachments = &color_attachment_ref;
subpass.pDepthStencilAttachment = &depth_attachment_ref;

// Subpass依赖（用于延迟渲染或高级效果）
VkSubpassDependency dependency = {};
dependency.srcSubpass = VK_SUBPASS_EXTERNAL;
dependency.dstSubpass = 0;
dependency.srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT |
                          VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT;
dependency.srcAccessMask = 0;
dependency.dstStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT |
                          VK_PIPELINE_STAGE_LATE_FRAGMENT_TESTS_BIT;
dependency.dstAccessMask = VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT |
                           VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT;

// 创建Render Pass
std::array<VkAttachmentDescription, 2> attachments = {color_attachment, depth_attachment};
VkRenderPassCreateInfo render_pass_info = {};
render_pass_info.sType = VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO;
render_pass_info.attachmentCount = attachments.size();
render_pass_info.pAttachments = attachments.data();
render_pass_info.subpassCount = 1;
render_pass_info.pSubpasses = &subpass;
render_pass_info.dependencyCount = 1;
render_pass_info.pDependencies = &dependency;

VkRenderPass render_pass;
vkCreateRenderPass(device, &render_pass_info, nullptr, &render_pass);
```

### 图形管线状态对象（PSO）

```cpp
// 1. 着色器阶段
VkShaderModule vert_shader = createShaderModule(vert_code);
VkShaderModule frag_shader = createShaderModule(frag_code);

VkPipelineShaderStageCreateInfo vert_stage_info = {};
vert_stage_info.sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO;
vert_stage_info.stage = VK_SHADER_STAGE_VERTEX_BIT;
vert_stage_info.module = vert_shader;
vert_stage_info.pName = "main";

VkPipelineShaderStageCreateInfo frag_stage_info = {};
frag_stage_info.sType = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO;
frag_stage_info.stage = VK_SHADER_STAGE_FRAGMENT_BIT;
frag_stage_info.module = frag_shader;
frag_stage_info.pName = "main";

VkPipelineShaderStageCreateInfo shader_stages[] = {vert_stage_info, frag_stage_info};

// 2. 顶点输入
VkPipelineVertexInputStateCreateInfo vertex_input_info = {};
vertex_input_info.sType = VK_STRUCTURE_TYPE_PIPELINE_VERTEX_INPUT_STATE_CREATE_INFO;
vertex_input_info.vertexBindingDescriptionCount = 1;
vertex_input_info.pVertexBindingDescriptions = &binding_description;
vertex_input_info.vertexAttributeDescriptionCount = attribute_descriptions.size();
vertex_input_info.pVertexAttributeDescriptions = attribute_descriptions.data();

// 3. 输入装配
VkPipelineInputAssemblyStateCreateInfo input_assembly = {};
input_assembly.sType = VK_STRUCTURE_TYPE_PIPELINE_INPUT_ASSEMBLY_STATE_CREATE_INFO;
input_assembly.topology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;
input_assembly.primitiveRestartEnable = VK_FALSE;

// 4. 视口和裁剪
VkViewport viewport = {};
viewport.x = 0.0f;
viewport.y = 0.0f;
viewport.width = (float)swap_chain_extent.width;
viewport.height = (float)swap_chain_extent.height;
viewport.minDepth = 0.0f;
viewport.maxDepth = 1.0f;

VkRect2D scissor = {};
scissor.offset = {0, 0};
scissor.extent = swap_chain_extent;

VkPipelineViewportStateCreateInfo viewport_state = {};
viewport_state.sType = VK_STRUCTURE_TYPE_PIPELINE_VIEWPORT_STATE_CREATE_INFO;
viewport_state.viewportCount = 1;
viewport_state.pViewports = &viewport;
viewport_state.scissorCount = 1;
viewport_state.pScissors = &scissor;

// 5. 光栅化
VkPipelineRasterizationStateCreateInfo rasterizer = {};
rasterizer.sType = VK_STRUCTURE_TYPE_PIPELINE_RASTERIZATION_STATE_CREATE_INFO;
rasterizer.depthClampEnable = VK_FALSE;
rasterizer.rasterizerDiscardEnable = VK_FALSE;
rasterizer.polygonMode = VK_POLYGON_MODE_FILL;
rasterizer.lineWidth = 1.0f;
rasterizer.cullMode = VK_CULL_MODE_BACK_BIT;
rasterizer.frontFace = VK_FRONT_FACE_COUNTER_CLOCKWISE;
rasterizer.depthBiasEnable = VK_FALSE;

// 6. 多重采样
VkPipelineMultisampleStateCreateInfo multisampling = {};
multisampling.sType = VK_STRUCTURE_TYPE_PIPELINE_MULTISAMPLE_STATE_CREATE_INFO;
multisampling.sampleShadingEnable = VK_FALSE;
multisampling.rasterizationSamples = VK_SAMPLE_COUNT_1_BIT;

// 7. 深度模板
VkPipelineDepthStencilStateCreateInfo depth_stencil = {};
depth_stencil.sType = VK_STRUCTURE_TYPE_PIPELINE_DEPTH_STENCIL_STATE_CREATE_INFO;
depth_stencil.depthTestEnable = VK_TRUE;
depth_stencil.depthWriteEnable = VK_TRUE;
depth_stencil.depthCompareOp = VK_COMPARE_OP_LESS;
depth_stencil.depthBoundsTestEnable = VK_FALSE;
depth_stencil.stencilTestEnable = VK_FALSE;

// 8. 颜色混合
VkPipelineColorBlendAttachmentState color_blend_attachment = {};
color_blend_attachment.colorWriteMask = VK_COLOR_COMPONENT_R_BIT |
                                        VK_COLOR_COMPONENT_G_BIT |
                                        VK_COLOR_COMPONENT_B_BIT |
                                        VK_COLOR_COMPONENT_A_BIT;
color_blend_attachment.blendEnable = VK_FALSE;

VkPipelineColorBlendStateCreateInfo color_blending = {};
color_blending.sType = VK_STRUCTURE_TYPE_PIPELINE_COLOR_BLEND_STATE_CREATE_INFO;
color_blending.logicOpEnable = VK_FALSE;
color_blending.attachmentCount = 1;
color_blending.pAttachments = &color_blend_attachment;

// 9. 动态状态
std::vector<VkDynamicState> dynamic_states = {
    VK_DYNAMIC_STATE_VIEWPORT,
    VK_DYNAMIC_STATE_SCISSOR
};

VkPipelineDynamicStateCreateInfo dynamic_state = {};
dynamic_state.sType = VK_STRUCTURE_TYPE_PIPELINE_DYNAMIC_STATE_CREATE_INFO;
dynamic_state.dynamicStateCount = dynamic_states.size();
dynamic_state.pDynamicStates = dynamic_states.data();

// 10. 创建管线
VkGraphicsPipelineCreateInfo pipeline_info = {};
pipeline_info.sType = VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO;
pipeline_info.stageCount = 2;
pipeline_info.pStages = shader_stages;
pipeline_info.pVertexInputState = &vertex_input_info;
pipeline_info.pInputAssemblyState = &input_assembly;
pipeline_info.pViewportState = &viewport_state;
pipeline_info.pRasterizationState = &rasterizer;
pipeline_info.pMultisampleState = &multisampling;
pipeline_info.pDepthStencilState = &depth_stencil;
pipeline_info.pColorBlendState = &color_blending;
pipeline_info.pDynamicState = &dynamic_state;
pipeline_info.layout = pipeline_layout;
pipeline_info.renderPass = render_pass;
pipeline_info.subpass = 0;

VkPipeline graphics_pipeline;
vkCreateGraphicsPipelines(device, VK_NULL_HANDLE, 1, &pipeline_info, nullptr, &graphics_pipeline);
```

### 命令缓冲录制

```cpp
// 开始命令缓冲
VkCommandBufferBeginInfo begin_info = {};
begin_info.sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO;
begin_info.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;

vkBeginCommandBuffer(command_buffer, &begin_info);

// 开始Render Pass
VkRenderPassBeginInfo render_pass_info = {};
render_pass_info.sType = VK_STRUCTURE_TYPE_RENDER_PASS_BEGIN_INFO;
render_pass_info.renderPass = render_pass;
render_pass_info.framebuffer = framebuffer;
render_pass_info.renderArea.offset = {0, 0};
render_pass_info.renderArea.extent = swap_chain_extent;

std::array<VkClearValue, 2> clear_values = {};
clear_values[0].color = {{0.0f, 0.0f, 0.0f, 1.0f}};
clear_values[1].depthStencil = {1.0f, 0};

render_pass_info.clearValueCount = clear_values.size();
render_pass_info.pClearValues = clear_values.data();

vkCmdBeginRenderPass(command_buffer, &render_pass_info, VK_SUBPASS_CONTENTS_INLINE);

// 绑定管线
vkCmdBindPipeline(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS, graphics_pipeline);

// 绑定Descriptor Set
vkCmdBindDescriptorSets(command_buffer, VK_PIPELINE_BIND_POINT_GRAPHICS,
                       pipeline_layout, 0, 1, &descriptor_set, 0, nullptr);

// 绑定顶点/索引缓冲
VkBuffer vertex_buffers[] = {vertex_buffer};
VkDeviceSize offsets[] = {0};
vkCmdBindVertexBuffers(command_buffer, 0, 1, vertex_buffers, offsets);
vkCmdBindIndexBuffer(command_buffer, index_buffer, 0, VK_INDEX_TYPE_UINT32);

// 绘制
vkCmdDrawIndexed(command_buffer, index_count, 1, 0, 0, 0);

// 结束Render Pass
vkCmdEndRenderPass(command_buffer);

// 结束命令缓冲
vkEndCommandBuffer(command_buffer);

// 提交队列
VkSubmitInfo submit_info = {};
submit_info.sType = VK_STRUCTURE_TYPE_SUBMIT_INFO;
submit_info.commandBufferCount = 1;
submit_info.pCommandBuffers = &command_buffer;

vkQueueSubmit(graphics_queue, 1, &submit_info, in_flight_fence);
```

### Forward vs Deferred渲染

```cpp
// Forward渲染（传统）
class ForwardRenderer {
public:
    void render(const std::vector<RenderObject>& objects) {
        for (auto& obj : objects) {
            // 绑定材质
            obj.material->bind();

            // 绑定网格
            obj.mesh->bind();

            // 设置变换矩阵
            setTransformUniforms(obj.transform);

            // 绘制
            vkCmdDrawIndexed(cmd, obj.mesh->getIndexCount(), 1, 0, 0, 0);
        }
    }
};

// Deferred渲染（延迟）
class DeferredRenderer {
public:
    void render(const std::vector<RenderObject>& objects) {
        // Pass 1: Geometry Pass
        geometry_pass->begin();

        for (auto& obj : objects) {
            geometry_pass->setMaterial(obj.material);
            geometry_pass->setMesh(obj.mesh);
            geometry_pass->setTransform(obj.transform);
            geometry_pass->draw();
        }

        geometry_pass->end();

        // Pass 2: Lighting Pass
        lighting_pass->begin();

        for (auto& light : lights) {
            lighting_pass->setLight(light);
            lighting_pass->draw();  // 绘制全屏四边形
        }

        lighting_pass->end();
    }

private:
    std::unique_ptr<GeometryPass> geometry_pass;  // 生成G-Buffer
    std::unique_ptr<LightingPass> lighting_pass;  // 光照计算
};
```

---

## 关键目录

```
runtime/function/render/
├── render_context.h         # 渲染上下文
├── render_device.h          # 渲染设备抽象
├── render_pipeline.h        # 渲染管线
├── swapchain.h              # 交换链
├── frame_buffer.h           # 帧缓冲
├── command_buffer.h         # 命令缓冲区
├── pipeline_state_object.h  # PSO
└── vulkan/
    ├── vulkan_context.h     # Vulkan上下文
    ├── vulkan_device.h      # Vulkan设备
    └── vulkan_swapchain.h   # Vulkan交换链
```

---

## 实践任务

### 任务1: 使用RenderDoc分析渲染

```bash
# 使用RenderDoc捕获一帧
renderdoccmd ./build/bin/PiccoloEditor.exe

# 在RenderDoc中：
# 1. 启动应用
# 2. 运行到要捕获的帧
# 3. 按 F12 捕获帧
# 4. 分析：
#    - 查看 Draw Call
#    - 查看顶点着色器输入/输出
#    - 查看像素着色器输入/输出
#    - 查看纹理和缓冲
#    - 查看管线状态
```

### 任务2: 理解着色器文件

```glsl
// 查看引擎/shader/vert/mesh.vert.glsl
#version 450

// 输入布局
layout(location = 0) in vec3 in_position;
layout(location = 1) in vec3 in_normal;
layout(location = 2) in vec2 in_texcoord;

// Uniform缓冲
layout(binding = 0) uniform UniformBufferObject {
    mat4 model;
    mat4 view;
    mat4 proj;
} ubo;

// 输出
layout(location = 0) out vec3 frag_position;
layout(location = 1) out vec3 frag_normal;
layout(location = 2) out vec2 frag_texcoord;

void main() {
    vec4 world_pos = ubo.model * vec4(in_position, 1.0);
    frag_position = world_pos.xyz;

    mat3 normal_matrix = transpose(inverse(mat3(ubo.model)));
    frag_normal = normalize(normal_matrix * in_normal);
    frag_texcoord = in_texcoord;

    gl_Position = ubo.proj * ubo.view * world_pos;
}
```

---

## 验证标准

- [ ] 理解Vulkan渲染管线
  - [ ] 知道各阶段作用
  - [ ] 理解PSO概念
  - [ ] 知道Render Pass结构

- [ ] 能阅读渲染代码
  - [ ] 理解命令缓冲录制
  - [ ] 知道如何提交绘制
  - [ ] 理解同步机制

- [ ] 实践完成
  - [ ] 运行编辑器查看渲染
  - [ ] 用RenderDoc分析
  - [ ] 理解Forward/Deferred区别

---

## 下周预告

第5周: 渲染系统（二）- GPU资源管理与材质系统
