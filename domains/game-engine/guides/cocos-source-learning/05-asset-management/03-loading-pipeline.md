# 加载流水线

加载流水线是资源管理系统的执行引擎，将加载过程拆分为下载、解析、创建等多个阶段。

## 目录

- [Pipeline 管线](#pipeline-管线)
- [Factory 工厂](#factory-工厂)
- [ReleaseManager 释放管理](#releasemanager-释放管理)
- [完整加载流程](#完整加载流程)
- [技术原理](#技术原理)

---

## Pipeline 管线

Pipeline 将加载过程拆分为一系列管道函数，依次执行：

```typescript
// cocos/asset/asset-manager/pipeline.ts

class Pipeline {
    pipes: Function[];   // 管道函数数组

    run(task: Task): void {
        // 依次执行每个 pipe
        // 每个 pipe 处理完后传递给下一个
    }
}
```

### 内置管道阶段

| 阶段 | 说明 | 输入 | 输出 |
|------|------|------|------|
| download | 下载原始数据 | 路径/UUID | ArrayBuffer / JSON |
| parse | 解析数据格式 | 原始数据 | 结构化对象 |
| factory | 创建资源实例 | 解析结果 | Asset 实例 |

---

## Factory 工厂

Factory 根据资源类型创建对应的 Asset 实例。

```typescript
// cocos/asset/asset-manager/factory.ts

export class Factory {
    // 注册创建器
    register(type: string | Record<string, CreateHandler>, handler?: CreateHandler): void;

    // 创建实例
    create(id: string, data: any, type: string, options: Record<string, any>, onComplete): void;
}
```

### 内置资源创建器

| 类型 | 创建器 | 说明 |
|------|--------|------|
| `.png/.jpg` | Texture2D 创建器 | 解码图片为 GPU 纹理 |
| `.json` | JsonAsset 创建器 | 解析 JSON 数据 |
| `.prefab` | Prefab 创建器 | 解析预制体 |
| `.scene` | SceneAsset 创建器 | 解析场景 |
| `.mtl` | Material 创建器 | 解析材质 |
| `.mp3/.wav` | AudioClip 创建器 | 解码音频 |
| `.anim` | AnimationClip 创建器 | 解析动画数据 |

### 注册自定义创建器

```typescript
// 扩展 Factory 支持新资源类型
assetManager.factory.register('.csv', (id, data, options, onComplete) => {
    const csv = parseCSV(data);
    onComplete(null, csv);
});
```

---

## ReleaseManager 释放管理

ReleaseManager 管理资源的引用计数和自动释放。

```typescript
// cocos/asset/asset-manager/release-manager.ts

export class ReleaseManager {
    // 尝试释放资源
    tryRelease(asset: Asset, force?: boolean): void;

    // 初始化（注册场景切换回调）
    init(): void;
}
```

### 引用计数流程

```
1. 资源加载完成
   asset.refCount = 0

2. 场景/组件引用资源
   asset.addRef()  →  refCount = 1

3. 多处引用
   asset.addRef()  →  refCount = 2

4. 释放引用
   asset.decRef()  →  refCount = 1
   asset.decRef()  →  refCount = 0

5. refCount = 0 时
   tryRelease(asset)
   ├── 依赖资源也 decRef()
   └── 标记为可回收（GC 负责真正释放）
```

### force 参数

```typescript
// 正常释放（检查引用计数）
releaseManager.tryRelease(asset);     // refCount > 0 时不释放

// 强制释放（忽略引用计数）
releaseManager.tryRelease(asset, true); // 强制释放，不管 refCount
```

---

## 完整加载流程

```
用户调用: bundle.load('hero', Prefab)
    │
    ▼
AssetManager.loadAny({ path: 'hero', type: Prefab, bundle: 'common' })
    │
    ├── 1. 解析路径
    │   ├── 查询 Bundle 配置 → UUID: "a1b2c3"
    │   └── 查询全局缓存 → 未命中
    │
    ├── 2. 创建 Task
    │   └── task = { input: uuid, options, callbacks }
    │
    ├── 3. Pipeline.run(task)
    │   │
    │   ├── Pipe: download
    │   │   ├── 根据 Bundle 类型选择下载方式
    │   │   ├── 本地 Bundle: 从包内读取
    │   │   ├── 远程 Bundle: HTTP 请求
    │   │   └── 输出: 原始二进制/JSON 数据
    │   │
    │   ├── Pipe: parse
    │   │   ├── 根据文件扩展名选择解析器
    │   │   ├── JSON → 解析为结构化对象
    │   │   ├── 图片 → 解码为像素数据
    │   │   └── 输出: 解析后的数据对象
    │   │
    │   └── Pipe: factory
    │       ├── 根据类型选择 Factory
    │       ├── 创建 Asset 实例 (new Prefab())
    │       ├── 填充属性
    │       ├── 处理依赖（递归加载子资源）
    │       └── 输出: Asset 实例
    │
    ├── 4. 缓存
    │   └── assets[uuid] = asset
    │
    └── 5. 回调 onComplete(err, asset)
```

---

## 技术原理

### 1. 异步管道设计

```
Pipeline 采用异步流程：

pipe1(task, done) {
    // 处理任务
    done();  // 通知完成，传递到下一个 pipe
}

pipe2(task, done) {
    // 处理任务
    done();
}

// 如果某个 pipe 不调用 done()，流程暂停
// 可用于等待异步操作（如网络下载）
```

### 2. 依赖图加载

```
加载 Prefab (hero)
    │
    ├── 依赖分析:
    │   hero.prefab
    │   ├── heroTexture (Texture2D)
    │   ├── heroMat (Material)
    │   │   ├── effectAsset (EffectAsset)
    │   │   └── heroNormalMap (Texture2D)
    │   └── heroAnim (AnimationClip)
    │
    └── 按依赖拓扑排序加载:
        1. effectAsset (无依赖)
        2. heroTexture (无依赖)
        3. heroNormalMap (无依赖)
        4. heroAnim (无依赖)
        5. heroMat (依赖 effectAsset)
        6. hero.prefab (依赖所有)
```

### 3. 循环引用处理

ReleaseManager 在释放时检测循环引用，避免无限递归：

```typescript
tryRelease(asset, force) {
    // 1. 检查引用计数
    if (asset.refCount > 0 && !force) return;

    // 2. 使用 visited 集合避免循环引用
    const visited = new Set<Asset>();

    function releaseRecursive(a) {
        if (visited.has(a)) return;  // 防止循环
        visited.add(a);

        // 递归释放依赖
        for (const dep of a.dependencies) {
            releaseRecursive(dep);
        }
    }
}
```

---

## 下一步

完成加载流水线的学习后，继续学习 [04-资源类型系统](./04-asset-types.md)。
