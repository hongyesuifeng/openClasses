extends RefCounted

const RewardServiceScript := preload("res://scripts/reward/reward_service.gd")


func name() -> String:
	return "RewardService card choices"


func run(ctx: Variant) -> void:
	var data_loader: Variant = ctx.autoload("DataLoader")
	var choices: Array = RewardServiceScript.generate_card_choices("normal_card_reward", [
		data_loader.create_card_instance("strike"),
		data_loader.create_card_instance("defend")
	])

	ctx.assert_eq(choices.size(), 3, "normal reward generates 3 card choices")

	var ids := {}
	for choice in choices:
		var card := choice as Dictionary
		var id := str(card.get("id", ""))
		ctx.assert_false(ids.has(id), "reward choice ids are unique")
		ctx.assert_false(str(card.get("rarity", "")) == "starter", "starter cards are excluded from rewards")
		ids[id] = true
