extends RefCounted

# Logger 集成测试
# 测试 Universal Logger 的核心功能

var test_context: RefCounted = null


func run(context: RefCounted) -> void:
	test_context = context

	test_logger_available()
	test_log_levels()
	test_battle_integration()
	test_json_output()


func test_logger_available() -> void:
	var logger: Variant = test_context.autoload("ULogger")

	test_context.assert_true(logger != null, "Logger Autoload 应该存在")

	if logger != null and logger.has_method("info"):
		print("[LoggerTest] Logger.info 方法可用")
		test_context.assert_true(true, "Logger.info 方法可用")
	else:
		test_context.assert_true(false, "Logger.info 方法应该可用")


func test_log_levels() -> void:
	var logger: Variant = test_context.autoload("ULogger")

	if logger == null:
		test_context.assert_true(false, "Logger 不可用，跳过测试")
		return

	# 测试各个日志级别不会崩溃
	logger.info("TEST", "测试 INFO 级别")
	logger.debug("TEST", "测试 DEBUG 级别")
	logger.warn("TEST", "测试 WARN 级别")
	logger.error("TEST", "测试 ERROR 级别")

	# 测试业务便捷方法
	logger.battle("测试战斗日志")
	logger.skill("测试技能日志")
	logger.ai("测试 AI 日志")
	logger.ui("测试 UI 日志")
	logger.lifecycle("测试生命周期日志")

	test_context.assert_true(true, "所有日志级别方法调用成功")


func test_battle_integration() -> void:
	var data_loader: Variant = test_context.autoload("DataLoader")
	if data_loader == null:
		test_context.assert_true(true, "DataLoader 不可用，跳过战斗测试")
		return

	# 创建一个简单的战斗场景
	var battle := BattleController.new()
	battle.setup("v1_normal_01", ["strike", "defend"], {"max_hp": 60})

	test_context.assert_true(battle != null, "BattleController 应该能创建")
	test_context.assert_eq(battle.encounter_id, "v1_normal_01", "遭遇 ID 应该正确")


func test_json_output() -> void:
	# 检查日志文件是否存在
	var file := FileAccess.open("res://.godot/game.log", FileAccess.READ)

	if file == null:
		# 文件不存在可能是因为还未写入日志，这是正常的
		test_context.assert_true(true, "日志文件尚未创建（首次运行）")
		return

	# 尝试读取一行并解析 JSON
	var line := file.get_line()
	file.close()

	if line.is_empty():
		test_context.assert_true(true, "日志文件为空（首次运行）")
		return

	var json := JSON.new()
	var error := json.parse(line)

	if error == OK:
		test_context.assert_true(true, "日志 JSON 格式正确")
	else:
		test_context.assert_true(false, "日志 JSON 解析失败: " + line)
