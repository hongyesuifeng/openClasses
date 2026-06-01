# FileOutput - 文件输出（AI 可解析的 JSON 格式）
# 将日志写入文件，支持 JSON 格式

extends RefCounted
class_name ULFileOutput

var _file_path: String = "res://.godot/game.log"
var _format: String = "json"  # json 或 text


func set_file_path(path: String) -> void:
	_file_path = path


func set_format(format: String) -> void:
	_format = format


func write(log_entry: Dictionary) -> void:
	var file := FileAccess.open(_file_path, FileAccess.READ_WRITE)

	if file == null:
		# 文件不存在，尝试创建
		var dir := DirAccess.open("res://.godot")
		if not dir:
			DirAccess.make_dir_absolute("res://.godot")

		file = FileAccess.open(_file_path, FileAccess.WRITE)
		if file == null:
			push_error("[FileOutput] Failed to create log file: " + _file_path)
			return
	else:
		file.seek_end()

	match _format:
		"json":
			_write_json_line(file, log_entry)
		"text":
			_write_text_line(file, log_entry)
		_:
			_write_text_line(file, log_entry)

	file.close()


func _write_json_line(file: FileAccess, log_entry: Dictionary) -> void:
	var json := JSON.new()
	var result = json.stringify(log_entry)
	if result == 0:  # OK = 0
		file.store_line(json.get_data())
	else:
		# JSON 序列化失败，降级为文本
		_write_text_line(file, log_entry)


func _write_text_line(file: FileAccess, log_entry: Dictionary) -> void:
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

	file.store_line(line)


func _format_timestamp(unix_time: int) -> String:
	var datetime := Time.get_datetime_dict_from_unix_time(unix_time)
	return "%02d:%02d:%02d" % [datetime.hour, datetime.minute, datetime.second]
