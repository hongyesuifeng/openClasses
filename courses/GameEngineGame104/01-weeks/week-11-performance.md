# 第11周: 性能优化

> **学习目标**: 学习引擎性能优化技术
>
> **时间安排**: 2026-05-09 ~ 2026-05-16
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. CPU优化
- [ ] 多线程任务系统
- [ ] 任务依赖图
- [ ] 工作窃取调度
- [ ] SIMD优化

### 2. GPU优化
- [ ] 渲染批处理
- [ ] GPU Instancing
- [ ] GPU驱动渲染
- [ ] 减少Draw Call

### 3. 内存优化
- [ ] 内存池设计
- [ ] 对象缓存
- [ ] 内存对齐
- [ ] 缓存友好性

### 4. 实践任务
- [ ] 使用性能分析器
- [ ] 识别性能瓶颈
- [ ] 应用优化技术

---

## 核心知识点

### 任务系统

```cpp
// 任务
class Task {
public:
    using TaskFunc = std::function<void()>;

    Task(TaskFunc func) : m_function(func) {}

    void execute() {
        m_function();
    }

    void addDependency(std::shared_ptr<Task> task) {
        m_dependencies.push_back(task);
    }

    bool isReady() const {
        for (auto& dep : m_dependencies) {
            if (!dep->isCompleted()) {
                return false;
            }
        }
        return true;
    }

    bool isCompleted() const {
        return m_completed;
    }

    void markCompleted() {
        m_completed = true;
    }

private:
    TaskFunc m_function;
    std::vector<std::shared_ptr<Task>> m_dependencies;
    std::atomic<bool> m_completed{false};
};

// 任务系统
class TaskScheduler {
public:
    TaskScheduler() {
        size_t num_threads = std::thread::hardware_concurrency();
        for (size_t i = 0; i < num_threads; i++) {
            m_workers.emplace_back(&TaskScheduler::workerLoop, this, i);
        }
    }

    ~TaskScheduler() {
        m_running = false;
        m_condition.notify_all();
        for (auto& worker : m_workers) {
            worker.join();
        }
    }

    // 提交任务
    std::shared_ptr<Task> submit(Task::TaskFunc func) {
        auto task = std::make_shared<Task>(func);

        {
            std::unique_lock lock(m_queue_mutex);
            m_task_queue.push(task);
        }

        m_condition.notify_one();
        return task;
    }

    // 提交带依赖的任务
    std::shared_ptr<Task> submitWithDependencies(
        Task::TaskFunc func,
        const std::vector<std::shared_ptr<Task>>& dependencies) {

        auto task = std::make_shared<Task>(func);
        for (auto& dep : dependencies) {
            task->addDependency(dep);
        }

        {
            std::unique_lock lock(m_queue_mutex);
            m_task_queue.push(task);
        }

        m_condition.notify_one();
        return task;
    }

    // 等待所有任务完成
    void waitAll() {
        std::unique_lock lock(m_queue_mutex);
        m_done.wait(lock, [this] {
            return m_task_queue.empty() && m_active_tasks == 0;
        });
    }

private:
    void workerLoop(int worker_id) {
        while (m_running) {
            std::shared_ptr<Task> task;

            {
                std::unique_lock lock(m_queue_mutex);
                m_condition.wait(lock, [this] {
                    return !m_running || !m_task_queue.empty();
                });

                if (!m_running) break;

                // 查找准备好的任务
                task = findReadyTask();

                // 工作窃取
                if (!task) {
                    task = stealTask();
                }

                if (task) {
                    m_active_tasks++;
                }
            }

            if (task) {
                task->execute();
                task->markCompleted();

                {
                    std::unique_lock lock(m_queue_mutex);
                    m_active_tasks--;
                    if (m_active_tasks == 0 && m_task_queue.empty()) {
                        m_done.notify_all();
                    }
                }
            }
        }
    }

    std::shared_ptr<Task> findReadyTask() {
        // 从后往前查找（避免锁竞争）
        for (auto it = m_task_queue.begin(); it != m_task_queue.end(); ++it) {
            if ((*it)->isReady()) {
                auto task = *it;
                m_task_queue.erase(it);
                return task;
            }
        }
        return nullptr;
    }

    std::shared_ptr<Task> stealTask() {
        // 简化版工作窃取
        return nullptr;
    }

    std::vector<std::thread> m_workers;
    std::deque<std::shared_ptr<Task>> m_task_queue;

    std::mutex m_queue_mutex;
    std::condition_variable m_condition;
    std::condition_variable m_done;

    std::atomic<int> m_active_tasks{0};
    std::atomic<bool> m_running{true};
};

// 并行for_each
template<typename Iterator, typename Func>
void parallelForEach(Iterator begin, Iterator end, Func&& func, size_t chunk_size = 1000) {
    auto& scheduler = TaskScheduler::instance();

    size_t total = std::distance(begin, end);
    size_t num_chunks = (total + chunk_size - 1) / chunk_size;

    std::vector<std::shared_ptr<Task>> tasks;
    tasks.reserve(num_chunks);

    for (size_t i = 0; i < num_chunks; i++) {
        Iterator chunk_begin = std::next(begin, i * chunk_size);
        Iterator chunk_end = std::next(chunk_begin, std::min(chunk_size, total - i * chunk_size));

        auto task = scheduler.submit([chunk_begin, chunk_end, &func]() {
            for (auto it = chunk_begin; it != chunk_end; ++it) {
                func(*it);
            }
        });

        tasks.push_back(task);
    }

    scheduler.waitAll();
}

// 使用示例
void updateEntities(std::vector<Entity>& entities, float delta_time) {
    parallelForEach(entities.begin(), entities.end(), [delta_time](Entity& entity) {
        entity.update(delta_time);
    });
}
```

### GPU Instancing

```cpp
// Instancing渲染器
class InstancedRenderer {
public:
    struct InstanceData {
        mat4 transform;
        vec4 color;
    };

    void addMesh(std::shared_ptr<Mesh> mesh, std::shared_ptr<Material> material) {
        m_batches.push_back({mesh, material, {}});
    }

    void addInstance(size_t batch_index, const InstanceData& data) {
        m_batches[batch_index].instances.push_back(data);
    }

    void flush() {
        for (auto& batch : m_batches) {
            if (batch.instances.empty()) continue;

            // 上传实例数据
            m_instance_buffer->setData(batch.instances.data(),
                                      batch.instances.size() * sizeof(InstanceData));

            // 绑定资源
            batch.material->bind();
            batch.mesh->bind();

            // 绘制实例
            vkCmdDrawIndexed(cmd, batch.mesh->getIndexCount(),
                            batch.instances.size(), 0, 0, 0);
        }

        // 清空
        for (auto& batch : m_batches) {
            batch.instances.clear();
        }
    }

private:
    struct RenderBatch {
        std::shared_ptr<Mesh> mesh;
        std::shared_ptr<Material> material;
        std::vector<InstanceData> instances;
    };

    std::vector<RenderBatch> m_batches;
    std::shared_ptr<Buffer> m_instance_buffer;
};
```

### 内存池

```cpp
// 固定大小内存池
template<typename T, size_t ChunkSize = 1024>
class MemoryPool {
public:
    MemoryPool() {
        allocateChunk();
    }

    T* allocate() {
        if (m_free_list.empty()) {
            allocateChunk();
        }

        T* ptr = m_free_list.back();
        m_free_list.pop_back();
        return ptr;
    }

    void deallocate(T* ptr) {
        m_free_list.push_back(ptr);
    }

    template<typename... Args>
    T* create(Args&&... args) {
        T* ptr = allocate();
        new(ptr) T(std::forward<Args>(args)...);
        return ptr;
    }

    void destroy(T* ptr) {
        ptr->~T();
        deallocate(ptr);
    }

private:
    void allocateChunk() {
        T* chunk = static_cast<T*>(::operator new(ChunkSize * sizeof(T)));

        for (size_t i = 0; i < ChunkSize; i++) {
            m_free_list.push_back(&chunk[i]);
        }

        m_chunks.push_back(chunk);
    }

    std::vector<T*> m_free_list;
    std::vector<T*> m_chunks;
};

// 使用示例
class Entity {
public:
    static void* operator new(size_t size) {
        return s_pool.allocate();
    }

    static void operator delete(void* ptr) {
        s_pool.deallocate(static_cast<Entity*>(ptr));
    }

private:
    static MemoryPool<Entity, 1000> s_pool;
};

MemoryPool<Entity, 1000> Entity::s_pool;
```

---

## 性能分析工具

```cpp
// 性能分析器
class Profiler {
public:
    static Profiler& instance() {
        static Profiler inst;
        return inst;
    }

    // 开始采样
    void beginSample(const std::string& name) {
        auto& sample = m_samples[name];
        sample.start = std::chrono::high_resolution_clock::now();
        sample.depth = m_current_depth++;
    }

    // 结束采样
    void endSample(const std::string& name) {
        auto end = std::chrono::high_resolution_clock::now();
        m_current_depth--;

        auto& sample = m_samples[name];
        auto duration = std::chrono::duration_cast<std::chrono::microseconds>(
            end - sample.start);

        sample.total_time += duration.count();
        sample.call_count++;
    }

    // 重置
    void reset() {
        m_samples.clear();
        m_current_depth = 0;
    }

    // 打印报告
    void printReport() {
        std::cout << "=== Profiler Report ===" << std::endl;
        for (auto& [name, sample] : m_samples) {
            float avg_time = sample.total_time / (float)sample.call_count / 1000.0f;
            std::cout << std::string(sample.depth, ' ')
                      << name << ": "
                      << avg_time << " ms ("
                      << sample.call_count << " calls)"
                      << std::endl;
        }
    }

    // RAII辅助类
    class Scope {
    public:
        Scope(const std::string& name) : m_name(name) {
            Profiler::instance().beginSample(name);
        }

        ~Scope() {
            Profiler::instance().endSample(m_name);
        }

    private:
        std::string m_name;
    };

private:
    struct Sample {
        std::chrono::high_resolution_clock::time_point start;
        uint64_t total_time = 0;
        uint64_t call_count = 0;
        int depth = 0;
    };

    std::unordered_map<std::string, Sample> m_samples;
    int m_current_depth = 0;
};

// 使用宏简化使用
#define PROFILE_SCOPE(name) Profiler::Scope _profiler_scope(name)
#define PROFILE_FUNCTION() PROFILE_SCOPE(__FUNCTION__)

// 使用示例
void Game::update(float delta_time) {
    PROFILE_FUNCTION();

    PROFILE_SCOPE("Input");
    m_input_system->update();

    PROFILE_SCOPE("Physics");
    m_physics_system->update(delta_time);

    PROFILE_SCOPE("Rendering");
    m_render_system->render();
}
```

---

## 关键目录

```
runtime/core/
├── task_scheduler.h
├── thread_pool.h
├── memory_pool.h
└── profiler.h

runtime/function/render/
├── instanced_renderer.h
└── batch_renderer.h
```

---

## 实践任务

### 任务1: 使用性能分析器

```cpp
// 分析渲染管线
void RenderSystem::render() {
    PROFILE_SCOPE("RenderSystem::render");

    PROFILE_SCOPE("Culling");
    auto visible = cullObjects();

    PROFILE_SCOPE("Sorting");
    sortByMaterial(visible);

    PROFILE_SCOPE("Drawing");
    for (auto& obj : visible) {
        drawObject(obj);
    }

    // 打印报告
    static int frame_count = 0;
    if (++frame_count % 60 == 0) {
        Profiler::instance().printReport();
        Profiler::instance().reset();
    }
}
```

### 任务2: 应用批处理优化

```cpp
// 优化前
void renderObjects(const std::vector<RenderObject>& objects) {
    for (auto& obj : objects) {
        obj.material->bind();
        obj.mesh->draw();  // 大量Draw Call
    }
}

// 优化后
void renderObjectsOptimized(const std::vector<RenderObject>& objects) {
    // 按材质分组
    std::unordered_map<Material*, std::vector<Mesh*>> batches;
    for (auto& obj : objects) {
        batches[obj.material.get()].push_back(obj.mesh.get());
    }

    // 批量渲染
    for (auto& [material, meshes] : batches) {
        material->bind();
        for (auto* mesh : meshes) {
            mesh->draw();
        }
    }
}
```

---

## 验证标准

- [ ] 理解性能优化方法
  - [ ] 知道多线程编程模型
  - [ ] 理解GPU批处理
  - [ ] 了解内存管理策略

- [ ] 能使用性能工具
  - [ ] 会使用Profiler
  - [ ] 能识别瓶颈

- [ ] 实践完成
  - [ ] 应用优化技术
  - [ ] 测量性能提升

---

## 下周预告

第12周: 编辑器架构 - 编辑器-运行时分离
