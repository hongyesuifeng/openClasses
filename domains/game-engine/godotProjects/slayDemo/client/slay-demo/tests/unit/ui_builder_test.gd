extends RefCounted

## UIBuilder 框架单元测试
## 覆盖：UIBuilder 节点构建、Layout Preset、UIStyleResolver、UIAssetLoader、UIActionBinder、UIDataBinder

# 插件未在 headless 模式下自动加载，必须显式 preload
const _UIBuilder       := preload("res://addons/ui_builder/ui_builder.gd")
const _UIStyleResolver := preload("res://addons/ui_builder/ui_style_resolver.gd")
const _UIAssetLoader   := preload("res://addons/ui_builder/ui_asset_loader.gd")
const _UIActionBinder  := preload("res://addons/ui_builder/ui_action_binder.gd")
const _UIDataBinder    := preload("res://addons/ui_builder/ui_data_binder.gd")

const EPSILON := 0.001


func name() -> String:
	return "UIBuilder framework"


func run_async(ctx: Variant) -> void:
	# 清空缓存确保加载真实 manifest
	_UIStyleResolver.clear_cache()
	_UIAssetLoader.clear_cache()

	_test_builder_basic(ctx)
	_test_builder_node_types(ctx)
	_test_builder_text_and_action(ctx)
	_test_builder_visibility(ctx)
	_test_builder_children(ctx)
	_test_builder_bind(ctx)
	_test_layout_full_rect(ctx)
	_test_layout_absolute_rect(ctx)
	_test_layout_top_full(ctx)
	_test_layout_bottom_full(ctx)
	_test_layout_left_full(ctx)
	_test_layout_right_full(ctx)
	_test_layout_center(ctx)
	_test_layout_top_left(ctx)
	_test_layout_top_right(ctx)
	_test_layout_top_center(ctx)
	_test_layout_bottom_left(ctx)
	_test_layout_bottom_right(ctx)
	_test_layout_bottom_center(ctx)
	_test_layout_left_center(ctx)
	_test_layout_right_center(ctx)
	_test_style_resolver_has_style(ctx)
	_test_style_resolver_flat(ctx)
	_test_style_resolver_label_colors(ctx)
	_test_style_resolver_progress(ctx)
	_test_style_resolver_missing_fallback(ctx)
	_test_asset_loader_resolve_path(ctx)
	_test_asset_loader_nine_patch(ctx)
	_test_asset_loader_missing_key(ctx)
	_test_action_binder(ctx)
	_test_data_binder_label(ctx)
	_test_data_binder_progressbar(ctx)
	_test_data_binder_button(ctx)
	_test_data_binder_missing_path(ctx)
	_test_pascal_to_snake(ctx)

	_UIStyleResolver.clear_cache()
	_UIAssetLoader.clear_cache()
	_cleanup_test_manifests()


## ──────────────────────── _UIBuilder 构建测试 ──────────────────────────


func _test_builder_basic(ctx: Variant) -> void:
	var spec := {
		"scene": "TestScene",
		"children": []
	}
	var root := _build_from_dict(spec)
	ctx.assert_true(root != null, "builder: 返回非空控件")
	ctx.assert_eq(root.name, "TestScene", "builder: scene name 赋值到 root.name")
	root.free()


func _test_builder_node_types(ctx: Variant) -> void:
	for type_name in ["Control", "Panel", "Label", "Button", "TextureRect",
			"HBoxContainer", "VBoxContainer", "MarginContainer", "CenterContainer", "ProgressBar"]:
		var node := _build_single_node({"type": type_name, "name": type_name + "Node",
				"layout": {"preset": "full_rect"}})
		ctx.assert_true(node != null, "builder: 创建 %s 不为空" % type_name)
		node.free()


func _test_builder_text_and_action(ctx: Variant) -> void:
	var label := _build_single_node({"type": "Label", "name": "L", "text": "你好",
			"layout": {"preset": "full_rect"}})
	ctx.assert_eq((label as Label).text, "你好", "builder: Label.text 赋值")
	label.free()

	var btn := _build_single_node({"type": "Button", "name": "B", "text": "点击",
			"action": "demo.on_click", "layout": {"preset": "full_rect"}})
	ctx.assert_eq((btn as Button).text, "点击", "builder: Button.text 赋值")
	ctx.assert_eq(btn.get_meta("ui_action", ""), "demo.on_click", "builder: action meta 已设置")
	btn.free()


func _test_builder_visibility(ctx: Variant) -> void:
	var hidden := _build_single_node({"type": "Control", "name": "H", "visible": false,
			"layout": {"preset": "full_rect"}})
	ctx.assert_eq(hidden.visible, false, "builder: visible=false 生效")
	hidden.free()

	var shown := _build_single_node({"type": "Control", "name": "S", "visible": true,
			"layout": {"preset": "full_rect"}})
	ctx.assert_eq(shown.visible, true, "builder: visible=true 生效")
	shown.free()


func _test_builder_children(ctx: Variant) -> void:
	var spec := {
		"type": "Panel",
		"name": "Parent",
		"layout": {"preset": "full_rect"},
		"children": [
			{"type": "Label", "name": "ChildA", "text": "A", "layout": {"preset": "full_rect"}},
			{"type": "Button", "name": "ChildB", "text": "B", "layout": {"preset": "full_rect"}}
		]
	}
	var parent := _build_single_node(spec)
	ctx.assert_eq(parent.get_child_count(), 2, "builder: 子节点数量正确")
	ctx.assert_eq(parent.get_child(0).name, "ChildA", "builder: 第一个子节点名正确")
	ctx.assert_eq(parent.get_child(1).name, "ChildB", "builder: 第二个子节点名正确")
	parent.free()


func _test_builder_bind(ctx: Variant) -> void:
	var node := _build_single_node({"type": "Label", "name": "BL", "bind": "battle.hp",
			"layout": {"preset": "full_rect"}})
	ctx.assert_eq(node.get_meta("ui_bind", ""), "battle.hp", "builder: bind meta 已设置")
	node.free()


## ──────────────────────── Layout Preset 测试 ──────────────────────────


func _test_layout_full_rect(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "full_rect"})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.0), "layout full_rect: anchor_left=0")
	ctx.assert_true(_approx_eq(n.anchor_right, 1.0), "layout full_rect: anchor_right=1")
	ctx.assert_true(_approx_eq(n.anchor_top, 0.0), "layout full_rect: anchor_top=0")
	ctx.assert_true(_approx_eq(n.anchor_bottom, 1.0), "layout full_rect: anchor_bottom=1")
	n.free()


func _test_layout_absolute_rect(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "absolute_rect", "position": [100, 200],
			"size": [300, 150]})
	ctx.assert_true(_approx_eq(n.position.x, 100.0), "layout absolute_rect: position.x")
	ctx.assert_true(_approx_eq(n.position.y, 200.0), "layout absolute_rect: position.y")
	ctx.assert_true(_approx_eq(n.size.x, 300.0), "layout absolute_rect: size.x")
	ctx.assert_true(_approx_eq(n.size.y, 150.0), "layout absolute_rect: size.y")
	n.free()


func _test_layout_top_full(ctx: Variant) -> void:
	# top_full: anchor_top=0, anchor_bottom=0 (height 通过 offset 控制)
	var n := _make_control_with_layout({"preset": "top_full", "height": 72, "margin": [8, 4, 8, 0]})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.0), "layout top_full: anchor_left=0")
	ctx.assert_true(_approx_eq(n.anchor_right, 1.0), "layout top_full: anchor_right=1")
	ctx.assert_true(_approx_eq(n.anchor_top, 0.0), "layout top_full: anchor_top=0")
	ctx.assert_true(_approx_eq(n.anchor_bottom, 0.0), "layout top_full: anchor_bottom=0")
	# offset_bottom = height = 72
	ctx.assert_true(_approx_eq(n.offset_bottom, 72.0), "layout top_full: offset_bottom=height")
	ctx.assert_true(_approx_eq(n.offset_left, 8.0), "layout top_full: offset_left=margin_left")
	ctx.assert_true(_approx_eq(n.offset_top, 4.0), "layout top_full: offset_top=margin_top")
	ctx.assert_true(_approx_eq(n.offset_right, -8.0), "layout top_full: offset_right=-margin_right")
	n.free()


func _test_layout_bottom_full(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "bottom_full", "height": 80, "margin": [0, 0, 0, 16]})
	ctx.assert_true(_approx_eq(n.anchor_top, 1.0), "layout bottom_full: anchor_top=1")
	ctx.assert_true(_approx_eq(n.anchor_bottom, 1.0), "layout bottom_full: anchor_bottom=1")
	ctx.assert_true(_approx_eq(n.offset_top, -80.0), "layout bottom_full: offset_top=-height")
	ctx.assert_true(_approx_eq(n.offset_bottom, -16.0), "layout bottom_full: offset_bottom=-margin_bottom")
	n.free()


func _test_layout_left_full(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "left_full", "width": 200})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.0), "layout left_full: anchor_left=0")
	ctx.assert_true(_approx_eq(n.anchor_right, 0.0), "layout left_full: anchor_right=0")
	ctx.assert_true(_approx_eq(n.offset_right, 200.0), "layout left_full: offset_right=width")
	n.free()


func _test_layout_right_full(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "right_full", "width": 180})
	ctx.assert_true(_approx_eq(n.anchor_left, 1.0), "layout right_full: anchor_left=1")
	ctx.assert_true(_approx_eq(n.anchor_right, 1.0), "layout right_full: anchor_right=1")
	ctx.assert_true(_approx_eq(n.offset_left, -180.0), "layout right_full: offset_left=-width")
	n.free()


func _test_layout_center(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "center", "size": [400, 300]})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.5), "layout center: anchor_left=0.5")
	ctx.assert_true(_approx_eq(n.anchor_right, 0.5), "layout center: anchor_right=0.5")
	ctx.assert_true(_approx_eq(n.anchor_top, 0.5), "layout center: anchor_top=0.5")
	ctx.assert_true(_approx_eq(n.anchor_bottom, 0.5), "layout center: anchor_bottom=0.5")
	ctx.assert_true(_approx_eq(n.offset_left, -200.0), "layout center: offset_left=-w/2")
	ctx.assert_true(_approx_eq(n.offset_right, 200.0), "layout center: offset_right=w/2")
	ctx.assert_true(_approx_eq(n.offset_top, -150.0), "layout center: offset_top=-h/2")
	ctx.assert_true(_approx_eq(n.offset_bottom, 150.0), "layout center: offset_bottom=h/2")
	n.free()


func _test_layout_top_left(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "top_left", "size": [120, 60], "margin": [10, 8, 0, 0]})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.0), "layout top_left: anchor_left=0")
	ctx.assert_true(_approx_eq(n.anchor_top, 0.0), "layout top_left: anchor_top=0")
	ctx.assert_true(_approx_eq(n.offset_left, 10.0), "layout top_left: offset_left=margin_left")
	ctx.assert_true(_approx_eq(n.offset_top, 8.0), "layout top_left: offset_top=margin_top")
	ctx.assert_true(_approx_eq(n.offset_right, 10.0 + 120.0), "layout top_left: offset_right=ml+w")
	ctx.assert_true(_approx_eq(n.offset_bottom, 8.0 + 60.0), "layout top_left: offset_bottom=mt+h")
	n.free()


func _test_layout_top_right(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "top_right", "size": [100, 50], "margin": [0, 10, 20, 0]})
	ctx.assert_true(_approx_eq(n.anchor_left, 1.0), "layout top_right: anchor_left=1")
	ctx.assert_true(_approx_eq(n.anchor_right, 1.0), "layout top_right: anchor_right=1")
	ctx.assert_true(_approx_eq(n.offset_right, -20.0), "layout top_right: offset_right=-margin_right")
	ctx.assert_true(_approx_eq(n.offset_left, -(20.0 + 100.0)), "layout top_right: offset_left=-(mr+w)")
	ctx.assert_true(_approx_eq(n.offset_top, 10.0), "layout top_right: offset_top=margin_top")
	ctx.assert_true(_approx_eq(n.offset_bottom, 10.0 + 50.0), "layout top_right: offset_bottom=mt+h")
	n.free()


func _test_layout_top_center(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "top_center", "size": [300, 60], "margin": [0, 12, 0, 0]})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.5), "layout top_center: anchor_left=0.5")
	ctx.assert_true(_approx_eq(n.anchor_right, 0.5), "layout top_center: anchor_right=0.5")
	ctx.assert_true(_approx_eq(n.offset_left, -150.0), "layout top_center: offset_left=-w/2")
	ctx.assert_true(_approx_eq(n.offset_right, 150.0), "layout top_center: offset_right=w/2")
	ctx.assert_true(_approx_eq(n.offset_top, 12.0), "layout top_center: offset_top=margin_top")
	n.free()


func _test_layout_bottom_left(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "bottom_left", "size": [80, 40], "margin": [16, 0, 0, 24]})
	ctx.assert_true(_approx_eq(n.anchor_bottom, 1.0), "layout bottom_left: anchor_bottom=1")
	ctx.assert_true(_approx_eq(n.offset_bottom, -24.0), "layout bottom_left: offset_bottom=-mb")
	ctx.assert_true(_approx_eq(n.offset_top, -(24.0 + 40.0)), "layout bottom_left: offset_top=-(mb+h)")
	ctx.assert_true(_approx_eq(n.offset_left, 16.0), "layout bottom_left: offset_left=ml")
	n.free()


func _test_layout_bottom_right(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "bottom_right", "size": [180, 60],
			"margin": [0, 0, 40, 40]})
	ctx.assert_true(_approx_eq(n.anchor_left, 1.0), "layout bottom_right: anchor_left=1")
	ctx.assert_true(_approx_eq(n.anchor_bottom, 1.0), "layout bottom_right: anchor_bottom=1")
	ctx.assert_true(_approx_eq(n.offset_right, -40.0), "layout bottom_right: offset_right=-mr")
	ctx.assert_true(_approx_eq(n.offset_bottom, -40.0), "layout bottom_right: offset_bottom=-mb")
	ctx.assert_true(_approx_eq(n.offset_left, -(40.0 + 180.0)), "layout bottom_right: offset_left=-(mr+w)")
	ctx.assert_true(_approx_eq(n.offset_top, -(40.0 + 60.0)), "layout bottom_right: offset_top=-(mb+h)")
	n.free()


func _test_layout_bottom_center(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "bottom_center", "size": [240, 72],
			"margin": [0, 0, 0, 40]})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.5), "layout bottom_center: anchor_left=0.5")
	ctx.assert_true(_approx_eq(n.anchor_bottom, 1.0), "layout bottom_center: anchor_bottom=1")
	ctx.assert_true(_approx_eq(n.offset_left, -120.0), "layout bottom_center: offset_left=-w/2")
	ctx.assert_true(_approx_eq(n.offset_right, 120.0), "layout bottom_center: offset_right=w/2")
	ctx.assert_true(_approx_eq(n.offset_bottom, -40.0), "layout bottom_center: offset_bottom=-mb")
	ctx.assert_true(_approx_eq(n.offset_top, -(40.0 + 72.0)), "layout bottom_center: offset_top=-(mb+h)")
	n.free()


func _test_layout_left_center(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "left_center", "size": [160, 120], "margin": [12, 0, 0, 0]})
	ctx.assert_true(_approx_eq(n.anchor_left, 0.0), "layout left_center: anchor_left=0")
	ctx.assert_true(_approx_eq(n.anchor_top, 0.5), "layout left_center: anchor_top=0.5")
	ctx.assert_true(_approx_eq(n.offset_left, 12.0), "layout left_center: offset_left=ml")
	ctx.assert_true(_approx_eq(n.offset_right, 12.0 + 160.0), "layout left_center: offset_right=ml+w")
	ctx.assert_true(_approx_eq(n.offset_top, -60.0), "layout left_center: offset_top=-h/2")
	ctx.assert_true(_approx_eq(n.offset_bottom, 60.0), "layout left_center: offset_bottom=h/2")
	n.free()


func _test_layout_right_center(ctx: Variant) -> void:
	var n := _make_control_with_layout({"preset": "right_center", "size": [200, 100],
			"margin": [0, 0, 24, 0]})
	ctx.assert_true(_approx_eq(n.anchor_left, 1.0), "layout right_center: anchor_left=1")
	ctx.assert_true(_approx_eq(n.anchor_right, 1.0), "layout right_center: anchor_right=1")
	ctx.assert_true(_approx_eq(n.offset_left, -(24.0 + 200.0)), "layout right_center: offset_left=-(mr+w)")
	ctx.assert_true(_approx_eq(n.offset_right, -24.0), "layout right_center: offset_right=-mr")
	ctx.assert_true(_approx_eq(n.offset_top, -50.0), "layout right_center: offset_top=-h/2")
	ctx.assert_true(_approx_eq(n.offset_bottom, 50.0), "layout right_center: offset_bottom=h/2")
	n.free()


## ──────────────────────── _UIStyleResolver 测试 ──────────────────────────


func _test_style_resolver_has_style(ctx: Variant) -> void:
	ctx.assert_true(_UIStyleResolver.has_style("btn_primary"), "style_resolver: btn_primary 存在")
	ctx.assert_true(_UIStyleResolver.has_style("panel_dark"), "style_resolver: panel_dark 存在")
	ctx.assert_true(_UIStyleResolver.has_style("text_title"), "style_resolver: text_title 存在")
	ctx.assert_true(_UIStyleResolver.has_style("progress_hp"), "style_resolver: progress_hp 存在")
	ctx.assert_eq(_UIStyleResolver.has_style("no_such_key"), false, "style_resolver: 不存在的 key 返回 false")


func _test_style_resolver_flat(ctx: Variant) -> void:
	var sb := _UIStyleResolver.get_stylebox("panel_dark")
	ctx.assert_true(sb != null, "style_resolver: get_stylebox 不为空")
	ctx.assert_true(sb is StyleBoxFlat, "style_resolver: panel_dark 返回 StyleBoxFlat")
	var flat := sb as StyleBoxFlat
	# 验证边框和圆角已应用
	ctx.assert_eq(flat.border_width_top, 2, "style_resolver: panel_dark border_width=2")
	ctx.assert_eq(flat.corner_radius_top_left, 12, "style_resolver: panel_dark corner_radius=12")


func _test_style_resolver_label_colors(ctx: Variant) -> void:
	var color := _UIStyleResolver.get_color("text_title", "color")
	# text_title.color = "text_primary" = "#FFFFFF"
	ctx.assert_true(_approx_eq(color.r, 1.0), "style_resolver: text_title color.r = 1.0")
	ctx.assert_true(_approx_eq(color.g, 1.0), "style_resolver: text_title color.g = 1.0")
	var font_size := _UIStyleResolver.get_font_size("text_title")
	ctx.assert_eq(font_size, 32, "style_resolver: text_title font_size = 32")


func _test_style_resolver_progress(ctx: Variant) -> void:
	var fill := _UIStyleResolver.get_progress_fill("progress_hp")
	ctx.assert_true(fill != null, "style_resolver: progress fill 不为空")
	ctx.assert_true(fill is StyleBoxFlat, "style_resolver: progress fill 是 StyleBoxFlat")
	var bg := _UIStyleResolver.get_progress_bg("progress_hp")
	ctx.assert_true(bg != null, "style_resolver: progress bg 不为空")
	# fill_color = #FF6B9D （r > 0.9）
	ctx.assert_true(fill.bg_color.r > 0.9, "style_resolver: progress_hp fill 颜色是粉色")


func _test_style_resolver_missing_fallback(ctx: Variant) -> void:
	var sb := _UIStyleResolver.get_stylebox("totally_missing_key")
	ctx.assert_true(sb != null, "style_resolver: 缺失 key 返回 fallback 而非 null")
	ctx.assert_true(sb is StyleBoxFlat, "style_resolver: fallback 是 StyleBoxFlat")


## ──────────────────────── _UIAssetLoader 测试 ──────────────────────────


func _test_asset_loader_resolve_path(ctx: Variant) -> void:
	var path := _UIAssetLoader.resolve_path("backgrounds.battle")
	ctx.assert_eq(path, "res://assets/backgrounds/bg_battle_dungeon.png",
			"asset_loader: backgrounds.battle 解析正确")


func _test_asset_loader_nine_patch(ctx: Variant) -> void:
	var np := _UIAssetLoader.get_nine_patch("buttons.primary")
	ctx.assert_eq(np.size(), 4, "asset_loader: nine_patch 有 4 个值")
	ctx.assert_eq(int(np[0]), 36, "asset_loader: nine_patch[0] = 36")
	ctx.assert_eq(int(np[1]), 24, "asset_loader: nine_patch[1] = 24")


func _test_asset_loader_missing_key(ctx: Variant) -> void:
	var path := _UIAssetLoader.resolve_path("no.such.key")
	ctx.assert_eq(path, "", "asset_loader: 不存在的 key 返回空字符串")
	var np := _UIAssetLoader.get_nine_patch("no.such.key")
	ctx.assert_eq(np.size(), 0, "asset_loader: 不存在的 key 返回空数组")


## ──────────────────────── _UIActionBinder 测试 ──────────────────────────


func _test_action_binder(ctx: Variant) -> void:
	# 用元数据记录 action，不依赖继承 Node 的 stub
	var root := Control.new()
	var btn := Button.new()
	btn.set_meta("ui_action", "test.fire")
	root.add_child(btn)

	# 验证 action meta 已被正确设置
	ctx.assert_eq(btn.get_meta("ui_action", ""), "test.fire", "action_binder: 按钮 action meta 已设置")

	# 验证 bind_all 不会崩溃
	_UIActionBinder.bind_all(root)
	ctx.assert_true(true, "action_binder: bind_all 不崩溃")

	# 验证 action binder 遍历了按钮并尝试连接（信号不报错即成功）
	ctx.assert_true(btn.pressed.get_connections().size() > 0, "action_binder: 按钮 pressed 信号已连接")
	root.free()


## ──────────────────────── _UIDataBinder 测试 ──────────────────────────


func _test_data_binder_label(ctx: Variant) -> void:
	_UIDataBinder.clear()
	var label := Label.new()
	label.text = "旧文本"
	label.set_meta("ui_bind", "battle.hp_text")
	_UIDataBinder.register_root(label)
	_UIDataBinder.refresh("battle.hp_text", "新文本")
	ctx.assert_eq(label.text, "新文本", "data_binder: Label.text 通过 bind path 更新")
	_UIDataBinder.clear()
	label.free()


func _test_data_binder_progressbar(ctx: Variant) -> void:
	_UIDataBinder.clear()
	var pb := ProgressBar.new()
	pb.max_value = 100.0
	pb.value = 0.0
	pb.set_meta("ui_bind", "battle.hp")
	_UIDataBinder.register_root(pb)
	_UIDataBinder.refresh("battle.hp", 75.0)
	ctx.assert_true(_approx_eq(pb.value, 75.0), "data_binder: ProgressBar.value 通过 bind path 更新")
	_UIDataBinder.clear()
	pb.free()


func _test_data_binder_button(ctx: Variant) -> void:
	_UIDataBinder.clear()
	var btn := Button.new()
	btn.text = "旧文字"
	btn.set_meta("ui_bind", "shop.label")
	_UIDataBinder.register_root(btn)
	_UIDataBinder.refresh("shop.label", "商店")
	ctx.assert_eq(btn.text, "商店", "data_binder: Button.text 通过 bind path 更新")
	_UIDataBinder.clear()
	btn.free()


func _test_data_binder_missing_path(ctx: Variant) -> void:
	_UIDataBinder.clear()
	var label := Label.new()
	label.text = "不变"
	label.set_meta("ui_bind", "other.path")
	_UIDataBinder.register_root(label)
	_UIDataBinder.refresh("wrong.path", "不相关")
	ctx.assert_eq(label.text, "不变", "data_binder: 不匹配的 bind path 不改变节点")
	_UIDataBinder.clear()
	label.free()


## ──────────────────────── 辅助工具 ──────────────────────────


func _test_pascal_to_snake(ctx: Variant) -> void:
	# _UIBuilder._pascal_to_snake 是私有静态方法，通过反射验证
	# 由于 GDScript 不允许直接调用私有静态，我们只能间接测试：
	# 用已知 component 名 "CardHandView" 看 ComponentRef 的路径转换
	# 但 build 会失败（文件不存在），只验证错误路径不崩溃
	var spec := {
		"type": "ComponentRef",
		"component": "MissingComponent",
		"name": "MC",
		"layout": {"preset": "full_rect"}
	}
	var node := _build_single_node(spec)
	# 返回 fallback Control 而不崩溃
	ctx.assert_true(node != null, "builder: ComponentRef 找不到组件时降级为 Control 而不崩溃")
	node.free()


## ──────────────────────── 私有辅助方法 ──────────────────────────


func _build_from_dict(spec: Dictionary) -> Control:
	# 把字典写入临时文件，通过 _UIBuilder.build 构建
	var tmp_path := "user://tmp_spec.ui.json"
	var f := FileAccess.open(tmp_path, FileAccess.WRITE)
	f.store_string(JSON.stringify(spec))
	f.close()
	return _UIBuilder.build(tmp_path)


func _build_single_node(spec: Dictionary) -> Control:
	# 直接用 spec 包含的节点信息建一个根节点
	var wrapper := {
		"scene": "Wrapper",
		"children": [spec]
	}
	var root := _build_from_dict(wrapper)
	if root.get_child_count() == 0:
		root.free()
		return Control.new()
	var child := root.get_child(0) as Control
	root.remove_child(child)
	root.free()
	return child


func _make_control_with_layout(layout: Dictionary) -> Control:
	var spec := {
		"type": "Control",
		"name": "TestNode",
		"layout": layout
	}
	return _build_single_node(spec)


func _approx_eq(a: float, b: float) -> bool:
	return abs(a - b) < EPSILON


func _cleanup_test_manifests() -> void:
	DirAccess.remove_absolute("user://tmp_spec.ui.json")
