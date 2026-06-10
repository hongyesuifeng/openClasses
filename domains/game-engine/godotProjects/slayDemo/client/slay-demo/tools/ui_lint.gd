extends SceneTree

## ui_lint.gd — UI Spec 静态校验工具
## 用法：godot --headless --path <project> --script res://tools/ui_lint.gd
##
## 校验项：
##   ERROR — JSON 语法、节点类型合法、节点名唯一、style_key 存在、layout preset 合法
##           动态内容区域必须使用 ComponentRef 或空容器、visual.expected_node 存在
##   WARN  — asset_key 存在、action 已在 manifest.actions.json 声明、visual token 可解析
##   INFO  — visual.json / mock.json 是否配套

const SPECS_DIR         := "res://ui_specs"
const MANIFEST_STYLES   := "res://ui_manifest/manifest.styles.json"
const MANIFEST_ASSETS   := "res://ui_manifest/manifest.assets.json"
const MANIFEST_ACTIONS  := "res://ui_manifest/manifest.actions.json"
const DESIGN_SPECS_DIR  := "res://ui_design_specs"
const MOCK_DATA_DIR     := "res://ui_mock_data"
const DESIGN_RESOLUTION := Vector2i(1280, 720)

## UIBuilder 当前支持的节点类型白名单
const VALID_NODE_TYPES := [
	"Control", "Panel", "PanelContainer", "Label", "Button",
	"TextureRect", "HBoxContainer", "VBoxContainer", "ScrollContainer",
	"MarginContainer", "CenterContainer", "ProgressBar", "ComponentRef",
	"ColorRect",
]

## 动态内容规则：这些节点名如果有硬编码子节点，报 ERROR
## key = 节点名关键字（部分匹配），value = 说明
const DYNAMIC_CONTAINER_RULES := {
	"HandRow":         "手牌区",
	"EnemyRow":        "敌人区",
	"RelicRow":        "遗物栏",
	"PotionRow":       "药水栏",
	"PlayerStatusRow": "玩家状态栏",
	"CardList":        "卡牌列表",
	"ShopItemGrid":    "商店商品格",
	"ChoiceRow":       "选项行（事件/奖励等）",
	"DeckRow":         "牌组展示行",
}

const VALID_PRESETS := [
	"full_rect", "top_full", "bottom_full", "left_full", "right_full",
	"center", "top_left", "top_right", "top_center",
	"bottom_left", "bottom_right", "bottom_center",
	"left_center", "right_center", "absolute_rect", "raw_anchors",
]

## preset 必填字段
const PRESET_REQUIRED := {
	"top_full":     ["height"],
	"bottom_full":  ["height"],
	"left_full":    ["width"],
	"right_full":   ["width"],
	"center":       ["size"],
	"top_left":     ["size"],
	"top_right":    ["size"],
	"top_center":   ["size"],
	"bottom_left":  ["size"],
	"bottom_right": ["size"],
	"bottom_center":["size"],
	"left_center":  ["size"],
	"right_center": ["size"],
	"absolute_rect":["position", "size"],
}

var _styles_data: Dictionary = {}
var _assets_data: Dictionary = {}
var _actions_data: Dictionary = {}
var _total_errors := 0
var _total_warns  := 0
var _total_files  := 0
var _failed_files := 0


func _init() -> void:
	_load_manifests()
	var spec_files := _list_specs()

	print("\n[LINT] ══════════════════════════════════════")
	print("[LINT] UI Spec Lint — %d 个文件待校验" % spec_files.size())
	print("[LINT] ══════════════════════════════════════\n")

	for path in spec_files:
		_lint_spec(path)

	print("\n[LINT] ─────────────────────────────────────")
	if _total_errors == 0 and _total_warns == 0:
		print("[LINT] ✅ 全部通过 — %d 个文件，0 错误，0 警告" % _total_files)
	else:
		print("[LINT] 总计: %d 个文件，%s%d 错误%s，%s%d 警告%s" % [
			_total_files,
			"" if _total_errors == 0 else "",
			_total_errors,
			"",
			"" if _total_warns == 0 else "",
			_total_warns,
			""
		])
		if _failed_files > 0:
			print("[LINT] ❌ %d 个文件有 ERROR，需要修复后才能提交" % _failed_files)

	print("[LINT] ══════════════════════════════════════\n")
	quit(1 if _total_errors > 0 else 0)


## ── 加载所有 manifest ──────────────────────────────────────────

func _load_manifests() -> void:
	_styles_data = _read_json(MANIFEST_STYLES)
	_assets_data = _read_json(MANIFEST_ASSETS)
	_actions_data = _read_json(MANIFEST_ACTIONS)


## ── 列出所有 spec 文件 ─────────────────────────────────────────

func _list_specs() -> Array[String]:
	var result: Array[String] = []
	var da := DirAccess.open(SPECS_DIR)
	if da == null:
		push_error("[LINT] 找不到 ui_specs 目录: %s" % SPECS_DIR)
		return result
	da.list_dir_begin()
	var name := da.get_next()
	while not name.is_empty():
		if not da.current_is_dir() and name.ends_with(".ui.json"):
			result.append(SPECS_DIR.path_join(name))
		name = da.get_next()
	da.list_dir_end()
	result.sort()
	return result


## ── 校验单个 spec 文件 ─────────────────────────────────────────

func _lint_spec(spec_path: String) -> void:
	_total_files += 1
	var scene_name := spec_path.get_file().replace(".ui.json", "")
	var errors: Array[String] = []
	var warns:  Array[String] = []
	var infos:  Array[String] = []

	## 1. JSON 语法
	var spec := _read_json(spec_path)
	if spec.is_empty() and not FileAccess.file_exists(spec_path):
		errors.append("文件不存在: %s" % spec_path)
		_report(scene_name, spec_path, errors, warns, infos)
		return
	if spec.is_empty():
		errors.append("JSON 解析失败")
		_report(scene_name, spec_path, errors, warns, infos)
		return

	_check_design_resolution(spec, "ui_specs/%s.ui.json" % scene_name, errors)

	## 2. 遍历所有节点
	var node_names: Array[String] = []
	var all_nodes: Array[Dictionary] = []
	_collect_nodes(spec, all_nodes)

	for node in all_nodes:
		var nname: String = str(node.get("name", ""))
		var ntype: String = str(node.get("type", "Control"))

		## 节点类型合法
		if not VALID_NODE_TYPES.has(ntype):
			errors.append("节点类型不支持: '%s' (节点: %s)" % [ntype, nname])

		## 节点名唯一
		if not nname.is_empty():
			if node_names.has(nname):
				errors.append("节点名重复: '%s'" % nname)
			else:
				node_names.append(nname)

		## style_key 存在
		var style_key: String = str(node.get("style", ""))
		if not style_key.is_empty():
			if not _has_style_key(style_key):
				errors.append("style_key 未注册: '%s' (节点: %s)" % [style_key, nname])

		## asset_key 存在
		var asset_key: String = str(node.get("asset", ""))
		if not asset_key.is_empty():
			if not _has_asset_key(asset_key):
				warns.append("asset_key 不存在: '%s' (节点: %s)" % [asset_key, nname])

		## action 已声明
		var action: String = str(node.get("action", ""))
		if not action.is_empty():
			if not _has_action(action):
				warns.append("action 未在 manifest.actions.json 中声明: '%s' (节点: %s)" % [action, nname])

		## layout preset 合法 + 必填字段
		var layout: Dictionary = node.get("layout", {}) as Dictionary
		if not layout.is_empty():
			var preset: String = str(layout.get("preset", "full_rect"))
			if not VALID_PRESETS.has(preset):
				errors.append("layout.preset 不合法: '%s' (节点: %s)" % [preset, nname])
			elif PRESET_REQUIRED.has(preset):
				for required_field in (PRESET_REQUIRED[preset] as Array):
					if not layout.has(required_field):
						errors.append("layout 缺少必填字段 '%s'（preset=%s，节点: %s）" % [required_field, preset, nname])

		## 动态内容容器：禁止硬编码子节点
		for dyn_key in DYNAMIC_CONTAINER_RULES.keys():
			if nname.contains(dyn_key):
				var children: Array = node.get("children", []) as Array
				var has_data_children := false
				for child in children:
					var child_dict := child as Dictionary
					## ComponentRef 是合法的动态占位
					if str(child_dict.get("type", "")) != "ComponentRef":
						has_data_children = true
						break
				if has_data_children:
					errors.append(
						"动态容器 '%s'（%s）包含硬编码子节点，应使用 ComponentRef 或由 GDScript 动态填充" % [
							nname, DYNAMIC_CONTAINER_RULES[dyn_key]
						]
					)

	## 3. 配套文件检查（INFO 级）
	var visual_path := DESIGN_SPECS_DIR.path_join("%s.visual.json" % scene_name)
	var mock_path   := MOCK_DATA_DIR.path_join("%s.mock.json" % scene_name)
	if not FileAccess.file_exists(visual_path):
		infos.append("缺少配套 visual.json（%s）" % visual_path)
	else:
		_lint_visual(visual_path, node_names, errors, warns, infos)
	if not FileAccess.file_exists(mock_path):
		infos.append("缺少配套 mock.json（%s）" % mock_path)

	_report(scene_name, spec_path, errors, warns, infos)


## ── 输出结果 ───────────────────────────────────────────────────

func _report(scene_name: String, path: String, errors: Array[String], warns: Array[String], infos: Array[String]) -> void:
	_total_errors += errors.size()
	_total_warns  += warns.size()

	var node_count := 0
	var spec := _read_json(path)
	if not spec.is_empty():
		var nodes: Array[Dictionary] = []
		_collect_nodes(spec, nodes)
		node_count = nodes.size()

	if errors.is_empty() and warns.is_empty():
		print("[LINT] ✅ %s (%d 节点, 0 错误, 0 警告)" % [path.get_file(), node_count])
	else:
		_failed_files += 1 if not errors.is_empty() else 0
		var status := "❌" if not errors.is_empty() else "⚠️"
		print("[LINT] %s %s (%d 节点, %d 错误, %d 警告)" % [
			status, path.get_file(), node_count, errors.size(), warns.size()
		])
		for e in errors:
			print("       [ERROR] %s" % e)
		for w in warns:
			print("       [WARN]  %s" % w)
		for i in infos:
			print("       [INFO]  %s" % i)


## ── 递归收集所有节点 ────────────────────────────────────────────

func _collect_nodes(spec: Dictionary, result: Array[Dictionary]) -> void:
	if spec.has("background") and spec["background"] is Dictionary:
		result.append(spec["background"] as Dictionary)
		_collect_children(spec["background"] as Dictionary, result)
	for child in (spec.get("children", []) as Array):
		if child is Dictionary:
			result.append(child as Dictionary)
			_collect_children(child as Dictionary, result)


func _collect_children(node: Dictionary, result: Array[Dictionary]) -> void:
	for child in (node.get("children", []) as Array):
		if child is Dictionary:
			result.append(child as Dictionary)
			_collect_children(child as Dictionary, result)


## ── visual.json 对齐检查 ───────────────────────────────────────

func _lint_visual(
	visual_path: String,
	node_names: Array[String],
	errors: Array[String],
	warns: Array[String],
	infos: Array[String]
) -> void:
	var visual := _read_json(visual_path)
	if visual.is_empty():
		warns.append("visual.json 解析失败或为空: %s" % visual_path)
		return

	_check_design_resolution(visual, visual_path, errors)
	_check_target_image_size(visual, errors, warns)

	var elements: Array = visual.get("elements", []) as Array
	if elements.is_empty():
		warns.append("visual.json 缺少 elements: %s" % visual_path)
		return

	var element_ids: Array[String] = []
	for element in elements:
		if not (element is Dictionary):
			warns.append("visual.elements 包含非对象条目: %s" % visual_path)
			continue

		var elem := element as Dictionary
		var elem_id := str(elem.get("id", "<missing id>"))
		if elem_id == "<missing id>" or elem_id.is_empty():
			warns.append("visual element 缺少 id: %s" % visual_path)
		elif element_ids.has(elem_id):
			warns.append("visual element id 重复: '%s'" % elem_id)
		else:
			element_ids.append(elem_id)

		var expected_node := str(elem.get("expected_node", ""))
		if expected_node.is_empty():
			warns.append("visual element '%s' 缺少 expected_node" % elem_id)
		elif not node_names.has(expected_node):
			errors.append("visual.expected_node 不存在: '%s' (element: %s)" % [expected_node, elem_id])

		var type_hint := str(elem.get("type_hint", ""))
		if not type_hint.is_empty() and not VALID_NODE_TYPES.has(type_hint):
			errors.append("visual.type_hint 不支持: '%s' (element: %s)" % [type_hint, elem_id])

		var anchor_hint := str(elem.get("anchor_hint", ""))
		if not anchor_hint.is_empty() and not VALID_PRESETS.has(anchor_hint):
			errors.append("visual.anchor_hint 不合法: '%s' (element: %s)" % [anchor_hint, elem_id])

		var style_token := str(elem.get("style_token", ""))
		if not style_token.is_empty() and not _has_style_key(style_token):
			warns.append("visual.style_token 未注册: '%s' (element: %s)" % [style_token, elem_id])

		var asset_token := str(elem.get("asset_token", ""))
		if not asset_token.is_empty() and not _has_asset_key(asset_token):
			warns.append("visual.asset_token 不存在: '%s' (element: %s)" % [asset_token, elem_id])

		var action_hint := str(elem.get("action_hint", ""))
		if not action_hint.is_empty() and not _has_action(action_hint):
			warns.append("visual.action_hint 未声明: '%s' (element: %s)" % [action_hint, elem_id])

		if not elem.has("tolerance"):
			infos.append("visual element 缺少 tolerance: '%s'" % elem_id)
		if not elem.has("acceptance_weight"):
			infos.append("visual element 缺少 acceptance_weight: '%s'" % elem_id)


## ── manifest 查找辅助 ──────────────────────────────────────────

func _has_style_key(key: String) -> bool:
	var styles: Dictionary = _styles_data.get("styles", {}) as Dictionary
	return styles.has(key)


func _has_asset_key(key: String) -> bool:
	var parts := key.split(".")
	var node: Variant = _assets_data
	for part in parts:
		if node is Dictionary and (node as Dictionary).has(part):
			node = (node as Dictionary)[part]
		else:
			return false
	return true


func _has_action(action: String) -> bool:
	if _actions_data.is_empty():
		return true  ## actions manifest 不存在时跳过此项
	var domains: Dictionary = _actions_data.get("domains", {}) as Dictionary
	for domain_key in domains.keys():
		var domain := domains[domain_key] as Dictionary
		var actions := domain.get("actions", {}) as Dictionary
		if actions.has(action):
			return true
	return false


func _check_design_resolution(data: Dictionary, label: String, errors: Array[String]) -> void:
	var value: Array = data.get("design_resolution", []) as Array
	if value.size() < 2:
		errors.append("%s 缺少 design_resolution，应为 [1280, 720]" % label)
		return
	var width := int(value[0])
	var height := int(value[1])
	if width != DESIGN_RESOLUTION.x or height != DESIGN_RESOLUTION.y:
		errors.append("%s design_resolution 应为 [%d, %d]，当前为 [%d, %d]" % [
			label, DESIGN_RESOLUTION.x, DESIGN_RESOLUTION.y, width, height
		])


func _check_target_image_size(visual: Dictionary, errors: Array[String], warns: Array[String]) -> void:
	var target_image := str(visual.get("target_image", ""))
	if target_image.is_empty():
		return
	if not FileAccess.file_exists(target_image):
		warns.append("target_image 不存在: %s" % target_image)
		return
	var image := Image.new()
	var err := image.load(target_image)
	if err != OK:
		warns.append("target_image 无法读取: %s (err=%d)" % [target_image, err])
		return
	var size := image.get_size()
	if size != DESIGN_RESOLUTION:
		errors.append("target_image 尺寸应为 %dx%d，当前为 %dx%d: %s" % [
			DESIGN_RESOLUTION.x, DESIGN_RESOLUTION.y, size.x, size.y, target_image
		])


## ── JSON 读取工具 ───────────────────────────────────────────────

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return {}
	var json := JSON.new()
	var err := json.parse(f.get_as_text())
	f.close()
	if err != OK:
		push_warning("ui_lint: JSON 解析失败 '%s' (行 %d: %s)" % [
			path, json.get_error_line(), json.get_error_message()
		])
		return {}
	if json.data is Dictionary:
		return json.data as Dictionary
	return {}
