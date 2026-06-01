# NullRefPattern - 空引用错误模式识别器
# 识别 "Invalid get index on base: null object" 等错误

extends PatternMatcher
class_name NullRefPattern

const PATTERN_NAME := "null_reference"
const SEVERITY := "ERROR"

# 空引用错误的关键词
const ERROR_PATTERNS := [
	"Invalid get index",
	"on base: 'null object'",
	"Attempt to call function",
	"on base: null object",
	"null value"
]


func analyze(log_entry: Dictionary) -> Dictionary:
	var message := log_entry.get("msg", "")
	var level := log_entry.get("level", "")
	var data := log_entry.get("data", {})

	# 只分析 ERROR 级别的日志
	if level != "ERROR":
		return {"matched": false, "pattern": PATTERN_NAME, "context": {}}

	# 检查是否包含空引用关键词
	var matched := false
	var context := {}

	for pattern in ERROR_PATTERNS:
		if pattern.to_lower() in message.to_lower():
			matched = true
			context["error_message"] = message
			context["pattern_found"] = pattern

			# 尝试提取更多信息
			_extract_context(message, data, context)
			break

	return {
		"matched": matched,
		"pattern": PATTERN_NAME,
		"context": context
	}


func suggest_fix(context: Dictionary) -> Dictionary:
	var reason := "检测到空引用错误：尝试访问 null 对象的属性或方法"
	var fix := ""

	if "property" in context:
		fix = "在访问 '%s' 前检查对象是否为 null：\n" % context["property"]
		fix += "if object != null:\n    # 安全访问 object.%s\n" % context["property"]
	elif "method" in context:
		fix = "在调用 '%s()' 前检查对象是否为 null：\n" % context["method"]
		fix += "if object != null:\n    object.%s()\n" % context["method"]
	else:
		fix = "在使用对象前检查是否为 null：\n"
		fix += "if object != null and is_instance_valid(object):\n    # 安全使用对象\n"

	return {
		"severity": SEVERITY,
		"reason": reason,
		"fix": fix
	}


func _extract_context(message: String, data: Dictionary, context: Dictionary) -> void:
	# 尝试提取属性名
	if "get index" in message:
		var regex := RegEx.new()
		regex.compile("Invalid get index '([^']+)'")
		var result := regex.search(message)
		if result:
			context["property"] = result.get_string(1)

	# 尝试提取方法名
	if "call function" in message:
		var regex := RegEx.new()
		regex.compile("call function '([^']+)'")
		var result := regex.search(message)
		if result:
			context["method"] = result.get_string(1)

	# 从 data 中提取更多信息
	if "file" in data:
		context["file"] = data["file"]
	if "line" in data:
		context["line"] = data["line"]
