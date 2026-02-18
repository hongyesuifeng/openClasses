# 第9周: 资源管理系统

> **学习目标**: 理解资源加载、缓存和热更新
>
> **时间安排**: 2026-04-23 ~ 2026-04-30
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 资源加载器设计
- [ ] 同步加载 vs 异步加载
- [ ] 资源依赖管理
- [ ] 加载优先级系统
- [ ] 加载进度回调

### 2. 资源缓存策略
- [ ] LRU（最近最少使用）缓存
- [ ] 引用计数管理
- [ ] 内存预算控制
- [ ] 资源卸载策略

### 3. 资源热更新
- [ ] 文件监听（File Watching）
- [ ] 运行时资源重载
- [ ] 版本兼容处理
- [ ] 热重载触发机制

### 4. 实践任务
- [ ] 分析资源加载流程
- [ ] 查看资源引用计数
- [ ] 实现简单资源预加载

---

## 核心知识点

### 资源类型定义

```cpp
// 资源类型枚举
enum class ResourceType {
    Mesh,
    Texture,
    Shader,
    Material,
    Animation,
    Audio,
    Scene,
    Unknown
};

// 资源基类
class IResource {
public:
    virtual ~IResource() = default;

    // 加载资源
    virtual bool load(const std::string& path) = 0;

    // 卸载资源
    virtual void unload() = 0;

    // 获取资源大小（字节）
    virtual size_t getMemorySize() const = 0;

    // 获取资源类型
    virtual ResourceType getType() const = 0;

    // 获取资源路径
    const std::string& getPath() const { return m_path; }
    void setPath(const std::string& path) { m_path = path; }

    // 获取最后修改时间
    const std::filesystem::file_time_type& getLastModified() const {
        return m_last_modified;
    }
    void setLastModified(const std::filesystem::file_time_type& time) {
        m_last_modified = time;
    }

    // 引用计数
    void addRef() { m_ref_count++; }
    void release() {
        m_ref_count--;
        if (m_ref_count <= 0) {
            unload();
        }
    }
    int getRefCount() const { return m_ref_count; }

protected:
    std::string m_path;
    std::filesystem::file_time_type m_last_modified;
    std::atomic<int> m_ref_count{0};
};
```

### 具体资源实现

```cpp
// 纹理资源
class TextureResource : public IResource {
public:
    bool load(const std::string& path) override {
        // 加载图像文件
        int width, height, channels;
        unsigned char* data = stbi_load(path.c_str(), &width, &height, &channels, 4);

        if (!data) {
            std::cerr << "Failed to load texture: " << path << std::endl;
            return false;
        }

        // 上传到GPU
        m_texture = std::make_shared<Texture>();
        m_texture->setData(data, width, height);
        stbi_image_free(data);

        // 计算内存大小
        m_memory_size = width * height * 4;

        // 设置修改时间
        m_last_modified = std::filesystem::last_write_time(path);

        return true;
    }

    void unload() override {
        m_texture.reset();
        m_memory_size = 0;
    }

    size_t getMemorySize() const override {
        return m_memory_size;
    }

    ResourceType getType() const override {
        return ResourceType::Texture;
    }

    std::shared_ptr<Texture> getTexture() const {
        return m_texture;
    }

private:
    std::shared_ptr<Texture> m_texture;
    size_t m_memory_size = 0;
};

// 网格资源
class MeshResource : public IResource {
public:
    bool load(const std::string& path) override {
        // 加载模型文件（.gltf, .obj等）
        tinygltf::Model model;
        tinygltf::TinyGLTF loader;
        std::string err, warn;

        bool ret = loader.LoadASCIIFromFile(&model, &err, &warn, path);

        if (!warn.empty()) {
            std::cout << "Warn: " << warn << std::endl;
        }

        if (!err.empty()) {
            std::cerr << "Err: " << err << std::endl;
        }

        if (!ret) {
            return false;
        }

        // 解析GLTF数据
        parseGLTF(model);

        // 设置修改时间
        m_last_modified = std::filesystem::last_write_time(path);

        return true;
    }

    void unload() override {
        m_mesh.reset();
        m_memory_size = 0;
    }

    size_t getMemorySize() const override {
        return m_memory_size;
    }

    ResourceType getType() const override {
        return ResourceType::Mesh;
    }

    std::shared_ptr<Mesh> getMesh() const {
        return m_mesh;
    }

private:
    void parseGLTF(const tinygltf::Model& model) {
        // 解析顶点数据
        // 解析索引数据
        // 创建Mesh对象
        m_mesh = std::make_shared<Mesh>();
        // ...
        m_memory_size = /* 计算大小 */;
    }

    std::shared_ptr<Mesh> m_mesh;
    size_t m_memory_size = 0;
};

// 材质资源
class MaterialResource : public IResource {
public:
    bool load(const std::string& path) override {
        // 加载JSON材质文件
        std::ifstream file(path);
        nlohmann::json json;
        file >> json;

        // 解析材质属性
        std::string shader_path = json["shader"];
        m_material = std::make_shared<Material>();
        m_material->setShader(ShaderManager::instance().load(shader_path));

        // 加载纹理
        if (json.contains("albedo_map")) {
            std::string albedo_path = json["albedo_map"];
            auto albedo = ResourceManager::instance().load<TextureResource>(albedo_path);
            m_material->setTexture("albedo", albedo->getTexture());
        }

        // 设置参数
        if (json.contains("albedo_color")) {
            vec3 color;
            auto& arr = json["albedo_color"];
            color.r = arr[0];
            color.g = arr[1];
            color.b = arr[2];
            m_material->setProperty("albedo", color);
        }

        m_last_modified = std::filesystem::last_write_time(path);

        return true;
    }

    void unload() override {
        m_material.reset();
    }

    size_t getMemorySize() const override {
        return sizeof(Material);
    }

    ResourceType getType() const override {
        return ResourceType::Material;
    }

    std::shared_ptr<Material> getMaterial() const {
        return m_material;
    }

private:
    std::shared_ptr<Material> m_material;
};
```

### 资源管理器

```cpp
// 资源加载请求
struct LoadRequest {
    std::string path;
    ResourceType type;
    std::function<void(std::shared_ptr<IResource>)> callback;
    int priority = 0;  // 优先级，越大越重要
    bool async = true;
};

// 资源管理器
class ResourceManager {
public:
    static ResourceManager& instance() {
        static ResourceManager inst;
        return inst;
    }

    // 同步加载
    template<typename T>
    std::shared_ptr<T> load(const std::string& path) {
        // 检查缓存
        auto it = m_resource_cache.find(path);
        if (it != m_resource_cache.end()) {
            return std::static_pointer_cast<T>(it->second);
        }

        // 创建资源
        auto resource = std::make_shared<T>();
        if (!resource->load(path)) {
            std::cerr << "Failed to load resource: " << path << std::endl;
            return nullptr;
        }

        // 增加引用
        resource->addRef();

        // 添加到缓存
        m_resource_cache[path] = resource;
        m_current_memory += resource->getMemorySize();

        return resource;
    }

    // 异步加载
    void loadAsync(const std::string& path, ResourceType type,
                   std::function<void(std::shared_ptr<IResource>)> callback,
                   int priority = 0) {
        LoadRequest request;
        request.path = path;
        request.type = type;
        request.callback = callback;
        request.priority = priority;
        request.async = true;

        m_load_queue.push(request);
    }

    // 预加载资源
    void preload(const std::vector<std::string>& paths) {
        for (const auto& path : paths) {
            ResourceType type = detectResourceType(path);
            loadAsync(path, type, [](auto resource) {
                std::cout << "Preloaded: " << resource->getPath() << std::endl;
            });
        }
    }

    // 卸载资源
    void unload(const std::string& path) {
        auto it = m_resource_cache.find(path);
        if (it != m_resource_cache.end()) {
            it->second->release();
            if (it->second->getRefCount() <= 0) {
                m_current_memory -= it->second->getMemorySize();
                m_resource_cache.erase(it);
            }
        }
    }

    // 获取资源
    template<typename T>
    std::shared_ptr<T> get(const std::string& path) {
        auto it = m_resource_cache.find(path);
        if (it != m_resource_cache.end()) {
            return std::static_pointer_cast<T>(it->second);
        }
        return nullptr;
    }

    // 更新（处理异步加载）
    void update() {
        while (!m_load_queue.empty()) {
            auto request = m_load_queue.top();
            m_load_queue.pop();

            // 检查是否已加载
            auto resource = get<IResource>(request.path);
            if (resource) {
                if (request.callback) {
                    request.callback(resource);
                }
                continue;
            }

            // 加载资源
            std::shared_ptr<IResource> new_resource;
            switch (request.type) {
                case ResourceType::Texture:
                    new_resource = std::make_shared<TextureResource>();
                    break;
                case ResourceType::Mesh:
                    new_resource = std::make_shared<MeshResource>();
                    break;
                case ResourceType::Material:
                    new_resource = std::make_shared<MaterialResource>();
                    break;
                default:
                    std::cerr << "Unknown resource type" << std::endl;
                    continue;
            }

            if (new_resource->load(request.path)) {
                new_resource->addRef();
                m_resource_cache[request.path] = new_resource;
                m_current_memory += new_resource->getMemorySize();
            }

            // 触发回调
            if (request.callback) {
                request.callback(new_resource);
            }
        }

        // 检查内存预算
        if (m_current_memory > m_memory_budget) {
            evictLRU();
        }
    }

    // 设置内存预算
    void setMemoryBudget(size_t bytes) {
        m_memory_budget = bytes;
    }

    // 获取当前内存使用
    size_t getCurrentMemoryUsage() const {
        return m_current_memory;
    }

    // 获取资源信息
    struct ResourceInfo {
        std::string path;
        ResourceType type;
        size_t size;
        int ref_count;
    };

    std::vector<ResourceInfo> getResourceInfo() const {
        std::vector<ResourceInfo> info;
        for (const auto& [path, resource] : m_resource_cache) {
            info.push_back({
                path,
                resource->getType(),
                resource->getMemorySize(),
                resource->getRefCount()
            });
        }
        return info;
    }

private:
    ResourceManager() : m_memory_budget(512 * 1024 * 1024) {}  // 默认512MB

    // 检测资源类型
    ResourceType detectResourceType(const std::string& path) {
        std::filesystem::path p(path);
        std::string ext = p.extension().string();

        if (ext == ".png" || ext == ".jpg" || ext == ".jpeg" || ext == ".tga") {
            return ResourceType::Texture;
        } else if (ext == ".gltf" || ext == ".glb" || ext == ".obj") {
            return ResourceType::Mesh;
        } else if (ext == ".mat") {
            return ResourceType::Material;
        }

        return ResourceType::Unknown;
    }

    // LRU驱逐
    void evictLRU() {
        // 找到最少使用的资源
        std::shared_ptr<IResource> lru_resource = nullptr;
        size_t lru_time = SIZE_MAX;
        std::string lru_path;

        for (auto& [path, resource] : m_resource_cache) {
            if (resource->getRefCount() <= 1) {  // 只保留缓存引用
                auto last_write = resource->getLastModified().time_since_epoch().count();
                if (last_write < lru_time) {
                    lru_time = last_write;
                    lru_resource = resource;
                    lru_path = path;
                }
            }
        }

        // 卸载
        if (lru_resource) {
            std::cout << "Evicting: " << lru_path << std::endl;
            unload(lru_path);
        }
    }

    // 加载队列（优先级队列）
    struct LoadRequestCompare {
        bool operator()(const LoadRequest& a, const LoadRequest& b) const {
            return a.priority < b.priority;
        }
    };

    std::priority_queue<LoadRequest, std::vector<LoadRequest>, LoadRequestCompare> m_load_queue;
    std::unordered_map<std::string, std::shared_ptr<IResource>> m_resource_cache;
    size_t m_memory_budget;
    size_t m_current_memory = 0;
};
```

### 资源热更新

```cpp
// 文件监听器
class FileWatcher {
public:
    using FileChangeCallback = std::function<void(const std::string&)>;

    void watch(const std::string& path, FileChangeCallback callback) {
        m_watches[path] = {
            path,
            std::filesystem::last_write_time(path),
            callback
        };
    }

    void update() {
        for (auto& [path, watch] : m_watches) {
            auto current_time = std::filesystem::last_write_time(path);
            if (current_time != watch.last_modified) {
                watch.last_modified = current_time;
                watch.callback(path);
            }
        }
    }

private:
    struct Watch {
        std::string path;
        std::filesystem::file_time_type last_modified;
        FileChangeCallback callback;
    };

    std::unordered_map<std::string, Watch> m_watches;
};

// 热更新管理器
class HotReloadManager {
public:
    static HotReloadManager& instance() {
        static HotReloadManager inst;
        return inst;
    }

    void initialize() {
        // 监听资源目录
        watchDirectory("assets/");
    }

    void update() {
        m_file_watcher.update();
    }

private:
    void watchDirectory(const std::string& path) {
        for (const auto& entry : std::filesystem::recursive_directory_iterator(path)) {
            if (entry.is_regular_file()) {
                std::string file_path = entry.path().string();
                m_file_watcher.watch(file_path, [this](const std::string& changed_path) {
                    onFileChanged(changed_path);
                });
            }
        }
    }

    void onFileChanged(const std::string& path) {
        std::cout << "File changed: " << path << std::endl;

        // 查找已加载的资源
        auto& rm = ResourceManager::instance();
        auto resource = rm.get<IResource>(path);

        if (resource) {
            std::cout << "Reloading resource: " << path << std::endl;

            // 记录旧资源
            auto old_resource = resource;

            // 重新加载
            if (old_resource->load(path)) {
                std::cout << "Successfully reloaded: " << path << std::endl;
            } else {
                std::cerr << "Failed to reload: " << path << std::endl;
            }
        }
    }

    FileWatcher m_file_watcher;
};
```

---

## 关键目录

```
runtime/resource/
├── resource_manager.h         # 资源管理器
├── resource_base.h            # 资源基类
├── resource_types/
│   ├── texture_resource.h
│   ├── mesh_resource.h
│   ├── material_resource.h
│   ├── shader_resource.h
│   └── animation_resource.h
├── resource_loader.h          # 资源加载器
├── resource_cache.h           # 资源缓存
└── hot_reload.h               # 热更新
```

---

## 实践任务

### 任务1: 分析资源加载流程

```cpp
// 添加日志观察加载过程
class TextureResource : public IResource {
    bool load(const std::string& path) override {
        LogInfo("Loading texture: {}", path);
        auto start = std::chrono::high_resolution_clock::now();

        // ... 加载逻辑

        auto end = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
        LogInfo("Texture loaded in {} ms, size: {} bytes", duration.count(), m_memory_size);

        return true;
    }
};
```

### 任务2: 实现资源预加载

```cpp
// 游戏启动时预加载必要资源
void Game::preloadResources() {
    std::vector<std::string> resources_to_preload = {
        "textures/player.png",
        "textures/enemy.png",
        "meshes/character.gltf",
        "materials/standard.mat",
        "shaders/standard.glsl"
    };

    ResourceManager::instance().preload(resources_to_preload);

    // 等待预加载完成
    while (ResourceManager::instance().getCurrentMemoryUsage() < getExpectedSize()) {
        ResourceManager::instance().update();
    }
}
```

### 任务3: 查看资源引用计数

```cpp
// 调试命令：列出所有资源
void debugListResources() {
    auto resources = ResourceManager::instance().getResourceInfo();

    std::cout << "=== Resource Info ===" << std::endl;
    std::cout << "Total memory: " << ResourceManager::instance().getCurrentMemoryUsage() / 1024 / 1024 << " MB" << std::endl;

    for (const auto& info : resources) {
        const char* type_name = "";
        switch (info.type) {
            case ResourceType::Texture: type_name = "Texture"; break;
            case ResourceType::Mesh: type_name = "Mesh"; break;
            case ResourceType::Material: type_name = "Material"; break;
        }

        std::cout << "[" << type_name << "] " << info.path
                  << " (" << info.size / 1024 << " KB)"
                  << " Refs: " << info.ref_count
                  << std::endl;
    }
}
```

---

## 验证标准

- [ ] 理解资源加载流程
  - [ ] 能解释同步/异步加载区别
  - [ ] 知道如何处理资源依赖
  - [ ] 理解加载优先级

- [ ] 掌握缓存策略
  - [ ] 理解LRU缓存原理
  - [ ] 知道如何控制内存使用
  - [ ] 能实现简单的缓存系统

- [ ] 理解热更新机制
  - [ ] 知道文件监听原理
  - [ ] 能实现简单的热重载

- [ ] 实践完成
  - [ ] 分析资源加载流程
  - [ ] 查看资源引用计数
  - [ ] 实现资源预加载

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

第10周将学习输入与UI系统：
- 键盘/鼠标事件处理
- 手柄输入支持
- Canvas和UI元素
- UI渲染和事件系统

**准备事项**:
- [ ] 了解输入系统基本概念
- [ ] 复习事件驱动编程
- [ ] 准备手柄测试设备
