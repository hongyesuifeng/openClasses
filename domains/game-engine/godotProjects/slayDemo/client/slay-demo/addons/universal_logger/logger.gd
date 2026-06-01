# Universal Logger for Godot
# AI 友好的通用日志系统

extends Node

# 预加载输出类
const LogOutputScript := preload("res://addons/universal_logger/outputs/log_output.gd")
const ConsoleOutputScript := preload("res://addons/universal_logger/outputs/console_output.gd")
const FileOutputScript := preload("res://addons/universal_logger/outputs/file_output.gd")

# 日志级别枚举
enum Level {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3
}

# 日志级别名称映射
const LEVEL_NAMES = {
	Level.DEBUG: "DEBUG",
	Level.INFO: "INFO",
	Level.WARN: "WARN",
	Level.ERROR: "ERROR"
}

# 信号定义
signal message_logged(level, module, message, data)

# 内部状态
var _outputs: Array = []
var _module_levels: Dictionary = {}
var _global_level: int = Level.INFO
var _config: LogConfig = null


func _ready() -> void:
	# 获取配置单例
	_config = get_node_or_null("/root/LogConfig")

	if _config:
		_config.config_changed.connect(_on_config_changed)
		_apply_config()

	# 初始化默认输出
	_setup_default_outputs()


# 核心日志方法
func write_log(level: int, module: String, message: String, data: Dictionary = {}) -> void:
	if not _should_log(level, module):
		return

	var log_entry = _create_log_entry(level, module, message, data)

	# 发射信号（向后兼容现有 UI）
	message_logged.emit(level, module, message, data)

	# 输出到所有已注册的输出
	_write_to_outputs(log_entry)


func debug(module: String, message: String, data: Dictionary = {}) -> void:
	write_log(Level.DEBUG, module, message, data)


func info(module: String, message: String, data: Dictionary = {}) -> void:
	write_log(Level.INFO, module, message, data)


func warn(module: String, message: String, data: Dictionary = {}) -> void:
	write_log(Level.WARN, module, message, data)


func error(module: String, message: String, data: Dictionary = {}) -> void:
	write_log(Level.ERROR, module, message, data)


# 业务便捷方法
func battle(message: String, data: Dictionary = {}) -> void:
	info("BATTLE", message, data)


func skill(message: String, data: Dictionary = {}) -> void:
	info("SKILL", message, data)


func ai(message: String, data: Dictionary = {}) -> void:
	info("AI", message, data)


func ui(message: String, data: Dictionary = {}) -> void:
	info("UI", message, data)


func lifecycle(message: String, data: Dictionary = {}) -> void:
	info("LIFECYCLE", message, data)


# 运行时控制
func set_level(module: String, level: int) -> void:
	_module_levels[module] = level


func enable_module(module: String, enabled: bool) -> void:
	if enabled:
		_module_levels.erase(module)
	else:
		_module_levels[module] = Level.ERROR + 1  # 禁用


func add_output(output: RefCounted) -> void:
	if output not in _outputs:
		_outputs.append(output)


func remove_output(output: RefCounted) -> void:
	_outputs.erase(output)


# 私有方法
func _should_log(level: int, module: String) -> bool:
	var effective_level = _get_effective_level(module)
	return level >= effective_level


func _get_effective_level(module: String) -> int:
	if module in _module_levels:
		return _module_levels[module]
	return _global_level


func _create_log_entry(level: int, module: String, message: String, data: Dictionary) -> Dictionary:
	var time := Time.get_unix_time_from_system()

	return {
		"ts": time,
		"level": LEVEL_NAMES[level],
		"module": module,
		"msg": message,
		"data": data
	}


func _setup_default_outputs() -> void:
	# 默认添加控制台输出（使用内联函数）
	# 默认添加文件输出
	_file_path = "res://.godot/game.log"
	_use_file_output = true


# 内联输出实现
var _file_path: String = ""
var _use_file_output: bool = false


func _write_to_outputs(log_entry: Dictionary) -> void:
	# 控制台输出
	var timestamp := _format_timestamp(log_entry["ts"])
	var line := "[%s] [%s] [%s] %s" % [
		timestamp,
		log_entry["level"],
		log_entry["module"],
		log_entry["msg"]
	]
	var data := log_entry.get("data", {})
	if not data.is_empty():
		line += " | " + str(data)
	print(line)

	# 文件输出
	if _use_file_output:
		_write_to_file(log_entry)


func _write_to_file(log_entry: Dictionary) -> void:
	var file := FileAccess.open(_file_path, FileAccess.READ_WRITE)
	if file == null:
		var dir := DirAccess.open("res://.godot")
		if not dir:
			DirAccess.make_dir_absolute("res://.godot")
		file = FileAccess.open(_file_path, FileAccess.WRITE)
		if file == null:
			return
	else:
		file.seek_end()

	# JSON 格式输出
	var json_str = JSON.stringify(log_entry)
	if json_str != null:
		file.store_line(json_str)
	file.close()


func _format_timestamp(unix_time: int) -> String:
	var datetime := Time.get_datetime_dict_from_unix_time(unix_time)
	return "%02d:%02d:%02d" % [datetime.hour, datetime.minute, datetime.second]


func _apply_config() -> void:
	if not _config:
		return

	_global_level = _config.get_global_level()
	_module_levels = _config.get_module_levels()

	# 重新配置输出
	_outputs.clear()
	for output_config in _config.get_output_configs():
		var output = _create_output_from_config(output_config)
		if output:
			add_output(output)


func _create_output_from_config(config: Dictionary) -> RefCounted:
	var type := config.get("type", "console")

	match type:
		"console":
			return ConsoleOutputScript.new()
		"file":
			var output := FileOutputScript.new()
			output.set_file_path(config.get("path", "res://.godot/game.log"))
			output.set_format(config.get("format", "json"))
			return output
		_:
			push_error("[Logger] Unknown output type: %s" % type)
			return null


func _on_config_changed() -> void:
	_apply_config()
