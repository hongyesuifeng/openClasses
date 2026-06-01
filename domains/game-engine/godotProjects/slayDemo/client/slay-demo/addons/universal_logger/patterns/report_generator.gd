# ReportGenerator - 日志分析和修复报告生成器
# 整合所有模式识别器，生成 Agent 可读的修复报告

extends Node
class_name ReportGenerator

# 内置模式识别器
var _pattern_matchers: Array = []

# 分析结果缓存
var _error_counts: Dictionary = {}
var _error_details: Array = []
var _first_seen: Dictionary = {}


func _ready() -> void:
	# 注册内置模式识别器
	_register_default_matchers()


func _register_default_matchers() -> void:
	_pattern_matchers.append(NullRefPattern.new())
	_pattern_matchers.append(IndexErrorPattern.new())
	_pattern_matchers.append(SignalDisconnectPattern.new())


# 分析单条日志
func analyze_log(log_entry: Dictionary) -> void:
	for matcher in _pattern_matchers:
		var result: Dictionary = matcher.analyze(log_entry)

		if result["matched"]:
			var pattern_name: String = result["pattern"]
			var context: Dictionary = result["context"]

			# 统计错误次数
			_error_counts[pattern_name] = _error_counts.get(pattern_name, 0) + 1

			# 记录首次出现时间
			if pattern_name not in _first_seen:
				_first_seen[pattern_name] = log_entry.get("ts", 0)

			# 记录详细信息
			_error_details.append({
				"pattern": pattern_name,
				"timestamp": log_entry.get("ts", 0),
				"level": log_entry.get("level", ""),
				"message": log_entry.get("msg", ""),
				"context": context
			})


# 生成分析报告
func generate_report() -> Dictionary:
	var errors := []

	# 按模式分组错误
	var grouped := {}
	for detail in _error_details:
		var pattern: String = detail["pattern"]
		if pattern not in grouped:
			grouped[pattern] = []
		grouped[pattern].append(detail)

	# 为每个模式生成详细信息
	for pattern in grouped:
		var details: Array = grouped[pattern]
		var matcher := _get_matcher_for_pattern(pattern)
		var suggestion := {}

		if matcher:
			# 使用第一个错误的上下文生成建议
			suggestion = matcher.suggest_fix(details[0]["context"])

		errors.append({
			"pattern": pattern,
			"count": details.size(),
			"severity": suggestion.get("severity", "UNKNOWN"),
			"first_seen": _first_seen.get(pattern, 0),
			"reason": suggestion.get("reason", ""),
			"fix": suggestion.get("fix", ""),
			"samples": _get_samples(details, 3)  # 最多 3 个样本
		})

	return {
		"generated_at": Time.get_unix_time_from_system(),
		"total_errors": _error_details.size(),
		"summary": _create_summary(errors),
		"errors": errors
	}


# 创建摘要
func _create_summary(errors: Array) -> Array:
	var summary := []

	for error in errors:
		summary.append({
			"pattern": error["pattern"],
			"count": error["count"],
			"severity": error["severity"],
			"first_seen": error["first_seen"]
		})

	return summary


# 获取错误样本
func _get_samples(details: Array, max_count: int) -> Array:
	var samples := []

	for i in range(min(details.size(), max_count)):
		var detail: Dictionary = details[i]
		samples.append({
			"timestamp": detail["timestamp"],
			"message": detail["message"],
			"context": detail["context"]
		})

	return samples


# 获取模式对应的匹配器
func _get_matcher_for_pattern(pattern_name: String) -> PatternMatcher:
	for matcher in _pattern_matchers:
		if matcher.has_method("analyze"):
			var test_result = {"matched": true, "pattern": pattern_name}
			# 简单检查：如果匹配器能识别这个模式名称
			return matcher
	return null


# 保存报告到文件
func save_report(path: String = "res://.godot/analysis_report.json") -> void:
	var report := generate_report()

	var file := FileAccess.open(path, FileAccess.WRITE)
	if file:
		var json := JSON.new()
		var result = json.stringify(report)
		if result == 0:  # OK = 0
			file.store_string(json.get_data())
			print("[ReportGenerator] Report saved to: " + path)
		else:
			push_error("[ReportGenerator] Failed to serialize report")
		file.close()
	else:
		push_error("[ReportGenerator] Failed to open file for writing: " + path)


# 清除缓存数据
func clear() -> void:
	_error_counts.clear()
	_error_details.clear()
	_first_seen.clear()


# 获取当前统计
func get_stats() -> Dictionary:
	return {
		"total_errors": _error_details.size(),
		"error_patterns": _error_counts.size(),
		"most_common": _get_most_common_pattern()
	}


func _get_most_common_pattern() -> String:
	var max_count := 0
	var most_common := ""

	for pattern in _error_counts:
		if _error_counts[pattern] > max_count:
			max_count = _error_counts[pattern]
			most_common = pattern

	return most_common
