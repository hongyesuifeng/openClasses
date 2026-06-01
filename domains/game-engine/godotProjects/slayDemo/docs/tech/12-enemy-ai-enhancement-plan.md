# 敌人 AI 增强规划

> 目标: 让敌人行为更加多样、智能、有趣，提升战斗的策略深度。

---

## 一、现状分析

### 1.1 当前行为模式

| 规则 | 行为 | 问题 |
|------|------|------|
| `next` | 执行下一个动作 | 完全可预测 |
| `repeat` | 重复当前动作 | 简单循环 |
| `loop` | 循环所有动作 | 固定序列 |

### 1.2 存在的问题

1. **可预测性过高** - 玩家可以记住敌人的行动序列
2. **无响应式行为** - 敌人不会根据自身 HP/玩家状态调整策略
3. **Boss 缺乏压迫感** - 没有 HP 阈值触发特殊行为
4. **无随机性** - 同样敌人每局表现完全相同

---

## 二、增强方案

### 2.1 新增行为规则

#### 权重池模式 (weighted_pool)

从多个动作中按权重随机选择:

```json
{
  "id": "cultist_v2",
  "actions": [
    { "id": "chant", "weight": 30, ... },
    { "id": "dark_strike", "weight": 50, ... },
    { "id": "summon", "weight": 20, ... }
  ],
  "selection_mode": "weighted_pool"
}
```

#### 条件分支模式 (conditional)

根据战斗状态选择动作:

```json
{
  "id": "smart_attack",
  "conditions": [
    { "if": "player_hp_below_30%", "then": "execute" },
    { "if": "self_hp_below_50%", "then": "defensive_move" },
    { "else": "normal_attack" }
  ]
}
```

#### Boss 阶段模式 (phase)

根据 HP 阈值切换行为池:

```json
{
  "id": "boss_fire_lord_v2",
  "phases": [
    {
      "trigger": "hp_above_50%",
      "actions": ["inferno", "fire_shield", "burning_rage"],
      "selection_mode": "weighted_pool"
    },
    {
      "trigger": "hp_below_50%",
      "actions": ["meteor_strike", "scorched_earth", "inferno_enhanced"],
      "selection_mode": "aggressive_pool"
    }
  ]
}
```

### 2.2 意图显示增强

| 意图类型 | 显示 | 说明 |
|---------|------|------|
| `attack` | 伤害数值 | 可被格挡 |
| `attack_debuff` | 伤害 + 状态图标 | 如毒咬 |
| `buff` | 增益图标 | 力量/护盾等 |
| `debuff` | 减益图标 | 施加给玩家 |
| `defend` | 格挡数值 | 获得格挡 |
| `unknown` | ? 图标 | 隐藏意图（Boss 特殊技能） |
| `sleep` | 睡眠图标 | 不行动 |

### 2.3 新增效果类型

```json
// 多段攻击
{ "type": "multi_damage", "value": 4, "hits": 3, "target": "player" }

// AOE 攻击
{ "type": "aoe_damage", "value": 8, "target": "all_enemies" }

// 治疗
{ "type": "heal", "value": 10, "target": "self" }

// 召唤
{ "type": "summon", "enemy_id": "slime_small_v1", "count": 2 }

// 清除状态
{ "type": "clear_status", "status_id": "weak", "target": "self" }

// 连击（若上回合攻击则伤害翻倍）
{ "type": "damage", "value": 8, "combo_bonus": 8 }
```

---

## 三、敌人重设计

### 3.1 普通敌人增强

#### 小史莱姆 → 史莱姆群

```json
{
  "id": "slime_swarm_v1",
  "name": "史莱姆群",
  "actions": [
    { "id": "group_tackle", "intent_type": "attack", "intent_value": 6,
      "effects": [{ "type": "damage", "value": 6 }],
      "weight": 40 },
    { "id": "absorb", "intent_type": "buff",
      "effects": [{ "type": "heal", "value": 5 }],
      "weight": 30 },
    { "id": "split", "intent_type": "summon",
      "effects": [{ "type": "summon", "enemy_id": "slime_tiny", "count": 1 }],
      "weight": 30,
      "cooldown": 3 }
  ],
  "selection_mode": "weighted_pool"
}
```

#### 暗影信徒 → 强化版

```json
{
  "id": "cultist_v2",
  "name": "暗影主教",
  "actions": [
    { "id": "dark_ritual", "intent_type": "buff",
      "effects": [{ "type": "gain_strength", "value": 2 }],
      "weight": 25 },
    { "id": "shadow_bolt", "intent_type": "attack", "intent_value": 10,
      "effects": [{ "type": "damage", "value": 10 }],
      "weight": 40 },
    { "id": "curse", "intent_type": "debuff",
      "effects": [{ "type": "apply_status", "status_id": "weak", "value": 2 }],
      "weight": 35 }
  ],
  "selection_mode": "weighted_pool"
}
```

### 3.2 精英敌人增强

#### 史莱姆王 - 多阶段

```json
{
  "id": "elite_slime_king_v2",
  "name": "史莱姆王",
  "phases": [
    {
      "name": "正常形态",
      "trigger": "hp_above_50%",
      "actions": [
        { "id": "slam", "intent_value": 12, "weight": 40 },
        { "id": "goop_spray", "intent_value": 8, "weight": 35 },
        { "id": "summon_minions", "weight": 25,
          "effects": [{ "type": "summon", "enemy_id": "slime_small_v1", "count": 2 }],
          "cooldown": 4 }
      ]
    },
    {
      "name": "分裂形态",
      "trigger": "hp_below_50%",
      "actions": [
        { "id": "desperate_slam", "intent_value": 18, "weight": 30 },
        { "id": "rapid_split", "weight": 40,
          "effects": [{ "type": "summon", "enemy_id": "slime_small_v1", "count": 3 }],
          "cooldown": 3 },
        { "id": "absorb_mass", "intent_type": "buff", "weight": 30,
          "effects": [{ "type": "heal", "value": 15 }, { "type": "gain_strength", "value": 1 }] }
      ]
    }
  ]
}
```

### 3.3 Boss 敌人重设计

#### 火焰领主 - 双阶段 + 狂暴

```json
{
  "id": "boss_fire_lord_v2",
  "name": "火焰领主",
  "max_hp": 120,
  "phases": [
    {
      "name": "常规阶段",
      "trigger": "hp_above_50%",
      "actions": [
        { "id": "inferno", "intent_value": 12, "weight": 35 },
        { "id": "fire_shield", "intent_type": "defend", "weight": 25,
          "effects": [{ "type": "block", "value": 15 }] },
        { "id": "burning_rage", "intent_type": "buff", "weight": 20,
          "effects": [{ "type": "gain_strength", "value": 2 }] },
        { "id": "scorch", "intent_value": 8, "weight": 20,
          "effects": [
            { "type": "damage", "value": 8 },
            { "type": "apply_status", "status_id": "vulnerable", "value": 1 }
          ]}
      ]
    },
    {
      "name": "狂暴阶段",
      "trigger": "hp_below_50%",
      "phase_effects": [
        { "type": "gain_strength", "value": 3 },
        { "type": "apply_status", "status_id": "thorns", "value": 2 }
      ],
      "actions": [
        { "id": "meteor_strike", "intent_value": 25, "weight": 25 },
        { "id": "inferno_enhanced", "intent_value": 18, "weight": 30,
          "effects": [{ "type": "multi_damage", "value": 6, "hits": 3 }] },
        { "id": "scorched_earth", "intent_value": 15, "weight": 25,
          "effects": [
            { "type": "damage", "value": 15 },
            { "type": "apply_status", "status_id": "weak", "value": 1 }
          ]},
        { "id": "flame_barrier", "intent_type": "defend", "weight": 20,
          "effects": [
            { "type": "block", "value": 20 },
            { "type": "apply_status", "status_id": "thorns", "value": 3 }
          ]}
      ]
    }
  ]
}
```

#### 腐化骑士 - 护盾机制 + 连击

```json
{
  "id": "boss_knight_v2",
  "name": "腐化骑士",
  "max_hp": 100,
  "phases": [
    {
      "name": "防守反击",
      "trigger": "hp_above_40%",
      "actions": [
        { "id": "ready_blade", "intent_type": "buff", "weight": 20,
          "effects": [{ "type": "gain_strength", "value": 2 }],
          "combo_next": "cleave" },
        { "id": "cleave", "intent_value": 14, "weight": 35,
          "combo_bonus": { "damage": 7 } },
        { "id": "fortify", "intent_type": "defend", "weight": 25,
          "effects": [{ "type": "block", "value": 20 }] },
        { "id": "shield_bash", "intent_value": 10, "weight": 20,
          "effects": [
            { "type": "damage", "value": 10 },
            { "type": "apply_status", "status_id": "vulnerable", "value": 1 }
          ]}
      ]
    },
    {
      "name": "破釜沉舟",
      "trigger": "hp_below_40%",
      "phase_effects": [
        { "type": "gain_strength", "value": 5 }
      ],
      "actions": [
        { "id": "execute", "intent_value": 30, "weight": 30,
          "effects": [{ "type": "damage", "value": 30 }],
          "condition": "player_hp_below_50%" },
        { "id": "heavy_cleave", "intent_value": 22, "weight": 40 },
        { "id": "corrupted_shield", "intent_type": "defend", "weight": 30,
          "effects": [
            { "type": "block", "value": 25 },
            { "type": "lose_hp", "value": 5 }
          ]}
      ]
    }
  ]
}
```

---

## 四、实现计划

### 4.1 阶段一：权重池模式 (1-2小时)

- [ ] 修改 `EnemyAI` 支持 `weighted_pool` 选择模式
- [ ] 为现有敌人添加权重
- [ ] 测试随机选择

### 4.2 阶段二：Boss 阶段系统 (2-3小时)

- [ ] 添加 `phases` 数据结构
- [ ] 实现 HP 阈值触发
- [ ] 阶段切换时的效果执行
- [ ] UI 显示当前阶段

### 4.3 阶段三：条件分支 (1-2小时)

- [ ] 实现条件判断系统
- [ ] `player_hp_below_X`、`self_hp_below_X` 等条件
- [ ] 冷却机制 `cooldown`

### 4.4 阶段四：新效果类型 (1-2小时)

- [ ] `multi_damage` 多段攻击
- [ ] `summon` 召唤小怪
- [ ] `heal` 治疗效果

### 4.5 阶段五：敌人数据更新 (1小时)

- [ ] 更新所有普通敌人
- [ ] 更新精英敌人
- [ ] 更新 Boss 敌人

---

## 五、验收标准

1. **权重池** - 敌人不再完全可预测，但有概率倾向
2. **Boss 阶段** - HP 低于 50% 时行为明显改变
3. **战斗变数** - 同样敌人每局可能有不同表现
4. **策略深度** - 玩家需要应对多种可能性而非固定序列

---

## 六、风险与缓解

| 风险 | 缓解 |
|------|------|
| 随机性过强导致战斗不公平 | 控制权重，保证可预测性在合理范围 |
| Boss 过于强力 | 阶段切换给予玩家喘息时间 |
| 实现复杂度爆炸 | 分阶段实现，首版只做权重池 |
