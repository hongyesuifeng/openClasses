# ConsoleOutput - 控制台输出（人类可读）
# 将日志输出到 Godot 控制台

extends RefCounted
class_name ULConsoleOutput


func write(log_entry: Dictionary) -> void:
	var timestamp := _format_timestamp(log_entry["ts"])
	var level: String = log_entry["level"]
	var module: String = log_entry["module"]
	var message: String = log_entry["msg"]
	var data := log_entry.get("data", {})

	var output := "[%s] [%s] [%s] %s" % [timestamp, level, module, message]

	if not data.is_empty():
		output += " | " + str(data)

	print(output)


func _format_timestamp(unix_time: int) -> String:
	var datetime := Time.get_datetime_dict_from_unix_time(unix_time)
	return "%02d:%02d:%02d" % [datetime.hour, datetime.minute, datetime.second]
