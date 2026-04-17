# 打包场景与序列化

> PackedScene 是 Godot 场景序列化和反序列化的核心机制，它将场景树结构、节点属性和信号连接保存为可持久化的数据。本文深入分析 PackedScene、SceneState、.tscn 文件格式、场景实例化和场景继承的源码实现。

---

## 目录

- [1. PackedScene 类概览](#1-packedscene-类概览)
- [2. SceneState 场景状态](#2-scenestate-场景状态)
- [3. .tscn 文件格式解析](#3-tscn-文件格式解析)
- [4. 场景实例化过程](#4-场景实例化过程)
- [5. 场景继承](#5-场景继承)
- [6. Resource 序列化与 .tres 格式](#6-resource-序列化与-tres-格式)
- [7. 源码结构总览](#7-源码结构总览)

---

## 1. PackedScene 类概览

### 继承体系

```
Object
└── RefCounted                   ← 引用计数基类
    └── Resource                 ← 可序列化资源基类
        └── PackedScene          ← 打包场景（本节重点）
```

### PackedScene 核心成员

```cpp
// scene/resources/packed_scene.h（简化）
class PackedScene : public Resource {
    GDCLASS(PackedScene, Resource);

    // ====== 场景状态 ======
    Ref<SceneState> scene_state;    // 场景的核心数据（节点树 + 属性 + 连接）

    // ====== 场景状态标志 ======
    enum GenEditState {
        GEN_EDIT_STATE_DISABLED,     // 禁止编辑（运行时实例化）
        GEN_EDIT_STATE_INSTANCE,     // 允许编辑（编辑器实例化）
        GEN_EDIT_STATE_MAIN,         // 主场景实例化
    };

public:
    // ====== 实例化 ======
    Node *instantiate(GenEditState p_edit_state = GEN_EDIT_STATE_DISABLED) const;

    // ====== 打包 ======
    Error pack(Node *p_root);       // 将节点树打包为场景数据

    // ====== 场景状态访问 ======
    Ref<SceneState> get_state() const;

    // ====== 场景继承 ======
    bool can_instantiate() const;
    void set_path(const String &p_path, bool p_take_over = false) override;
};
```

### PackedScene 与 SceneState 的关系

```
PackedScene 与 SceneState 的分工：

  PackedScene:
  ├── 继承 Resource，可被 ResourceLoader 加载
  ├── 持有 SceneState 引用
  ├── 提供 instantiate() 方法
  └── 提供 pack() 方法

  SceneState:
  ├── 存储场景的实际数据
  ├── 节点列表（类型、名称、属性）
  ├── 信号连接列表
  ├── 场景继承信息
  └── 二进制/文本序列化

  关系图：
  ┌───────────────────┐
  │   PackedScene     │
  │   (Resource)      │
  │                   │
  │   Ref<SceneState> │──────→ ┌────────────────────┐
  │                   │        │   SceneState        │
  └───────────────────┘        │                    │
                               │ NodeData[] nodes   │
                               │ Connection[] conns  │
                               │ 信号/组信息         │
                               │ 继承信息            │
                               └────────────────────┘
```

---

## 2. SceneState 场景状态

### SceneState 核心数据结构

```cpp
// scene/resources/packed_scene.h（SceneState 定义，简化）
class SceneState : public Resource {
    GDCLASS(SceneState, Resource);

public:
    // ====== 节点数据 ======
    struct NodeData {
        int parent = -1;              // 父节点索引（-1 = 根节点）
        int owner = -1;               // 所有者索引
        StringName type;              // 节点类型名（如 "Node3D"）
        StringName name;              // 节点实例名
        int instance = -1;            // 子场景索引（嵌套场景）
        int index;                    // 在父节点子列表中的位置
        Vector<int> properties;       // 属性索引列表
        int groups = 0;               // 分组数量
    };

    // ====== 属性数据 ======
    struct PropertyData {
        StringName name;              // 属性名
        Variant value;                // 属性值（Variant 类型）
    };

    // ====== 信号连接数据 ======
    struct ConnectionData {
        int from;                     // 源节点索引
        int to;                       // 目标节点索引
        StringName signal;            // 信号名
        StringName method;            // 方法名
        uint32_t flags = 0;           // 连接标志
        int binds = 0;                // 绑定参数数量
    };

    // ====== 子场景数据 ======
    // 嵌套的 PackedScene 列表
    Vector<Ref<PackedScene>> sub_scenes;

private:
    // ====== 核心存储 ======
    Vector<NodeData> nodes;           // 所有节点数据
    Vector<PropertyData> properties;  // 所有属性数据
    Vector<ConnectionData> connections; // 所有连接数据

    // ====== 元数据 ======
    StringName base_scene;            // 继承的基础场景路径
    Vector<StringName> node_groups;   // 节点分组信息

public:
    // ====== 访问方法 ======
    int get_node_count() const;
    StringName get_node_type(int p_idx) const;
    StringName get_node_name(int p_idx) const;
    int get_node_parent(int p_idx) const;
    int get_node_property_count(int p_idx) const;
    StringName get_node_property_name(int p_idx, int p_prop) const;
    Variant get_node_property_value(int p_idx, int p_prop) const;

    int get_connection_count() const;
    ConnectionData get_connection(int p_idx) const;
};
```

### SceneState 数据组织示例

```
场景结构：
  Player (CharacterBody3D)
  ├── Mesh (MeshInstance3D)
  │   └── material: StandardMaterial3D
  └── Collider (CollisionShape3D)
      └── shape: BoxShape3D

SceneState 内部存储：

  nodes[] 数组：
  ┌─────┬────────────────────┬────────┬────────┬────────┐
  │ idx │ type               │ name   │ parent │ owner  │
  ├─────┼────────────────────┼────────┼────────┼────────┤
  │  0  │ CharacterBody3D    │ Player │   -1   │   0    │
  │  1  │ MeshInstance3D     │ Mesh   │    0   │   0    │
  │  2  │ CollisionShape3D   │ Collider│   0   │   0    │
  └─────┴────────────────────┴────────┴────────┴────────┘

  properties[] 数组：
  ┌─────┬───────────────────────┬──────────────────────┐
  │ idx │ name                  │ value                │
  ├─────┼───────────────────────┼──────────────────────┤
  │  0  │ transform             │ Transform3D(...)     │
  │  1  │ script                │ res://player.gd      │
  │  2  │ mesh                  │ BoxMesh(...)         │
  │  3  │ surface_material/0    │ StandardMaterial3D   │
  │  4  │ shape                 │ BoxShape3D(...)      │
  └─────┴───────────────────────┴──────────────────────┘

  nodes[0].properties = [0, 1]           ← Player 的属性
  nodes[1].properties = [2, 3]           ← Mesh 的属性
  nodes[2].properties = [4]              ← Collider 的属性

  connections[] 数组（信号连接）：
  ┌─────┬──────┬────┬──────────┬──────────┬───────┐
  │ idx │ from │ to │ signal   │ method   │ flags │
  ├─────┼──────┼────┼──────────┼──────────┼───────┤
  │  0  │   0  │ -1 │ died     │ _on_died │  0    │
  └─────┴──────┴────┴──────────┴──────────┴───────┘
```

---

## 3. .tscn 文件格式解析

### 文本场景格式（.tscn）

Godot 使用类似 INI 的文本格式存储场景：

```
[gd_scene load_steps=3 format=3 uid="uid://bq3x8h27lbe0y"]

[ext_resource type="Script" path="res://player.gd" id="1"]
[ext_resource type="Texture2D" path="res://icon.svg" id="2"]

[sub_resource type="BoxShape3D" id="BoxShape3D_1"]
size = Vector3(1, 1, 1)

[node name="Player" type="CharacterBody3D"]
script = ExtResource("1")

[node name="Mesh" type="MeshInstance3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0)
mesh = BoxMesh(1, 1, 1)

[node name="Collider" type="CollisionShape3D" parent="."]
shape = SubResource("BoxShape3D_1")

[node name="Sprite" type="Sprite3D" parent="Mesh"]
texture = ExtResource("2")

[connection signal="body_entered" from="." to="." method="_on_body_entered"]
```

### .tscn 格式详解

```
文件结构：

  1. 文件头
     [gd_scene ...]
     ├── load_steps: 加载步骤数（外部资源 + 子资源 + 1）
     ├── format: 格式版本（3 = Godot 4.x）
     └── uid: 唯一标识符（用于资源缓存）

  2. 外部资源引用
     [ext_resource type="类型" path="路径" id="ID"]
     ├── type: 资源类型（Script, Texture2D, PackedScene 等）
     ├── path: 资源文件路径
     └── id: 引用标识符（文件内唯一）

  3. 内联子资源
     [sub_resource type="类型" id="ID"]
     key = value
     ├── type: 资源类型（BoxShape3D, Shader, 等）
     ├── id: 引用标识符
     └── 属性键值对

  4. 节点定义
     [node name="名称" type="类型" parent="父路径" ...]
     key = value
     ├── name: 节点名称
     ├── type: 节点类名
     ├── parent: 父节点路径（"." = 根节点）
     ├── instance: 子场景引用（可选）
     └── 节点属性键值对

  5. 信号连接
     [connection signal="信号名" from="源路径" to="目标路径" method="方法名"]
```

### 属性值的序列化语法

```
属性值的 Variant 序列化格式：

  基本类型：
    name = "Hello World"           → String
    visible = true                 → bool
    position = Vector2(100, 200)   → Vector2
    transform = Transform3D(1,0,0,0,1,0,0,0,1,0,0,0)  → Transform3D
    color = Color(1, 0, 0, 1)     → Color
    value = 42                     → int
    speed = 3.14                   → float

  资源引用：
    texture = ExtResource("2")     → 引用外部资源
    shape = SubResource("ID")      → 引用子资源

  数组：
    array = [1, 2, 3, 4]          → PackedInt32Array
    children = [Node("A"), Node("B")]  → Array

  字典：
    metadata = { "key": "value", "count": 10 }

  枚举：
    process_mode = 0               → 按整数值
    layout_mode = 2                → Control 布局模式
```

### 二进制场景格式（.scn）

```
.tscn (文本) vs .scn (二进制)：

  .tscn 文本格式：
  ├── 人类可读
  ├── Git 友好（可 diff）
  ├── 默认格式
  └── 适合版本控制

  .scn 二进制格式：
  ├── 更小的文件体积
  ├── 更快的加载速度
  ├── 不可读
  └── 适合发布版本

  上帝油在导出时自动将 .tscn 转换为 .scn 以优化加载性能
```

---

## 4. 场景实例化过程

### instantiate() 源码分析

```cpp
// scene/resources/packed_scene.cpp（简化）
Node *PackedScene::instantiate(GenEditState p_edit_state) const {
    // 1. 获取场景状态
    Ref<SceneState> state = get_state();
    ERR_FAIL_COND_V_MSG(state.is_null(), nullptr, "Scene state is null.");

    // 2. 检查是否可以实例化
    ERR_FAIL_COND_V_MSG(!can_instantiate(), nullptr, "Cannot instantiate scene.");

    // 3. 创建根节点
    StringName root_type = state->get_node_type(0);
    Variant::Type variant_type = ClassDB::get_type(root_type);
    Object *root_obj = ClassDB::instantiate(root_type);
    Node *root = Object::cast_to<Node>(root_obj);

    // 4. 设置根节点属性
    root->set_name(state->get_node_name(0));

    // 5. 应用根节点属性
    _apply_node_properties(state, 0, root, p_edit_state);

    // 6. 创建子节点并构建树
    for (int i = 1; i < state->get_node_count(); i++) {
        _instantiate_node(state, i, root, p_edit_state);
    }

    // 7. 建立信号连接
    for (int i = 0; i < state->get_connection_count(); i++) {
        SceneState::ConnectionData conn = state->get_connection(i);
        Node *source = _get_node_by_index(root, conn.from);
        Node *target = _get_node_by_index(root, conn.to);
        if (source && target) {
            source->connect(conn.signal, Callable(target, conn.method), conn.flags);
        }
    }

    return root;
}
```

### 实例化的完整时序

```
PackedScene.instantiate() 时序图：

  步骤 1：创建节点
  ┌────────────────────────────────────────────────┐
  │ for each node in SceneState.nodes:             │
  │   ├── ClassDB::instantiate(type)               │
  │   │   └── 根据 "CharacterBody3D" 创建实例      │
  │   ├── node->set_name(name)                     │
  │   └── 存储到 node_map[index] = node            │
  │                                                │
  │ 结果：所有节点已创建但未建立父子关系              │
  └────────────────────────────────────────────────┘

  步骤 2：构建树
  ┌────────────────────────────────────────────────┐
  │ for each node (按索引顺序，保证父先于子):       │
  │   ├── parent_node = node_map[node.parent]      │
  │   ├── parent_node->add_child(current_node)     │
  │   │   ├── 触发 NOTIFICATION_PARENTED           │
  │   │   └── (此时可能还未进入场景树)              │
  │   └── 设置 owner                               │
  │                                                │
  │ 结果：节点树结构已建立                           │
  └────────────────────────────────────────────────┘

  步骤 3：应用属性
  ┌────────────────────────────────────────────────┐
  │ for each node:                                 │
  │   for each property in node.properties:        │
  │     ├── 获取属性名和值                          │
  │     ├── 处理资源引用（ExtResource/SubResource）  │
  │     └── node->set(property_name, property_value)│
  │                                                │
  │ 结果：所有属性已设置                            │
  └────────────────────────────────────────────────┘

  步骤 4：建立连接
  ┌────────────────────────────────────────────────┐
  │ for each connection in SceneState.connections:  │
  │   ├── source = node_map[conn.from]             │
  │   ├── target = node_map[conn.to]               │
  │   └── source->connect(signal, Callable(target,method))│
  │                                                │
  │ 结果：所有信号连接已建立                         │
  └────────────────────────────────────────────────┘

  步骤 5：添加到场景树
  ┌────────────────────────────────────────────────┐
  │ parent_node->add_child(instantiated_root)      │
  │   ├── _propagate_enter_tree()                  │
  │   │   ├── 所有节点收到 ENTER_TREE              │
  │   │   └── 延迟触发 READY                       │
  │   └── 场景实例化完成                            │
  └────────────────────────────────────────────────┘
```

### 嵌套场景（子场景）的实例化

```
场景可以嵌套其他场景：

  Player.tscn:
    Player (CharacterBody3D)
    ├── Mesh (MeshInstance3D)
    └── Collider (CollisionShape3D)

  Level.tscn:
    Level (Node3D)
    ├── Player (instance=Player.tscn)   ← 嵌套场景
    ├── Camera (Camera3D)
    └── Lights (Node3D)

  SceneState 中嵌套场景的表示：
  nodes[i].instance = sub_scene_index
  sub_scenes[sub_scene_index] = PackedScene(Player.tscn)

  实例化过程：
  1. 遇到 instance != -1 的节点
  2. 加载对应的 PackedScene
  3. 递归实例化子场景
  4. 将子场景的根节点替换为当前节点位置
  5. 应用覆盖属性
```

```cpp
// 简化的嵌套场景处理
Node *_instantiate_sub_scene(const Ref<PackedScene> &p_scene, NodeData &p_data) {
    // 实例化子场景
    Node *instance_root = p_scene->instantiate();

    // 应用覆盖属性（子场景实例上修改的属性）
    for (int prop_idx : p_data.properties) {
        StringName prop_name = properties[prop_idx].name;
        Variant prop_value = properties[prop_idx].value;
        instance_root->set(prop_name, prop_value);
    }

    return instance_root;
}
```

---

## 5. 场景继承

### 场景继承的概念

```
Godot 支持场景继承（类似类的继承）：

  基础场景：enemy_base.tscn
  ┌──────────────────────────────┐
  │ Enemy (CharacterBody3D)      │
  │ ├── script: enemy_base.gd    │
  │ ├── Mesh (MeshInstance3D)    │
  │ └── Collider (CollisionShape3D) │
  └──────────────────────────────┘

  派生场景：enemy_fast.tscn
  ┌──────────────────────────────┐
  │ [extends: enemy_base.tscn]   │
  │                              │
  │ 修改:                         │
  │ - Enemy.speed = 10           │ ← 覆盖基础属性
  │ - Mesh.material = fast_mat   │ ← 覆盖子节点属性
  └──────────────────────────────┘

  派生场景：enemy_tank.tscn
  ┌──────────────────────────────┐
  │ [extends: enemy_base.tscn]   │
  │                              │
  │ 修改:                         │
  │ - Enemy.health = 200         │
  │ - 新增: Shield (MeshInstance3D) │ ← 新增子节点
  └──────────────────────────────┘
```

### .tscn 中的继承表示

```
enemy_fast.tscn 文件内容：

  [gd_scene load_steps=2 format=3 uid="..."]

  [ext_resource type="PackedScene" path="res://enemy_base.tscn" id="1"]

  [node name="Enemy" instance=ExtResource("1")]    ← 声明继承
  speed = 10.0                                      ← 覆盖属性

  [node name="Mesh" parent="." index="0"]          ← 修改子节点
  surface_material/0 = ExtResource("fast_mat")

场景继承的 SceneState 结构：
  ├── base_scene = "res://enemy_base.tscn"     ← 基础场景路径
  ├── nodes[] 只包含差异部分                    ← 只存修改和新节点
  └── 实例化时先加载基础场景，再应用差异
```

### 继承的实例化流程

```cpp
// 简化的继承实例化逻辑
Node *PackedScene::_instantiate_with_inheritance(GenEditState p_edit_state) const {
    Ref<SceneState> state = get_state();

    // 1. 如果有基础场景，先实例化基础场景
    Node *root = nullptr;
    if (!state->get_base_scene().is_empty()) {
        Ref<PackedScene> base = ResourceLoader::load(state->get_base_scene());
        root = base->instantiate(p_edit_state);

        // 建立节点索引映射
        HashMap<int, Node *> node_map;
        _build_node_index_map(root, node_map);
    }

    // 2. 应用覆盖属性
    for (int i = 0; i < state->get_node_count(); i++) {
        Node *node = node_map[i];
        if (node) {
            // 覆盖已有节点的属性
            for (int j = 0; j < state->get_node_property_count(i); j++) {
                StringName prop = state->get_node_property_name(i, j);
                Variant value = state->get_node_property_value(i, j);
                node->set(prop, value);
            }
        } else {
            // 新增节点（基础场景中不存在的）
            _add_new_node(state, i, root, node_map);
        }
    }

    return root;
}
```

### 场景继承的限制

```
场景继承的限制：

  可以做的：
  ├── 修改任何节点的属性
  ├── 添加新的子节点
  ├── 添加新的信号连接
  └── 修改脚本

  不能做的：
  ├── 删除基础场景中的节点（只能隐藏）
  ├── 改变节点类型
  ├── 改变节点的父子关系
  └── 重新排序基础场景的节点

  继承链深度：
  └── 支持多层继承：A → B → C
      但过深的继承会增加加载时间和复杂度
```

---

## 6. Resource 序列化与 .tres 格式

### Resource 基类的序列化接口

```cpp
// core/io/resource.h（简化）
class Resource : public RefCounted {
    GDCLASS(Resource, RefCounted);

    // ====== 序列化接口 ======
    // ResourceFormatLoader 负责加载
    // ResourceFormatSaver 负责保存

    // ====== 核心属性 ======
    String path;                    // 资源路径（res://xxx）
    StringName name;                // 资源名称
    int subindex = 0;              // 子资源索引

    // ====== 缓存 ======
    static HashMap<String, Resource *> resource_cache;
};
```

### .tres 文本资源格式

```
资源文件格式（.tres）与场景格式类似：

[gd_resource type="ShaderMaterial" load_steps=2 format=3]

[ext_resource type="Shader" path="res://shader.gdshader" id="1"]

[resource]
shader = ExtResource("1")
shader_parameter/albedo = Color(1, 0, 0, 1)
shader_parameter/metallic = 0.8

资源类型示例：

  ShaderMaterial → .tres
  Theme → .tres
  Environment → .tres
  Animation → .tres
  Mesh → .tres（也可二进制 .mesh）
  Texture2D → .png / .svg / .tres（如 CompressedTexture2D）
```

### ResourceLoader 加载流程

```
ResourceLoader.load("res://player.tscn") 流程：

  1. 确定资源格式
     ├── .tscn → SceneFormatLoaderText
     ├── .scn → SceneFormatLoaderBinary
     └── .tres → ResourceFormatLoaderText

  2. 检查缓存
     ├── 已缓存 → 返回缓存的资源实例
     └── 未缓存 → 继续加载

  3. 解析文件
     ├── 文本格式 → 逐行解析 [key=value]
     └── 二进制格式 → 按二进制协议解析

  4. 创建资源实例
     ├── ClassDB::instantiate(type)
     └── 设置属性

  5. 处理资源引用
     ├── ExtResource → 递归加载外部资源
     └── SubResource → 加载内联子资源

  6. 缓存并返回
     └── resource_cache[path] = resource
```

### 资源引用解析

```
.tscn / .tres 中的资源引用类型：

  ExtResource("ID"):
  ┌────────────────────────────────────────────────┐
  │ 引用外部文件中的资源                             │
  │                                                 │
  │ [ext_resource type="Texture2D" path="res://icon.svg" id="2"]│
  │                                                 │
  │ 使用：texture = ExtResource("2")                │
  │ 加载：ResourceLoader::load("res://icon.svg")    │
  └────────────────────────────────────────────────┘

  SubResource("ID"):
  ┌────────────────────────────────────────────────┐
  │ 引用同一文件中的内联子资源                       │
  │                                                 │
  │ [sub_resource type="BoxShape3D" id="1"]         │
  │ size = Vector3(1, 1, 1)                         │
  │                                                 │
  │ 使用：shape = SubResource("1")                  │
  │ 加载：在同一文件中查找并创建                      │
  └────────────────────────────────────────────────┘

  内联值：
  ┌────────────────────────────────────────────────┐
  │ 直接在属性中构造简单值                           │
  │                                                 │
  │ transform = Transform3D(1, 0, 0, 0, 1, 0, ...) │
  │ color = Color(1, 0, 0, 1)                       │
  │ position = Vector2(100, 200)                    │
  └────────────────────────────────────────────────┘
```

---

## 7. 源码结构总览

### 关键源文件

| 文件 | 路径 | 行数(约) | 说明 |
|------|------|---------|------|
| PackedScene | `scene/resources/packed_scene.h` | 250 | 打包场景类声明 |
| PackedScene 实现 | `scene/resources/packed_scene.cpp` | 1500 | 实例化和打包逻辑 |
| SceneState | 在 packed_scene.h 中 | 200 | 场景状态数据结构 |
| ResourceSaverText | `scene/resources/resource_format_text.h` | 150 | 文本格式保存器 |
| ResourceLoaderText | `scene/resources/resource_format_text.h` | 150 | 文本格式加载器 |
| Resource | `core/io/resource.h` | 200 | 资源基类 |
| ResourceLoader | `core/io/resource_loader.h` | 150 | 资源加载器 |

### PackedScene 关键方法

```cpp
// scene/resources/packed_scene.h 方法列表

class PackedScene : public Resource {
    // ====== 实例化 ======
    Node *instantiate(GenEditState p_edit_state = GEN_EDIT_STATE_DISABLED) const;
    bool can_instantiate() const;

    // ====== 打包 ======
    Error pack(Node *p_root);

    // ====== 场景状态 ======
    Ref<SceneState> get_state() const;

    // ====== 继承 ======
    void set_state(Ref<SceneState> p_state);
    void clear();

    // ====== 替换 ======
    void replace_stage(GenEditState p_edit_state);
};
```

### SceneState 关键方法

```cpp
class SceneState : public Resource {
    // ====== 节点信息 ======
    int get_node_count() const;
    StringName get_node_type(int p_idx) const;
    StringName get_node_name(int p_idx) const;
    int get_node_parent(int p_idx) const;
    NodePath get_node_path(int p_idx, bool p_for_parent = false) const;

    // ====== 属性信息 ======
    int get_node_property_count(int p_idx) const;
    StringName get_node_property_name(int p_idx, int p_prop) const;
    Variant get_node_property_value(int p_idx, int p_prop) const;

    // ====== 信号连接 ======
    int get_connection_count() const;
    // ... 连接详情方法

    // ====== 继承 ======
    StringName get_base_scene() const;
    bool is_base_scene(int p_idx) const;

    // ====== 子场景 ======
    Ref<PackedScene> get_sub_scene(int p_idx) const;

    // ====== 分组 ======
    int get_node_group_count(int p_idx) const;
    StringName get_node_group(int p_idx, int p_group) const;
};
```

### 场景系统完整流程图

```
场景的完整生命周期：

  创建/编辑阶段：
  ┌─────────────────────────────────────────────┐
  │ 编辑器中构建场景树                            │
  │   ├── 添加节点、设置属性、连接信号            │
  │   └── 保存为 .tscn 文件                      │
  │       └── SceneState 存储所有数据             │
  └───────────────────┬─────────────────────────┘
                      │
  加载阶段：          ▼
  ┌─────────────────────────────────────────────┐
  │ ResourceLoader.load("res://scene.tscn")      │
  │   ├── 解析文本格式                           │
  │   ├── 创建 PackedScene                       │
  │   ├── 解析节点数据 → SceneState              │
  │   └── 缓存 PackedScene 实例                  │
  └───────────────────┬─────────────────────────┘
                      │
  实例化阶段：        ▼
  ┌─────────────────────────────────────────────┐
  │ packed_scene.instantiate()                   │
  │   ├── ClassDB::instantiate() 创建节点        │
  │   ├── 构建父子关系                           │
  │   ├── 应用属性值                             │
  │   ├── 处理嵌套场景                           │
  │   ├── 建立信号连接                           │
  │   └── 返回场景根节点                         │
  └───────────────────┬─────────────────────────┘
                      │
  运行阶段：          ▼
  ┌─────────────────────────────────────────────┐
  │ tree->root->add_child(scene_root)            │
  │   ├── ENTER_TREE 通知                        │
  │   ├── READY 通知                             │
  │   ├── _process / _physics_process            │
  │   └── 场景运行                               │
  └───────────────────┬─────────────────────────┘
                      │
  切换/退出：         ▼
  ┌─────────────────────────────────────────────┐
  │ change_scene() / queue_free()               │
  │   ├── EXIT_TREE 通知                        │
  │   └── 节点销毁                               │
  └─────────────────────────────────────────────┘
```

---

## 性能考量

### 场景实例化优化

```
优化场景加载性能的方法：

  1. 资源预加载
     ResourceLoader.load_threaded("res://heavy_scene.tscn")
     → 在后台线程加载，避免卡顿主线程

  2. 对象池
     var pool = []
     func get_enemy():
         if pool.is_empty():
             return enemy_scene.instantiate()
         return pool.pop_back()

  3. 场景缓存
     PackedScene.instantiate() 每次都创建新节点
     但 PackedScene 本身被 ResourceLoader 缓存
     → 多次 load() 同一文件只解析一次

  4. 延迟实例化
     在需要时才实例化场景（如进入视野时）
     → 减少初始加载时间

  5. 简化场景结构
     减少节点数量，合并静态网格
     → 更少的节点 = 更快的实例化
```

---

> 至此，场景系统的所有主题已全部覆盖。回顾：[README](./README.md) | 返回上级：[Godot 源码学习指南](../README.md)
