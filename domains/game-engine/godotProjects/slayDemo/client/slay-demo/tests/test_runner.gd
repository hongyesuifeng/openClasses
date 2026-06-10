extends Node

const TestContextScript := preload("res://tests/framework/test_context.gd")

const TEST_SCRIPTS := [
	preload("res://tests/unit/compile_check_test.gd"),
	preload("res://tests/unit/audio_manager_test.gd"),
	preload("res://tests/unit/data_loader_test.gd"),
	preload("res://tests/unit/deck_runtime_test.gd"),
	preload("res://tests/unit/status_manager_test.gd"),
	preload("res://tests/unit/status_view_factory_test.gd"),
	preload("res://tests/unit/ui_layout_store_test.gd"),
	preload("res://tests/unit/battle_rules_test.gd"),
	preload("res://tests/unit/map_generator_test.gd"),
	preload("res://tests/unit/reward_service_test.gd"),
	preload("res://tests/unit/shop_service_test.gd"),
	preload("res://tests/unit/save_service_test.gd"),
	preload("res://tests/unit/potion_service_test.gd"),
	preload("res://tests/unit/content_expansion_test.gd"),
	preload("res://tests/unit/p3_features_test.gd"),
	preload("res://tests/unit/ui_builder_test.gd"),
	preload("res://tests/integration/v1_flow_test.gd"),
	preload("res://tests/integration/v2_content_flow_test.gd"),
	preload("res://tests/integration/map_route_test.gd"),
	preload("res://tests/integration/rest_node_test.gd"),
	preload("res://tests/integration/relic_ui_test.gd"),
	preload("res://tests/integration/event_node_test.gd"),
	preload("res://tests/integration/potion_reward_flow_test.gd"),
	preload("res://tests/integration/result_scene_test.gd"),
	preload("res://tests/integration/map_path_lines_test.gd"),
	preload("res://tests/integration/ui_spec_integration_test.gd"),
	preload("res://tests/integration/ui_scene_spec_override_test.gd"),
]


func _ready() -> void:
	var context: Variant = TestContextScript.new()

	for test_script in TEST_SCRIPTS:
		var test: Variant = test_script.new()
		context.begin_test(test.name())
		if test.has_method("run_async"):
			await test.run_async(context)
		else:
			test.run(context)

	print("")
	print("Assertions: %d" % int(context.assertion_count))
	print("Failures: %d" % int(context.failure_count))

	if int(context.failure_count) > 0:
		for failure in context.failures:
			printerr("[FAIL] %s" % failure)
		get_tree().quit(1)
		return

	print("All tests passed.")
	get_tree().quit(0)
