# 技术原理：编辑器架构与扩展

## 目录

1. [编辑器即应用](#1-编辑器即应用)
2. [插件系统原理](#2-插件系统原理)
3. [Inspector 属性编辑](#3-inspector-属性编辑)
4. [自定义节点类型](#4-自定义节点类型)
5. [工具脚本](#5-工具脚本)

---

## 1. 编辑器即应用

### 1.1 核心概念

Godot 编辑器不是独立的应用程序，而是使用 Godot 引擎本身构建的特殊应用。这意味着编辑器拥有与游戏项目相同的底层能力：场景系统、脚本系统、渲染引擎、GUI 系统等。

```
┌─────────────────────────────────────────────────────────────┐
│                    Godot Engine Core                        │
│  (渲染、音频、物理、脚本、场景、GUI、网络等)                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
┌─────────────▼─────────────┐    ┌───────────▼──────────┐
│   Godot Editor Application │    │  Game Application   │
│   (editor/editor_node.cpp) │    │  (user game)        │
├───────────────────────────┤    ├─────────────────────┤
│ • EditorNode (根节点)      │    │ • 用户定义的根节点   │
│ • EditorPlugin 系统        │    │ • 游戏逻辑           │
│ • Inspector 检查器         │    │ • 游戏玩法           │
│ • SceneTreeEditor          │    │ • 用户界面           │
│ • ScriptEditor             │    │                     │
│ • FileSystemDock           │    │                     │
└───────────────────────────┘    └─────────────────────┘
```

### 1.2 EditorNode 架构

EditorNode 是编辑器的根节点，继承自 Node，但拥有特殊的编辑器功能。

```cpp
// editor/editor_node.h

class EditorNode : public Node {
    GDCLASS(EditorNode, Node);

public:
    // 编辑器单例
    static EditorNode *get_singleton() { return singleton; }

    // 初始化编辑器
    void init_editor();
    
    // 运行项目
    void run_project();
    
    // 编辑对象
    void edit_node(Node *p_node);
    void edit_resource(Ref<Resource> p_resource);
    
    // 获取编辑器接口
    EditorInterface *get_editor_interface() { return editor_interface; }

private:
    static EditorNode *singleton;
    
    // 编辑器核心组件
    EditorInterface *editor_interface;
    EditorSelection *editor_selection;
    EditorSettings *editor_settings;
    EditorFileSystem *editor_file_system;
    
    // 主要面板
    FileSystemDock *file_system_dock;
    SceneTreeDock *scene_tree_dock;
    InspectorDock *inspector_dock;
    ScriptEditor *script_editor;
    
    // 编辑器插件
    Vector<EditorPlugin *> editor_plugins;
};
```

**关键特性**：

1. **单例模式**：EditorNode 作为全局单例，提供统一的编辑器访问点
2. **组件化设计**：各个编辑器面板作为独立组件，通过 EditorNode 协调
3. **插件集成**：通过 EditorPlugin 系统扩展功能
4. **对象编辑**：统一的 `edit_*()` 方法管理当前编辑的对象

### 1.3 编辑器与运行时的区别

| 特性 | 编辑器模式 | 运行时模式 |
|------|-----------|-----------|
| **入口点** | EditorNode | 用户定义的主场景 |
| **脚本执行** | 选择性执行（编辑器脚本） | 完全执行 |
| **渲染目标** | 编辑器视口 | 游戏窗口 |
| **物理模拟** | 禁用或简化 | 完全模拟 |
| **调试工具** | 可用 | 不可用 |
| **热重载** | 支持 | 有限支持 |

```cpp
// 编辑器模式检测示例

#ifdef TOOLS_ENABLED
    // 仅在编辑器构建中编译
    if (Engine::get_singleton()->is_editor_hint()) {
        // 编辑器模式代码
        EditorNode::get_singleton()->edit_node(this);
    }
#endif

#ifdef TOOLS_ENABLED
    // 编辑器工具代码
#endif

#ifndef TOOLS_ENABLED
    // 仅在游戏发布构建中编译
#endif
```

### 1.4 编辑器启动流程

```
┌─────────────────────────────────────────────────────────────┐
│                    Editor Startup Flow                       │
└─────────────────────────────────────────────────────────────┘

main() (platform/*/)
  │
  ├─► OS::create() - 创建操作系统实例
  │
  ├─► create_splash() - 显示启动画面
  │
  └─► main_loop_init() - 初始化主循环
      │
      ├─► editor_main() (editor/editor.cpp)
      │   │
      │   ├─► EditorNode::init_editor()
      │   │   │
      │   │   ├─► 创建核心组件
      │   │   │   ├─► EditorInterface
      │   │   │   ├─► EditorSettings
      │   │   │   ├─► EditorSelection
      │   │   │   └─► EditorFileSystem
      │   │   │
      │   │   ├─► 创建 UI 面板
      │   │   │   ├─► FileSystemDock
      │   │   │   ├─► SceneTreeDock
      │   │   │   ├─► InspectorDock
      │   │   │   ├─► NodeDock
      │   │   │   └─► ScriptEditor
      │   │   │
      │   │   ├─► 加载编辑器插件
      │   │   │   └─► 扫描 res://addons/*/plugin.cfg
      │   │   │
      │   │   └─► 初始化编辑器界面
      │   │
      │   └─► 设置为主循环
      │
      └─► 主循环开始
```

**源码位置**：`editor/editor.cpp` - `editor_main()` 函数

---

## 2. 插件系统原理

### 2.1 EditorPlugin 架构

EditorPlugin 是扩展编辑器功能的核心机制。插件通过继承 EditorPlugin 基类并重写虚方法来集成到编辑器中。

```cpp
// editor/plugins/editor_plugin.h

class EditorPlugin : public GDExtension {
    GDCLASS(EditorPlugin, GDExtension);

public:
    // 生命周期管理
    virtual void _enter_tree() override;
    virtual void _exit_tree() override;
    
    // 对象编辑处理
    virtual void _edit(Object *p_object) override;
    virtual bool _handles(Object *p_object) const override;
    virtual void _make_visible(bool p_visible) override;
    
    // GUI 集成
    virtual void _add_to_groups(Vector<String> *p_groups) {}
    virtual EditorPlugin::AfterGUIInput _forward_3d_gui_input(
        const Camera3D *p_camera, 
        const Ref<InputEvent> &p_event
    ) { return AFTER_GUI_INPUT_PASS; }
    
    // 自定义类型注册
    void add_custom_type(
        const String &p_type,        // 类型名称
        const String &p_base,        // 基类名称
        const Ref<Script> &p_script, // 脚本
        const Ref<Texture> &p_icon   // 图标
    );
    
    void remove_custom_type(const String &p_type);
    
    // 控件添加
    void add_control_to_container(
        CustomControlContainer p_location,
        Control *p_control
    );
    
    void remove_control_from_container(
        CustomControlContainer p_location,
        Control *p_control
    );
    
    // 菜单和工具栏
    void add_tool_menu_item(const String &p_name, Callable p_action);
    void remove_tool_menu_item(const String &p_name);
    
protected:
    static void _bind_methods();
};
```

### 2.2 插件配置文件

每个插件需要 `plugin.cfg` 配置文件：

```ini
# plugin.cfg 示例

[plugin]

name="My Custom Plugin"
description="A sample editor plugin for demonstration"
author="Your Name <email@example.com>"
version="1.0"
script="plugin.gd"
```

**配置字段说明**：

| 字段 | 说明 | 必需 |
|------|------|------|
| `name` | 插件显示名称 | 是 |
| `description` | 插件描述 | 是 |
| `author` | 作者信息 | 是 |
| `version` | 版本号 | 是 |
| `script` | 插件脚本文件 | 是 |

### 2.3 插件生命周期

```
┌─────────────────────────────────────────────────────────────┐
│                  Plugin Lifecycle                           │
└─────────────────────────────────────────────────────────────┘

1. 插件发现
   │
   └─► EditorFileSystem 扫描 res://addons/*/plugin.cfg
       │
       ├─► 解析 plugin.cfg
       ├─► 加载插件脚本
       └─► 创建插件实例

2. 插件激活
   │
   └─► EditorPlugin::_enter_tree()
       │
       ├─► 初始化插件状态
       ├─► 注册自定义类型
       ├─► 添加 UI 控件
       ├─► 注册菜单项
       └─► 连接信号

3. 插件运行
   │
   └─► 响应编辑器事件
       │
       ├─► _handles() - 判断是否处理对象
       ├─► _edit() - 编辑对象
       ├─► _make_visible() - 显示/隐藏界面
       └─► _forward_*_gui_input() - 处理输入

4. 插件停用
   │
   └─► EditorPlugin::_exit_tree()
       │
       ├─► 清理自定义类型
       ├─► 移除 UI 控件
       ├─► 断开信号连接
       └─► 释放资源
```

### 2.4 插件类型分类

```
EditorPlugin 插件类型
│
├─► GUI 扩展插件
│   ├─► 添加到现有面板
│   ├─► 创建独立面板
│   └─► 自定义工具栏
│
├─► 自定义类型插件
│   ├─► 自定义节点
│   ├─► 自定义资源
│   └─► 自定义编辑器
│
├─► Import/Export 插件
│   ├─► 资源导入插件
│   └─► 项目导出插件
│
├─► Inspector 插件
│   ├─► 自定义属性编辑器
│   └─► 属性检查器插件
│
└─► 编辑器工具插件
    ├─► 场景编辑工具
    ├─► 资源生成工具
    └─► 自动化工具
```

---

## 3. Inspector 属性编辑

### 3.1 Inspector 架构

Inspector（属性检查器）是编辑器中用于编辑对象属性的核心组件。它使用反射机制动态显示和编辑对象的属性。

```cpp
// editor/inspector/editor_inspector.h

class EditorInspector : public VBoxContainer {
    GDCLASS(EditorInspector, VBoxContainer);

public:
    // 编辑对象
    void edit(Object *p_object);
    
    // 刷新显示
    void refresh();
    
    // 获取当前编辑的对象
    Object *get_edited_object() { return object; }
    
    // 属性变更信号
    Signal property_edited;
    Signal property_changed;
    Signal property_keyed;
    Signal resource_selected;
    Signal object_id_selected;

private:
    Object *object;
    
    // 属性列表
    List<PropertyInfo> properties;
    
    // 属性编辑器
    Vector<EditorProperty *> property_editors;
    
    // 更新属性
    void _update_property(const String &p_property);
    
    // 创建属性编辑器
    EditorProperty *_create_editor_for_property(
        const PropertyInfo &p_property
    );
};
```

### 3.2 属性编辑器系统

每种属性类型都有对应的专用编辑器：

```cpp
// editor/inspector/editor_property.h

class EditorProperty : public Control {
    GDCLASS(EditorProperty, Control);

public:
    // 设置属性信息
    void setup(
        const PropertyInfo &p_property,
        const String &p_name,
        const Variant &p_value
    );
    
    // 获取当前值
    virtual Variant get_value() = 0;
    
    // 设置值
    virtual void set_value(const Variant &p_value) = 0;
    
    // 属性变更信号
    Signal property_changed;
    
protected:
    PropertyInfo property_info;
    String property_name;
    Variant current_value;
    
    void emit_changed(const Variant &p_value);
};

// 具体属性编辑器示例
class EditorPropertyText : public EditorProperty {
    GDCLASS(EditorPropertyText, EditorProperty);
    
    LineEdit *line_edit;
    
public:
    virtual void set_value(const Variant &p_value) override {
        line_edit->set_text(p_value);
    }
    
    virtual Variant get_value() override {
        return line_edit->get_text();
    }
};

class EditorPropertyInteger : public EditorProperty {
    GDCLASS(EditorPropertyInteger, EditorProperty);
    
    SpinBox *spin_box;
    
public:
    virtual void set_value(const Variant &p_value) override {
        spin_box->set_value(p_value);
    }
    
    virtual Variant get_value() override {
        return spin_box->get_value();
    }
};

class EditorPropertyVector3 : public EditorProperty {
    GDCLASS(EditorPropertyVector3, EditorProperty);
    
    SpinBox *spin_box[3]; // X, Y, Z
    
public:
    virtual void set_value(const Variant &p_value) override {
        Vector3 v = p_value;
        spin_box[0]->set_value(v.x);
        spin_box[1]->set_value(v.y);
        spin_box[2]->set_value(v.z);
    }
    
    virtual Variant get_value() override {
        return Vector3(
            spin_box[0]->get_value(),
            spin_box[1]->get_value(),
            spin_box[2]->get_value()
        );
    }
};
```

### 3.3 属性提示系统

Godot 使用属性提示（Property Hint）来控制属性的显示和编辑方式：

```cpp
// core/object/property_info.h

enum PropertyHint {
    PROPERTY_HINT_NONE,              // 无提示
    PROPERTY_HINT_RANGE,             // 范围: min,max,step,slider
    PROPERTY_HINT_ENUM,              // 枚举: One,Two,Three
    PROPERTY_HINT_EXP_EASING,        // 缓动函数
    PROPERTY_HINT_LENGTH,            // 长度
    PROPERTY_HINT_TYPE_STRING,       // 类型字符串
    PROPERTY_HINT_FILE,              // 文件路径
    PROPERTY_HINT_DIR,               // 目录路径
    PROPERTY_HINT_RESOURCE_TYPE,     // 资源类型
    PROPERTY_HINT_MULTILINE_TEXT,    // 多行文本
    PROPERTY_HINT_COLOR_NO_ALPHA,    // 颜色（无透明度）
    PROPERTY_HINT_OBJECT_ID,         // 对象 ID
    PROPERTY_HINT_NODE_PATH,         // 节点路径
    PROPERTY_HINT_PLACEHOLDER_TEXT,  // 占位符文本
    PROPERTY_HINT_FLAGS,             // 标志位
    PROPERTY_HINT_LAYERS,            // 渲染层
    PROPERTY_HINT_NODE_PATH_TO_EDITED_NODE,
    PROPERTY_HINT_ARRAY_TYPE,
};

// 属性提示使用示例
void MyNode::_bind_methods() {
    // 范围提示
    ADD_PROPERTY(PropertyInfo(
        Variant::FLOAT, 
        "health",
        PROPERTY_HINT_RANGE,
        "0,100,1,or_greater"  // min,max,step,提示
    ), "set_health", "get_health");
    
    // 枚举提示
    ADD_PROPERTY(PropertyInfo(
        Variant::INT, 
        "state",
        PROPERTY_HINT_ENUM,
        "Idle,Run,Jump,Attack"
    ), "set_state", "get_state");
    
    // 资源类型提示
    ADD_PROPERTY(PropertyInfo(
        Variant::OBJECT, 
        "material",
        PROPERTY_HINT_RESOURCE_TYPE,
        "BaseMaterial3D"
    ), "set_material", "get_material");
    
    // 颜色提示
    ADD_PROPERTY(PropertyInfo(
        Variant::COLOR, 
        "color",
        PROPERTY_HINT_COLOR_NO_ALPHA
    ), "set_color", "get_color");
}
```

### 3.4 自定义属性编辑器

插件可以注册自定义属性编辑器：

```cpp
// editor/plugins/editor_plugin.h

class EditorPlugin {
public:
    // 注册属性编辑器
    void add_inspector_plugin(
        const Ref<EditorInspectorPlugin> &p_plugin
    );
    
    void remove_inspector_plugin(
        const Ref<EditorInspectorPlugin> &p_plugin
    );
};

// editor/inspector/editor_inspector_plugin.h

class EditorInspectorPlugin : public RefCounted {
    GDCLASS(EditorInspectorPlugin, RefCounted);

public:
    // 判断是否可以处理此属性
    virtual bool can_handle(Object *p_object) = 0;
    
    // 解析属性
    virtual bool parse_property(
        Object *p_object,
        const Variant::Type p_type,
        const String &p_path,
        const PropertyHint p_hint,
        const String &p_hint_text,
        const BitField<PropertyUsageFlags> p_usage,
        const bool p_wide
    );
    
    // 自定义 UI 回调
    virtual void parse_category(
        Object *p_object,
        const String &p_category
    ) {}
    
    virtual void parse_group(
        Object *p_object,
        const String &p_group
    ) {}
    
protected:
    static void _bind_methods();
    
    // 添加自定义属性编辑器
    void add_custom_control(
        const String &p_label,
        Control *p_control,
        const String &p_property,
        const bool p_keying
    );
};
```

**使用示例**：

```cpp
// 自定义属性编辑器插件
class MyVector4EditorPlugin : public EditorInspectorPlugin {
    GDCLASS(MyVector4EditorPlugin, EditorInspectorPlugin);

public:
    virtual bool can_handle(Object *p_object) override {
        // 检查对象是否有 Vector4 属性
        return true; // 简化示例
    }
    
    virtual bool parse_property(
        Object *p_object,
        const Variant::Type p_type,
        const String &p_path,
        const PropertyHint p_hint,
        const String &p_hint_text,
        const BitField<PropertyUsageFlags> p_usage,
        const bool p_wide
    ) override {
        // 处理 Vector4 类型
        if (p_type == Variant::VECTOR4) {
            EditorPropertyVector4 *editor = memnew(EditorPropertyVector4);
            editor->setup(p_path, p_object->get(p_path));
            add_custom_control(p_path, editor, p_path, true);
            return true;
        }
        return false;
    }
};

// 在插件中注册
void MyEditorPlugin::_enter_tree() {
    Ref<MyVector4EditorPlugin> plugin;
    plugin.instantiate();
    add_inspector_plugin(plugin);
}
```

---

## 4. 自定义节点类型

### 4.1 类型注册系统

Godot 允许在编辑器中注册自定义节点类型，使其出现在节点创建对话框中。

```cpp
// editor/plugins/editor_plugin.h

class EditorPlugin {
public:
    // 注册自定义节点类型
    void add_custom_type(
        const String &p_type,        // 类型名称
        const String &p_base,        // 基类名称
        const Ref<Script> &p_script, // 脚本
        const Ref<Texture> &p_icon   // 图标
    );
    
    void remove_custom_type(const String &p_type);
    
    // 获取自定义类型列表
    Array get_custom_types() const;
};

// 核心实现
void EditorNode::add_custom_type(
    const String &p_type,
    const String &p_base,
    const Ref<Script> &p_script,
    const Ref<Texture> &p_icon
) {
    ERR_FAIL_COND(p_type.is_empty());
    ERR_FAIL_COND(p_base.is_empty());
    ERR_FAIL_COND(p_script.is_null());
    
    // 验证基类存在
    StringName base_type = p_base;
    if (!ClassDB::class_exists(base_type)) {
        ERR_PRINT("Base type '" + p_base + "' does not exist");
        return;
    }
    
    // 添加到自定义类型注册表
    CustomType custom_type;
    custom_type.type = p_type;
    custom_type.base = p_base;
    custom_type.script = p_script;
    custom_type.icon = p_icon;
    
    custom_types[p_type] = custom_type;
    
    // 通知编辑器界面更新
    emit_signal("custom_type_added", p_type);
}
```

### 4.2 注册流程

```
┌─────────────────────────────────────────────────────────────┐
│            Custom Type Registration Flow                     │
└─────────────────────────────────────────────────────────────┘

1. 插件调用 add_custom_type()
   │
   └─► EditorPlugin::add_custom_type()
       │
       ├─► 验证参数
       ├─► 检查基类存在
       ├─► 存储类型信息
       └─► 触发更新信号

2. 编辑器界面更新
   │
   └─► SceneTreeDock 更新
       │
       ├─► "添加子节点" 对话框
       ├─► 节点类型过滤
       └─► 图标和描述显示

3. 类型实例化
   │
   └─► 用户创建自定义类型节点
       │
       ├─► 创建基类实例
       ├─► 附加脚本
       └─► 设置默认属性
```

### 4.3 图标系统

自定义类型可以提供自定义图标：

```cpp
// 图标格式和位置
res://addons/my_plugin/icons/my_custom_node.svg

// 在插件中加载图标
Ref<Texture2D> icon;
icon = ResourceLoader::load(
    "res://addons/my_plugin/icons/my_custom_node.svg"
);

// 注册时指定图标
add_custom_type(
    "MyCustomNode",
    "Node",
    script,
    icon
);

// 图标规范
// - 推荐 SVG 格式（矢量图，可缩放）
// - 尺寸：16x16 像素基准
// - 颜色：使用编辑器主题颜色
// - 风格：简洁明了，易于识别
```

### 4.4 完整示例

```cpp
// 插件头文件
#ifndef MY_PLUGIN_H
#define MY_PLUGIN_H

#include "editor/editor_plugin.h"

class MyEditorPlugin : public EditorPlugin {
    GDCLASS(MyEditorPlugin, EditorPlugin);

private:
    Ref<Script> custom_node_script;
    Ref<Texture2D> custom_node_icon;

public:
    virtual void _enter_tree() override;
    virtual void _exit_tree() override;
};

#endif // MY_PLUGIN_H

// 插件实现文件
#include "my_plugin.h"

void MyEditorPlugin::_enter_tree() {
    // 加载自定义节点脚本
    custom_node_script = ResourceLoader::load(
        "res://addons/my_plugin/custom_node.gd"
    );
    
    // 加载图标
    custom_node_icon = ResourceLoader::load(
        "res://addons/my_plugin/icons/custom_node.svg"
    );
    
    // 注册自定义类型
    add_custom_type(
        "MyCustomNode",      // 类型名称
        "Node",              // 基类
        custom_node_script,  // 脚本
        custom_node_icon     // 图标
    );
    
    // 可以注册多个类型
    Ref<Script> resource_script = ResourceLoader::load(
        "res://addons/my_plugin/custom_resource.gd"
    );
    
    Ref<Texture2D> resource_icon = ResourceLoader::load(
        "res://addons/my_plugin/icons/custom_resource.svg"
    );
    
    add_custom_type(
        "MyCustomResource",
        "Resource",
        resource_script,
        resource_icon
    );
}

void MyEditorPlugin::_exit_tree() {
    // 移除自定义类型
    remove_custom_type("MyCustomNode");
    remove_custom_type("MyCustomResource");
}
```

---

## 5. 工具脚本

### 5.1 EditorScript 基类

EditorScript 是用于创建编辑器工具脚本的基类。

```cpp
// editor/editor_script.cpp

class EditorScript : public RefCounted {
    GDCLASS(EditorScript, RefCounted);

public:
    // 运行脚本
    virtual void _run() {}
    
    // 获取编辑器接口
    EditorInterface *get_editor_interface() {
        return EditorInterface::get_singleton();
    }
    
    // 获取编辑器选择
    EditorSelection *get_editor_selection() {
        return EditorSelection::get_singleton();
    }
    
    // 获取编辑器文件系统
    EditorFileSystem *get_editor_file_system() {
        return EditorFileSystem::get_singleton();
    }

protected:
    static void _bind_methods();
};

void EditorScript::_bind_methods() {
    ClassDB::bind_method(D_METHOD("run"), &EditorScript::_run);
    ClassDB::bind_method(D_METHOD("get_editor_interface"), 
                         &EditorScript::get_editor_interface);
    ClassDB::bind_method(D_METHOD("get_editor_selection"), 
                         &EditorScript::get_editor_selection);
    ClassDB::bind_method(D_METHOD("get_editor_file_system"), 
                         &EditorScript::get_editor_file_system);
}
```

### 5.2 工具脚本使用场景

```
EditorScript 应用场景
│
├─► 资源批量处理
│   ├─► 批量导入资源
│   ├─► 批量修改资源属性
│   └─► 资源格式转换
│
├─► 场景批量操作
│   ├─► 批量修改场景
│   ├─► 场景结构优化
│   └─► 场景统计分析
│
├─► 代码生成
│   ├─► 自动生成脚本
│   ├─► 生成配置文件
│   └─► 生成文档
│
└─► 编辑器自动化
    ├─► 自动化测试
    ├─► 工作流自动化
    └─► 批量重命名
```

### 5.3 实用工具脚本示例

#### 示例 1：批量重命名节点

```gdscript
# tools/batch_rename_nodes.gd
@tool
extends EditorScript

func _run():
    var editor_selection = get_editor_selection()
    var selected_nodes = editor_selection.get_selected_nodes()
    
    if selected_nodes.is_empty():
        print("没有选中的节点")
        return
    
    var base_name = "Node_"
    var counter = 0
    
    for node in selected_nodes:
        var new_name = base_name + str(counter)
        node.name = new_name
        counter += 1
        print("重命名: %s -> %s" % [node.name, new_name])
    
    print("批量重命名完成，共处理 %d 个节点" % counter)
```

#### 示例 2：批量修改属性

```gdscript
# tools/batch_modify_properties.gd
@tool
extends EditorScript

func _run():
    var editor_interface = get_editor_interface()
    var editor_selection = get_editor_selection()
    var selected_nodes = editor_selection.get_selected_nodes()
    
    if selected_nodes.is_empty():
        print("没有选中的节点")
        return
    
    var modified_count = 0
    
    for node in selected_nodes:
        # 修改 position
        if node.has_method("set_position"):
            node.set_position(Vector2(100, 100))
            modified_count += 1
        
        # 修改 modulation
        if node.has_method("set_modulate"):
            node.set_modulate(Color(1, 1, 1, 1))
            modified_count += 1
    
    print("批量修改完成，共修改 %d 个属性" % modified_count)
    
    # 刷新编辑器
    editor_interface.inspect_selected_objects()
```

#### 示例 3：资源统计工具

```gdscript
# tools/resource_statistics.gd
@tool
extends EditorScript

func _run():
    var editor_file_system = get_editor_file_system()
    var resources = {}
    
    # 扫描所有资源
    for file in editor_file_system.get_filesystem():
        if file.get_file_type() != "":
            var type = file.get_file_type()
            
            if not resources.has(type):
                resources[type] = {
                    "count": 0,
                    "total_size": 0
                }
            
            resources[type].count += 1
            # 注意：文件大小访问需要更多代码
    
    # 打印统计结果
    print("=== 资源统计 ===")
    for type in resources:
        print("%s: %d 个文件" % [type, resources[type].count])
    
    print("统计完成，共发现 %d 种资源类型" % resources.size())
```

#### 示例 4：场景结构分析

```gdscript
# tools/scene_analyzer.gd
@tool
extends EditorScript

func _run():
    var editor_interface = get_editor_interface()
    var current_scene = editor_interface.get_edited_scene_root()
    
    if not current_scene:
        print("没有打开的场景")
        return
    
    print("=== 场景结构分析 ===")
    print("场景: %s" % current_scene.name)
    
    var stats = _analyze_scene(current_scene)
    
    print("\n--- 统计信息 ---")
    print("节点总数: %d" % stats.total_nodes)
    print("节点类型数: %d" % stats.node_types.size())
    print("最大深度: %d" % stats.max_depth)
    
    print("\n--- 节点类型分布 ---")
    for type in stats.node_types:
        print("  %s: %d" % [type, stats.node_types[type]])

func _analyze_scene(node: Node, depth: int = 0) -> Dictionary:
    var stats = {
        "total_nodes": 0,
        "node_types": {},
        "max_depth": depth
    }
    
    _analyze_node_recursive(node, stats, depth)
    return stats

func _analyze_node_recursive(node: Node, stats: Dictionary, depth: int):
    stats.total_nodes += 1
    stats.max_depth = max(stats.max_depth, depth)
    
    var type = node.get_class()
    if not stats.node_types.has(type):
        stats.node_types[type] = 0
    stats.node_types[type] += 1
    
    for child in node.get_children():
        _analyze_node_recursive(child, stats, depth + 1)
```

### 5.4 编辑器资源生成工具

```gdscript
# tools/resource_generator.gd
@tool
extends EditorScript

func _run():
    var editor_interface = get_editor_interface()
    var editor_file_system = get_editor_file_system()
    
    # 生成默认材质资源
    _generate_materials()
    
    # 生成配置资源
    _generate_configs()
    
    print("资源生成完成")

func _generate_materials():
    var base_material = StandardMaterial3D.new()
    base_material.albedo_color = Color(1, 1, 1)
    base_material.metallic = 0.0
    base_material.roughness = 0.5
    
    var path = "res://materials/default_material.tres"
    ResourceSaver.save(base_material, path)
    print("生成材质: %s" % path)

func _generate_configs():
    var config = ConfigFile.new()
    
    config.set_value("game", "version", "1.0.0")
    config.set_value("game", "debug_mode", true)
    config.set_value("graphics", "vsync", true)
    config.set_value("graphics", "fps_limit", 60)
    
    var path = "res://config/game.cfg"
    config.save(path)
    print("生成配置: %s" % path)
```

### 5.5 运行工具脚本

工具脚本可以通过以下方式运行：

1. **通过编辑器菜单**：
   - 项目 → 工具 → 运行脚本
   - 选择脚本文件

2. **通过快捷键**：
   - 自定义快捷键运行特定脚本

3. **通过插件触发**：
   - 在插件中添加菜单项或按钮

```gdscript
# 在插件中添加工具脚本菜单项
# my_plugin.gd
@tool
extends EditorPlugin

func _enter_tree():
    add_tool_menu_item("批量重命名节点", _run_batch_rename)
    add_tool_menu_item("场景分析", _run_scene_analyzer)

func _exit_tree():
    remove_tool_menu_item("批量重命名节点")
    remove_tool_menu_item("场景分析")

func _run_batch_rename():
    var script = load("res://tools/batch_rename_nodes.gd").new()
    script._run()

func _run_scene_analyzer():
    var script = load("res://tools/scene_analyzer.gd").new()
    script._run()
```

---

## 6. 技术原理总结

### 6.1 编辑器核心架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      Godot Editor Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   EditorNode (Root)                       │ │
│  │  • 单例管理                                               │ │
│  │  • 组件协调                                               │ │
│  │  • 生命周期管理                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────────┐ │
│  │                       │                                   │ │
│  │  ┌───────────────────▼─────────────────┐                  │ │
│  │  │       EditorInterface               │                  │ │
│  │  │  • 公共 API                         │                  │ │
│  │  │  • 跨组件通信                        │                  │ │
│  │  │  • 插件集成                         │                  │ │
│  │  └─────────────────────────────────────┘                  │ │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │           Core Systems                         │  │   │
│  │  │  • EditorSettings                              │  │   │
│  │  │  • EditorSelection                             │  │   │
│  │  │  • EditorFileSystem                            │  │   │
│  │  │  • EditorResourcePreview                       │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │           UI Components                         │  │   │
│  │  │  • FileSystemDock                               │  │   │
│  │  │  • SceneTreeDock                                │  │   │
│  │  │  • InspectorDock                                │  │   │
│  │  │  • NodeDock                                     │  │   │
│  │  │  • ScriptEditor                                 │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐  │   │
│  │  │         EditorPlugin System                     │  │   │
│  │  │  • Custom Types                                 │  │   │
│  │  │  • Inspector Plugins                            │  │   │
│  │  │  • Import/Export Plugins                        │  │   │
│  │  │  • GUI Extensions                               │  │   │
│  │  └─────────────────────────────────────────────────┘  │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 关键技术点

| 技术点 | 实现方式 | 应用场景 |
|--------|---------|---------|
| **反射机制** | ClassDB + PropertyList | 属性编辑、类型识别 |
| **插件架构** | EditorPlugin 基类 | 功能扩展、工具开发 |
| **信号系统** | Signal + Callable | 事件通信、状态同步 |
| **资源系统** | Resource + ResourceLoader | 资源管理、导入导出 |
| **脚本系统** | Script + GDExtension | 脚本编辑、代码生成 |
| **GUI 系统** | Control 节点树 | 编辑器界面、面板布局 |

### 6.3 学习要点

1. **理解编辑器即应用**：编辑器使用与游戏相同的引擎基础
2. **掌握插件系统**：通过 EditorPlugin 扩展功能
3. **熟悉反射机制**：属性编辑和类型系统的基础
4. **实践工具脚本**：自动化编辑任务
5. **研究源码实现**：深入理解内部机制

### 6.4 实践建议

1. **从简单开始**：先创建简单的工具脚本
2. **逐步深入**：从工具脚本到完整插件
3. **参考源码**：研究官方编辑器插件的实现
4. **调试分析**：使用调试器跟踪运行流程
5. **文档结合**：结合官方文档和源码学习

---

## 7. 源码参考

### 7.1 核心头文件

```cpp
// editor/editor_node.h
// 编辑器主节点，管理所有编辑器组件

class EditorNode : public Node {
    // 单例访问
    static EditorNode *get_singleton();
    
    // 初始化和清理
    void init_editor();
    void finish_editor();
    
    // 对象编辑
    void edit_node(Node *p_node);
    void edit_resource(Ref<Resource> p_resource);
    
    // 组件访问
    EditorInterface *get_editor_interface();
    EditorSelection *get_editor_selection();
    EditorSettings *get_editor_settings();
};

// editor/plugins/editor_plugin.h
// 编辑器插件基类

class EditorPlugin : public GDExtension {
    // 生命周期
    virtual void _enter_tree();
    virtual void _exit_tree();
    
    // 对象处理
    virtual void _edit(Object *p_object);
    virtual bool _handles(Object *p_object) const;
    
    // 类型注册
    void add_custom_type(const String &p_type, 
                        const String &p_base,
                        const Ref<Script> &p_script,
                        const Ref<Texture> &p_icon);
    
    // UI 集成
    void add_control_to_container(CustomControlContainer p_location,
                                 Control *p_control);
};

// editor/inspector/editor_inspector.h
// 属性检查器

class EditorInspector : public VBoxContainer {
    // 对象编辑
    void edit(Object *p_object);
    void refresh();
    
    // 属性变更
    Signal property_edited;
    Signal property_changed;
};

// editor/editor_script.cpp
// 编辑器工具脚本

class EditorScript : public RefCounted {
    // 执行脚本
    virtual void _run();
    
    // 编辑器访问
    EditorInterface *get_editor_interface();
    EditorSelection *get_editor_selection();
};
```

### 7.2 相关源码文件

```
editor/
├── editor_node.h/cpp              # 编辑器主节点
├── editor_interface.h/cpp         # 编辑器接口
├── editor_settings.h/cpp          # 编辑器设置
├── editor_selection.h/cpp         # 选择管理
├── editor_file_system.h/cpp       # 文件系统
├── editor_script.cpp              # 编辑器脚本
│
├── plugins/
│   ├── editor_plugin.h/cpp        # 插件基类
│   ├── canvas_item_editor_plugin.h/cpp
│   ├── spatial_editor_plugin.h/cpp
│   └── script_editor_plugin.h/cpp
│
├── inspector/
│   ├── editor_inspector.h/cpp     # 属性检查器
│   ├── editor_property.h/cpp      # 属性编辑器基类
│   ├── editor_property_text.cpp   # 文本属性
│   ├── editor_property_number.cpp # 数值属性
│   └── editor_property_vector.cpp # 向量属性
│
└── docks/
    ├── file_system_dock.h/cpp     # 文件系统面板
    ├── scene_tree_dock.h/cpp      # 场景树面板
    └── inspector_dock.h/cpp       # 检查器面板
```

---

**下一节**：继续学习 [01-editor-architecture.md](./01-editor-architecture.md) - 编辑器架构详解
