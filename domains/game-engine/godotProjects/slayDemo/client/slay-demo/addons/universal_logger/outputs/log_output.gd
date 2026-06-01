# LogOutput - 日志输出接口基类
# 所有输出目标都需要继承此类

extends RefCounted
class_name ULLogOutput


# 写入日志
func write(log_entry: Dictionary) -> void:
	push_error("LogOutput.write() must be overridden by subclass")


# 刷新缓冲区（可选实现）
func flush() -> void:
	pass


# 关闭输出（可选实现）
func close() -> void:
	pass
