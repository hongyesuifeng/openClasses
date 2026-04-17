# 序列化系统

本文档介绍 Cocos Creator 引擎的序列化系统，用于场景和资源的保存与加载。

## 目录

- [序列化概述](#serialization-overview)
- [序列化标记](#serialization-attributes)
- [序列化流程](#serialization-flow)
- [反序列化流程](#deserialization-flow)
- [自定义序列化](#custom-serialization)

---

## 序列化概述

### 核心文件

| 文件 | 说明 |
|------|------|
| `cocos/core/data/serialize.ts` | 序列化函数 |
| `cocos/core/data/deserialize.ts` | 反序列化函数 |
| `cocos/core/data/decorators/` | 序列化装饰器 |
| `cocos/serialization/deserialize.ts` | 反序列化入口 |

### 用途

- 场景文件（.scene）
- 预制体文件（.prefab）
- 资源文件（.mtl, .prefab 等）
- 编辑器状态保存

---

## 序列化标记

### 属性装饰器

```typescript
// cocos/core/data/decorators/property.ts

export function property (options?: PropertyOptions): PropertyDecorator {
    return function (target: any, key: string) {
        // 注册属性元数据
        const ctor = target.constructor;
        if (!ctor.__props__) {
            ctor.__props__ = [];
        }
        ctor.__props__.push(key);
    };
}
```

### 序列化选项

```typescript
interface PropertyOptions {
    // 类型
    type?: Constructor;

    // 是否可见（编辑器）
    visible?: boolean;

    // 是否序列化
    serializable?: boolean;

    // 是否编辑器专用
    editorOnly?: boolean;

    // 默认值
    default?: any;

    // 范围限制
    min?: number;
    max?: number;

    // 提示文本
    tooltip?: string;
}
```

### 使用示例

```typescript
import { _decorator, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MyComponent')
export class MyComponent extends Component {
    // 基本类型，自动序列化
    @property
    public speed = 10;

    // 引用类型，需要指定类型
    @property(Node)
    public targetNode: Node | null = null;

    // 不序列化
    @property({ serializable: false })
    public tempValue = 0;

    // 编辑器专用，不打包
    @property({ editorOnly: true })
    public debugFlag = false;

    // 带范围限制
    @property({ min: 0, max: 100 })
    public health = 100;

    // 数组类型
    @property({ type: [Vec3] })
    public positions: Vec3[] = [];
}
```

---

## 序列化流程

### serialize 函数

```typescript
// cocos/core/data/serialize.ts

export function serialize (
    object: any,
    options?: ISerializeOptions,
): string {
    // 1. 创建序列化上下文
    const context: SerializationContext = {
        _referenceMap: new Map(),
        _outputMap: new Map(),
        _result: [],
    };

    // 2. 序列化对象
    _serializeObject(object, context);

    // 3. 生成 JSON
    return JSON.stringify(context._result);
}

function _serializeObject (object: any, context: SerializationContext): void {
    // 获取对象类型信息
    const ctor = object.constructor;

    // 检查是否已序列化（引用处理）
    if (context._referenceMap.has(object)) {
        // 添加引用
        const index = context._referenceMap.get(object);
        context._outputMap.set(object, { __id__: index });
        return;
    }

    // 记录引用
    const index = context._result.length;
    context._referenceMap.set(object, index);

    // 获取可序列化属性
    const props = ctor.__props__ || [];

    // 构建输出对象
    const output: any = {
        __type__: js.getClassId(ctor),
    };

    for (const prop of props) {
        const value = object[prop];

        // 跳过默认值
        if (value === undefined) continue;

        // 序列化属性值
        output[prop] = _serializeValue(value, context);
    }

    context._result.push(output);
    context._outputMap.set(object, { __id__: index });
}
```

### 序列化输出格式

```json
[
    {
        "__type__": "MyComponent",
        "speed": 10,
        "targetNode": { "__id__": 1 },
        "health": 100,
        "positions": [
            { "__type__": "Vec3", "x": 1, "y": 2, "z": 3 }
        ]
    },
    {
        "__type__": "Node",
        "_name": "TargetNode",
        "_active": true
    }
]
```

---

## 反序列化流程

### deserialize 函数

```typescript
// cocos/serialization/deserialize.ts

export function deserialize (
    json: string | any[],
    options?: IDeserializeOptions,
): any {
    // 1. 解析 JSON
    const data = typeof json === 'string' ? JSON.parse(json) : json;

    // 2. 创建反序列化上下文
    const context: DeserializationContext = {
        _references: [],
        _result: null,
    };

    // 3. 第一遍：创建对象实例
    for (const item of data) {
        const obj = _createInstance(item);
        context._references.push(obj);
    }

    // 4. 第二遍：填充属性值
    for (let i = 0; i < data.length; ++i) {
        const item = data[i];
        const obj = context._references[i];
        _fillProperties(obj, item, context);
    }

    // 5. 第三遍：调用反序列化回调
    for (const obj of context._references) {
        if (obj._deserialize) {
            obj._deserialize(context);
        }
    }

    return context._references[0];
}

function _createInstance (item: any): any {
    if (!item.__type__) {
        return item;  // 普通对象
    }

    // 获取类构造函数
    const ctor = js.getClassById(item.__type__);
    if (!ctor) {
        return null;
    }

    // 创建实例
    return new ctor();
}

function _fillProperties (obj: any, item: any, context: DeserializationContext): void {
    for (const key in item) {
        if (key === '__type__') continue;

        let value = item[key];

        // 解析引用
        if (value && value.__id__ !== undefined) {
            value = context._references[value.__id__];
        }

        obj[key] = value;
    }
}
```

---

## 自定义序列化

### _serialize 方法

```typescript
export class MyComponent extends Component {
    private _data: Map<string, number> = new Map();

    // 自定义序列化
    public _serialize (context: SerializationContext): any {
        // 将 Map 转换为数组
        return {
            data: Array.from(this._data.entries()),
        };
    }

    // 自定义反序列化
    public _deserialize (data: any, context: DeserializationContext): void {
        // 将数组转换回 Map
        for (const [key, value] of data.data) {
            this._data.set(key, value);
        }
    }
}
```

### CustomSerializable 接口

```typescript
// cocos/core/data/custom-serializable.ts

export interface CustomSerializable {
    _serialize?(context: SerializationContext): any;
    _deserialize?(data: any, context: DeserializationContext): void;
}
```

---

## 引用处理

### 循环引用

```typescript
// 对象 A 引用 B，B 又引用 A
const nodeA = new Node('A');
const nodeB = new Node('B');
nodeA.addChild(nodeB);  // A -> B
nodeB.ref = nodeA;      // B -> A（假设有 ref 属性）

// 序列化输出：
[
    {
        "__type__": "Node",
        "_name": "A",
        "_children": [{ "__id__": 1 }]
    },
    {
        "__type__": "Node",
        "_name": "B",
        "_parent": { "__id__": 0 },
        "ref": { "__id__": 0 }  // 引用第一个对象
    }
]
```

---

## 序列化最佳实践

### 1. 使用属性装饰器

```typescript
// ✅ 正确
@property
public count = 0;

// ❌ 错误：不会被序列化
public count = 0;
```

### 2. 避免序列化大数据

```typescript
// ❌ 错误：序列化大量数据
@property({ type: [Vec3] })
public largeArray: Vec3[] = new Array(10000).fill(new Vec3());

// ✅ 正确：运行时生成
public largeArray: Vec3[] = [];
protected onLoad (): void {
    this.largeArray = new Array(10000).fill(new Vec3());
}
```

### 3. 使用 _serialize 处理复杂数据

```typescript
// 对于 Map、Set 等不支持 JSON 的数据结构
public _serialize (): any {
    return {
        myMap: Array.from(this._myMap.entries()),
    };
}

public _deserialize (data: any): void {
    this._myMap = new Map(data.myMap);
}
```

---

## 下一步

核心基础层学习完成后，继续学习 [场景图系统](../02-scene-graph/README.md)。
