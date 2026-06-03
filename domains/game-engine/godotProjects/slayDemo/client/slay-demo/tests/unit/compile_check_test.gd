extends RefCounted
## 编译检查测试：preload 所有脚本和场景，确保 Parse Error 在 headless 测试阶段就能暴露。
## 不测试运行时逻辑，只验证文件可被 Godot 解析。

## ── autoload ────────────────────────────────────────────
const S_DataLoader      := preload("res://scripts/autoload/data_loader.gd")
const S_GameState       := preload("res://scripts/autoload/game_state.gd")
const S_RunController   := preload("res://scripts/autoload/run_controller.gd")
const S_SaveService     := preload("res://scripts/autoload/save_service.gd")
const S_SceneRouter     := preload("res://scripts/autoload/scene_router.gd")

## ── battle ──────────────────────────────────────────────
const S_BattleController := preload("res://scripts/battle/battle_controller.gd")
const S_DeckRuntime      := preload("res://scripts/battle/deck_runtime.gd")
const S_EffectRunner     := preload("res://scripts/battle/effect_runner.gd")
const S_EnemyAI          := preload("res://scripts/battle/enemy_ai.gd")
const S_StatusManager    := preload("res://scripts/battle/status_manager.gd")
const S_UpgradeService   := preload("res://scripts/battle/upgrade_service.gd")

## ── event / map / potion / relic / reward / shop ────────
const S_EventService    := preload("res://scripts/event/event_service.gd")
const S_MapGenerator    := preload("res://scripts/map/map_generator.gd")
const S_PotionService   := preload("res://scripts/potion/potion_service.gd")
const S_RelicService    := preload("res://scripts/relic/relic_service.gd")
const S_RewardService   := preload("res://scripts/reward/reward_service.gd")
const S_ShopService     := preload("res://scripts/shop/shop_service.gd")

## ── scenes ──────────────────────────────────────────────
const S_AppRoot       := preload("res://scripts/scenes/app_root.gd")
const S_BattleScene   := preload("res://scripts/scenes/battle_scene.gd")
const S_ChestScene    := preload("res://scripts/scenes/chest_scene.gd")
const S_EventScene    := preload("res://scripts/scenes/event_scene.gd")
const S_MainMenuScene := preload("res://scripts/scenes/main_menu_scene.gd")
const S_MapScene      := preload("res://scripts/scenes/map_scene.gd")
const S_RestScene     := preload("res://scripts/scenes/rest_scene.gd")
const S_ResultScene   := preload("res://scripts/scenes/result_scene.gd")
const S_RewardScene   := preload("res://scripts/scenes/reward_scene.gd")
const S_ShopScene     := preload("res://scripts/scenes/shop_scene.gd")

## ── ui ──────────────────────────────────────────────────
const S_CardViewFactory   := preload("res://scripts/ui/card_view_factory.gd")
const S_PotionViewFactory := preload("res://scripts/ui/potion_view_factory.gd")
const S_RelicViewFactory  := preload("res://scripts/ui/relic_view_factory.gd")
const S_StatusViewFactory := preload("res://scripts/ui/status_view_factory.gd")

## ── vfx ─────────────────────────────────────────────────
const S_VFXManager := preload("res://scripts/vfx/vfx_manager.gd")

## ── .tscn 场景资源 ──────────────────────────────────────
const T_AppRoot    := preload("res://scenes/app/app_root.tscn")
const T_Battle     := preload("res://scenes/battle/battle_scene.tscn")
const T_Chest      := preload("res://scenes/chest/chest_scene.tscn")
const T_Event      := preload("res://scenes/event/event_scene.tscn")
const T_MainMenu   := preload("res://scenes/main_menu/main_menu_scene.tscn")
const T_Map        := preload("res://scenes/map/map_scene.tscn")
const T_Rest       := preload("res://scenes/rest/rest_scene.tscn")
const T_Result     := preload("res://scenes/result/result_scene.tscn")
const T_Reward     := preload("res://scenes/reward/reward_scene.tscn")
const T_Shop       := preload("res://scenes/shop/shop_scene.tscn")


func name() -> String:
	return "Compile check: all scripts and scenes"


func run(ctx: Variant) -> void:
	## autoload
	ctx.assert_true(S_DataLoader != null,     "data_loader.gd compiles")
	ctx.assert_true(S_GameState != null,      "game_state.gd compiles")
	ctx.assert_true(S_RunController != null,  "run_controller.gd compiles")
	ctx.assert_true(S_SaveService != null,    "save_service.gd compiles")
	ctx.assert_true(S_SceneRouter != null,    "scene_router.gd compiles")

	## battle
	ctx.assert_true(S_BattleController != null, "battle_controller.gd compiles")
	ctx.assert_true(S_DeckRuntime != null,      "deck_runtime.gd compiles")
	ctx.assert_true(S_EffectRunner != null,     "effect_runner.gd compiles")
	ctx.assert_true(S_EnemyAI != null,          "enemy_ai.gd compiles")
	ctx.assert_true(S_StatusManager != null,    "status_manager.gd compiles")
	ctx.assert_true(S_UpgradeService != null,   "upgrade_service.gd compiles")

	## domain services
	ctx.assert_true(S_EventService != null,   "event_service.gd compiles")
	ctx.assert_true(S_MapGenerator != null,   "map_generator.gd compiles")
	ctx.assert_true(S_PotionService != null,  "potion_service.gd compiles")
	ctx.assert_true(S_RelicService != null,   "relic_service.gd compiles")
	ctx.assert_true(S_RewardService != null,  "reward_service.gd compiles")
	ctx.assert_true(S_ShopService != null,    "shop_service.gd compiles")

	## scenes
	ctx.assert_true(S_AppRoot != null,       "app_root.gd compiles")
	ctx.assert_true(S_BattleScene != null,   "battle_scene.gd compiles")
	ctx.assert_true(S_ChestScene != null,    "chest_scene.gd compiles")
	ctx.assert_true(S_EventScene != null,    "event_scene.gd compiles")
	ctx.assert_true(S_MainMenuScene != null, "main_menu_scene.gd compiles")
	ctx.assert_true(S_MapScene != null,      "map_scene.gd compiles")
	ctx.assert_true(S_RestScene != null,     "rest_scene.gd compiles")
	ctx.assert_true(S_ResultScene != null,   "result_scene.gd compiles")
	ctx.assert_true(S_RewardScene != null,   "reward_scene.gd compiles")
	ctx.assert_true(S_ShopScene != null,     "shop_scene.gd compiles")

	## ui
	ctx.assert_true(S_CardViewFactory != null,   "card_view_factory.gd compiles")
	ctx.assert_true(S_PotionViewFactory != null, "potion_view_factory.gd compiles")
	ctx.assert_true(S_RelicViewFactory != null,  "relic_view_factory.gd compiles")
	ctx.assert_true(S_StatusViewFactory != null, "status_view_factory.gd compiles")

	## vfx
	ctx.assert_true(S_VFXManager != null, "vfx_manager.gd compiles")

	## .tscn 场景资源
	ctx.assert_true(T_AppRoot != null,  "app_root.tscn loads")
	ctx.assert_true(T_Battle != null,   "battle_scene.tscn loads")
	ctx.assert_true(T_Chest != null,    "chest_scene.tscn loads")
	ctx.assert_true(T_Event != null,    "event_scene.tscn loads")
	ctx.assert_true(T_MainMenu != null, "main_menu_scene.tscn loads")
	ctx.assert_true(T_Map != null,      "map_scene.tscn loads")
	ctx.assert_true(T_Rest != null,     "rest_scene.tscn loads")
	ctx.assert_true(T_Result != null,   "result_scene.tscn loads")
	ctx.assert_true(T_Reward != null,   "reward_scene.tscn loads")
	ctx.assert_true(T_Shop != null,     "shop_scene.tscn loads")
