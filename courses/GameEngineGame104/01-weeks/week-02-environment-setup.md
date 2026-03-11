# 第2周: 环境搭建与图形学基础

> **学习目标**: 搭建开发环境，补充图形学基础知识
>
> **时间安排**: 2026-02-26 ~ 2026-03-05
> **学习时长**: 每天2-3小时

---

## 本周学习重点

### 1. 开发环境搭建
- [ ] 安装Visual Studio 2019+ / VSCode
- [ ] 安装CMake 3.19+
- [ ] 克隆Piccolo引擎仓库
- [ ] 安装Vulkan SDK
- [ ] 安装Python（用于构建脚本）

### 2. 图形学基础
- [ ] 渲染管线概述（应用→几何→光栅化）
- [ ] 坐标系统（模型→世界→视图→裁剪→屏幕）
- [ ] 变换矩阵（平移、旋转、缩放）
- [ ] 光栅化基础

### 3. 线性代数复习
- [ ] 向量运算（点乘、叉乘）
- [ ] 矩阵运算
- [ ] 四元数基础（用于旋转）

---

## 学习资源

### 开发工具下载
| 工具 | 下载地址 | 用途 |
|------|----------|------|
| Visual Studio | https://visualstudio.microsoft.com/ | C++ IDE |
| CMake | https://cmake.org/download/ | 构建系统 |
| Vulkan SDK | https://vulkan.lunarg.com/ | 图形API |
| Git | https://git-scm.com/ | 版本控制 |
| RenderDoc | https://renderdoc.org/ | 图形调试 |

### 图形学学习
- **《3D游戏编程大师技巧》** - 第5-7章
- **《Real-Time Rendering》** - 第2章
- **LearnOpenGL-CN**: https://learnopengl-cn.github.io/
- **Vulkan Tutorial**: https://vulkan-tutorial.com/

---

## 开发环境搭建步骤

### Windows环境

#### 1. 安装Visual Studio
```bash
# 下载 Visual Studio 2022 Community（免费）
# 安装时勾选组件：
- 使用C++的桌面开发
- C++ CMake工具
- Windows 10/11 SDK
```

#### 2. 安装CMake
```bash
# 下载 CMake 安装包
# 添加到系统 PATH
cmake --version  # 验证安装
```

#### 3. 安装Vulkan SDK
```bash
# 下载 Vulkan SDK
# 安装后设置环境变量
VULKAN_SDK=C:\VulkanSDK\1.x.x.x
```

#### 4. 克隆引擎仓库
```bash
cd C:\dev
git clone https://github.com/BoomingTech/Piccolo.git
cd Piccolo

# 查看目录结构
tree /F /A
```

### Linux环境（WSL）

```bash
# 更新包管理器
sudo apt update

# 安装依赖
sudo apt install -y \
    build-essential \
    cmake \
    git \
    libvulkan-dev \
    vulkan-tools \
    python3 \
    python3-pip

# 克隆仓库
cd ~/dev
git clone https://github.com/BoomingTech/Piccolo.git
cd Piccolo
```

---

## 渲染管线基础

### 渲染管线流程图

```
应用阶段 (Application Stage)
    ├── CPU处理
    ├── 场景遍历
    ├── 视锥体裁剪
    └── 提交绘制命令
         ↓
几何阶段 (Geometry Stage)
    ├── 模型变换 (Model Transform)
    ├── 世界变换 (World Transform)
    ├── 视图变换 (View Transform)
    ├── 投影变换 (Projection Transform)
    ├── 裁剪 (Clipping)
    └── 屏幕映射 (Screen Mapping)
         ↓
光栅化阶段 (Rasterization Stage)
    ├── 三角形设置 (Triangle Setup)
    ├── 三角形遍历 (Triangle Traversal)
    ├── 像素着色 (Pixel Shading)
    └── 输出合并 (Output Merger)
         ↓
帧缓冲 (Frame Buffer)
```

---

## 坐标系统详解

### 1. 局部空间 (Local Space)
- 对象自身的坐标系
- 原点通常在物体中心

### 2. 世界空间 (World Space)
- 所有对象共享的全局坐标系
- 通过模型矩阵从局部空间转换

### 3. 观察空间 (View Space)
- 以摄像机为原点的坐标系
- 通过视图矩阵转换

### 4. 裁剪空间 (Clip Space)
- 用于视锥体裁剪
- 通过投影矩阵转换
- 范围 [-1, 1] 或 [0, 1]

### 5. 屏幕空间 (Screen Space)
- 最终像素坐标
- 通过视口变换

### 坐标变换代码示例

```cpp
// 伪代码：顶点变换流程
vec4 local_pos = vertex.position;  // 局部坐标

// 模型矩阵：局部 -> 世界
mat4 model_matrix = translate * rotate * scale;
vec4 world_pos = model_matrix * local_pos;

// 视图矩阵：世界 -> 观察
mat4 view_matrix = camera.GetViewMatrix();
vec4 view_pos = view_matrix * world_pos;

// 投影矩阵：观察 -> 裁剪
mat4 projection_matrix = camera.GetProjectionMatrix();
vec4 clip_pos = projection_matrix * view_pos;

// 透视除法：裁剪 -> NDC
vec3 ndc_pos = clip_pos.xyz / clip_pos.w;

// 视口变换：NDC -> 屏幕
vec2 screen_pos = viewport_transform(ndc_pos);
```

---

## 变换矩阵

### 平移矩阵 (Translation)

```
| 1  0  0  tx |
| 0  1  0  ty |
| 0  0  1  tz |
| 0  0  0  1  |
```

### 缩放矩阵 (Scale)

```
| sx  0   0   0 |
| 0   sy  0   0 |
| 0   0   sz  0 |
| 0   0   0   1 |
```

### 旋转矩阵 (Rotation)

**绕X轴旋转**:
```
| 1    0        0        0 |
| 0  cos(θ) -sin(θ)    0 |
| 0  sin(θ)  cos(θ)    0 |
| 0    0        0        1 |
```

**绕Y轴旋转**:
```
| cos(θ)   0   sin(θ)   0 |
|   0      1     0      0 |
| -sin(θ)  0   cos(θ)   0 |
|   0      0     0      1 |
```

**绕Z轴旋转**:
```
| cos(θ) -sin(θ)   0   0 |
| sin(θ)  cos(θ)   0   0 |
|   0       0      1   0 |
|   0       0      0   1 |
```

---

## 向量运算

### 点乘 (Dot Product)

```cpp
// 几何意义：计算夹角、投影
float dot(const vec3& a, const vec3& b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

// 应用：计算两向量夹角
float angle = acos(dot(a, b) / (length(a) * length(b)));

// 应用：判断向量方向
if (dot(forward, direction) > 0) {
    // 同向
}
```

### 叉乘 (Cross Product)

```cpp
// 几何意义：获得垂直向量
vec3 cross(const vec3& a, const vec3& b) {
    return {
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    };
}

// 应用：计算法线
vec3 normal = normalize(cross(v1 - v0, v2 - v0));

// 应用：判断左右
vec3 side = cross(forward, up);
```

---

## 四元数 (Quaternion)

### 为什么使用四元数？

- 避免万向节锁 (Gimbal Lock)
- 插值更平滑
- 存储空间小（4个float vs 9个float）

### 四元数表示

```
q = w + xi + yj + zk
q = (w, x, y, z)

其中：
- w 是标量部分
- (x, y, z) 是向量部分
```

### 四元数运算

```cpp
struct Quaternion {
    float w, x, y, z;

    // 四元数乘法（旋转组合）
    Quaternion operator*(const Quaternion& q) const {
        return {
            w*q.w - x*q.x - y*q.y - z*q.z,
            w*q.x + x*q.w + y*q.z - z*q.y,
            w*q.y - x*q.z + y*q.w + z*q.x,
            w*q.z + x*q.y - y*q.x + z*q.w
        };
    }

    // 旋转向量
    vec3 rotate(const vec3& v) const {
        Quaternion vq(0, v.x, v.y, v.z);
        Quaternion result = (*this) * vq * inverse();
        return {result.x, result.y, result.z};
    }
};

// 创建旋转四元数
Quaternion fromAxisAngle(const vec3& axis, float angle) {
    float half_angle = angle * 0.5f;
    float s = sin(half_angle);
    return {
        cos(half_angle),
        axis.x * s,
        axis.y * s,
        axis.z * s
    };
}

// 四元数球面插值（SLERP）
Quaternion slerp(const Quaternion& a, const Quaternion& b, float t) {
    float dot = a.w*b.w + a.x*b.x + a.y*b.y + a.z*b.z;

    if (dot < 0.0f) {
        // 选择最短路径
        Quaternion temp = -b;
        return slerp(a, temp, t);
    }

    // ... 插值计算
}
```

---

## Piccolo引擎目录结构预览

```
Piccolo/
├── engine/                  # 引擎源码
│   ├── source/
│   │   ├── runtime/
│   │   │   ├── core/       # 基础设施
│   │   │   │   ├── base/   # 基础定义
│   │   │   │   ├── math/   # 数学库 ★ 重点
│   │   │   │   ├── log/    # 日志系统
│   │   │   │   └── meta/   # 反射系统
│   │   │   └── function/
│   │   │       ├── render/ # 渲染系统
│   │   │       └── ...
│   │   └── editor/
│   └── shader/              # 着色器文件
├── build_*.sh/bat          # 构建脚本
├── CMakeLists.txt          # CMake配置
└── README.md               # 项目说明
```

---

## 实践任务

### 任务1: 编写向量数学库

实现一个简单的3D向量类，包含常用运算：

```cpp
struct vec3 {
    float x, y, z;

    // TODO: 实现以下功能
    vec3 operator+(const vec3& other) const;
    vec3 operator-(const vec3& other) const;
    vec3 operator*(float scalar) const;
    float length() const;
    vec3 normalize() const;
    float dot(const vec3& other) const;
    vec3 cross(const vec3& other) const;
};

// TODO: 实现矩阵类
struct mat4 {
    float m[16];  // 行优先存储

    static mat4 identity();
    static mat4 translate(const vec3& t);
    static mat4 scale(const vec3& s);
    static mat4 rotate(float angle, const vec3& axis);
    static mat4 perspective(float fov, float aspect, float near, float far);
    static mat4 lookAt(const vec3& eye, const vec3& center, const vec3& up);

    mat4 operator*(const mat4& other) const;
};
```

### 任务2: 搭建Vulkan测试环境

创建一个最简单的Vulkan程序，验证环境配置：

```cpp
// TODO: 实现基本的Vulkan初始化
// 1. 创建Instance
// 2. 选择物理设备
// 3. 创建逻辑设备和队列
// 4. 创建交换链
// 5. 渲染一个三角形
```

### 任务3: 理解渲染管线

使用RenderDoc捕获一个简单程序的一帧，分析：
- [ ] 绘制调用（Draw Call）
- [ ] 顶点着色器输入/输出
- [ ] 像素着色器输入/输出
- [ ] 渲染目标（Render Target）

---

## 常见问题

### Q: CMake编译失败
**A**: 检查以下项：
- CMake版本是否 >= 3.19
- 编译器是否支持C++17
- Vulkan SDK是否正确安装
- 环境变量是否正确设置

### Q: Vulkan验证层报错
**A**:
- 确保安装了Vulkan验证层
- 检查Vulkan SDK版本兼容性
- 使用`vkconfig`工具配置验证层

### Q: 数学库选择
**A**: 学习阶段建议：
- 第1阶段：自己实现简单版本，理解原理
- 第2阶段：使用GLM库（类似GLSL的C++库）
- 第3阶段：阅读引擎自研数学库

---

## 验证标准

- [ ] 成功搭建开发环境
  - [ ] 能编译运行C++项目
  - [ ] CMake工作正常
  - [ ] Vulkan SDK可用

- [ ] 理解渲染管线流程
  - [ ] 能解释各阶段作用
  - [ ] 理解坐标变换流程
  - [ ] 知道什么是光栅化

- [ ] 掌握基础数学知识
  - [ ] 能进行向量运算
  - [ ] 理解矩阵变换
  - [ ] 了解四元数用途

---

## 学习笔记

### 重点总结
<!-- 在此记录本周学习的重点内容 -->

### 疑问记录
<!-- 在此记录学习过程中的疑问 -->

### 环境配置记录
<!-- 在此记录环境配置和遇到的问题 -->

---

## 下周预告

第3周将进行引擎编译与代码导读：
- 执行构建脚本
- 解决编译依赖问题
- 理解引擎入口点
- 阅读核心模块代码

**准备事项**:
- [ ] 确保所有依赖已安装
- [ ] 准备调试工具
- [ ] 预留足够编译时间
