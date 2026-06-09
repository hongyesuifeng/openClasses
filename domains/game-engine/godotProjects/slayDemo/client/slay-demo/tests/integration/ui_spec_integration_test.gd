extends RefCounted

## UIBuilder 场景迁移集成测试
## 验证所有场景的 ui_specs/*.ui.json 能被 UIBuilder 正确解析，生成预期节点树

const _UIBuilder := preload("res://addons/ui_builder/ui_builder.gd")

# 场景规格路径
const SPECS := {
	"main_menu": "res://ui_specs/main_menu.ui.json",
	"chest":     "res://ui_specs/chest.ui.json",
	"rest":      "res://ui_specs/rest.ui.json",
	"result":    "res://ui_specs/result.ui.json",
	"event":     "res://ui_specs/event.ui.json",
	"shop":      "res://ui_specs/shop.ui.json",
	"reward":    "res://ui_specs/reward.ui.json",
	"map":       "res://ui_specs/map.ui.json",
	"battle":    "res://ui_specs/battle.ui.json",
	"demo":      "res://ui_specs/demo.ui.json",
}

# 每个 spec 必须存在的关键节点名
const REQUIRED_NODES := {
	"main_menu": ["Background", "Sidebar", "TopRight", "CenterPanel",
				  "TitleLabel", "SubtitleLabel", "ButtonContainer", "StartButton", "ContinueButton"],
	"chest":     ["Background", "Root", "TitleLabel", "StatusLabel", "OpenButton"],
	"rest":      ["Background", "Root", "TitleLabel", "StatusLabel", "ChoiceRow"],
	"result":    ["Background", "Scroll", "Root", "TitleLabel", "ButtonRow", "RestartButton", "MenuButton"],
	"event":     ["Background", "ContentContainer", "TitleLabel", "StatusLabel", "ChoiceRow"],
	"shop":      ["Background", "ResourceBar", "MainRow", "TitleLabel", "StatusLabel", "ContentRow", "ButtonRow", "RemoveButton", "LeaveButton"],
	"reward":    ["Background", "Scroll", "Root", "TitleLabel", "ChoiceRow", "ButtonRow"],
	"map":       ["Background", "Root", "TitleLabel", "StatusLabel", "RelicRow", "NodeSurface"],
	"battle":    ["Background", "Root", "PlayerPanel", "EnemyRow", "HandRow", "BottomBar", "EndTurnButton"],
	"demo":      ["TopBar", "TitleLabel", "PrimaryBtn", "SecondaryBtn"],
}

# 每个 spec 预期的 action meta
const REQUIRED_ACTIONS := {
	"main_menu": { "StartButton": "menu.on_start", "ContinueButton": "menu.on_continue",
				   "SettingsBtn": "menu.on_settings" },
	"shop":   { "RemoveButton": "shop.on_remove_mode", "LeaveButton": "shop.on_leave" },
	"reward": { "SkipButton": "reward.on_skip" },
	"result": { "RestartButton": "result.on_restart", "MenuButton": "result.on_menu" },
	"battle": { "EndTurnButton": "battle.on_end_turn" },
	"demo":   { "PrimaryBtn": "demo.on_primary", "SecondaryBtn": "demo.on_secondary" },
}


func name() -> String:
	return "UIBuilder scene spec integration"


func run_async(ctx: Variant) -> void:
	for spec_name in SPECS.keys():
		var spec_path: String = SPECS[spec_name]
		ctx.assert_true(FileAccess.file_exists(spec_path),
			"spec 文件存在: %s" % spec_name)

		var root := _UIBuilder.build(spec_path)
		ctx.assert_true(root != null,
			"UIBuilder.build 不返回 null: %s" % spec_name)
		ctx.assert_true(root is Control,
			"UIBuilder.build 返回 Control: %s" % spec_name)

		## 验证关键节点存在
		if REQUIRED_NODES.has(spec_name):
			for node_name in (REQUIRED_NODES[spec_name] as Array):
				var found := root.find_child(node_name, true, false)
				ctx.assert_true(found != null,
					"%s: 节点 %s 存在于树中" % [spec_name, node_name])

		## 验证 action meta
		if REQUIRED_ACTIONS.has(spec_name):
			var actions := REQUIRED_ACTIONS[spec_name] as Dictionary
			for btn_name in actions.keys():
				var btn := root.find_child(btn_name, true, false)
				if btn != null:
					ctx.assert_eq(
						str(btn.get_meta("ui_action", "")),
						str(actions[btn_name]),
						"%s: %s action meta 正确" % [spec_name, btn_name]
					)

		root.free()

	## ── 特殊断言：spec 文件用的 style_key 都在 manifest 里注册 ──
	_test_style_keys_exist(ctx)

	## ── 特殊断言：spec 文件中的 asset key 在 manifest 里有对应条目 ──
	_test_asset_keys_exist(ctx)


func _test_style_keys_exist(ctx: Variant) -> void:
	const _StyleResolver := preload("res://addons/ui_builder/ui_style_resolver.gd")
	_StyleResolver.clear_cache()

	## 提取各 spec 里实际用到的 style_key 并验证
	const STYLE_KEYS_IN_USE := [
		"btn_primary", "btn_secondary", "btn_action",
		"panel_dark", "panel_card",
		"text_title", "text_title_pink", "text_title_gold",
		"text_body", "text_caption", "text_subtitle",
	]
	for key in STYLE_KEYS_IN_USE:
		ctx.assert_true(_StyleResolver.has_style(key),
			"manifest.styles.json 包含 style_key: %s" % key)


func _test_asset_keys_exist(ctx: Variant) -> void:
	const _AssetLoader := preload("res://addons/ui_builder/ui_asset_loader.gd")
	_AssetLoader.clear_cache()

	const ASSET_KEYS_IN_USE := [
		"backgrounds.main_menu",
		"backgrounds.battle",
		"backgrounds.map",
		"characters.merchant",
	]
	for key in ASSET_KEYS_IN_USE:
		var path := _AssetLoader.resolve_path(key)
		ctx.assert_true(not path.is_empty(),
			"manifest.assets.json 包含 asset_key: %s" % key)
