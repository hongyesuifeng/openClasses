# UIBuilder 框架迁移指南

> 验证框架是否真正与游戏解耦、能移植到其他项目的完整清单

---

## 框架边界：哪些文件属于框架，哪些属于游戏

### 框架核心（复制到新项目）

```
addons/ui_builder/           ← 全部复制，一行不改
├── plugin.cfg
├── plugin.gd
├── ui_builder.gd
├── ui_style_resolver.gd
├── ui_asset_loader.gd
├── ui_action_binder.gd
├── ui_data_binder.gd
└── base_components/
    ├── BaseButton.gd
    └── BasePanel.gd
```

**这 9 个文件里没有任何 slayDemo 的业务逻辑、数据结构、颜色值或路径。**

### 游戏填写（新项目重新写）

```
ui_manifest/
├── manifest.assets.json     ← 新项目替换为自己的资源路径
└── manifest.styles.json     ← 新项目替换为自己的配色/字体

ui_specs/
└── *.ui.json                ← 新项目的界面描述文件
```

### 游戏专用组件（新项目自己写）

```
ui_components/
└── *.gd / *.tscn            ← ComponentRef 引用的组件
```

---

## 移植步骤（新 Godot 4.x 项目）

### Step 1：复制框架

```
将 addons/ui_builder/ 整个目录复制到新项目的 addons/
```

### Step 2：创建 manifest 文件（必须在这两个路径）

```
res://ui_manifest/manifest.assets.json
res://ui_manifest/manifest.styles.json
```

最小可用的 manifest：

```json
// manifest.assets.json
{}

// manifest.styles.json  
{
  "colors": {},
  "fonts": {},
  "styles": {
    "panel_dark": {
      "type": "flat",
      "bg_color": "#1A1A2E",
      "border_width": 0
    }
  }
}
```

### Step 3：写第一个 Spec 文件

```json
// res://ui_specs/my_first.ui.json
{
  "scene": "MyFirstUI",
  "children": [
    {
      "type": "Label",
      "name": "Hello",
      "text": "Hello from UIBuilder!",
      "layout": { "preset": "center", "size": [400, 60] }
    }
  ]
}
```

### Step 4：在场景脚本中使用

```gdscript
const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")

func _ready() -> void:
    var ui := _UIBuilder.build("res://ui_specs/my_first.ui.json")
    add_child(ui)
```

> 注意：用 preload 而不是 class_name，确保在不启用插件时也能工作。

---

## 解耦验证清单（移植完成后逐项检查）

### ✅ 框架文件零修改验证
- [ ] `addons/ui_builder/` 里的文件与 slayDemo 中的完全一致（可用 diff 比较）
- [ ] 没有在框架文件里出现新项目的任何名词

### ✅ 资源替换验证
- [ ] 修改 `manifest.styles.json` 中 `panel_dark.bg_color` 为 `"#FF0000"`，重启后背景变红
- [ ] 修改 `manifest.assets.json` 添加一个资源 key，Spec 里引用它，能正确加载

### ✅ 样式替换验证
- [ ] Spec 文件里所有节点都用 `"style": "style_key"`，没有任何直接写颜色的地方
- [ ] 把一个 style_key 的颜色改掉，所有用到它的节点同时变色

### ✅ Action 解耦验证
- [ ] Spec 里有 `"action": "myapp.on_click"`
- [ ] 场景脚本实现 `handle_action(action_name, source)` 后点击有响应
- [ ] 框架文件没有任何 "myapp" 字样

### ✅ ComponentRef 验证
- [ ] 写一个新的 `ui_components/my_widget.tscn`（根节点是 Control）
- [ ] 脚本实现 `func setup(props: Dictionary) -> void`
- [ ] Spec 里用 `"type": "ComponentRef", "component": "MyWidget"` 能正确加载

---

## 已知限制（移植前需了解）

| 限制 | 说明 | 影响 |
|------|------|------|
| manifest 路径硬编码 | `res://ui_manifest/` 是写死的 | 多项目共存时需要分别存放 |
| 不支持动画/过渡 | 框架只生成静态节点树 | 动画需在 ComponentRef 组件里自行实现 |
| 数据绑定是手动模式 | 需要手动调用 `UIDataBinder.refresh()` | 不是响应式，数据变化不会自动更新 |
| 没有热重载 | 修改 Spec 后需要重启场景 | 开发时略麻烦（可配合 auto_reload 插件） |
| base_components 缺 .tscn | BaseButton/BasePanel 只有 .gd，ComponentRef 无法加载它们 | 直接用 style_key 替代，或自建 .tscn |

---

## 单元测试迁移

复制 `tests/unit/ui_builder_test.gd` 到新项目，修改顶部 preload 路径（如果不变则不需要改），加入测试运行器即可复用 132 条断言验证框架行为。

---

> 最后更新: 2026-06-09
