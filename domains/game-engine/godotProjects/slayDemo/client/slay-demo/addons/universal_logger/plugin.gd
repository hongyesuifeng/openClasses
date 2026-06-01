@tool
extends EditorPlugin

# Universal Logger for Godot
# AI 友好的通用日志系统插件

const LOGGER_AUTOLOAD_NAME = "ULogger"
const CONFIG_AUTOLOAD_NAME = "LogConfig"

func _enter_tree() -> void:
	# 注册 Logger 为 Autoload 单例
	add_autoload_singleton(LOGGER_AUTOLOAD_NAME, "res://addons/universal_logger/logger.gd")

	# 注册 LogConfig 为 Autoload 单例
	add_autoload_singleton(CONFIG_AUTOLOAD_NAME, "res://addons/universal_logger/log_config.gd")

	print("[UniversalLogger] Plugin enabled. Logger and LogConfig registered as Autoloads.")


func _exit_tree() -> void:
	# 移除 Autoload 单例
	remove_autoload_singleton(LOGGER_AUTOLOAD_NAME)
	remove_autoload_singleton(CONFIG_AUTOLOAD_NAME)

	print("[UniversalLogger] Plugin disabled. Logger and LogConfig unregistered.")
