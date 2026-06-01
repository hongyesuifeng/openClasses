# SignalDisconnectPattern - 信号断连错误模式识别器
# 识别信号未连接或已释放对象的错误

extends PatternMatcher
class_name SignalDisconnectPattern

const PATTERN_NAME := "signal_disconnect"
const SEVERITY := "WARN"

const ERROR_PATTERNS := [
	"signal not found",
	"cannot connect signal",
	"object was freed",
	"attempting to function",
	"was already freed"
]


func analyze(log_entry: Dictionary) -> Dictionary:
	var message := log_entry.get("msg", "")
	var level := log_entry.get("level", "")
	var data := log_entry.get("data", {})

	# 分析 WARN 或 ERROR 级别
	if level not in ["WARN", "ERROR"]:
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
	var reason := "检测到信号连接问题：可能是因为信号未正确连接或对象已被释放"
	var fix := ""

	if "object" in context:
		fix = "对象 '%s' 可能已被释放。\n\n" % context["object"]
		fix += "修复方案：\n"
		fix += "# 1. 检查对象是否有效\n"
		fix += "if is_instance_valid(object):\n"
		fix += "    object.signal_name.connect(_on_handler)\n\n"
		fix += "# 2. 使用 weak 引用避免循环引用\n"
		fix += "object.signal_name.connect(_on_handler, CONNECT_DEFERRED)\n"
	elif "signal" in context:
		fix = "信号 '%s' 可能未在 _ready() 中正确连接。\n\n" % context["signal"]
		fix += "修复方案：\n"
		fix += "# 在 _ready() 中连接信号\n"
		fix += "func _ready():\n"
		fix += "    emitter.signal_name.connect(_on_signal)\n\n"
		fix += "# 确保在对象释放时断开信号\n"
		fix += "func _exit_tree():\n"
		fix += "    emitter.signal_name.disconnect(_on_signal)\n"
	else:
		fix = "信号连接问题建议：\n"
		fix += "1. 在 _ready() 中连接信号，而不是 _init()\n"
		fix += "2. 使用 is_instance_valid() 检查对象有效性\n"
		fix += "3. 在 _exit_tree() 或 cleanup() 中断开信号\n"

	return {
		"severity": SEVERITY,
		"reason": reason,
		"fix": fix
	}


func _extract_context(message: String, data: Dictionary, context: Dictionary) -> void:
	# 尝试提取信号名
	var regex := RegEx.new()
	regex.compile("signal '?([^':]+)'?")
	var result := regex.search(message)
	if result:
		context["signal"] = result.get_string(1)

	# 尝试提取对象名
	regex.compile("on base: '([^']+)'")
	result = regex.search(message)
	if result:
		context["object"] = result.get_string(1)

	# 从 data 中提取更多信息
	if "file" in data:
		context["file"] = data["file"]
	if "line" in data:
		context["line"] = data["line"]
