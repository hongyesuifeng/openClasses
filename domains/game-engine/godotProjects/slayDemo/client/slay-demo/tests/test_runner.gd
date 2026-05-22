extends Node

const TestContextScript := preload("res://tests/framework/test_context.gd")

const TEST_SCRIPTS := [
	preload("res://tests/unit/data_loader_test.gd"),
	preload("res://tests/unit/deck_runtime_test.gd"),
	preload("res://tests/unit/battle_rules_test.gd"),
	preload("res://tests/unit/reward_service_test.gd"),
	preload("res://tests/integration/v1_flow_test.gd")
]


func _ready() -> void:
	var context: Variant = TestContextScript.new()

	for test_script in TEST_SCRIPTS:
		var test: Variant = test_script.new()
		context.begin_test(test.name())
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
