# 编辑器架构详解

## 目录

1. [EditorNode：编辑器主类](#1-editornode编辑器主类)
2. [EditorPlugin 系统](#2-editorplugin-系统)
3. [EditorInspector：属性检查器](#3-editorinspector属性检查器)
4. [FileSystemDock：文件系统面板](#4-filesystemdock文件系统面板)
5. [ScriptEditor：脚本编辑器](#5-scripteditor脚本编辑器)
6. [编辑器设置系统](#6-编辑器设置系统)
7. [场景编辑器](#7-场景编辑器)

---

## 1. EditorNode：编辑器主类

### 1.1 类定义与架构

EditorNode 是整个编辑器的核心控制器，继承自 Node，作为编辑器场景的根节点存在。

```cpp
// editor/editor_node.h

#ifndef EDITOR_NODE_H
#define EDITOR_NODE_H

#include "scene/main/node.h"
#include "scene/gui/control.h"
#include "core/templates/safe_ref.h"

class EditorInterface;
class EditorSelection;
class EditorSettings;
class EditorFileSystem;
class EditorResourcePreview;

class FileSystemDock;
class SceneTreeDock;
class InspectorDock;
class NodeDock;
class CreateDialog;
class ScriptEditor;

class EditorNode : public Node {
    GDCLASS(EditorNode, Node);

public:
    // 编辑器单例
    static EditorNode *get_singleton() { return singleton; }
    
    // 编辑器初始化
    void init_editor();
    
    // 运行项目
    void run_project();
    
    // 编辑对象
    void edit_node(Node *p_node);
    void edit_resource(Ref<Resource> p_resource);
    void edit_current();
    
    // 获取编辑的根场景
    Node *get_edited_scene();
    
    // 保存场景
    void save_scene();
    void save_scene_as();
    
    // 场景切换
    void load_scene(const String &p_scene);
    void reload_scene();
    
    // 播销控制
    void play_main_scene();
    void play_current_scene();
    void play_custom_scene(const String &p_scene);
    void stop_playing();
    
    // 编辑器界面
    EditorInterface *get_editor_interface() const { return editor_interface; }
    
    // 核心系统
    EditorSelection *get_editor_selection() const { return editor_selection; }
    EditorSettings *get_editor_settings() const { return editor_settings; }
    EditorFileSystem *get_editor_file_system() const { return editor_file_system; }
    
    // UI 面板
    FileSystemDock *get_file_system_dock() const { return file_system_dock; }
    SceneTreeDock *get_scene_tree_dock() const { return scene_tree_dock; }
    InspectorDock *get_inspector_dock() const { return inspector_dock; }
    ScriptEditor *get_script_editor() const { return script_editor; }
    
    // 插件管理
    void add_editor_plugin(EditorPlugin *p_plugin, bool p_make_first = false);
    void remove_editor_plugin(EditorPlugin *p_plugin);
    Vector<EditorPlugin *> get_editor_plugins() const { return editor_plugins; }
    
    // 全局菜单
    void add_tool_menu_item(const String &p_name, const Callable &p_callable);
    void remove_tool_menu_item(const String &p_name);
    
    // 通知
    void notify_resource_saved(const Ref<Resource> &p_resource);
    void notify_scene_saved(const String &p_path);
    void notify_scene_changed(const Node *p_root);

protected:
    static void _bind_methods();
    void _notification(int p_notification);

private:
    static EditorNode *singleton;
    
    // 核心系统
    EditorInterface *editor_interface;
    EditorSelection *editor_selection;
    EditorSettings *editor_settings;
    EditorFileSystem *editor_file_system;
    EditorResourcePreview *resource_preview;
    
    // UI 面板
    FileSystemDock *file_system_dock;
    SceneTreeDock *scene_tree_dock;
    InspectorDock *inspector_dock;
    NodeDock *node_dock;
    ScriptEditor *script_editor;
    
    // 编辑器插件
    Vector<EditorPlugin *> editor_plugins;
    
    // 当前编辑状态
    Node *edited_scene;
    String edited_scene_path;
    
    // 播销状态
    bool playing;
    bool playing_custom_scene;
    
    // 编辑器界面
    Control *editor_folding;
    HSplitContainer *main_split;
    VSplitContainer *scene_split;
    
    // 初始化辅助
    void _setup_editor();
    void _create_docks();
    void _create_menus();
    void _load_editor_plugins();
    
    // 事件处理
    void _resource_saved(const Ref<Resource> &p_resource);
    void _script_created(const Ref<Script> &p_script);
    void _scene_changed(Node *p_root);
};

#endif // EDITOR_NODE_H
```

### 1.2 编辑器初始化流程

```cpp
// editor/editor_node.cpp

void EditorNode::init_editor() {
    // 1. 创建核心系统
    editor_interface = memnew(EditorInterface);
    editor_selection = memnew(EditorSelection);
    editor_settings = memnew(EditorSettings);
    editor_file_system = memnew(EditorFileSystem);
    resource_preview = memnew(EditorResourcePreview);
    
    // 添加到场景树
    add_child(editor_interface);
    add_child(editor_selection);
    add_child(editor_settings);
    add_child(editor_file_system);
    
    // 2. 创建主界面布局
    _setup_editor();
    
    // 3. 创建各个面板
    _create_docks();
    
    // 4. 创建菜单
    _create_menus();
    
    // 5. 加载编辑器插件
    _load_editor_plugins();
    
    // 6. 恢复编辑器状态
    _restore_editor_state();
}

void EditorNode::_setup_editor() {
    // 创建主容器
    main_split = memnew(HSplitContainer);
    add_child(main_split);
    
    // 左侧面板容器
    left_split = memnew(VSplitContainer);
    main_split->add_child(left_split);
    
    // 右侧面板容器
    right_split = memnew(VSplitContainer);
    main_split->add_child(right_split);
    
    // 中央编辑区域
    scene_root = memnew(Control);
    main_split->add_child(scene_root);
}

void EditorNode::_create_docks() {
    // 文件系统面板
    file_system_dock = memnew(FileSystemDock);
    left_split->add_child(file_system_dock);
    
    // 场景树面板
    scene_tree_dock = memnew(SceneTreeDock);
    left_split->add_child(scene_tree_dock);
    
    // 属性检查器
    inspector_dock = memnew(InspectorDock);
    right_split->add_child(inspector_dock);
    
    // 节点面板
    node_dock = memnew(NodeDock);
    right_split->add_child(node_dock);
    
    // 脚本编辑器
    script_editor = memnew(ScriptEditor);
    add_child(script_editor);
}

void EditorNode::_load_editor_plugins() {
    // 扫描插件目录
    Ref<DirAccess> dir = DirAccess::open("res://addons/");
    if (dir.is_valid()) {
        dir->list_dir_begin();
        String plugin_name = dir->get_next();
        
        while (!plugin_name.is_empty()) {
            // 检查 plugin.cfg
            String plugin_path = "res://addons/" + plugin_name + "/plugin.cfg";
            if (FileAccess::exists(plugin_path)) {
                // 加载插件
                _load_plugin(plugin_path);
            }
            plugin_name = dir->get_next();
        }
    }
}
```

### 1.3 编辑器架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        EditorNode                                │
│                     (编辑器主控制器)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐     ┌────────▼────────┐     ┌───────▼────────┐
│  Core Systems  │     │  UI Components  │     │  EditorPlugin  │
├────────────────┤     ├─────────────────┤     │    System      │
│ • Interface    │     │ • FileSystemDock│     ├────────────────┤
│ • Selection    │     │ • SceneTreeDock │     │ • Custom Types │
│ • Settings     │     │ • InspectorDock │     │ • Inspector    │
│ • FileSystem   │     │ • NodeDock      │     │ • Import/Export│
│ • ResourcePrev │     │ • ScriptEditor  │     │ • GUI Ext.     │
└────────────────┘     └─────────────────┘     └────────────────┘
```

---

## 2. EditorPlugin 系统

### 2.1 EditorPlugin 基类

EditorPlugin 是所有编辑器插件的基类，提供插件生命周期管理和功能扩展接口。

```cpp
// editor/plugins/editor_plugin.h

#ifndef EDITOR_PLUGIN_H
#define EDITOR_PLUGIN_H

#include "core/object/gd_extension.h"
#include "scene/gui/control.h"
#include "scene/resources/texture.h"

class EditorInterface;

class EditorPlugin : public GDExtension {
    GDCLASS(EditorPlugin, GDExtension);

public:
    // 插件生命周期
    virtual void _enter_tree();
    virtual void _exit_tree();
    
    // 对象编辑处理
    virtual void _edit(Object *p_object);
    virtual bool _handles(Object *p_object) const;
    virtual void _make_visible(bool p_visible);
    
    // GUI 输入转发
    virtual bool _forward_canvas_gui_input(const Ref<InputEvent> &p_event);
    virtual bool _forward_3d_gui_input(const Camera3D *p_camera, 
                                       const Ref<InputEvent> &p_event);
    
    // 强制步进（用于动画编辑等）
    virtual void _forward_canvas_force_draw_over_viewport(Control *p_overlay);
    virtual void _forward_3d_force_draw_over_viewport(Control *p_overlay);
    
    // 状态变化通知
    virtual void _state_changed(int p_old_state, int p_new_state);
    virtual void _scene_changed(Node *p_root);
    virtual void _scene_closed(const String &p_filepath);
    
    // 资源保存通知
    virtual void _resource_saved(const Ref<Resource> &p_resource);
    
    // 配置
    virtual String _get_plugin_name() const;
    virtual String _get_plugin_icon() const;
    
    // 自定义类型管理
    void add_custom_type(const String &p_type, 
                        const String &p_base,
                        const Ref<Script> &p_script,
                        const Ref<Texture> &p_icon);
    
    void remove_custom_type(const String &p_type);
    Array get_custom_types() const;
    
    // UI 控件管理
    enum CustomControlContainer {
        CONTAINER_TOOLBAR,
        CONTAINER_SPATIAL_EDITOR_MENU,
        CONTAINER_SPATIAL_EDITOR_SIDEBAR,
        CONTAINER_CANVAS_EDITOR_MENU,
        CONTAINER_CANVAS_EDITOR_SIDEBAR,
        CONTAINER_INSPECTOR_BOTTOM,
        CONTAINER_PROJECT_SETTING_TAB_LEFT,
        CONTAINER_PROJECT_SETTING_TAB_RIGHT,
    };
    
    void add_control_to_container(CustomControlContainer p_location,
                                 Control *p_control);
    
    void remove_control_from_container(CustomControlContainer p_location,
                                      Control *p_control);
    
    // 菜单项管理
    void add_tool_menu_item(const String &p_name, const Callable &p_callable);
    void remove_tool_menu_item(const String &p_name);
    
    // 热键管理
    void add_autoload_singleton(const String &p_name, const String &p_path);
    void remove_autoload_singleton(const String &p_name);
    
    // 检查器插件
    void add_inspector_plugin(const Ref<EditorInspectorPlugin> &p_plugin);
    void remove_inspector_plugin(const Ref<EditorInspectorPlugin> &p_plugin);
    
    // 导入插件
    void add_import_plugin(const Ref<EditorImportPlugin> &p_importer);
    void remove_import_plugin(const Ref<EditorImportPlugin> &p_importer);
    
    // 获取编辑器接口
    EditorInterface *get_editor_interface() const;
    
    // 获取编辑器界面
    Control *get_base_control() const;
    
    // 使编辑器设置失效
    void queue_save_layout();

protected:
    static void _bind_methods();

private:
    EditorInterface *editor_interface;
    
    // 自定义类型
    struct CustomType {
        String name;
        String base;
        Ref<Script> script;
        Ref<Texture> icon;
    };
    Vector<CustomType> custom_types;
    
    // UI 控件
    HashMap<CustomControlContainer, Vector<Control *>> container_controls;
    
    // 菜单项
    HashMap<String, Callable> tool_menu_items;
};

#endif // EDITOR_PLUGIN_H
```

### 2.2 插件生命周期详解

```cpp
// editor/plugins/editor_plugin.cpp

void EditorPlugin::_enter_tree() {
    // 插件初始化阶段
    // 在这里进行以下操作：
    
    // 1. 注册自定义类型
    Ref<Script> custom_node_script = ResourceLoader::load("res://addons/my_plugin/custom_node.gd");
    Ref<Texture2D> custom_node_icon = ResourceLoader::load("res://addons/my_plugin/icon.svg");
    add_custom_type("MyCustomNode", "Node", custom_node_script, custom_node_icon);
    
    // 2. 添加 UI 控件
    Control *my_panel = memnew(Control);
    add_control_to_container(CONTAINER_SPATIAL_EDITOR_SIDEBAR, my_panel);
    
    // 3. 注册检查器插件
    Ref<MyInspectorPlugin> inspector_plugin;
    inspector_plugin.instantiate();
    add_inspector_plugin(inspector_plugin);
    
    // 4. 添加菜单项
    add_tool_menu_item("我的工具", callable_mp(this, &MyEditorPlugin::_on_tool_menu));
    
    // 5. 连接编辑器信号
    EditorInterface *editor_interface = get_editor_interface();
    editor_interface->connect("scene_closed", callable_mp(this, &MyEditorPlugin::_on_scene_closed));
}

void EditorPlugin::_exit_tree() {
    // 插件清理阶段
    // 在这里进行以下操作：
    
    // 1. 移除自定义类型
    remove_custom_type("MyCustomNode");
    
    // 2. 移除 UI 控件
    remove_control_from_container(CONTAINER_SPATIAL_EDITOR_SIDEBAR, my_panel);
    memdelete(my_panel);
    
    // 3. 移除检查器插件
    remove_inspector_plugin(inspector_plugin);
    
    // 4. 移除菜单项
    remove_tool_menu_item("我的工具");
    
    // 5. 断开信号连接
    EditorInterface *editor_interface = get_editor_interface();
    editor_interface->disconnect("scene_closed", callable_mp(this, &MyEditorPlugin::_on_scene_closed));
}

bool EditorPlugin::_handles(Object *p_object) const {
    // 判断插件是否处理此对象
    // 返回 true 表示插件要处理此对象
    
    // 示例：只处理特定类型的节点
    Node *node = Object::cast_to<Node>(p_object);
    if (node && node->is_class("MyCustomNode")) {
        return true;
    }
    
    return false;
}

void EditorPlugin::_edit(Object *p_object) {
    // 编辑对象时调用
    // 在这里更新插件的状态和界面
    
    if (_handles(p_object)) {
        // 更新插件界面
        my_panel->update_ui(p_object);
    }
}

void EditorPlugin::_make_visible(bool p_visible) {
    // 控制插件界面可见性
    // 当编辑器切换到其他对象时调用
    
    if (my_panel) {
        my_panel->set_visible(p_visible);
    }
}
```

### 2.3 自定义类型注册机制

```cpp
// editor/editor_node.cpp - 类型注册实现

void EditorPlugin::add_custom_type(const String &p_type, 
                                   const String &p_base,
                                   const Ref<Script> &p_script,
                                   const Ref<Texture> &p_icon) {
    ERR_FAIL_COND(p_type.is_empty());
    ERR_FAIL_COND(p_base.is_empty());
    ERR_FAIL_COND(p_script.is_null());
    
    // 验证基类存在
    StringName base_type = p_base;
    if (!ClassDB::class_exists(base_type)) {
        ERR_PRINT("Base type '" + p_base + "' does not exist");
        return;
    }
    
    // 创建自定义类型记录
    CustomType custom_type;
    custom_type.name = p_type;
    custom_type.base = p_base;
    custom_type.script = p_script;
    custom_type.icon = p_icon;
    
    // 添加到类型列表
    custom_types.push_back(custom_type);
    
    // 通知编辑器更新
    EditorNode::get_singleton()->get_editor_interface()->notify_custom_type_added(p_type);
}

// 实例化自定义类型
Node *EditorInterface::create_node_from_type(const String &p_type) {
    // 查找自定义类型
    for (const EditorPlugin *plugin : EditorNode::get_singleton()->get_editor_plugins()) {
        Array custom_types = plugin->get_custom_types();
        
        for (int i = 0; i < custom_types.size(); i++) {
            Dictionary type_info = custom_types[i];
            
            if (type_info["name"] == p_type) {
                String base = type_info["base"];
                Ref<Script> script = type_info["script"];
                
                // 创建基类实例
                Node *node = Object::cast_to<Node>(ClassDB::instantiate(base));
                
                if (node && script.is_valid()) {
                    // 附加脚本
                    node->set_script(script);
                    
                    // 设置默认属性
                    if (script->has_method("_init_properties")) {
                        script->call("_init_properties", node);
                    }
                }
                
                return node;
            }
        }
    }
    
    // 尝试创建引擎内置类型
    return Object::cast_to<Node>(ClassDB::instantiate(p_type));
}
```

### 2.4 插件容器系统

```cpp
// 编辑器 UI 容器布局

enum CustomControlContainer {
    // 主工具栏
    CONTAINER_TOOLBAR,
    
    // 2D 编辑器
    CONTAINER_CANVAS_EDITOR_MENU,
    CONTAINER_CANVAS_EDITOR_SIDEBAR,
    
    // 3D 编辑器
    CONTAINER_SPATIAL_EDITOR_MENU,
    CONTAINER_SPATIAL_EDITOR_SIDEBAR,
    
    // 属性检查器
    CONTAINER_INSPECTOR_BOTTOM,
    
    // 项目设置
    CONTAINER_PROJECT_SETTING_TAB_LEFT,
    CONTAINER_PROJECT_SETTING_TAB_RIGHT,
};

// 容器布局示意
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar (CONTAINER_TOOLBAR)                                    │
├──────────┬──────────────────────────────────────────────────────┤
│          │  Canvas Editor (CONTAINER_CANVAS_EDITOR_MENU)        │
│          │  ┌─────────────┬──────────────────────────────────┐  │
│  Canvas  │  │             │                                  │  │
│  Sidebar │  │  Viewport   │   Inspector (CONTAINER_INSPECTOR) │  │
│          │  │             │   ┌──────────────────────────┐   │  │
│          │  └─────────────┘   │  Property Editors         │   │  │
│          │                    │  (CONTAINER_INSPECTOR_    │   │  │
│          │                    │   BOTTOM)                 │   │  │
│          │                    └──────────────────────────┘   │  │
└──────────┴──────────────────────────────────────────────────────┘
```

---

## 3. EditorInspector：属性检查器

### 3.1 EditorInspector 类定义

```cpp
// editor/inspector/editor_inspector.h

#ifndef EDITOR_INSPECTOR_H
#define EDITOR_INSPECTOR_H

#include "scene/gui/box_container.h"
#include "editor/inspector/editor_property.h"
#include "editor/inspector/editor_inspector_plugin.h"

class EditorInspector : public VBoxContainer {
    GDCLASS(EditorInspector, VBoxContainer);

public:
    // 编辑对象
    void edit(Object *p_object);
    
    // 刷新显示
    void refresh();
    
    // 获取当前编辑的对象
    Object *get_edited_object() const { return object; }
    
    // 属性变更信号
    Signal property_edited;      // 属性编辑完成
    Signal property_changed;     // 属性值改变
    Signal property_keyed;       // 属性关键帧设置
    Signal resource_selected;    // 资源被选中
    Signal object_id_selected;   // 对象 ID 被选中
    
    // 检查器配置
    void set_read_only(bool p_read_only);
    bool is_read_only() const { return read_only; }
    
    void set_use_filter(bool p_use_filter);
    bool is_using_filter() const { return use_filter; }
    
    void set_property_prefix(const String &p_prefix);
    String get_property_prefix() const { return property_prefix; }
    
    // 检查器插件
    void add_inspector_plugin(const Ref<EditorInspectorPlugin> &p_plugin);
    void remove_inspector_plugin(const Ref<EditorInspectorPlugin> &p_plugin);
    
    // 重载状态
    void set_can_reorder(bool p_can_reorder);
    void set_use_word_wrap(bool p_word_wrap);
    void set_use_folding(bool p_folding);
    
    // 调试
    void set_capitalize_paths(bool p_capitalize);

protected:
    void _notification(int p_notification);
    static void _bind_methods();

private:
    Object *object;
    bool read_only;
    bool use_filter;
    String property_prefix;
    
    // 属性列表
    Vector<PropertyInfo> properties;
    HashMap<String, EditorProperty *> property_editors;
    
    // 分类和分组
    HashMap<String, int> categories;
    HashMap<String, int> groups;
    
    // 检查器插件
    Vector<Ref<EditorInspectorPlugin>> inspector_plugins;
    
    // 更新属性
    void _update_property(const String &p_property);
    void _update_all_properties();
    
    // 创建属性编辑器
    EditorProperty *_create_editor_for_property(const PropertyInfo &p_property);
    
    // 属性变更处理
    void _property_changed(const String &p_property, const Variant &p_value, const String &p_field = "", bool p_changing = false);
    void _property_edited(const String &p_property);
    void _property_keyed(const String &p_property);
    void _resource_selected(const String &p_property, const Ref<Resource> &p_resource);
    
    // 构建属性列表
    void _build_property_list();
    void _sort_properties();
    
    // UI 更新
    void _update_category(const String &p_category);
    void _update_group(const String &p_group);
};

#endif // EDITOR_INSPECTOR_H
```

### 3.2 属性编辑器系统

```cpp
// editor/inspector/editor_property.h

#ifndef EDITOR_PROPERTY_H
#define EDITOR_PROPERTY_H

#include "scene/gui/control.h"
#include "core/object/object.h"

class EditorProperty : public Control {
    GDCLASS(EditorProperty, Control);

public:
    // 属性信息
    void setup(const PropertyInfo &p_property, 
              const String &p_name,
              const Variant &p_value,
              int p_h_offset = 0);
    
    // 值操作
    virtual void set_value(const Variant &p_value);
    virtual Variant get_value();
    
    // 属性名称
    void set_label(const String &p_label);
    String get_label() const { return label; }
    
    // 只读状态
    void set_read_only(bool p_read_only);
    bool is_read_only() const { return read_only; }
    
    // 提示文本
    void set_hint_text(const String &p_hint);
    String get_hint_text() const { return hint_text; }
    
    // 信号
    Signal property_changed;
    Signal property_selected;
    Signal property_checked;
    
    // 通知检查器
    void emit_changed(const Variant &p_value, const String &p_field = "", bool p_changing = false);
    void emit_selected(const String &p_path);
    void emit_checked(bool p_checked);

protected:
    static void _bind_methods();
    void _notification(int p_notification);

private:
    PropertyInfo property_info;
    String label;
    String name;
    Variant current_value;
    bool read_only;
    String hint_text;
    
    // 子控件管理
    void add_child_control(Control *p_control);
    void set_label_width(int p_width);
};

// 具体属性编辑器示例

// 文本属性编辑器
class EditorPropertyText : public EditorProperty {
    GDCLASS(EditorPropertyText, EditorProperty);

private:
    LineEdit *line_edit;
    TextEdit *text_edit;

public:
    virtual void set_value(const Variant &p_value) override {
        if (p_value.get_type() == Variant::STRING) {
            String text = p_value;
            if (text_edit) {
                text_edit->set_text(text);
            } else if (line_edit) {
                line_edit->set_text(text);
            }
        }
    }
    
    virtual Variant get_value() override {
        if (text_edit) {
            return text_edit->get_text();
        } else if (line_edit) {
            return line_edit->get_text();
        }
        return Variant();
    }
};

// 数值属性编辑器
class EditorPropertyInteger : public EditorProperty {
    GDCLASS(EditorPropertyInteger, EditorProperty);

private:
    SpinBox *spin_box;

public:
    EditorPropertyInteger() {
        spin_box = memnew(SpinBox);
        spin_box->connect("value_changed", callable_mp(this, &EditorPropertyInteger::_value_changed));
        add_child_control(spin_box);
    }
    
    virtual void set_value(const Variant &p_value) override {
        if (p_value.get_type() == Variant::INT) {
            spin_box->set_value(p_value);
        }
    }
    
    virtual Variant get_value() override {
        return spin_box->get_value();
    }
    
private:
    void _value_changed(double p_value) {
        emit_changed((int)p_value);
    }
};

// 颜色属性编辑器
class EditorPropertyColor : public EditorProperty {
    GDCLASS(EditorPropertyColor, EditorProperty);

private:
    ColorPickerButton *color_picker;

public:
    EditorPropertyColor() {
        color_picker = memnew(ColorPickerButton);
        color_picker->connect("color_changed", callable_mp(this, &EditorPropertyColor::_color_changed));
        add_child_control(color_picker);
    }
    
    virtual void set_value(const Variant &p_value) override {
        if (p_value.get_type() == Variant::COLOR) {
            Color color = p_value;
            color_picker->set_color(color);
        }
    }
    
    virtual Variant get_value() override {
        return color_picker->get_color();
    }
    
private:
    void _color_changed(const Color &p_color) {
        emit_changed(p_color);
    }
};

// 资源属性编辑器
class EditorPropertyResource : public EditorProperty {
    GDCLASS(EditorPropertyResource, EditorProperty);

private:
    EditorResourcePicker *resource_picker;

public:
    EditorPropertyResource() {
        resource_picker = memnew(EditorResourcePicker);
        resource_picker->connect("resource_selected", callable_mp(this, &EditorPropertyResource::_resource_selected));
        add_child_control(resource_picker);
    }
    
    void set_resource_type(const String &p_type) {
        resource_picker->set_resource_type(p_type);
    }
    
    virtual void set_value(const Variant &p_value) override {
        if (p_value.get_type() == Variant::OBJECT) {
            Ref<Resource> resource = p_value;
            resource_picker->set_edited_resource(resource);
        }
    }
    
    virtual Variant get_value() override {
        return resource_picker->get_edited_resource();
    }
    
private:
    void _resource_selected(const Ref<Resource> &p_resource) {
        emit_changed(p_resource);
    }
};

#endif // EDITOR_PROPERTY_H
```

### 3.3 检查器插件系统

```cpp
// editor/inspector/editor_inspector_plugin.h

#ifndef EDITOR_INSPECTOR_PLUGIN_H
#define EDITOR_INSPECTOR_PLUGIN_H

#include "core/object/ref_counted.h"
#include "core/variant/variant.h"

class Object;
class Control;

class EditorInspectorPlugin : public RefCounted {
    GDCLASS(EditorInspectorPlugin, RefCounted);

public:
    // 判断是否可以处理此对象
    virtual bool can_handle(Object *p_object) = 0;
    
    // 解析属性
    // 返回 true 表示插件处理此属性，false 使用默认编辑器
    virtual bool parse_property(
        Object *p_object,
        const Variant::Type p_type,
        const String &p_path,
        const PropertyHint p_hint,
        const String &p_hint_text,
        const BitField<PropertyUsageFlags> p_usage,
        const bool p_wide = false
    );
    
    // 自定义分类
    virtual void parse_category(Object *p_object, const String &p_category);
    
    // 自定义分组
    virtual void parse_group(Object *p_object, const String &p_group);
    
    // 添加自定义控件
    void add_custom_control(const String &p_label, 
                          Control *p_control,
                          const String &p_property,
                          const bool p_keying = false);
    
    // 添加属性编辑器
    void add_property_editor(const String &p_property, 
                           EditorProperty *p_editor,
                           const bool p_keying = false);

protected:
    static void _bind_methods();

private:
    // 自定义控件列表
    struct CustomControl {
        String label;
        Control *control;
        String property;
        bool keying;
    };
    Vector<CustomControl> custom_controls;
};

#endif // EDITOR_INSPECTOR_PLUGIN_H
```

---

## 4. FileSystemDock：文件系统面板

### 4.1 FileSystemDock 类定义

```cpp
// editor/docks/file_system_dock.h

#ifndef FILE_SYSTEM_DOCK_H
#define FILE_SYSTEM_DOCK_H

#include "scene/gui/control.h"
#include "editor/editor_file_system.h"
#include "scene/gui/tree.h"
#include "scene/gui/item_list.h"

class EditorFileSystemDirectory;

class FileSystemDock : public Control {
    GDCLASS(FileSystemDock, Control);

public:
    // 文件操作
    void file_operation(const String &p_operation, 
                      const Vector<String> &p_files,
                      const String &p_to_path = "");
    
    void copy_files(const Vector<String> &p_files, const String &p_to_path);
    void move_files(const Vector<String> &p_files, const String &p_to_path);
    void duplicate_files(const Vector<String> &p_files);
    void remove_files(const Vector<String> &p_files);
    
    // 文件夹操作
    void make_dir(const String &p_dir);
    void rename_file(const String &p_old_path, const String &p_new_path);
    
    // 文件信息
    void show_file_in_filesystem(const String &p_file);
    void set_file_display_mode(FileListDisplayMode p_mode);
    
    // 搜索和过滤
    void set_search_term(const String &p_term);
    void set_file_filter(const String &p_filter);
    
    // 选择
    Vector<String> get_selected_files() const;
    String get_current_path() const;
    
    // 上下文菜单
    void show_file_context_menu(const String &p_file_path);
    void show_directory_context_menu(const String &p_dir_path);

protected:
    static void _bind_methods();
    void _notification(int p_notification);

private:
    // UI 组件
    Tree *file_tree;
    ItemList *file_list;
    LineEdit *search_box;
    OptionButton *view_mode_button;
    
    // 当前状态
    String current_path;
    Vector<String> selected_files;
    
    // 文件系统
    EditorFileSystem *editor_filesystem;
    EditorFileSystemDirectory *root_directory;
    
    // 显示模式
    enum FileListDisplayMode {
        DISPLAY_LIST,
        DISPLAY_THUMBNAILS
    };
    FileListDisplayMode display_mode;
    
    // 更新文件系统
    void _update_file_system();
    void _update_file_list();
    void _update_tree();
    
    // 事件处理
    void _file_selected(const String &p_file);
    void _file_activated(const String &p_file);
    void _directory_selected(const String &p_directory);
    void _context_menu_item_pressed(int p_id);
    
    // 拖放
    void _drop_files(const Vector<String> &p_files, int p_button);
    bool _can_drop_files(const Vector<String> &p_files);
    
    // 辅助方法
    String _get_file_type(const String &p_file) const;
    Ref<Texture2D> _get_file_icon(const String &p_file) const;
    void _open_file(const String &p_file);
};

#endif // FILE_SYSTEM_DOCK_H
```

### 4.2 文件系统面板功能

```
┌─────────────────────────────────────────────────────────────────┐
│                    FileSystemDock                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Search: ____________] [List] [Thumbnail] [Refresh]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────┬───────────────────────────────────────────┐   │
│  │             │                                           │   │
│  │  File Tree  │          File List                        │   │
│  │             │                                           │   │
│  │  📁 res://  │  📄 scene.tscn     Scene                  │   │
│  │   ├─ 📁 img │  📄 script.gd      GDScript               │   │
│  │   │  ├─ 🖼️ │  🖼️  texture.png    Texture2D              │   │
│  │   │  └─ 🖼️ │                                           │   │
│  │   ├─ 📁 scn │                                           │   │
│  │   └─ 📁 src │                                           │   │
│  │             │                                           │   │
│  └─────────────┴───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

功能列表：
• 文件浏览：树形视图和列表视图
• 文件搜索：按名称和类型过滤
• 文件操作：复制、移动、删除、重命名
• 文件夹操作：创建、重命名、删除
• 文件信息：类型、大小、修改时间
• 上下文菜单：右键菜单操作
• 拖放支持：拖拽文件进行移动
```

---

## 5. ScriptEditor：脚本编辑器

### 5.1 ScriptEditor 类定义

```cpp
// editor/script/script_editor.h

#ifndef SCRIPT_EDITOR_H
#define SCRIPT_EDITOR_H

#include "scene/gui/control.h"
#include "editor/editor_help.h"
#include "scene/main/node.h"

class ScriptEditorBase;
class ScriptTextEditor;
class ScriptEditorQuickOpen;

class ScriptEditor : public Control {
    GDCLASS(ScriptEditor, Control);

public:
    // 脚本编辑
    void edit(const Ref<Script> &p_script);
    void edit_script(const Ref<Script> &p_script, int p_line = -1, int p_col = 0, bool p_grab_focus = true);
    
    // 获取当前编辑的脚本
    Ref<Script> get_current_script() const;
    Vector<Ref<Script>> get_open_scripts() const;
    
    // 保存和关闭
    void save_current_script();
    void save_all_scripts();
    void close_current_script();
    void close_all_scripts();
    
    // 历史导航
    void goto_next_script();
    void goto_prev_script();
    void add_recent_script(const String &p_path);
    
    // 快速打开
    void quick_open(const String &p_term = "");
    
    // 帮助系统
    void show_doc_script();
    void search_in_docs();
    
    // 代码补全
    void trigger_code_complete();
    void trigger_symbol_lookup();
    
    // 断点调试
    void toggle_breakpoint(int p_line);
    void clear_breakpoints();
    Vector<int> get_breakpoints() const;
    
    // 信号
    Signal editor_refreshed;
    Signal script_close;
    Signal script_saved;

protected:
    static void _bind_methods();
    void _notification(int p_notification);

private:
    // UI 组件
    TabContainer *script_list;
    ScriptEditorQuickOpen *quick_open;
    Control *help_bar;
    
    // 编辑器实例
    Vector<ScriptEditorBase *> script_editors;
    HashMap<Ref<Script>, ScriptEditorBase *> script_editor_map;
    
    // 当前状态
    Ref<Script> current_script;
    Vector<String> recent_scripts;
    
    // 历史导航
    int history_pos;
    Vector<Ref<Script>> history;
    
    // 更新编辑器
    void _update_script_editors();
    void _update_script_list();
    
    // 事件处理
    void _script_changed();
    void _script_saved();
    void _tab_changed(int p_tab);
    void _tab_closed(int p_tab);
    
    // 辅助方法
    ScriptEditorBase *_create_editor_for_script(const Ref<Script> &p_script);
    bool _is_script_open(const Ref<Script> &p_script) const;
    void _go_to_script(const Ref<Script> &p_script);
};

#endif // SCRIPT_EDITOR_H
```

### 5.2 脚本编辑器功能

```
┌─────────────────────────────────────────────────────────────────┐
│                      ScriptEditor                                │
├─────────────────────────────────────────────────────────────────┤
│  [Save] [Save All] [Close] [Quick Open] [Help] [Search]        │
├─────────────────────────────────────────────────────────────────┤
│  [scene.gd] [player.gd] [enemy.gd] [utils.gd]                  │
├─────────────────────────────────────────────────────────────────┤
│  1  extends Node                                                │
│  2                                                               │
│  3  @export var health: int = 100                               │
│  4  @export var speed: float = 5.0                              │
│  5                                                               │
│  6  func _ready():                                              │
│  7      print("Player ready")                                   │
│  8                                                               │
│  9  func _process(delta):                                       │
│ 10      position += Vector2(speed * delta, 0)                   │
│ 11                                                               │
│  12  func take_damage(amount: int):                             │
│ 13      health -= amount                                        │
│ 14      if health <= 0:                                         │
│ 15          die()                                               │
│ 16                                                               │
│  └───────────────────────────────────────────────────────────┘  │
│  [Line: 12, Col: 5] | [UTF-8] | [GDScript]                     │
└─────────────────────────────────────────────────────────────────┘

功能列表：
• 多标签页编辑：同时编辑多个脚本
• 语法高亮：支持多种脚本语言
• 代码补全：自动完成和智能提示
• 错误检查：实时语法和错误检测
• 断点调试：设置断点和调试支持
• 代码导航：跳转到定义和查找引用
• 快速打开：快速查找和打开文件
• 代码搜索：跨文件搜索和替换
• 代码格式化：自动格式化和缩进
• 版本控制：Git 集成和差异比较
```

---

## 6. 编辑器设置系统

### 6.1 EditorSettings 类定义

```cpp
// editor/editor_settings.h

#ifndef EDITOR_SETTINGS_H
#define EDITOR_SETTINGS_H

#include "core/io/config_file.h"
#include "core/object/ref_counted.h"

class EditorSettings : public RefCounted {
    GDCLASS(EditorSettings, RefCounted);

public:
    // 单例访问
    static EditorSettings *get_singleton();
    
    // 设置管理
    void set_setting(const String &p_setting, const Variant &p_value);
    Variant get_setting(const String &p_setting) const;
    bool has_setting(const String &p_setting) const;
    
    // 首选项
    void set_favorite_dirs(const Vector<String> &p_dirs);
    Vector<String> get_favorite_dirs() const;
    
    void set_recent_dirs(const Vector<String> &p_dirs);
    Vector<String> get_recent_dirs() const;
    
    // 编辑器行为
    void set_auto_reload_modified_files(bool p_enable);
    bool get_auto_reload_modified_files() const;
    
    void set_show_script_variables_in_inspector(bool p_enable);
    bool get_show_script_variables_in_inspector() const;
    
    // 界面设置
    void set_editor_scale(float p_scale);
    float get_editor_scale() const;
    
    void set_display_scale(DisplayScale p_scale);
    DisplayScale get_display_scale() const;
    
    void set_custom_editor_scale(float p_scale);
    float get_custom_editor_scale() const;
    
    // 外观设置
    void set_theme(const Ref<Theme> &p_theme);
    Ref<Theme> get_theme() const;
    
    void set_editor_font(const String &p_font_path);
    String get_editor_font() const;
    
    void set_editor_font_size(int p_size);
    int get_editor_font_size() const;
    
    // 网络设置
    void set_network_proxy(const String &p_host, int p_port);
    String get_network_proxy_host() const;
    int get_network_proxy_port() const;
    
    // 项目设置
    void set_project_manager_on_start(bool p_enabled);
    bool get_project_manager_on_start() const;
    
    // 保存和加载
    Error save();
    Error load();
    void load_default();
    
    // 通知
    Signal settings_changed;

protected:
    static void _bind_methods();

private:
    ConfigFile config_file;
    String settings_path;
    
    // 缓存
    HashMap<String, Variant> settings_cache;
    
    // 默认设置
    void _register_defaults();
    void _apply_settings();
};

#endif // EDITOR_SETTINGS_H
```

### 6.2 编辑器设置分类

```
EditorSettings 设置分类
│
├─► 界面设置
│   ├─► 编辑器缩放
│   ├─► 主题和外观
│   ├─► 字体和字号
│   └─► 布局配置
│
├─► 编辑器行为
│   ├─► 自动重载
│   ├─► 保存提示
│   ├─► 撤销历史
│   └─► 脚本变量显示
│
├─► 文件系统
│   ├─► 文本编辑器
│   ├─► 脚本编辑器
│   ├─► 资源预览
│   └─► 文件关联
│
├─► 网络设置
│   ├─► 代理配置
│   ├─► 模板下载
│   └─► 更新检查
│
├─► 外部工具
│   ├─► 终端命令
│   ├─► 图像编辑器
│   └─► 其他工具
│
└─► 高级设置
    ├─► 性能设置
    ├─► 内存限制
    └─► 调试选项
```

---

## 7. 场景编辑器

### 7.1 SceneTreeDock 类定义

```cpp
// editor/docks/scene_tree_dock.h

#ifndef SCENE_TREE_DOCK_H
#define SCENE_TREE_DOCK_H

#include "scene/gui/control.h"
#include "scene/gui/tree.h"
#include "scene/main/node.h"

class SceneTreeDock : public Control {
    GDCLASS(SceneTreeDock, Control);

public:
    // 场景操作
    void instantiate(const String &p_path);
    void add_child_node_to_selected(Node *p_node);
    void remove_and_delete_node(Node *p_node);
    
    // 节点选择
    void select_node(Node *p_node);
    void deselect_nodes();
    Node *get_selected_node() const;
    Vector<Node *> get_selected_nodes() const;
    
    // 场景树操作
    void set_edited_scene(Node *p_scene);
    Node *get_edited_scene() const;
    
    void set_display_mode(DisplayMode p_mode);
    DisplayMode get_display_mode() const;
    
    // 节点过滤
    void set_node_filter(const String &p_filter);
    String get_node_filter() const;
    
    // 拖放操作
    bool can_drop_node(Node *p_node, Node *p_new_parent, int p_pos);
    void drop_node(Node *p_node, Node *p_new_parent, int p_pos);
    
    // 信号
    Signal node_selected;
    Signal node_prerename;
    Signal nodes_dragged;

protected:
    static void _bind_methods();
    void _notification(int p_notification);

private:
    // UI 组件
    Tree *scene_tree;
    LineEdit *search_box;
    MenuButton *add_button;
    
    // 当前状态
    Node *edited_scene;
    Node *selected_node;
    DisplayMode display_mode;
    
    // 场景树数据
    HashMap<Node *, TreeItem *> node_items;
    
    // 更新场景树
    void _update_scene_tree();
    void _update_tree_item(Node *p_node, TreeItem *p_item);
    
    // 事件处理
    void _node_selected();
    void _node_renamed();
    void _tree_item_activated();
    void _tree_item_rmb_selected(const Vector2 &p_pos);
    
    // 节点操作
    void _add_child_node(Node *p_node);
    void _duplicate_node(Node *p_node);
    void _reparent_node(Node *p_node, Node *p_new_parent);
    
    // 辅助方法
    TreeItem *_find_tree_item(Node *p_node);
    void _expand_tree(TreeItem *p_item);
    void _collapse_tree(TreeItem *p_item);
};

#endif // SCENE_TREE_DOCK_H
```

### 7.2 场景树编辑器功能

```
┌─────────────────────────────────────────────────────────────────┐
│                      SceneTreeDock                               │
├─────────────────────────────────────────────────────────────────┤
│  [Search: ____________] [Add] [Groups] [Filter]                │
├─────────────────────────────────────────────────────────────────┤
│  📄 Main (root)                                                 │
│   ├─ 📄 Camera3D                                                │
│   ├─ 📄 DirectionalLight3D                                       │
│   ├─ 📄 Player                                                  │
│   │   ├─ 📄 MeshInstance3D                                       │
│   │   ├─ 📄 CollisionShape3D                                     │
│   │   └─ 📄 Area3D                                              │
│   │       └─ 📄 CollisionShape3D                                 │
│   └─ 📄 Enemy                                                   │
│       ├─ 📄 MeshInstance3D                                       │
│       └─ 📄 NavigationAgent3D                                    │
└─────────────────────────────────────────────────────────────────┘

功能列表：
• 节点选择：单击选择节点
• 多节点选择：Ctrl+点击多选
• 节点重命名：双击重命名
• 节点拖放：拖拽调整层级
• 节点过滤：按名称过滤节点
• 节点分组：创建和管理节点组
• 场景实例：嵌套场景编辑
• 右键菜单：快速操作菜单
• 节点图标：显示节点类型图标
• 展开折叠：树形结构展开折叠
```

### 7.3 场景编辑器工作流程

```
场景编辑工作流程
│
├─► 1. 创建场景
│   ├─► 新建场景
│   ├─► 选择根节点类型
│   └─► 设置场景属性
│
├─► 2. 添加节点
│   ├─► 从"添加子节点"对话框选择
│   ├─► 从场景库实例化
│   └─► 复制粘贴节点
│
├─► 3. 编辑节点
│   ├─► 调整节点属性
│   ├─► 添加子节点
│   ├─► 附加脚本
│   └─► 设置变换
│
├─► 4. 场景组织
│   ├─► 调整节点层级
│   ├─► 创建节点组
│   └─► 使用场景实例
│
└─► 5. 保存和测试
    ├─► 保存场景
    ├─► 运行场景
    └─► 调试和优化
```

---

## 8. 总结

### 8.1 编辑器架构核心要点

1. **EditorNode 作为中心**：所有编辑器组件的协调者
2. **插件系统扩展**：通过 EditorPlugin 灵活扩展功能
3. **反射驱动**：使用属性系统实现动态编辑
4. **模块化设计**：各组件职责明确，耦合度低
5. **场景树架构**：利用 Godot 自身的场景系统构建编辑器

### 8.2 关键技术总结

| 技术 | 应用 | 优势 |
|------|------|------|
| **单例模式** | EditorNode, EditorSettings | 全局访问点 |
| **观察者模式** | 信号系统 | 松耦合通信 |
| **工厂模式** | 节点/资源创建 | 统一创建接口 |
| **策略模式** | 属性编辑器 | 可替换算法 |
| **插件架构** | EditorPlugin | 功能扩展 |

### 8.3 学习建议

1. **从整体到局部**：先理解整体架构，再深入具体组件
2. **跟踪代码流程**：使用调试器跟踪编辑器运行流程
3. **实践开发插件**：通过编写插件加深理解
4. **阅读源码注释**：源码中有详细的实现说明
5. **参考官方插件**：学习官方编辑器插件的实现

---

**下一节**：继续学习其他章节内容

**相关源码**：
- `editor/editor_node.h/cpp` - 编辑器主节点
- `editor/plugins/editor_plugin.h/cpp` - 插件系统
- `editor/inspector/editor_inspector.h/cpp` - 属性检查器
- `editor/docks/file_system_dock.h/cpp` - 文件系统面板
- `editor/script/script_editor.h/cpp` - 脚本编辑器
