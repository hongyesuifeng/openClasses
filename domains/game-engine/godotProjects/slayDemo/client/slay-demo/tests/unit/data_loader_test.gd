extends RefCounted


func name() -> String:
	return "DataLoader validates V1 JSON"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	ctx.assert_true(data_loader != null, "DataLoader autoload exists")

	data_loader.clear_cache()
	data_loader.load_all()
	var errors: PackedStringArray = data_loader.validate_all()
	ctx.assert_eq(errors.size(), 0, "V1 JSON has no validation errors")

	var strike: Dictionary = data_loader.get_card("strike")
	ctx.assert_eq(str(strike.get("name", "")), "打击", "strike card is loaded")
	ctx.assert_eq(int(strike.get("cost", -99)), 1, "strike cost is configured")

	var boss: Dictionary = data_loader.get_enemy("boss_knight_v1")
	ctx.assert_eq(str(boss.get("enemy_type", "")), "boss", "boss enemy is loaded")
	ctx.assert_gt((boss.get("phases", []) as Array).size(), 0, "boss has phases")

	var run_config: Dictionary = data_loader.get_run_config("v1_fixed_run")
	ctx.assert_eq((run_config.get("nodes", []) as Array).size(), 8, "V1 run has fixed 8 nodes")
