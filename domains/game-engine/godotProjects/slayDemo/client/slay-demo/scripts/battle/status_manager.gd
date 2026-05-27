extends RefCounted
class_name StatusManager

## 状态效果定义
## trigger: none (无触发) | turn_start (回合开始) | turn_end (回合结束) | on_hit (被击中时)
const STATUS_DEFS := {
	"strength": {"is_debuff": false, "is_permanent": true, "trigger": "none", "affects": "damage"},
	"dexterity": {"is_debuff": false, "is_permanent": true, "trigger": "none", "affects": "block"},
	"vulnerable": {"is_debuff": true, "is_permanent": false, "trigger": "turn_end", "affects": "damage_taken"},
	"weak": {"is_debuff": true, "is_permanent": false, "trigger": "turn_end", "affects": "damage_dealt"},
	"frail": {"is_debuff": true, "is_permanent": false, "trigger": "turn_end", "affects": "block"},
	"poison": {"is_debuff": true, "is_permanent": false, "trigger": "turn_start", "affects": "hp"},
	"thorns": {"is_debuff": false, "is_permanent": false, "trigger": "on_hit", "affects": "reflect"},
	"regeneration": {"is_debuff": false, "is_permanent": false, "trigger": "turn_start", "affects": "hp"},
}

var statuses: Dictionary = {}  # {status_id: stacks}
signal status_changed(status_id: String, stacks: int)
signal poison_damage(amount: int)
signal regeneration_heal(amount: int)
signal thorns_damage(amount: int)


func apply_status(status_id: String, stacks: int) -> void:
	if not STATUS_DEFS.has(status_id):
		push_warning("StatusManager: unknown status '%s'" % status_id)
		return

	if stacks <= 0:
		remove_status(status_id)
		return

	var old_stacks := get_stacks(status_id)
	statuses[status_id] = stacks
	if old_stacks != stacks:
		status_changed.emit(status_id, stacks)


func remove_status(status_id: String) -> void:
	if statuses.has(status_id):
		statuses.erase(status_id)
		status_changed.emit(status_id, 0)


func get_stacks(status_id: String) -> int:
	return int(statuses.get(status_id, 0))


func has_status(status_id: String) -> bool:
	return statuses.has(status_id) and statuses[status_id] > 0


func get_all_statuses() -> Dictionary:
	return statuses.duplicate(true)


## 回合开始触发：中毒造成伤害，生命回复恢复HP
## 返回：{poison_damage: int, regeneration_heal: int}
func tick_turn_start() -> Dictionary:
	var result := {"poison_damage": 0, "regeneration_heal": 0}

	# 中毒：造成等于层数的伤害，然后层数-1
	if has_status("poison"):
		var poison_stacks := get_stacks("poison")
		result.poison_damage = poison_stacks
		poison_damage.emit(poison_stacks)
		_decrement_status("poison")

	# 生命回复：恢复等于层数的HP，然后层数-1
	if has_status("regeneration"):
		var regen_stacks := get_stacks("regeneration")
		result.regeneration_heal = regen_stacks
		regeneration_heal.emit(regen_stacks)
		_decrement_status("regeneration")

	return result


## 回合结束触发：易伤、虚弱、无力等层数递减
func tick_turn_end() -> void:
	var tick_down := ["vulnerable", "weak", "frail"]
	for status_id in tick_down:
		if has_status(status_id):
			_decrement_status(status_id)


## 计算最终伤害（考虑力量、易伤、无力）
## base_damage: 基础伤害
## is_attacker: true=攻击者计算, false=被攻击者计算
func calculate_damage(base_damage: int, is_attacker: bool) -> int:
	var damage := base_damage

	if is_attacker:
		# 攻击者：力量加成
		damage += get_stacks("strength")

		# 攻击者：无力减伤 25%
		if has_status("weak"):
			damage = int(floor(damage * 0.75))
			damage = maxi(1, damage)  # 最低 1 点伤害
	else:
		# 被攻击者：易伤增伤 50%
		if has_status("vulnerable"):
			damage = int(ceil(damage * 1.5))

	return maxi(0, damage)


## 计算最终格挡（考虑敏捷、虚弱）
func calculate_block(base_block: int) -> int:
	var block := base_block

	# 敏捷加成
	block += get_stacks("dexterity")

	# 虚弱减少格挡 25%
	if has_status("frail"):
		block = int(floor(block * 0.75))

	return maxi(0, block)


## 被攻击时触发：荆棘反弹伤害
func on_hit() -> int:
	var thorns_damage := 0
	if has_status("thorns"):
		thorns_damage = get_stacks("thorns")
	return thorns_damage


## 获取状态快照（用于 UI 显示）
func get_snapshot() -> Array:
	var result := []
	for status_id in statuses:
		var stacks: int = statuses[status_id]
		if stacks > 0:
			result.append({
				"id": status_id,
				"stacks": stacks,
				"is_debuff": STATUS_DEFS[status_id]["is_debuff"]
			})
	return result


func _decrement_status(status_id: String) -> void:
	var current := get_stacks(status_id)
	if current <= 1:
		remove_status(status_id)
	else:
		statuses[status_id] = current - 1
		status_changed.emit(status_id, current - 1)
