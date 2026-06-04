extends RefCounted

const UILayoutStoreScript := preload("res://scripts/ui/ui_layout_store.gd")
const CardViewFactoryScript := preload("res://scripts/ui/card_view_factory.gd")
const RelicViewFactoryScript := preload("res://scripts/ui/relic_view_factory.gd")
const StatusViewFactoryScript := preload("res://scripts/ui/status_view_factory.gd")
const PotionViewFactoryScript := preload("res://scripts/ui/potion_view_factory.gd")
const UILayoutEditorScript := preload("res://scripts/dev/ui_layout_editor.gd")

const TEST_PATH := "user://ui_layout_store_test.json"


func name() -> String:
	return "UI layout store and factory IDs"


func run_async(ctx: Variant) -> void:
	UILayoutStoreScript.configure_storage(TEST_PATH, true)
	UILayoutStoreScript.set_override("sample", {
		"anchors": [0.1, 0.2, 0.5, 0.6],
		"offsets": [1.23456, 2, -3, -4],
		"min_size": [40, 30],
	})
	UILayoutStoreScript.set_override("sample", {"offsets": [9, 8, 7, 6]}, "instance-a")

	var merged := UILayoutStoreScript.get_layout("sample", "instance-a")
	ctx.assert_eq(merged["anchors"], [0.1, 0.2, 0.5, 0.6], "template fields survive instance merge")
	ctx.assert_eq(merged["offsets"], [9.0, 8.0, 7.0, 6.0], "instance override wins")

	var control := Control.new()
	UILayoutStoreScript.apply_layout(control, "sample", "instance-a")
	ctx.assert_true(is_equal_approx(control.anchor_left, 0.1), "anchor applies to Control")
	ctx.assert_eq(control.offset_left, 9.0, "offset applies to Control")
	ctx.assert_eq(control.custom_minimum_size, Vector2(40, 30), "minimum size applies to Control")
	ctx.assert_eq(control.get_meta("layout_element_id"), "sample", "layout ID metadata is set")
	ctx.assert_eq(UILayoutStoreScript.save(), OK, "layout saves")
	UILayoutStoreScript.reload_config()
	var reloaded := UILayoutStoreScript.get_layout("sample", "instance-a")
	ctx.assert_true(reloaded.has("offsets"), "saved layout reloads with offsets")
	ctx.assert_eq(reloaded.get("offsets", []), [9.0, 8.0, 7.0, 6.0], "saved instance values reload")
	control.free()

	var card := CardViewFactoryScript.create_card_button({"id": "strike", "name": "打击", "type": "attack"})
	ctx.assert_true(_has_layout_id(card, "card.root"), "card factory marks root")
	ctx.assert_true(_has_layout_id(card, "card.icon"), "card factory marks icon")
	ctx.assert_true(_has_layout_id(card, "card.description"), "card factory marks description")
	card.free()

	var relic := RelicViewFactoryScript.create_relic_button({"id": "anchor", "name": "锚", "rarity": "common"})
	ctx.assert_true(_has_layout_id(relic, "relic.root"), "relic factory marks root")
	ctx.assert_true(_has_layout_id(relic, "relic.icon"), "relic factory marks icon")
	relic.free()

	var status := StatusViewFactoryScript.create_status_label("strength", 2)
	ctx.assert_true(_has_layout_id(status, "status.root"), "status factory marks root")
	ctx.assert_true(_has_layout_id(status, "status.icon"), "status factory marks icon")
	status.free()

	var potion := PotionViewFactoryScript.create_potion_button({"id": "heal", "name": "治疗药水"})
	ctx.assert_true(_has_layout_id(potion, "potion.root"), "potion factory marks root")
	potion.free()

	var editor := UILayoutEditorScript.new()
	var source := CardViewFactoryScript.create_card_button({"id": "strike", "name": "打击", "type": "attack"})
	var tree := Engine.get_main_loop() as SceneTree
	tree.root.add_child.call_deferred(editor)
	await tree.process_frame
	editor.open(source)
	await tree.process_frame
	ctx.assert_true(editor.get_child_count() > 0, "layout editor builds its independent canvas")
	var preview_host := editor.get("_preview_host") as Control
	var interaction := editor.get("_interaction") as Control
	ctx.assert_true(preview_host.size.x >= 400 and preview_host.size.y >= 300, "layout editor exposes a visible canvas")
	ctx.assert_true(interaction.size.x >= 400 and interaction.size.y >= 300, "layout editor exposes an interactive canvas")
	var save_button := editor.find_child("ApplyAndSaveButton", true, false) as Button
	ctx.assert_true(save_button != null and save_button.is_visible_in_tree(), "layout editor keeps save button visible")
	source.free()
	editor.free()

	UILayoutStoreScript.restore_default_storage()
	UILayoutStoreScript.reload_config()


func _has_layout_id(root: Control, element_id: String) -> bool:
	if str(root.get_meta("layout_element_id", "")) == element_id:
		return true
	for child in root.get_children():
		if child is Control and _has_layout_id(child as Control, element_id):
			return true
	return false
