# IndexErrorPattern - 数组越界错误模式识别器
# 识别 "Invalid get index", "Index out of bounds" 等错误

extends PatternMatcher
class_name IndexErrorPattern

const PATTERN_NAME := "index_out_of_bounds"
const SEVERITY := "ERROR"

const ERROR_PATTERNS := [
	"Invalid get index",
	"Index out of bounds",
	"index out of range"
]


func analyze(log_entry: Dictionary) -> Dictionary:
	var message := log_entry.get("msg", "")
	var level := log_entry.get("level", "")
	var data := log_entry.get("data", {})

	if level != "ERROR":
		return {"matched": false, "pattern": PATTERN_NAME, "context": {}}

	var matched := false
	var context := {}

	for pattern in ERROR_PATTERNS:
		if pattern.to_lower() in message.to_lower():
			matched = true
			context["error_message"] = message
			_extract_context(message, data, context)
			break

	return {
		"matched": matched,
		"pattern": PATTERN_NAME,
		"context": context
	}


func suggest_fix(context: Dictionary) -> Dictionary:
	var reason := "检测到数组越界错误：尝试访问超出数组范围的索引"
	var fix := ""

	if "index" in context and "array_size" in context:
		var idx: int = context["index"]
		var size: int = context["array_size"]
		fix = "数组大小为 %d，但尝试访问索引 %d。\n\n修复方案：\n" % [size, idx]
		fix += "# 方案 1：检查索引范围\n"
		fix += "if index >= 0 and index < array.size():\n"
		fix += "    value = array[index]\n\n"
		fix += "# 方案 2：限制索引在有效范围内\n"
		fix += "var safe_index = clamp(index, 0, array.size() - 1)\n"
		fix += "value = array[safe_index]\n"
	elif "index" in context:
		fix = "尝试访问索引 %d，但数组可能不够大。\n\n" % context["index"]
		fix += "修复方案：\n"
		fix += "if array.size() > index:\n"
		fix += "    value = array[index]\n"
	else:
		fix = "数组越界错误。建议：\n"
		fix += "1. 检查数组大小：array.size()\n"
		fix += "2. 验证索引范围：index >= 0 and index < array.size()\n"

	return {
		"severity": SEVERITY,
		"reason": reason,
		"fix": fix
	}


func _extract_context(message: String, data: Dictionary, context: Dictionary) -> void:
	# 尝试提取索引值
	var regex := RegEx.new()
	regex.compile("get index \\(?(-?\\d+)\\)?")
	var result := regex.search(message)
	if result:
		context["index"] = result.get_string(1).to_int()

	# 尝试提取数组大小
	regex.compile("on base: 'Array' \\(size (\\d+)\\)")
	result = regex.search(message)
	if result:
		context["array_size"] = result.get_string(1).to_int()

	# 从 data 中提取更多信息
	if "file" in data:
		context["file"] = data["file"]
	if "line" in data:
		context["line"] = data["line"]
