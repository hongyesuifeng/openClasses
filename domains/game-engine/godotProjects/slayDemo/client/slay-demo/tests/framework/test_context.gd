extends RefCounted

var assertion_count := 0
var failure_count := 0
var failures: Array[String] = []
var current_test := ""


func begin_test(test_name: String) -> void:
	current_test = test_name
	print("[TEST] %s" % test_name)


func assert_true(condition: bool, message: String) -> void:
	assertion_count += 1
	if condition:
		return
	_record_failure(message)


func assert_false(condition: bool, message: String) -> void:
	assert_true(not condition, message)


func assert_eq(actual: Variant, expected: Variant, message: String) -> void:
	assertion_count += 1
	if actual == expected:
		return
	_record_failure("%s | expected=%s actual=%s" % [message, str(expected), str(actual)])


func assert_gt(actual: int, expected_min: int, message: String) -> void:
	assertion_count += 1
	if actual > expected_min:
		return
	_record_failure("%s | expected > %d actual=%d" % [message, expected_min, actual])


func fail(message: String) -> void:
	assertion_count += 1
	_record_failure(message)


func autoload(name: String) -> Variant:
	var tree := Engine.get_main_loop() as SceneTree
	if tree == null:
		return null
	return tree.root.get_node_or_null(name)


func _record_failure(message: String) -> void:
	failure_count += 1
	failures.append("%s: %s" % [current_test, message])
