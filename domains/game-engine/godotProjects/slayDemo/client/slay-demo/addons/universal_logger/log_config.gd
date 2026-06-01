# LogConfig - 日志配置管理
# 支持运行时热加载配置

extends Node

# 信号定义
signal config_changed()

# 配置文件路径
const CONFIG_FILE_PATH = "res://.godot/logger_config.yaml"

# 日志级别常量（与 ULogger.Level 保持一致）
const DEBUG := 0
const INFO := 1
const WARN := 2
const ERROR := 3

# 内部状态
var _global_level: int = INFO
var _module_levels: Dictionary = {}
var _output_configs: Array = []

# 配置文件监视
var _config_file: FileAccess = null
var _config_modified_time: int = 0
var _check_timer: float = 0.0
var _check_interval: float = 1.0  # 每秒检查一次


func _ready() -> void:
	# 尝试加载配置
	_load_config()

	# 设置定时检查配置变化
	set_process(true)


func _process(delta: float) -> void:
	_check_timer += delta
	if _check_timer >= _check_interval:
		_check_timer = 0.0
		_check_config_changes()


# 公共方法
func get_global_level() -> int:
	return _global_level


func get_module_levels() -> Dictionary:
	return _module_levels.duplicate()


func get_output_configs() -> Array:
	return _output_configs.duplicate()


func set_global_level(level: int) -> void:
	_global_level = level
	config_changed.emit()


func set_module_level(module: String, level: int) -> void:
	_module_levels[module] = level
	config_changed.emit()


func reload() -> void:
	_load_config()
	config_changed.emit()


# 私有方法
func _load_config() -> void:
	# 如果配置文件不存在，使用默认配置
	if not FileAccess.file_exists(CONFIG_FILE_PATH):
		_apply_default_config()
		_save_default_config()
		return

	var file := FileAccess.open(CONFIG_FILE_PATH, FileAccess.READ)
	if file == null:
		push_error("[LogConfig] Failed to open config file: " + CONFIG_FILE_PATH)
		_apply_default_config()
		return

	var content := file.get_as_text()
	file.close()

	_parse_config(content)


func _parse_config(content: String) -> void:
	# 简单的 YAML 解析（Godot 没有内置 YAML 解析器）
	# 这里使用简化的解析逻辑，实际项目中可能需要专门的 YAML 库

	var lines := content.split("\n")
	var current_section := ""

	for line in lines:
		line = line.strip_edges()

		# 跳过空行和注释
		if line.is_empty() or line.begins_with("#"):
			continue

		# 解析全局级别
		if line.begins_with("global_level:"):
			var level_str := line.split(":")[1].strip_edges()
			_global_level = _parse_level(level_str)

		# 解析模块级别
		elif line.begins_with("modules:"):
			current_section = "modules"
		elif line.begins_with("outputs:"):
			current_section = "outputs"
		elif current_section == "modules":
			_parse_module_config(line)
		elif current_section == "outputs":
			_parse_output_config(line)


func _parse_level(level_str: String) -> int:
	match level_str.to_upper():
		"DEBUG":
			return DEBUG
		"INFO":
			return INFO
		"WARN":
			return WARN
		"ERROR":
			return ERROR
		_:
			return INFO


func _parse_module_config(line: String) -> void:
	# 格式:  battle: DEBUG
	var parts := line.split(":")
	if parts.size() >= 2:
		var module := parts[0].strip_edges()
		var level_str := parts[1].strip_edges()
		_module_levels[module] = _parse_level(level_str)


func _parse_output_config(line: String) -> void:
	# 格式:  - type: file
	#         path: .godot/game.log
	if line.begins_with("- type:"):
		var type := line.split(":")[1].strip_edges()
		_output_configs.append({"type": type})


func _apply_default_config() -> void:
	_global_level = INFO
	_module_levels = {
		"BATTLE": DEBUG,
		"SKILL": DEBUG,
		"AI": INFO,
		"UI": WARN,
		"LIFECYCLE": INFO
	}
	_output_configs = [
		{"type": "console"},
		{"type": "file", "path": "res://.godot/game.log", "format": "json"}
	]


func _save_default_config() -> void:
	var dir := DirAccess.open("res://.godot")
	if not dir:
		DirAccess.make_dir_absolute("res://.godot")

	var file := FileAccess.open(CONFIG_FILE_PATH, FileAccess.WRITE)
	if file:
		file.store_string("""# Universal Logger Configuration
# version: 1.0

# 全局日志级别
global_level: INFO

# 模块级别配置
modules:
  BATTLE: DEBUG
  SKILL: DEBUG
  AI: INFO
  UI: WARN
  LIFECYCLE: INFO

# 输出配置
outputs:
  - type: console
  - type: file
    path: .godot/game.log
    format: json
""")
		file.close()


func _check_config_changes() -> void:
	if not FileAccess.file_exists(CONFIG_FILE_PATH):
		return

	var modified_time := FileAccess.get_modified_time(CONFIG_FILE_PATH)
	if modified_time != _config_modified_time:
		_config_modified_time = modified_time
		_load_config()
		config_changed.emit()
		print("[LogConfig] Configuration reloaded.")
