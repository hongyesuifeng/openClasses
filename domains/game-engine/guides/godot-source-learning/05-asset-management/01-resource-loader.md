# 资源加载与缓存

## 概述

本章深入分析 Godot 引擎的资源加载与缓存系统，包括 `Resource` 基类、`ResourceLoader` 加载器、资源格式加载器插件、缓存机制和异步加载等核心功能。通过分析源代码，揭示资源从磁盘到内存的完整生命周期。

## 1. Resource 基类

### 1.1 类继承结构

```
Object
    │
    └── RefCounted
            │
            └── Resource
                    │
                    ├── Texture2D
                    ├── AudioStream
                    ├── PackedScene
                    ├── Script
                    ├── Material
                    └── ...
```

### 1.2 Resource 核心实现

```cpp
// core/io/resource.h

class Resource : public RefCounted {
    GDCLASS(Resource, RefCounted);
    
    OBJ_SAVE_TYPE(Resource); // 序列化支持
    
private:
    String path;              // 资源路径
    String name;              // 资源名称
    RID rid;                  // 资源 ID（用于服务器）
    
    // 依赖关系
    struct Dependency {
        String path;
        String type;
        uint32_t id;
    };
    Vector<Dependency> dependencies;
    
    // 被依赖此资源的其他资源
    HashMap<String, int> dependants;
    
    // 元数据
    HashMap<StringName, Variant> meta_data;
    
    // 导入状态
    bool imported_from_source = false;
    
protected:
    // 设置路径
    void _set_path(const String &p_path, bool p_take_over);
    void _set_path_with_takeover(const String &p_path) {
        _set_path(p_path, true);
    }
    
    // 设置名称
    void _set_name(const String &p_name);
    
    // 初始化资源
    virtual void reset_state() {}
    
    static void _bind_methods();
    
public:
    // 路径和名称
    void set_path(const String &p_path, bool p_take_over_path = false);
    String get_path() const;
    
    void set_name(const String &p_name);
    String get_name() const;
    
    // RID 管理
    void set_rid(const RID &p_rid) { rid = p_rid; }
    RID get_rid() const { return rid; }
    
    // 依赖关系
    void set_dependency(const String &p_path, uint32_t p_id);
    Vector<String> get_dependencies() const;
    void clear_dependencies();
    
    void add_dependent(const String &p_path);
    void remove_dependent(const String &p_path);
    
    // 元数据
    void set_meta(const StringName &p_name, const Variant &p_value);
    Variant get_meta(const StringName &p_name, bool *p_valid = nullptr) const;
    bool has_meta(const StringName &p_name) const;
    void remove_meta(const StringName &p_name);
    void get_meta_list(List<StringName> *p_list) const;
    
    void set_meta(const HashMap<StringName, Variant> &p_meta);
    const HashMap<StringName, Variant> &get_meta_map() const;
    
    // 导入状态
    void set_imported_from_source(bool p_imported) {
        imported_from_source = p_imported;
    }
    bool is_imported_from_source() const {
        return imported_from_source;
    }
    
    // 资源类型
    virtual String get_class() const;
    virtual String get_save_class() const { return get_class(); }
    
    // 复制资源
    virtual Ref<Resource> duplicate_for_local_state() const {
        return Ref<Resource>();
    }
    
    // 资源是否已加载
    bool is_loaded() const { return true; }
    
    Resource();
    ~Resource();
};
```

### 1.3 资源属性设置

```cpp
// core/io/resource.cpp

void Resource::set_path(const String &p_path, bool p_take_over_path) {
    if (path == p_path) {
        return;
    }
    
    String old_path = path;
    path = p_path;
    
    // 更新资源缓存
    ResourceCache::get_singleton()->resource_renamed(this, old_path, p_path);
    
    // 处理路径接管
    if (p_take_over_path) {
        ResourceCache::get_singleton()->resource_take_over_path(this, p_path);
    }
}

void Resource::set_name(const String &p_name) {
    name = p_name;
    emit_changed();
}

String Resource::get_path() const {
    return path;
}

String Resource::get_name() const {
    return name;
}
```

## 2. ResourceLoader 加载器

### 2.1 ResourceLoader 类定义

```cpp
// core/io/resource_loader.h

class ResourceLoader {
    // 资源加载回调
    typedef Ref<Resource> (*ResourceLoadCallback)(const String &p_path);
    
public:
    enum CacheMode {
        CACHE_MODE_IGNORE,  // 忽略缓存
        CACHE_MODE_REUSE,   // 复用缓存
        CACHE_MODE_REPLACE  // 替换缓存
    };
    
    enum ThreadLoadStatus {
        THREAD_LOAD_INVALID_RESOURCE,
        THREAD_LOAD_IN_PROGRESS,
        THREAD_LOAD_FAILED,
        THREAD_LOAD_LOADED
    };
    
private:
    static ResourceLoader *singleton;
    
    // 加载线程状态
    struct ThreadLoadTask {
        String path;
        String type_hint;
        CacheMode cache_mode;
        Ref<Resource> resource;
        Error error;
        int stages;
    };
    
    HashMap<String, ThreadLoadTask> thread_load_tasks;
    Mutex thread_load_mutex;
    
    // 加载回调
    ResourceLoadCallback load_callback = nullptr;
    
    // 资源格式加载器
    ResourceFormatLoaderManager *loader_manager = nullptr;
    
    // 添加依赖
    void _add_dependency(const String &p_path, const String &p_dep_path);
    
public:
    static ResourceLoader *get_singleton() { return singleton; }
    
    // 同步加载
    Ref<Resource> load(const String &p_path,
                      const String &p_type_hint = "",
                      CacheMode p_cache_mode = CACHE_MODE_REUSE);
    
    // 异步加载
    Error load_threaded_begin(const String &p_path,
                             const String &p_type_hint = "");
    Error load_threaded_end(const String &p_path,
                           Ref<Resource> &r_resource);
    
    ThreadLoadStatus load_threaded_get_status(const String &p_path,
                                             Ref<Resource> &r_resource);
    
    // 取消加载
    void load_threaded_cancel(const String &p_path);
    
    // 存在性检查
    bool exists(const String &p_path, const String &p_type_hint = "");
    
    // 资源类型
    String get_resource_type(const String &p_path);
    
    // 依赖关系
    void get_dependencies(const String &p_path,
                         List<String> *p_dependencies,
                         bool p_add_types = false);
    
    // 回调设置
    void set_load_callback(ResourceLoadCallback p_callback);
    
    // 加载器管理
    void add_resource_format_loader(Ref<ResourceFormatLoader> p_loader,
                                   bool p_at_front = false);
    void remove_resource_format_loader(Ref<ResourceFormatLoader> p_loader);
    
    ResourceLoader();
    ~ResourceLoader();
};
```

### 2.2 load() 函数实现

```cpp
// core/io/resource_loader.cpp

Ref<Resource> ResourceLoader::load(const String &p_path,
                                  const String &p_type_hint,
                                  CacheMode p_cache_mode) {
    // 检查路径是否为空
    if (p_path.is_empty()) {
        ERR_PRINT("Resource path cannot be empty");
        return Ref<Resource>();
    }
    
    // 标准化路径
    String local_path = p_path;
    if (local_path.is_relative_path()) {
        local_path = "res://" + local_path;
    }
    
    // 检查缓存
    if (p_cache_mode != CACHE_MODE_IGNORE) {
        Ref<Resource> cached = ResourceCache::get_singleton()->get_resource(local_path);
        if (cached.is_valid()) {
            // 缓存命中
            if (p_cache_mode == CACHE_MODE_REPLACE) {
                // 替换模式：从缓存移除，重新加载
                ResourceCache::get_singleton()->remove_resource(local_path);
            } else {
                // 复用模式：返回缓存资源
                return cached;
            }
        }
    }
    
    // 查找合适的加载器
    String path_type = get_resource_type(local_path);
    String type = p_type_hint.is_empty() ? path_type : p_type_hint;
    
    if (type.is_empty()) {
        ERR_PRINT(vformat("Cannot determine resource type for: %s", local_path));
        return Ref<Resource>();
    }
    
    // 使用加载器管理器加载资源
    Error err = OK;
    Ref<Resource> res = loader_manager->load(local_path, "", &err, false, nullptr, p_cache_mode);
    
    if (res.is_null()) {
        ERR_PRINT(vformat("Failed loading resource: %s (type: %s)", 
                         local_path, type));
        return Ref<Resource>();
    }
    
    // 设置资源路径
    res->set_path(local_path);
    
    // 添加到缓存
    if (p_cache_mode != CACHE_MODE_IGNORE) {
        ResourceCache::get_singleton()->add_resource(local_path, res);
    }
    
    // 调用加载回调
    if (load_callback) {
        load_callback(local_path);
    }
    
    return res;
}
```

### 2.3 加载流程图

```
ResourceLoader::load() 详细流程：

┌─────────────────────────────────────┐
│  用户调用 load(path, type, mode)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  1. 路径验证和标准化                │
│     ├─ 检查空路径                    │
│     ├─ 转换相对路径为绝对路径        │
│     └─ 验证路径格式                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. 缓存检查                        │
│     ├─ mode != IGNORE?              │
│     │   ├─ Yes ──► 检查缓存          │
│     │   │   ├─ 缓存命中?             │
│     │   │   │   ├─ Yes ──►           │
│     │   │   │   │   ├─ mode == REPLACE? │
│     │   │   │   │   │   ├─ Yes ──► 移除缓存，继续加载 │
│     │   │   │   │   │   └─ No ──► 返回缓存资源 │
│     │   │   │   │   └─               │
│     │   │   │   └─ No ──► 继续加载   │
│     │   │   └─                       │
│     │   └─ No ──► 跳过缓存检查        │
│     └─                               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. 确定资源类型                    │
│     ├─ 从路径推断类型                │
│     ├─ 使用 type_hint 覆盖           │
│     └─ 验证类型有效性                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. 查找加载器                      │
│     ├─ 遍历 ResourceFormatLoader    │
│     ├─ 检查 handles_type()          │
│     ├─ 检查 recognize_path()        │
│     └─ 选择匹配的加载器              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. 执行加载                        │
│     ├─ 调用 ResourceFormatLoader::load() │
│     ├─ 读取文件内容                  │
│     ├─ 解析资源数据                  │
│     ├─ 创建资源对象                  │
│     └─ 设置资源属性                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. 处理依赖                        │
│     ├─ 递归加载依赖资源              │
│     ├─ 建立依赖关系图                │
│     └─ 检测循环引用                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. 缓存资源                        │
│     ├─ mode != IGNORE?              │
│     │   └─ Yes ──► 添加到 ResourceCache │
│     └─                              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  8. 返回资源                        │
│     └─ 返回 Ref<Resource>           │
└─────────────────────────────────────┘
```

## 3. ResourceFormatLoader 插件

### 3.1 加载器接口定义

```cpp
// core/io/resource_format_loader.h

class ResourceFormatLoader : public RefCounted {
    GDCLASS(ResourceFormatLoader, RefCounted);
    
public:
    // 资源加载选项
    enum CacheMode {
        CACHE_MODE_IGNORE,
        CACHE_MODE_REUSE,
        CACHE_MODE_REPLACE
    };
    
    // 获取识别的文件扩展名
    virtual PackedStringArray get_recognized_extensions() const = 0;
    
    // 处理特定类型
    virtual bool handles_type(const String &p_type) const = 0;
    
    // 获取资源类型
    virtual String get_resource_type(const String &p_path) const = 0;
    
    // 加载资源
    virtual Ref<Resource> load(const String &p_path,
                              const String &p_original_path = "",
                              Error *r_error = nullptr,
                              bool p_use_sub_threads = false,
                              float *r_progress = nullptr,
                              CacheMode p_cache_mode = CACHE_MODE_REUSE) = 0;
    
    // 识别路径
    virtual bool recognize_path(const String &p_path,
                               const String &p_type = "") const = 0;
    
    // 获取依赖
    virtual void get_dependencies(const String &p_path,
                                 List<String> *p_dependencies,
                                 bool p_add_types = false) {}
    
    // 导入选项
    virtual void get_import_options(const String &p_path,
                                   List<ResourceImporter::ImportOption> *r_options) {}
    
    ResourceFormatLoader() {}
    virtual ~ResourceFormatLoader() {}
};
```

### 3.2 文本格式加载器

```cpp
// scene/resource_format_text.cpp

class ResourceFormatLoaderText : public ResourceFormatLoader {
    GDCLASS(ResourceFormatLoaderText, ResourceFormatLoader);
    
public:
    virtual PackedStringArray get_recognized_extensions() const override {
        PackedStringArray extensions;
        extensions.push_back("tscn");  // 场景文本格式
        extensions.push_back("tres");  // 资源文本格式
        return extensions;
    }
    
    virtual bool handles_type(const String &p_type) const override {
        return true;  // 处理所有类型
    }
    
    virtual String get_resource_type(const String &p_path) const override {
        // 从文件内容推断类型
        Ref<FileAccess> f = FileAccess::open(p_path, FileAccess::READ);
        if (f.is_null()) {
            return "";
        }
        
        String line = f->get_line();
        while (!line.is_empty()) {
            if (line.begins_with("[gd_scene ")) {
                return "PackedScene";
            } else if (line.begins_with("[gd_resource ")) {
                // 提取类型
                int type_pos = line.find("type=");
                if (type_pos != -1) {
                    String type = line.substr(type_pos + 5);
                    type = type.get_slice("\"", 1);
                    return type;
                }
            }
            line = f->get_line();
        }
        
        return "";
    }
    
    virtual bool recognize_path(const String &p_path,
                               const String &p_type) const override {
        return p_path.ends_with(".tscn") || p_path.ends_with(".tres");
    }
    
    virtual Ref<Resource> load(const String &p_path,
                              const String &p_original_path,
                              Error *r_error,
                              bool p_use_sub_threads,
                              float *r_progress,
                              CacheMode p_cache_mode) override {
        if (r_error) {
            *r_error = ERR_FILE_CANT_OPEN;
        }
        
        // 打开文件
        Ref<FileAccess> f = FileAccess::open(p_path, FileAccess::READ);
        if (f.is_null()) {
            ERR_PRINT(vformat("Failed to open: %s", p_path));
            return Ref<Resource>();
        }
        
        // 解析资源
        Ref<Resource> res;
        Error err = _parse_text_resource(f, p_path, res, p_use_sub_threads, r_progress);
        
        if (r_error) {
            *r_error = err;
        }
        
        return res;
    }
    
private:
    Error _parse_text_resource(Ref<FileAccess> p_file,
                               const String &p_path,
                               Ref<Resource> &r_resource,
                               bool p_use_sub_threads,
                               float *r_progress) {
        // 解析 TSCN/TRES 文件
        // ...
        return OK;
    }
};
```

### 3.3 二进制格式加载器

```cpp
// scene/resource_format_binary.cpp

class ResourceFormatLoaderBinary : public ResourceFormatLoader {
    GDCLASS(ResourceFormatLoaderBinary, ResourceFormatLoader);
    
public:
    virtual PackedStringArray get_recognized_extensions() const override {
        PackedStringArray extensions;
        extensions.push_back("scn");   // 场景二进制格式
        extensions.push_back("res");   // 资源二进制格式
        return extensions;
    }
    
    virtual bool handles_type(const String &p_type) const override {
        return true;
    }
    
    virtual String get_resource_type(const String &p_path) const override {
        // 从文件头读取类型
        Ref<FileAccess> f = FileAccess::open(p_path, FileAccess::READ);
        if (f.is_null()) {
            return "";
        }
        
        // 读取魔术字和版本
        uint8_t header[4];
        f->get_buffer(header, 4);
        
        if (header[0] == 'R' && header[1] == 'S' && 
            header[2] == 'C' && header[3] == 'C') {
            // 读取类型字符串
            return f->get_token_string();
        }
        
        return "";
    }
    
    virtual bool recognize_path(const String &p_path,
                               const String &p_type) const override {
        return p_path.ends_with(".scn") || p_path.ends_with(".res");
    }
    
    virtual Ref<Resource> load(const String &p_path,
                              const String &p_original_path,
                              Error *r_error,
                              bool p_use_sub_threads,
                              float *r_progress,
                              CacheMode p_cache_mode) override {
        if (r_error) {
            *r_error = ERR_FILE_CANT_OPEN;
        }
        
        // 打开文件
        Ref<FileAccess> f = FileAccess::open(p_path, FileAccess::READ);
        if (f.is_null()) {
            return Ref<Resource>();
        }
        
        // 解析二进制资源
        Ref<Resource> res;
        Error err = _parse_binary_resource(f, p_path, res, p_use_sub_threads, r_progress);
        
        if (r_error) {
            *r_error = err;
        }
        
        return res;
    }
    
private:
    Error _parse_binary_resource(Ref<FileAccess> p_file,
                                const String &p_path,
                                Ref<Resource> &r_resource,
                                bool p_use_sub_threads,
                                float *r_progress) {
        // 解析 SCN/RES 文件
        // ...
        return OK;
    }
};
```

### 3.4 图像格式加载器

```cpp
// scene/resource_format_image.cpp

class ResourceFormatLoaderImage : public ResourceFormatLoader {
    GDCLASS(ResourceFormatLoaderImage, ResourceFormatLoader);
    
public:
    virtual PackedStringArray get_recognized_extensions() const override {
        PackedStringArray extensions;
        extensions.push_back("png");
        extensions.push_back("jpg");
        extensions.push_back("jpeg");
        extensions.push_back("webp");
        extensions.push_back("bmp");
        extensions.push_back("tga");
        extensions.push_back("svg");
        return extensions;
    }
    
    virtual bool handles_type(const String &p_type) const override {
        return p_type == "ImageTexture" || 
               p_type == "Texture2D" ||
               p_type == "CompressedTexture2D";
    }
    
    virtual String get_resource_type(const String &p_path) const override {
        String ext = p_path.get_extension().to_lower();
        if (ext == "png" || ext == "jpg" || ext == "jpeg" || 
            ext == "webp" || ext == "bmp" || ext == "tga") {
            return "ImageTexture";
        } else if (ext == "svg") {
            return "Texture2D";
        }
        return "";
    }
    
    virtual bool recognize_path(const String &p_path,
                               const String &p_type) const override {
        String ext = p_path.get_extension().to_lower();
        return ext == "png" || ext == "jpg" || ext == "jpeg" || 
               ext == "webp" || ext == "bmp" || ext == "tga" || ext == "svg";
    }
    
    virtual Ref<Resource> load(const String &p_path,
                              const String &p_original_path,
                              Error *r_error,
                              bool p_use_sub_threads,
                              float *r_progress,
                              CacheMode p_cache_mode) override {
        if (r_error) {
            *r_error = ERR_FILE_CANT_OPEN;
        }
        
        // 加载图像数据
        Ref<Image> img;
        img.instantiate();
        Error err = img->load(p_path);
        
        if (err != OK) {
            if (r_error) {
                *r_error = err;
            }
            return Ref<Resource>();
        }
        
        // 创建纹理
        Ref<ImageTexture> texture;
        texture.instantiate();
        texture->set_image(img);
        
        if (r_error) {
            *r_error = OK;
        }
        
        return texture;
    }
};
```

## 4. ResourceCache 缓存系统

### 4.1 ResourceCache 单例实现

```cpp
// core/io/resource_cache.cpp

class ResourceCache {
    static ResourceCache *singleton;
    
    // 资源缓存
    HashMap<String, Ref<Resource>> resources;
    
    // 路径到资源的映射
    HashMap<Resource *, String> resource_paths;
    
    // 互斥锁（线程安全）
    Mutex cache_mutex;
    
    // 依赖 ID 计数器
    static uint32_t dependency_id_counter;
    
public:
    static ResourceCache *get_singleton() {
        return singleton;
    }
    
    // 添加资源到缓存
    void add_resource(const String &p_path, Ref<Resource> p_resource) {
        if (p_path.is_empty() || p_resource.is_null()) {
            return;
        }
        
        MutexLock lock(cache_mutex);
        
        // 移除旧资源（如果存在）
        if (resources.has(p_path)) {
            remove_resource(p_path);
        }
        
        // 添加新资源
        resources[p_path] = p_resource;
        resource_paths[p_resource.ptr()] = p_path;
    }
    
    // 获取缓存资源
    Ref<Resource> get_resource(const String &p_path) {
        MutexLock lock(cache_mutex);
        
        if (resources.has(p_path)) {
            return resources[p_path];
        }
        return Ref<Resource>();
    }
    
    // 移除缓存资源
    void remove_resource(const String &p_path) {
        MutexLock lock(cache_mutex);
        
        if (resources.has(p_path)) {
            Ref<Resource> res = resources[p_path];
            resource_paths.erase(res.ptr());
            resources.erase(p_path);
        }
    }
    
    // 获取资源路径
    String get_resource_path(Resource *p_resource) {
        MutexLock lock(cache_mutex);
        
        if (resource_paths.has(p_resource)) {
            return resource_paths[p_resource];
        }
        return "";
    }
    
    // 资源重命名
    void resource_renamed(Resource *p_resource, const String &p_old_path, const String &p_new_path) {
        MutexLock lock(cache_mutex);
        
        if (p_old_path == p_new_path) {
            return;
        }
        
        // 更新路径映射
        if (resources.has(p_old_path)) {
            Ref<Resource> res = resources[p_old_path];
            resources.erase(p_old_path);
            resources[p_new_path] = res;
            resource_paths[p_resource] = p_new_path;
        }
    }
    
    // 清空缓存
    void clear() {
        MutexLock lock(cache_mutex);
        
        resources.clear();
        resource_paths.clear();
    }
    
    // 获取所有缓存资源
    Vector<Ref<Resource>> get_cached_resources() {
        MutexLock lock(cache_mutex);
        
        Vector<Ref<Resource>> result;
        for (const KeyValue<String, Ref<Resource>> &E : resources) {
            result.push_back(E.value);
        }
        return result;
    }
    
    // 获取缓存大小
    int get_cache_size() const {
        return resources.size();
    }
    
    // 依赖 ID 管理
    static uint32_t get_dependency_id(const String &p_path) {
        static HashMap<String, uint32_t> dependency_ids;
        
        if (!dependency_ids.has(p_path)) {
            dependency_ids[p_path] = ++dependency_id_counter;
        }
        
        return dependency_ids[p_path];
    }
};
```

### 4.2 缓存模式实现细节

```cpp
// 缓存模式处理逻辑

Ref<Resource> ResourceLoader::load_with_cache_mode(const String &p_path,
                                                  CacheMode p_cache_mode) {
    String local_path = p_path;
    
    // 标准化路径
    if (local_path.is_relative_path()) {
        local_path = "res://" + local_path;
    }
    
    ResourceCache *cache = ResourceCache::get_singleton();
    
    // CACHE_MODE_IGNORE: 完全忽略缓存
    if (p_cache_mode == CACHE_MODE_IGNORE) {
        return load_resource_without_cache(local_path);
    }
    
    // CACHE_MODE_REUSE: 优先使用缓存
    if (p_cache_mode == CACHE_MODE_REUSE) {
        Ref<Resource> cached = cache->get_resource(local_path);
        if (cached.is_valid()) {
            return cached;
        }
        return load_and_cache_resource(local_path);
    }
    
    // CACHE_MODE_REPLACE: 替换缓存
    if (p_cache_mode == CACHE_MODE_REPLACE) {
        // 从缓存移除旧资源
        cache->remove_resource(local_path);
        // 加载新资源
        Ref<Resource> res = load_resource_without_cache(local_path);
        // 添加到缓存
        if (res.is_valid()) {
            cache->add_resource(local_path, res);
        }
        return res;
    }
    
    return Ref<Resource>();
}
```

## 5. 异步加载机制

### 5.1 load_threaded_begin() 实现

```cpp
// core/io/resource_loader.cpp

Error ResourceLoader::load_threaded_begin(const String &p_path,
                                         const String &p_type_hint) {
    // 检查路径
    String local_path = p_path;
    if (local_path.is_relative_path()) {
        local_path = "res://" + local_path;
    }
    
    MutexLock lock(thread_load_mutex);
    
    // 检查是否已在加载
    if (thread_load_tasks.has(local_path)) {
        return ERR_ALREADY_IN_USE;
    }
    
    // 检查缓存
    Ref<Resource> cached = ResourceCache::get_singleton()->get_resource(local_path);
    if (cached.is_valid()) {
        // 已在缓存中，立即返回
        ThreadLoadTask task;
        task.path = local_path;
        task.resource = cached;
        task.error = OK;
        thread_load_tasks[local_path] = task;
        return OK;
    }
    
    // 创建加载任务
    ThreadLoadTask task;
    task.path = local_path;
    task.type_hint = p_type_hint;
    task.cache_mode = CACHE_MODE_REUSE;
    task.error = ERR_FILE_NOT_FOUND;
    
    thread_load_tasks[local_path] = task;
    
    // 启动工作线程
    WorkerThreadPool::get_singleton()->add_template_task(
        this, "_load_threaded_func", &thread_load_tasks[local_path],
        -1, true, "ResourceLoader");
    
    return OK;
}

// 工作线程函数
void ResourceLoader::_load_threaded_func(void *p_userdata) {
    ThreadLoadTask *task = static_cast<ThreadLoadTask *>(p_userdata);
    
    // 执行加载
    Ref<Resource> res = load(task->path, task->type_hint, task->cache_mode);
    
    // 更新任务状态
    MutexLock lock(thread_load_mutex);
    task->resource = res;
    task->error = res.is_valid() ? OK : FAILED;
}
```

### 5.2 load_threaded_get() 实现

```cpp
// core/io/resource_loader.cpp

ResourceLoader::ThreadLoadStatus ResourceLoader::load_threaded_get_status(
    const String &p_path,
    Ref<Resource> &r_resource) {
    
    String local_path = p_path;
    if (local_path.is_relative_path()) {
        local_path = "res://" + local_path;
    }
    
    MutexLock lock(thread_load_mutex);
    
    if (!thread_load_tasks.has(local_path)) {
        return THREAD_LOAD_INVALID_RESOURCE;
    }
    
    const ThreadLoadTask &task = thread_load_tasks[local_path];
    
    if (task.resource.is_valid()) {
        r_resource = task.resource;
        return THREAD_LOAD_LOADED;
    } else if (task.error != OK) {
        return THREAD_LOAD_FAILED;
    } else {
        return THREAD_LOAD_IN_PROGRESS;
    }
}

Error ResourceLoader::load_threaded_end(const String &p_path,
                                       Ref<Resource> &r_resource) {
    String local_path = p_path;
    if (local_path.is_relative_path()) {
        local_path = "res://" + local_path;
    }
    
    MutexLock lock(thread_load_mutex);
    
    if (!thread_load_tasks.has(local_path)) {
        return ERR_INVALID_PARAMETER;
    }
    
    ThreadLoadTask task = thread_load_tasks[local_path];
    thread_load_tasks.erase(local_path);
    
    r_resource = task.resource;
    return task.error;
}
```

### 5.3 异步加载流程图

```
异步加载时序图：

主线程                    工作线程池              ResourceCache
    │                          │                        │
    │                          │                        │
    ├─ load_threaded_begin()   │                        │
    │   ────────────────────────►                        │
    │                          │                        │
    │                          ├─ 启动加载任务          │
    │                          │                        │
    │                          ├─ 读取文件              │
    │                          │                        │
    │                          ├─ 解析数据              │
    │                          │                        │
    │                          ├─ 创建资源              │
    │                          │                        │
    │                          ├─ 处理依赖              │
    │                          │   ────────────────────► 检查缓存
    │                          │   ◄──────────────────── 返回缓存资源
    │                          │                        │
    │                          ├─ 完成加载              │
    │                          │                        │
    ├─ load_threaded_get()     │                        │
    │   ◄─────────────────────── 任务完成                │
    │                          │                        │
    └─ 使用资源                │                        │
```

## 6. ResourceSaver 资源保存

### 6.1 ResourceSaver 类定义

```cpp
// core/io/resource_saver.h

class ResourceSaver {
    static ResourceSaver *singleton;
    
    ResourceFormatSaverManager *saver_manager = nullptr;
    
public:
    enum SaverFlags {
        FLAG_NONE = 0,
        FLAG_RELATIVE_PATHS = 1,
        FLAG_BUNDLE_RESOURCES = 2,
        FLAG_CHANGE_PATH = 4,
        FLAG_OMIT_EDITOR_PROPERTIES = 8,
        FLAG_SAVE_BIG_ENDIAN = 16,
        FLAG_COMPRESS = 32,
        FLAG_REPLACE_SUBRESOURCE_PATHS = 64
    };
    
    static ResourceSaver *get_singleton() { return singleton; }
    
    // 保存资源
    Error save(const Ref<Resource> &p_resource,
              const String &p_path,
              uint32_t p_flags = 0);
    
    // 保存为字符串
    String save_to_string(const Ref<Resource> &p_resource);
    
    // 获取保存扩展名
    String get_save_extension(const String &p_path) const;
    
    // 资源类型
    String get_resource_type(const Ref<Resource> &p_resource) const;
    
    // 保存器管理
    void add_resource_format_saver(Ref<ResourceFormatSaver> p_saver,
                                  bool p_at_front = false);
    void remove_resource_format_saver(Ref<ResourceFormatSaver> p_saver);
    
    ResourceSaver();
    ~ResourceSaver();
};
```

### 6.2 save() 函数实现

```cpp
// core/io/resource_saver.cpp

Error ResourceSaver::save(const Ref<Resource> &p_resource,
                         const String &p_path,
                         uint32_t p_flags) {
    if (p_resource.is_null()) {
        return ERR_INVALID_PARAMETER;
    }
    
    String local_path = p_path;
    if (local_path.is_relative_path()) {
        local_path = "res://" + local_path;
    }
    
    // 查找合适的保存器
    Ref<ResourceFormatSaver> saver = saver_manager->find_saver_for_type(
        p_resource->get_class());
    
    if (saver.is_null()) {
        ERR_PRINT(vformat("No saver found for resource type: %s",
                         p_resource->get_class()));
        return ERR_UNAVAILABLE;
    }
    
    // 创建目录（如果不存在）
    String dir = local_path.get_base_dir();
    if (!DirAccess::exists(dir)) {
        Error err = DirAccess::make_dir_recursive(dir);
        if (err != OK) {
            return err;
        }
    }
    
    // 保存资源
    Error err = saver->save(p_resource, local_path, p_flags);
    
    if (err != OK) {
        ERR_PRINT(vformat("Failed to save resource: %s", local_path));
        return err;
    }
    
    // 更新资源路径
    p_resource->set_path(local_path);
    
    // 添加到缓存
    ResourceCache::get_singleton()->add_resource(local_path, p_resource);
    
    return OK;
}
```

## 7. 资源依赖管理

### 7.1 依赖关系跟踪

```cpp
// core/io/resource.cpp

void Resource::set_dependency(const String &p_path, uint32_t p_id) {
    Dependency dep;
    dep.path = p_path;
    dep.type = ResourceLoader::get_resource_type(p_path);
    dep.id = p_id;
    
    dependencies.push_back(dep);
}

Vector<String> Resource::get_dependencies() const {
    Vector<String> deps;
    for (const Dependency &dep : dependencies) {
        deps.push_back(dep.path);
    }
    return deps;
}

void Resource::clear_dependencies() {
    dependencies.clear();
}

void Resource::add_dependent(const String &p_path) {
    if (dependants.has(p_path)) {
        dependants[p_path]++;
    } else {
        dependants[p_path] = 1;
    }
}

void Resource::remove_dependent(const String &p_path) {
    if (dependants.has(p_path)) {
        dependants[p_path]--;
        if (dependants[p_path] <= 0) {
            dependants.erase(p_path);
        }
    }
}
```

### 7.2 依赖加载流程

```cpp
// 递归加载依赖

Ref<Resource> load_with_dependencies(const String &p_path,
                                   HashSet<String> &p_loaded) {
    // 避免循环依赖
    if (p_loaded.has(p_path)) {
        return ResourceCache::get_singleton()->get_resource(p_path);
    }
    
    p_loaded.insert(p_path);
    
    // 加载主资源
    Ref<Resource> res = ResourceLoader::load(p_path);
    if (res.is_null()) {
        return Ref<Resource>();
    }
    
    // 加载依赖
    Vector<String> deps = res->get_dependencies();
    for (const String &dep_path : deps) {
        Ref<Resource> dep = load_with_dependencies(dep_path, p_loaded);
        if (dep.is_null()) {
            WARN_PRINT(vformat("Failed to load dependency: %s", dep_path));
        }
    }
    
    return res;
}
```

## 8. 性能优化

### 8.1 资源预加载

```cpp
// 场景预加载实现

void SceneTree::preload_resources(const Vector<String> &p_paths) {
    // 在后台线程中预加载
    for (const String &path : p_paths) {
        ResourceLoader::load_threaded_begin(path);
    }
}

void SceneTree::check_preload_status() {
    for (const String &path : preload_paths) {
        Ref<Resource> res;
        auto status = ResourceLoader::load_threaded_get_status(path, res);
        
        if (status == ResourceLoader::THREAD_LOAD_LOADED) {
            // 预加载完成
            preload_paths.erase(path);
        } else if (status == ResourceLoader::THREAD_LOAD_FAILED) {
            // 预加载失败
            WARN_PRINT(vformat("Failed to preload: %s", path));
            preload_paths.erase(path);
        }
    }
}
```

### 8.2 内存使用优化

```cpp
// 资源内存优化策略

class ResourceOptimizer {
public:
    // 释放未使用的资源
    static void free_unused_resources() {
        Vector<Ref<Resource>> cached = 
            ResourceCache::get_singleton()->get_cached_resources();
        
        for (const Ref<Resource> &res : cached) {
            // 检查引用计数
            if (res->get_reference_count() <= 1) {
                // 只有缓存持有引用，可以释放
                String path = res->get_path();
                ResourceCache::get_singleton()->remove_resource(path);
            }
        }
    }
    
    // 清空缓存
    static void clear_cache() {
        ResourceCache::get_singleton()->clear();
    }
    
    // 手动释放资源
    static void free_resource(const String &p_path) {
        ResourceCache::get_singleton()->remove_resource(p_path);
    }
};
```

## 9. 总结

本章深入分析了 Godot 资源加载与缓存系统的核心实现：

1. **Resource 基类**：提供资源路径、名称、依赖关系和元数据管理
2. **ResourceLoader**：协调资源加载过程，支持同步和异步加载
3. **ResourceFormatLoader**：插件式加载器架构，支持多种文件格式
4. **ResourceCache**：高效的资源缓存机制，支持多种缓存模式
5. **异步加载**：多线程加载支持，避免阻塞主线程
6. **ResourceSaver**：资源保存功能，支持多种保存格式

理解这些核心组件的实现原理，有助于优化游戏性能和内存使用。

---

**下一步**：继续阅读 [资源格式加载器](02-resource-format-loaders.md) 了解各种资源格式的具体加载实现。
