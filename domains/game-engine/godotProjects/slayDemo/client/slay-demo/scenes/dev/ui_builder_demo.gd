extends Control

## UIBuilder 框架视觉验证场景
## 运行后观察屏幕上的布局是否符合预期，用于验证框架可视效果

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")

const DEMO_SPEC_PATH := "res://ui_specs/demo.ui.json"


func _ready() -> void:
	var ui := _UIBuilder.build(DEMO_SPEC_PATH)
	ui.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(ui)

	_add_verification_overlay()


func _add_verification_overlay() -> void:
	# 在右下角显示验收清单，方便对照观察
	var panel := Panel.new()
	panel.anchor_left   = 1.0
	panel.anchor_top    = 0.0
	panel.anchor_right  = 1.0
	panel.anchor_bottom = 0.0
	panel.offset_left   = -360
	panel.offset_top    = 80
	panel.offset_right  = -8
	panel.offset_bottom = 380
	add_child(panel)

	var label := Label.new()
	label.set_anchors_preset(Control.PRESET_FULL_RECT)
	label.offset_left   = 12
	label.offset_top    = 12
	label.offset_right  = -12
	label.offset_bottom = -12
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.text = """UIBuilder 框架验收清单

[ ] 背景 panel_dark 铺满屏幕
[ ] TopBar 高度约 72px，贴顶
[ ] "UI 框架 Demo" 文字在 TopBar 内居中
[ ] CenterContent 区域在屏幕中央
[ ] "主要按钮" 在底部居中，距底约 40px
[ ] "次要按钮" 在右下角，距右/底各 40px
[ ] 点击按钮查看控制台是否有 "找不到 handle_action" 警告
    （正常现象，说明 action 绑定工作了）

修改 manifest.styles.json 中
panel_dark.bg_color 重启后是否变色
→ 说明样式与代码解耦成功"""
	panel.add_child(label)


func handle_action(action_name: String, _source: Node) -> void:
	print("[UIBuilder Demo] action 触发: ", action_name)
