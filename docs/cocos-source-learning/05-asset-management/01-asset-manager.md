# AssetManager 核心

AssetManager 是资源管理系统的核心，提供统一的资源加载、缓存和释放接口。

## 目录

- [单例设计](#单例设计)
- [核心 API](#核心-api)
- [加载机制](#加载机制)
- [缓存系统](#缓存系统)
- [技术原理](#技术原理)

---

## 单例设计

```typescript
// cocos/asset/asset-manager/asset-manager.ts

export class AssetManager {
    // 全局单例
    static get instance(): AssetManager;

    // 内部 Bundle
    bundles: Record<string, Bundle>;     // 已加载的资源包
    assets: Record<string, Asset>;       // 全局资源缓存（UUID → Asset）
    pipeline: Pipeline;                  // 加载管线

    // 初始化
    init(options: IAssetManagerOptions): void;
}
```

### 访问方式

```typescript
import { assetManager } from 'cc';

// 全局单例访问
assetManager.loadBundle('resources');
assetManager.getBundle('common');
```

---

## 核心 API

### 加载接口

```typescript
class AssetManager {
    // ─── 通用加载 ───
    loadAny(requests, options?, onProgress?, onComplete?): void;

    // ─── 预加载（不创建实例，只下载） ───
    preloadAny(requests, options?, onProgress?, onComplete?): void;

    // ─── 远程加载 ───
    loadRemote<T extends Asset>(url, options?, onComplete?): void;

    // ─── 资源包 ───
    loadBundle(nameOrUrl, options?, onComplete?): void;

    // ─── 释放 ───
    releaseAsset(asset: Asset): void;
    releaseUnused(): void;              // 释放所有未引用资源

    // ─── 查询 ───
    getBundle(name: string): Bundle | null;
}
```

### loadAny 详解

`loadAny` 是最灵活的加载方法，支持多种输入格式：

```typescript
// 按路径加载
assetManager.loadAny('textures/hero', (err, asset) => { });

// 按 UUID 加载
assetManager.loadAny({ uuid: 'xxxx-xxxx' }, (err, asset) => { });

// 批量加载
assetManager.loadAny(['textures/a', 'textures/b'], null, (done, total) => {
    // 进度回调
}, (err, assets) => {
    // 完成回调
});
```

---

## 加载机制

### Pipeline 管线模式

AssetManager 使用管道（Pipeline）模式处理加载流程：

```typescript
// cocos/asset/asset-manager/pipeline.ts

class Pipeline {
    tasks: Task[];
    pipes: Function[];   // 管道函数数组

    // 执行管线
    async run(task: Task): void;
}
```

```
加载请求 → Pipeline 执行
              │
              ▼
         ┌─ Pipe 1: download ──→ 下载原始数据
         │
         ▼
         ┌─ Pipe 2: parse ─────→ 解析数据格式
         │
         ▼
         ┌─ Pipe 3: factory ───→ 创建 Asset 实例
         │
         ▼
         缓存并回调 onComplete
```

### Task 异步任务

```typescript
// cocos/asset/asset-manager/task.ts

class Task {
    id: number;                    // 任务 ID
    input: any;                    // 输入（路径/UUID/请求）
    output: any;                   // 输出（加载完成的 Asset）
    options: Record<string, any>;  // 选项
    onProgress: Function;          // 进度回调
    onComplete: Function;          // 完成回调
    isError: boolean;              // 是否出错
}
```

---

## 缓存系统

### UUID → Asset 映射

```
全局缓存表:
┌──────────────────────────┬─────────────────────────┐
│ UUID                     │ Asset 实例               │
├──────────────────────────┼─────────────────────────┤
│ "a1b2c3d4@f084a"         │ Texture2D (hero.png)     │
│ "e5f6g7h8@12345"         │ Material (heroMat)       │
│ "i9j0k1l2@67890"         │ Prefab (heroPrefab)      │
└──────────────────────────┴─────────────────────────┘

特点:
- 全局唯一：每个 UUID 对应一个 Asset 实例
- 引用计数：自动跟踪资源使用情况
- 依赖管理：加载资源时自动加载依赖
```

### 引用计数机制

```
Asset A (heroPrefab)
    ├── 引用 1: Scene 中使用
    ├── 引用 2: 代码持有
    └── 依赖:
        ├── Asset B (heroTexture)  ── 引用计数 = 1
        └── Asset C (heroMat)     ── 引用计数 = 1

当 Asset A 被释放时:
  1. Asset A 引用计数 -1
  2. Asset B、C 引用计数也 -1（依赖释放）
  3. 引用计数为 0 的资源可被 GC 回收
```

---

## 技术原理

### 1. 管道模式（Pipeline Pattern）

AssetManager 的加载流程采用管道模式，每个阶段只处理自己的职责：

```
请求 → [下载] → [解析] → [创建] → [缓存] → 回调
         │         │         │
         │         │         └── Factory: 根据类型创建实例
         │         └── Parser: 将二进制/JSON 解析为结构化数据
         └── Downloader: 从 Bundle/网络获取原始数据
```

### 2. 异步任务调度

```
Task 1 (load hero)     ──→ Pipeline ──→ onComplete
Task 2 (load monster)  ──→ Pipeline ──→ onComplete
Task 3 (load map)      ──→ Pipeline ──→ onComplete

多个 Task 可以并行执行
Pipeline 内部管理 Task 队列和并发数
```

### 3. 依赖自动加载

```
加载 Prefab (hero)
    │
    ├── 发现依赖: heroTexture, heroMat, heroAnim
    │
    ├── 自动创建子任务加载依赖
    │   ├── loadTask(heroTexture)
    │   ├── loadTask(heroMat)
    │   └── loadTask(heroAnim)
    │
    └── 所有依赖加载完成后，完成 Prefab 加载
```

---

## 下一步

完成 AssetManager 的学习后，继续学习 [02-Bundle 资源包](./02-bundle-system.md)。
