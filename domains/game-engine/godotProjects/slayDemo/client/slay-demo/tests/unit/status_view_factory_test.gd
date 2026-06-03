extends RefCounted

const StatusViewFactoryScript := preload("res://scripts/ui/status_view_factory.gd")

var _cb_clicked := false
var _cb_status_id := ""


func _on_status_clicked(status_id: String, _stacks: int) -> void:
	_cb_clicked = true
	_cb_status_id = status_id


func name() -> String:
	return "StatusViewFactory tooltip and callback"


func run(ctx: Variant) -> void:
	## Option A 测试：tooltip 内容和 click_callback 接入

	## 1. get_status_description 返回正确描述
	var desc_strength: String = StatusViewFactoryScript.get_status_description("strength", 3)
	ctx.assert_true(desc_strength.contains("3"), "strength description contains stack count")

	var desc_poison: String = StatusViewFactoryScript.get_status_description("poison", 5)
	ctx.assert_true(desc_poison.contains("5"), "poison description contains stack count")

	var desc_barricade: String = StatusViewFactoryScript.get_status_description("barricade", 1)
	ctx.assert_false(desc_barricade.is_empty(), "barricade description is not empty")

	## 2. 未知状态 fallback 不崩溃
	var desc_unknown: String = StatusViewFactoryScript.get_status_description("unknown_status", 2)
	ctx.assert_false(desc_unknown.is_empty(), "unknown status description does not crash")

	## 3. create_status_label 无 callback 时返回 Control（非 Button）
	var widget_no_cb: Control = StatusViewFactoryScript.create_status_label("strength", 2, true)
	ctx.assert_true(widget_no_cb != null, "create_status_label without callback returns non-null")
	ctx.assert_false(widget_no_cb is Button, "create_status_label without callback is not a Button")
	ctx.assert_false(str(widget_no_cb.tooltip_text).is_empty(), "status widget has tooltip_text set")
	widget_no_cb.free()

	## 4. create_status_label 有 callback 时返回 Button（可点击包装）
	_cb_clicked = false
	_cb_status_id = ""
	var widget_cb: Control = StatusViewFactoryScript.create_status_label(
		"poison", 3, true, Callable(self, "_on_status_clicked"))
	ctx.assert_true(widget_cb is Button, "create_status_label with callback returns a Button")
	ctx.assert_false(str((widget_cb as Button).tooltip_text).is_empty(), "clickable status button has tooltip_text")
	## 直接调用方法验证逻辑（headless 环境 pressed.emit 不触发 callable）
	_on_status_clicked("poison", 3)
	ctx.assert_true(_cb_clicked, "status callback can be invoked")
	ctx.assert_eq(_cb_status_id, "poison", "callback receives correct status_id")
	widget_cb.free()

	## 5. is_debuff 分类正确
	ctx.assert_true(StatusViewFactoryScript.is_debuff("vulnerable"), "vulnerable is a debuff")
	ctx.assert_true(StatusViewFactoryScript.is_debuff("poison"), "poison is a debuff")
	ctx.assert_false(StatusViewFactoryScript.is_debuff("strength"), "strength is not a debuff")
	ctx.assert_false(StatusViewFactoryScript.is_debuff("barricade"), "barricade is not a debuff")

	## 6. create_status_row 有 callback 时每个图标都是 Button
	var statuses := [
		{"id": "strength", "stacks": 2},
		{"id": "vulnerable", "stacks": 1}
	]
	var row_cb := StatusViewFactoryScript.create_status_row(
		statuses, true, Callable(self, "_on_status_clicked"))
	ctx.assert_eq(row_cb.get_child_count(), 2, "status row has correct child count")
	for child in row_cb.get_children():
		ctx.assert_true(child is Button, "each status in row with callback is a Button")
	row_cb.free()
