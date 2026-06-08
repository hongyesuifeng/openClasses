extends RefCounted


func name() -> String:
	return "Relic and card content expansion"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	data_loader.load_all()

	## ── Option B：遗物扩充验证 ────────────────────────

	## 1. validate_all 通过（新遗物格式正确）
	var errors: PackedStringArray = data_loader.validate_all()
	ctx.assert_eq(errors.size(), 0, "validate_all passes with expanded relics and cards")

	## 2. 遗物总数 >= 11
	var all_relics: Array = data_loader.get_all_relics()
	ctx.assert_true(all_relics.size() >= 11, "relics expanded to at least 11")

	## 3. 新遗物可被查询
	var iron_boots: Dictionary = data_loader.get_relic("iron_boots")
	ctx.assert_false(iron_boots.is_empty(), "iron_boots relic exists")
	ctx.assert_eq(str(iron_boots.get("rarity", "")), "common", "iron_boots is common rarity")

	var war_drum: Dictionary = data_loader.get_relic("war_drum")
	ctx.assert_false(war_drum.is_empty(), "war_drum relic exists")
	ctx.assert_eq(str(war_drum.get("rarity", "")), "uncommon", "war_drum is uncommon rarity")

	var crystal_ball: Dictionary = data_loader.get_relic("crystal_ball")
	ctx.assert_false(crystal_ball.is_empty(), "crystal_ball relic exists")
	ctx.assert_eq(str(crystal_ball.get("rarity", "")), "rare", "crystal_ball is rare rarity")

	## 4. war_drum 有 draw_per_turn effect
	var drum_effects: Array = war_drum.get("effects", [])
	ctx.assert_eq(drum_effects.size(), 1, "war_drum has one effect")
	var drum_effect := drum_effects[0] as Dictionary
	ctx.assert_eq(str(drum_effect.get("type", "")), "draw_per_turn", "war_drum effect type is draw_per_turn")
	ctx.assert_eq(int(drum_effect.get("value", 0)), 1, "war_drum draw bonus is 1")

	## 5. draw_per_turn effect 被 RelicService 正确求和
	const RelicServiceScript := preload("res://scripts/relic/relic_service.gd")
	var draw_bonus: int = RelicServiceScript.get_effect_total(["war_drum"], data_loader, "draw_per_turn")
	ctx.assert_eq(draw_bonus, 1, "RelicService sums draw_per_turn correctly for war_drum")

	## 6. 两个 draw_per_turn 遗物叠加
	var double_draw: int = RelicServiceScript.get_effect_total(["war_drum", "war_drum"], data_loader, "draw_per_turn")
	ctx.assert_eq(double_draw, 2, "two war_drums stack draw_per_turn to 2")

	## ── Option C：卡牌扩充验证 ───────────────────────

	## 7. 卡牌总数 >= 37
	var all_cards: Array = data_loader.get_all_cards()
	ctx.assert_true(all_cards.size() >= 37, "cards expanded to at least 37")

	## 8. 新攻击牌可被查询
	var whirlwind: Dictionary = data_loader.get_card("whirlwind")
	ctx.assert_false(whirlwind.is_empty(), "whirlwind card exists")
	ctx.assert_eq(str(whirlwind.get("type", "")), "attack", "whirlwind is attack type")
	ctx.assert_eq(str(whirlwind.get("target", "")), "all_enemies", "whirlwind targets all_enemies")

	var venomous_stab: Dictionary = data_loader.get_card("venomous_stab")
	ctx.assert_false(venomous_stab.is_empty(), "venomous_stab card exists")
	var stab_effects: Array = venomous_stab.get("effects", [])
	ctx.assert_eq(stab_effects.size(), 2, "venomous_stab has 2 effects (damage + poison)")

	## 9. 新技能牌
	var adrenaline: Dictionary = data_loader.get_card("adrenaline")
	ctx.assert_false(adrenaline.is_empty(), "adrenaline card exists")
	ctx.assert_eq(int(adrenaline.get("cost", -1)), 0, "adrenaline costs 0 energy")
	ctx.assert_eq(str(adrenaline.get("type", "")), "skill", "adrenaline is skill type")

	## 10. 新能力牌
	var corruption: Dictionary = data_loader.get_card("corruption")
	ctx.assert_false(corruption.is_empty(), "corruption card exists")
	ctx.assert_eq(str(corruption.get("type", "")), "power", "corruption is power type")

	## 11. 所有新卡牌都有 upgrade 字段
	var new_ids := ["whirlwind", "reckless_charge", "venomous_stab", "skull_crusher",
		"thunderclap", "fortify", "battle_hymn", "second_wind", "adrenaline",
		"warcry", "brutality", "corruption"]
	for card_id in new_ids:
		var card: Dictionary = data_loader.get_card(card_id)
		ctx.assert_true(card.has("upgrade"), "new card %s has upgrade field" % card_id)

	## ── V1.5 毒流/格挡流扩充验证 ─────────────────────

	## 12. 新增毒流卡可查询
	var poison_burst: Dictionary = data_loader.get_card("poison_burst")
	ctx.assert_false(poison_burst.is_empty(), "poison_burst card exists")
	ctx.assert_eq(str(poison_burst.get("type", "")), "attack", "poison_burst is attack type")
	ctx.assert_eq(str(poison_burst.get("rarity", "")), "common", "poison_burst is common rarity")

	var toxic_cloud: Dictionary = data_loader.get_card("toxic_cloud")
	ctx.assert_false(toxic_cloud.is_empty(), "toxic_cloud card exists")
	ctx.assert_eq(str(toxic_cloud.get("rarity", "")), "uncommon", "toxic_cloud is uncommon rarity")

	var catalyst: Dictionary = data_loader.get_card("catalyst")
	ctx.assert_false(catalyst.is_empty(), "catalyst card exists")
	ctx.assert_eq(str(catalyst.get("type", "")), "skill", "catalyst is skill type")

	var corrosive_strike: Dictionary = data_loader.get_card("corrosive_strike")
	ctx.assert_false(corrosive_strike.is_empty(), "corrosive_strike card exists")
	var cs_effects: Array = corrosive_strike.get("effects", [])
	ctx.assert_eq(cs_effects.size(), 2, "corrosive_strike has 2 effects (damage + poison)")

	var plague: Dictionary = data_loader.get_card("plague")
	ctx.assert_false(plague.is_empty(), "plague card exists")
	ctx.assert_eq(str(plague.get("rarity", "")), "rare", "plague is rare rarity")

	## 13. 新增格挡流卡可查询
	var shield_bash_pro: Dictionary = data_loader.get_card("shield_bash_pro")
	ctx.assert_false(shield_bash_pro.is_empty(), "shield_bash_pro card exists")
	ctx.assert_eq(str(shield_bash_pro.get("type", "")), "attack", "shield_bash_pro is attack type")

	var juggernaut: Dictionary = data_loader.get_card("juggernaut")
	ctx.assert_false(juggernaut.is_empty(), "juggernaut card exists")
	ctx.assert_eq(str(juggernaut.get("type", "")), "power", "juggernaut is power type")

	var fortress: Dictionary = data_loader.get_card("fortress")
	ctx.assert_false(fortress.is_empty(), "fortress card exists")
	ctx.assert_eq(str(fortress.get("rarity", "")), "uncommon", "fortress is uncommon rarity")

	var counter_strike: Dictionary = data_loader.get_card("counter_strike")
	ctx.assert_false(counter_strike.is_empty(), "counter_strike card exists")
	ctx.assert_eq(str(counter_strike.get("rarity", "")), "rare", "counter_strike is rare rarity")

	var steel_wall: Dictionary = data_loader.get_card("steel_wall")
	ctx.assert_false(steel_wall.is_empty(), "steel_wall card exists")
	var sw_effects: Array = steel_wall.get("effects", [])
	ctx.assert_eq(sw_effects.size(), 2, "steel_wall has 2 effects (block + metallicize)")

	## 14. 所有新增卡牌都有 upgrade 字段
	var v15_card_ids := [
		"poison_burst", "toxic_cloud", "catalyst", "corrosive_strike", "plague",
		"shield_bash_pro", "juggernaut", "fortress", "counter_strike", "steel_wall"
	]
	for card_id in v15_card_ids:
		var card: Dictionary = data_loader.get_card(card_id)
		ctx.assert_true(card.has("upgrade"), "v1.5 card %s has upgrade field" % card_id)

	## 15. 卡牌总数 >= 65（55基础卡 + 10新增）
	ctx.assert_true(all_cards.size() >= 65, "cards expanded to at least 65 after v1.5 addition")
