# 资源管理设计 (@nova/resource)

## 概述

资源管理系统负责游戏资源的加载、缓存和释放，支持图片、音频、JSON、文本等多种资源类型。

## 设计目标

1. **异步加载**: 所有资源异步加载，支持进度回调
2. **缓存管理**: 避免重复加载，支持资源释放
3. **类型扩展**: 可注册自定义资源加载器
4. **批量加载**: 支持资源组批量加载

## 核心类型

### Resource - 资源基类

```typescript
// resource.ts
export abstract class Resource {
  abstract readonly type: string;
  abstract dispose(): void;
}

export interface ResourceOptions {
  url: string;
  name?: string;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  progress: number;
}
```

### ResourceLoader - 资源加载器

```typescript
// resource-loader.ts
export type ResourceFactory = (data: any) => Resource;

export interface LoaderOptions {
  baseUrl?: string;
  crossOrigin?: string;
}

export class ResourceLoader {
  private cache: Map<string, Resource> = new Map();
  private loading: Map<string, Promise<Resource>> = new Map();
  private loaders: Map<string, ResourceFactory> = new Map();

  private baseUrl: string = '';
  private crossOrigin: string = 'anonymous';

  onProgress: Signal<[LoadProgress]> = new Signal();
  onError: Signal<[url: string, error: Error]> = new Signal();
  onLoad: Signal<[url: string, resource: Resource]> = new Signal();

  constructor(options: LoaderOptions = {}) {
    this.baseUrl = options.baseUrl ?? '';
    this.crossOrigin = options.crossOrigin ?? 'anonymous';

    // 注册默认加载器
    this.registerDefaultLoaders();
  }

  private registerDefaultLoaders(): void {
    // 图片
    this.loaders.set('image', (img: HTMLImageElement) => new ImageResource(img));
    this.loaders.set('texture', (img: HTMLImageElement) => new ImageResource(img));

    // 音频
    this.loaders.set('audio', (buffer: AudioBuffer) => new AudioResource(buffer));

    // JSON
    this.loaders.set('json', (data: any) => new JSONResource(data));

    // 文本
    this.loaders.set('text', (text: string) => new TextResource(text));

    // 二进制
    this.loaders.set('binary', (buffer: ArrayBuffer) => new BinaryResource(buffer));
  }

  // 注册自定义加载器
  registerLoader(type: string, factory: ResourceFactory): void {
    this.loaders.set(type, factory);
  }

  // 获取完整 URL
  private getFullUrl(url: string): string {
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    return this.baseUrl + url;
  }

  // 获取资源类型
  private getResourceType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase() || '';

    const typeMap: Record<string, string> = {
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'webp': 'image',
      'svg': 'image',
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'm4a': 'audio',
      'json': 'json',
      'txt': 'text',
      'bin': 'binary',
      'dat': 'binary',
    };

    return typeMap[ext] || 'text';
  }

  // 加载单个资源
  async load<T extends Resource = Resource>(url: string, type?: string): Promise<T> {
    const fullUrl = this.getFullUrl(url);
    const resourceType = type || this.getResourceType(url);

    // 检查缓存
    if (this.cache.has(fullUrl)) {
      return this.cache.get(fullUrl) as T;
    }

    // 检查是否正在加载
    if (this.loading.has(fullUrl)) {
      return this.loading.get(fullUrl) as Promise<T>;
    }

    // 开始加载
    const promise = this.loadResource(fullUrl, resourceType);
    this.loading.set(fullUrl, promise);

    try {
      const resource = await promise;
      this.cache.set(fullUrl, resource);
      this.loading.delete(fullUrl);
      this.onLoad.emit(fullUrl, resource);
      return resource as T;
    } catch (error) {
      this.loading.delete(fullUrl);
      this.onError.emit(fullUrl, error as Error);
      throw error;
    }
  }

  private async loadResource(url: string, type: string): Promise<Resource> {
    switch (type) {
      case 'image':
      case 'texture':
        return this.loadImage(url);
      case 'audio':
        return this.loadAudio(url);
      case 'json':
        return this.loadJSON(url);
      case 'text':
        return this.loadText(url);
      case 'binary':
        return this.loadBinary(url);
      default:
        return this.loadText(url);
    }
  }

  // 加载图片
  private async loadImage(url: string): Promise<ImageResource> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = this.crossOrigin;

      img.onload = () => {
        const factory = this.loaders.get('image')!;
        resolve(factory(img) as ImageResource);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  // 加载音频
  private async loadAudio(url: string): Promise<AudioResource> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const factory = this.loaders.get('audio')!;
    return factory(audioBuffer) as AudioResource;
  }

  // 加载 JSON
  private async loadJSON(url: string): Promise<JSONResource> {
    const response = await fetch(url);
    const data = await response.json();

    const factory = this.loaders.get('json')!;
    return factory(data) as JSONResource;
  }

  // 加载文本
  private async loadText(url: string): Promise<TextResource> {
    const response = await fetch(url);
    const text = await response.text();

    const factory = this.loaders.get('text')!;
    return factory(text) as TextResource;
  }

  // 加载二进制
  private async loadBinary(url: string): Promise<BinaryResource> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();

    const factory = this.loaders.get('binary')!;
    return factory(buffer) as BinaryResource;
  }

  // 批量加载
  async loadAll(resources: Array<{ url: string; type?: string }>): Promise<Map<string, Resource>> {
    const results = new Map<string, Resource>();
    const total = resources.length;
    let loaded = 0;

    const promises = resources.map(async ({ url, type }) => {
      const resource = await this.load(url, type);
      loaded++;

      this.onProgress.emit({
        loaded,
        total,
        progress: loaded / total
      });

      results.set(url, resource);
      return resource;
    });

    await Promise.all(promises);
    return results;
  }

  // 加载资源清单
  async loadManifest(manifest: ResourceManifest): Promise<Map<string, Resource>> {
    const resources: Array<{ url: string; type?: string }> = [];

    for (const [name, item] of Object.entries(manifest)) {
      resources.push({
        url: typeof item === 'string' ? item : item.url,
        type: typeof item === 'string' ? undefined : item.type
      });
    }

    return this.loadAll(resources);
  }

  // 获取资源
  get<T extends Resource = Resource>(url: string): T | undefined {
    return this.cache.get(this.getFullUrl(url)) as T | undefined;
  }

  // 检查是否已加载
  has(url: string): boolean {
    return this.cache.has(this.getFullUrl(url));
  }

  // 释放资源
  unload(url: string): void {
    const fullUrl = this.getFullUrl(url);
    const resource = this.cache.get(fullUrl);

    if (resource) {
      resource.dispose();
      this.cache.delete(fullUrl);
    }
  }

  // 释放所有资源
  unloadAll(): void {
    for (const resource of this.cache.values()) {
      resource.dispose();
    }
    this.cache.clear();
  }

  // 获取缓存大小
  get size(): number {
    return this.cache.size;
  }
}

export interface ResourceManifest {
  [name: string]: string | { url: string; type?: string };
}
```

### 具体资源类型

```typescript
// resources/image-resource.ts
export class ImageResource extends Resource {
  readonly type = 'image';

  constructor(public readonly image: HTMLImageElement) {
    super();
  }

  get width(): number {
    return this.image.naturalWidth;
  }

  get height(): number {
    return this.image.naturalHeight;
  }

  dispose(): void {
    // HTMLImageElement 不需要特殊清理
  }
}

// resources/audio-resource.ts
export class AudioResource extends Resource {
  readonly type = 'audio';

  constructor(public readonly buffer: AudioBuffer) {
    super();
  }

  get duration(): number {
    return this.buffer.duration;
  }

  dispose(): void {
    // AudioBuffer 不需要特殊清理
  }
}

// resources/json-resource.ts
export class JSONResource extends Resource {
  readonly type = 'json';

  constructor(public readonly data: any) {
    super();
  }

  dispose(): void {
    // JSON 不需要特殊清理
  }
}

// resources/text-resource.ts
export class TextResource extends Resource {
  readonly type = 'text';

  constructor(public readonly text: string) {
    super();
  }

  dispose(): void {
    // 文本不需要特殊清理
  }
}

// resources/binary-resource.ts
export class BinaryResource extends Resource {
  readonly type = 'binary';

  constructor(public readonly buffer: ArrayBuffer) {
    super();
  }

  dispose(): void {
    // ArrayBuffer 不需要特殊清理
  }
}
```

## 资源组

### ResourceGroup - 资源组管理

```typescript
// resource-group.ts
export class ResourceGroup {
  private resources: Map<string, Resource> = new Map();
  private loader: ResourceLoader;

  onProgress: Signal<[LoadProgress]> = new Signal();
  onComplete: Signal<[]> = new Signal();

  constructor(loader: ResourceLoader) {
    this.loader = loader;
  }

  add(url: string, type?: string): this {
    // 仅记录 URL，实际加载在 load() 时
    this.resources.set(url, null as any);
    return this;
  }

  addMultiple(urls: string[]): this {
    for (const url of urls) {
      this.add(url);
    }
    return this;
  }

  async load(): Promise<void> {
    const urls = Array.from(this.resources.keys());
    const total = urls.length;
    let loaded = 0;

    for (const url of urls) {
      const resource = await this.loader.load(url);
      this.resources.set(url, resource);

      loaded++;
      this.onProgress.emit({
        loaded,
        total,
        progress: loaded / total
      });
    }

    this.onComplete.emit();
  }

  get<T extends Resource = Resource>(url: string): T | undefined {
    return this.resources.get(url) as T | undefined;
  }

  has(url: string): boolean {
    return this.resources.has(url);
  }

  get size(): number {
    return this.resources.size;
  }
}
```

## 资源缓存策略

### ResourceCache - LRU 缓存

```typescript
// resource-cache.ts
export class ResourceCache {
  private cache: Map<string, { resource: Resource; lastAccess: number }> = new Map();
  private maxSize: number;
  private currentSize: number = 0;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get<T extends Resource = Resource>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccess = Date.now();
      return entry.resource as T;
    }
    return undefined;
  }

  set(key: string, resource: Resource): void {
    // 如果超过最大大小，移除最旧的
    if (this.currentSize >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, { resource, lastAccess: Date.now() });
    this.currentSize++;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      entry.resource.dispose();
      this.cache.delete(key);
      this.currentSize--;
      return true;
    }
    return false;
  }

  clear(): void {
    for (const entry of this.cache.values()) {
      entry.resource.dispose();
    }
    this.cache.clear();
    this.currentSize = 0;
  }

  private evictOldest(): void {
    let oldest: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldest = key;
      }
    }

    if (oldest) {
      this.delete(oldest);
    }
  }

  get size(): number {
    return this.currentSize;
  }
}
```

## 使用示例

```typescript
import { ResourceLoader, ResourceCache } from '@nova/resource';

class Game {
  private loader: ResourceLoader;

  async init() {
    this.loader = new ResourceLoader({
      baseUrl: '/assets/'
    });

    // 监听加载进度
    this.loader.onProgress.on((progress) => {
      console.log(`Loading: ${(progress.progress * 100).toFixed(0)}%`);
    });

    // 加载单个资源
    const playerTexture = await this.loader.load<ImageResource>('images/player.png', 'image');
    console.log(`Player texture: ${playerTexture.width}x${playerTexture.height}`);

    // 加载 JSON
    const levelData = await this.loader.load<JSONResource>('levels/level1.json', 'json');
    console.log('Level data:', levelData.data);

    // 批量加载
    const resources = await this.loader.loadAll([
      { url: 'images/enemy.png', type: 'image' },
      { url: 'images/tile.png', type: 'image' },
      { url: 'sounds/jump.mp3', type: 'audio' },
      { url: 'data/config.json', type: 'json' },
    ]);

    // 使用资源清单
    await this.loader.loadManifest({
      player: 'images/player.png',
      enemy: { url: 'images/enemy.png', type: 'image' },
      jump: { url: 'sounds/jump.mp3', type: 'audio' },
      config: { url: 'data/config.json', type: 'json' },
    });

    // 获取已加载的资源
    const player = this.loader.get<ImageResource>('images/player.png');
  }

  // 资源组加载
  async loadLevel(levelName: string) {
    const group = new ResourceGroup(this.loader);

    group.add(`levels/${levelName}/background.png`);
    group.add(`levels/${levelName}/tileset.png`);
    group.add(`levels/${levelName}/data.json`);

    group.onProgress.on((progress) => {
      updateLoadingBar(progress.progress);
    });

    await group.load();

    return group;
  }
}
```

## 参考资源

- [PixiJS Loader](https://pixijs.com/7.x/guides/basics/loading-assets)
- [Howler.js](https://github.com/goldfire/howler.js) - 音频加载
- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
