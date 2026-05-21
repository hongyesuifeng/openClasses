# 09 - UI 系统技术方案

## 1. UI 节点结构设计

### 1.1 UI 层级总览

```
Root (Node)
├── BattleScene (Node2D)
│   ├── BackgroundLayer (CanvasLayer, layer=-10)
│   │   └── Background (TextureRect)
│   │
│   ├── GameLayer (Node2D)              # 游戏实体层
│   │   ├── EnemyContainer
│   │   └── PlayerArea
│   │
│   ├── CardLayer (CanvasLayer, layer=5) # 卡牌层（独立于游戏层）
│   │   └── HandArea (Control)
│   │       └── HandLayout (Control)
│   │
│   ├── HUDLayer (CanvasLayer, layer=10) # HUD 层
│   │   ├── EnergyDisplay
│   │   ├── TurnIndicator
│   │   ├── EndTurnButton
│   │   └── PileButtons
│   │
│   └── PopupLayer (CanvasLayer, layer=20) # 弹窗层（最上层）
│       ├── CardPreviewPopup
│       ├── PileViewPopup
│       └── GameOverPopup
```

### 1.2 CanvasLayer 分层策略

使用 `CanvasLayer` 确保各 UI 层级独立渲染，不受游戏层缩放和相机影响。

| 层级 | layer 值 | 内容 | 理由 |
|------|----------|------|------|
| BackgroundLayer | -10 | 战斗背景 | 最底层，不受 UI 影响 |
| GameLayer | 0 | 敌人、玩家 | 默认层 |
| CardLayer | 5 | 手牌区域 | 独立于游戏层，卡牌拖拽时不被遮挡 |
| HUDLayer | 10 | HUD 元素 | 始终显示在游戏层之上 |
| PopupLayer | 20 | 弹窗、抽牌堆查看 | 最上层，模态显示 |

## 2. 卡牌手牌 UI

### 2.1 CardView 场景结构

```
CardView (Control)
├── CardBackground (NinePatchRect)        # 卡牌背景框
├── CardArt (TextureRect)                 # 卡牌插画
├── CostBadge (Label)                     # 左上角费用
├── NameLabel (Label)                     # 卡牌名称
├── DescriptionBox (RichTextLabel)        # 效果描述
├── TypeBanner (TextureRect)              # 类型标签（攻击/技能/能力）
├── RarityGem (TextureRect)               # 稀有度标记
├── Highlight (ColorRect)                 # 高亮边框（鼠标悬浮）
└── SelectedOverlay (ColorRect)           # 选中态遮罩
```

### 2.2 CardView 脚本

```gdscript
# scripts/ui/card_view.gd
extends Control

signal card_hovered(card_view: Control)
signal card_unhovered(card_view: Control)
signal card_clicked(card_view: Control)
signal card_target_selected(card_view: Control, target: Node)

enum CardViewState {
    IN_HAND,        # 在手牌中
    DRAGGING,       # 正在拖拽
    SELECTED,       # 已选中（等待目标选择）
    PREVIEW,        # 预览模式（放大显示）
    DISABLED,       # 不可交互（费用不足等）
}

var card_data: CardData
var state: CardViewState = CardViewState.IN_HAND
var original_position: Vector2
var original_scale: Vector2 = Vector2.ONE
var is_playable: bool = true

@onready var cost_badge: Label = $CostBadge
@onready var name_label: Label = $NameLabel
@onready var description_box: RichTextLabel = $DescriptionBox
@onready var card_art: TextureRect = $CardArt
@onready var highlight: ColorRect = $Highlight
@onready var selected_overlay: ColorRect = $SelectedOverlay


func setup(data: CardData) -> void:
    card_data = data
    name_label.text = data.card_name
    cost_badge.text = str(data.cost)
    description_box.text = data.get_display_description()
    if data.card_art:
        card_art.texture = data.card_art


func set_playable(value: bool) -> void:
    is_playable = value
    if not value:
        state = CardViewState.DISABLED
        modulate = Color(0.6, 0.6, 0.6, 1.0)
    else:
        state = CardViewState.IN_HAND
        modulate = Color.WHITE


func _gui_input(event: InputEvent) -> void:
    if state == CardViewState.DISABLED:
        return

    if event is InputEventMouseButton:
        if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
            if state == CardViewState.IN_HAND:
                _start_drag()
            elif state == CardViewState.DRAGGING:
                _try_play_card()
        elif not event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
            if state == CardViewState.DRAGGING:
                _cancel_drag()

    if event is InputEventMouseMotion and state == CardViewState.DRAGGING:
        _update_drag_position()
```

### 2.3 拖拽逻辑

```gdscript
var _drag_offset: Vector2 = Vector2.ZERO


func _start_drag() -> void:
    state = CardViewState.DRAGGING
    original_position = position
    original_scale = scale
    _drag_offset = get_global_mouse_position() - global_position

    # 拖拽时放大
    var tween := create_tween()
    tween.tween_property(self, "scale", Vector2(1.2, 1.2), 0.1)

    # 提升渲染层级
    z_index = 10

    highlight.visible = true
    card_clicked.emit(self)


func _update_drag_position() -> void:
    var target_pos := get_global_mouse_position() - _drag_offset
    # 限制在手牌区域上方
    target_pos.y = mini(target_pos.y, original_position.y - 50)
    position = target_pos


func _cancel_drag() -> void:
    state = CardViewState.IN_HAND
    z_index = 0
    highlight.visible = false

    # 动画回到原位
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(self, "position", original_position, 0.2).set_ease(Tween.EASE_OUT)
    tween.tween_property(self, "scale", original_scale, 0.2).set_ease(Tween.EASE_OUT)


func _try_play_card() -> void:
    # 如果拖到足够高，尝试打出
    if global_position.y < original_position.y - 80:
        # 需要目标选择
        if card_data.target_type == TargetType.SINGLE_ENEMY:
            state = CardViewState.SELECTED
            card_target_selected.emit(self, null)  # null 表示等待目标选择
        else:
            # 自动目标卡牌，直接打出
            card_target_selected.emit(self, null)
    else:
        _cancel_drag()
```

### 2.4 手牌布局管理

```gdscript
# scripts/ui/hand_layout.gd
extends Control

var card_views: Array[Control] = []
var _is_animating: bool = false

const CARD_WIDTH: float = 120.0
const CARD_HEIGHT: float = 170.0
const CARD_SPACING: float = 10.0
const MAX_FAN_ANGLE: float = 15.0  # 扇形最大角度（度）
const ARC_RADIUS: float = 800.0    # 扇形弧线半径


func add_card(card_view: Control) -> void:
    add_child(card_view)
    card_views.append(card_view)
    _update_layout()


func remove_card(card_view: Control) -> void:
    card_views.erase(card_view)
    _update_layout()


func _update_layout() -> void:
    if _is_animating:
        return

    var count := card_views.size()
    if count == 0:
        return

    var center_x := size.x / 2.0
    var base_y := size.y - CARD_HEIGHT

    for i in range(count):
        var card: Control = card_views[i]
        var offset_from_center := i - (count - 1) / 2.0

        # 横向位置：均匀分布
        var x := center_x + offset_from_center * (CARD_WIDTH + CARD_SPACING) - CARD_WIDTH / 2.0

        # 扇形排列：越靠边越向上弯曲
        var angle_deg := offset_from_center * MAX_FAN_ANGLE / (count / 2.0) if count > 1 else 0.0
        var angle_rad := deg_to_rad(angle_deg)
        var y := base_y - abs(offset_from_center) * 10.0  # 轻微上弧

        var target_pos := Vector2(x, y)
        var target_rotation := angle_deg * 0.5

        # 动画过渡
        var tween := card.create_tween()
        tween.set_parallel(true)
        tween.tween_property(card, "position", target_pos, 0.2).set_ease(Tween.EASE_OUT)
        tween.tween_property(card, "rotation", deg_to_rad(target_rotation), 0.2).set_ease(Tween.EASE_OUT)
```

### 2.5 鼠标悬浮效果

```gdscript
# card_view.gd

func _on_mouse_entered() -> void:
    if state == CardViewState.DISABLED or state == CardViewState.DRAGGING:
        return
    card_hovered.emit(self)
    _hover_up()


func _on_mouse_exited() -> void:
    if state == CardViewState.DISABLED or state == CardViewState.DRAGGING:
        return
    card_unhovered.emit(self)
    _hover_down()


func _hover_up() -> void:
    z_index = 5
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(self, "position:y", position.y - 30, 0.1)
    tween.tween_property(self, "scale", Vector2(1.1, 1.1), 0.1)


func _hover_down() -> void:
    z_index = 0
    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(self, "position:y", original_position.y, 0.1)
    tween.tween_property(self, "scale", original_scale, 0.1)
```

## 3. 战斗 HUD 设计

### 3.1 EnergyDisplay

```gdscript
# scripts/ui/energy_display.gd
extends Control

@onready var current_label: Label = $CurrentLabel
@onready var max_label: Label = $MaxLabel
@onready var energy_icon: TextureRect = $EnergyIcon


func _ready() -> void:
    if BattleManager.energy_system:
        BattleManager.energy_system.energy_changed.connect(_on_energy_changed)


func _on_energy_changed(current: int, maximum: int) -> void:
    current_label.text = str(current)
    max_label.text = str(maximum)

    # 能量不足时变灰
    if current == 0:
        energy_icon.modulate = Color(0.5, 0.5, 0.5, 1.0)
    else:
        energy_icon.modulate = Color.WHITE
```

### 3.2 TurnIndicator

```gdscript
# scripts/ui/turn_indicator.gd
extends Control

@onready var label: Label = $Label
@onready var end_turn_button: Button = $EndTurnButton


func _ready() -> void:
    end_turn_button.pressed.connect(_on_end_turn_pressed)
    BattleManager.state_changed.connect(_on_battle_state_changed)


func _on_battle_state_changed(old_state: int, new_state: int) -> void:
    match new_state:
        BattleState.PLAYER_TURN:
            label.text = "你的回合"
            end_turn_button.disabled = false
            end_turn_button.visible = true
        BattleState.ENEMY_TURN:
            label.text = "敌人回合"
            end_turn_button.disabled = true
        BattleState.BATTLE_END:
            end_turn_button.visible = false
        _:
            pass


func _on_end_turn_pressed() -> void:
    if not GameState.input_enabled:
        return
    BattleManager.end_player_turn()
```

### 3.3 PileButtons（牌堆按钮）

```gdscript
# scripts/ui/pile_buttons.gd
extends HBoxContainer

@onready var draw_pile_button: Button = $DrawPileButton
@onready var discard_pile_button: Button = $DiscardPileButton


func _ready() -> void:
    BattleManager.deck_manager.hand_changed.connect(_on_hand_changed)
    draw_pile_button.pressed.connect(_on_draw_pile_clicked)
    discard_pile_button.pressed.connect(_on_discard_pile_clicked)


func _on_hand_changed(_hand: Array) -> void:
    var counts := BattleManager.deck_manager.get_pile_counts()
    draw_pile_button.text = "抽牌堆: %d" % counts.draw
    discard_pile_button.text = "弃牌堆: %d" % counts.discard


func _on_draw_pile_clicked() -> void:
    _show_pile_view(BattleManager.deck_manager.draw_pile)


func _on_discard_pile_clicked() -> void:
    _show_pile_view(BattleManager.deck_manager.discard_pile)


func _show_pile_view(pile: Array[CardData]) -> void:
    # 打开弹窗显示牌堆内容
    PopupManager.show_pile_view(pile)
```

## 4. 敌人意图展示

### 4.1 IntentDisplay 结构

```
IntentDisplay (HBoxContainer)
├── IntentIcon (TextureRect)             # 意图图标（剑/盾/增益/减益）
└── IntentValue (Label)                  # 数值文本
```

### 4.2 IntentDisplay 脚本

```gdscript
# scripts/ui/intent_display.gd
extends HBoxContainer

@onready var icon: TextureRect = $IntentIcon
@onready var value_label: Label = $IntentValue

const INTENT_ICONS: Dictionary = {
    IntentType.ATTACK: "res://assets/art/ui/intent_sword.png",
    IntentType.ATTACK_BUFF: "res://assets/art/ui/intent_sword_buff.png",
    IntentType.ATTACK_DEBUFF: "res://assets/art/ui/intent_sword_debuff.png",
    IntentType.DEFEND: "res://assets/art/ui/intent_shield.png",
    IntentType.DEFEND_BUFF: "res://assets/art/ui/intent_shield_buff.png",
    IntentType.BUFF: "res://assets/art/ui/intent_buff.png",
    IntentType.DEBUFF: "res://assets/art/ui/intent_debuff.png",
    IntentType.UNKNOWN: "res://assets/art/ui/intent_question.png",
    IntentType.SLEEP: "res://assets/art/ui/intent_sleep.png",
    IntentType.STUN: "res://assets/art/ui/intent_stun.png",
}


func update_intent(intent: Intent) -> void:
    if intent == null:
        visible = false
        return

    visible = true

    # 设置图标
    var icon_path: String = INTENT_ICONS.get(intent.intent_type, "")
    if icon_path:
        icon.texture = load(icon_path)

    # 设置数值
    if intent.value > 0:
        value_label.text = str(intent.value)
        value_label.visible = true
    else:
        value_label.visible = false

    # 攻击意图用红色，防御用蓝色，增益用绿色
    match intent.intent_type:
        IntentType.ATTACK, IntentType.ATTACK_BUFF, IntentType.ATTACK_DEBUFF, IntentType.ATTACK_DEFEND:
            value_label.add_theme_color_override("font_color", Color.RED)
        IntentType.DEFEND, IntentType.DEFEND_BUFF:
            value_label.add_theme_color_override("font_color", Color.CYAN)
        IntentType.BUFF:
            value_label.add_theme_color_override("font_color", Color.GREEN)
        IntentType.DEBUFF, IntentType.STRONG_DEBUFF:
            value_label.add_theme_color_override("font_color", Color.ORANGE)
        _:
            value_label.add_theme_color_override("font_color", Color.WHITE)
```

## 5. 弹窗与层级管理

### 5.1 PopupManager

```gdscript
# scripts/ui/popup_manager.gd
extends CanvasLayer

var _active_popup: Control = null
var _popup_stack: Array[Control] = []

@onready var dim_overlay: ColorRect = $DimOverlay


func _ready() -> void:
    layer = 20  # 最上层
    dim_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
    dim_overlay.color = Color(0, 0, 0, 0)


func show_popup(popup: Control) -> void:
    if _active_popup:
        _popup_stack.append(_active_popup)
        _active_popup.visible = false

    _active_popup = popup
    add_child(popup)
    _show_dim_overlay()
    GameState.set_input_enabled(false)


func close_popup() -> void:
    if _active_popup:
        _active_popup.queue_free()
        _active_popup = null

    if _popup_stack.size() > 0:
        _active_popup = _popup_stack.pop_back()
        _active_popup.visible = true
    else:
        _hide_dim_overlay()
        GameState.set_input_enabled(true)


func _show_dim_overlay() -> void:
    dim_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
    var tween := create_tween()
    tween.tween_property(dim_overlay, "color:a", 0.5, 0.2)


func _hide_dim_overlay() -> void:
    var tween := create_tween()
    tween.tween_property(dim_overlay, "color:a", 0.0, 0.2)
    tween.finished.connect(func(): dim_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE)
```

### 5.2 抽牌堆查看弹窗

```gdscript
# scripts/ui/pile_view_popup.gd
extends Control

signal closed()

@onready var grid: GridContainer = $Panel/MarginContainer/ScrollContainer/GridContainer
@onready var close_button: Button = $Panel/CloseButton

const CARD_VIEW_SMALL = preload("res://scenes/ui/card_view_small.tscn")


func setup(pile: Array[CardData], title: String = "牌堆") -> void:
    $Panel/TitleLabel.text = title

    for card: CardData in pile:
        var view := CARD_VIEW_SMALL.instantiate()
        view.setup(card)
        grid.add_child(view)

    close_button.pressed.connect(_on_close)


func _on_close() -> void:
    closed.emit()
    PopupManager.close_popup()
```

## 6. 信号流设计

### 6.1 UI 与逻辑的通信架构

```
逻辑层                                UI 层
──────                               ──────

BattleManager ────[Signal]────▶ BattleUI
  .state_changed                    ._on_state_changed()
  .battle_started                   ._on_battle_started()
  .battle_ended                     ._on_battle_ended()

DeckManager ─────[Signal]────▶ HandLayout + PileButtons
  .hand_changed                     ._update_hand()
  .card_drawn                       ._animate_card_draw()
  .card_discarded                   ._animate_card_discard()

EnergySystem ────[Signal]────▶ EnergyDisplay
  .energy_changed                   ._on_energy_changed()

EnemyEntity ─────[Signal]────▶ IntentDisplay + EnemyView
  .intent_changed                   ._update_intent()
  .hp_changed                       ._update_hp_bar()

BattleEntity ────[Signal]────▶ PlayerView / EnemyView
  .hp_changed                       ._update_hp_bar()
  .block_changed                    ._update_block_display()

StatusManager ──[Signal]────▶ StatusIcons
  .status_applied                   ._add_status_icon()
  .status_removed                   ._remove_status_icon()
  .status_changed                   ._update_stacks()

BattleUI ───────[方法调用]──▶ BattleManager
  (end_player_turn)                 end_turn_button.pressed
  (try_play_card)                   card_view.card_target_selected
```

### 6.2 用户操作到逻辑的调用路径

```
用户点击"结束回合"
  → EndTurnButton._pressed()
    → BattleManager.end_player_turn()

用户拖拽卡牌到目标
  → CardView._try_play_card()
    → CardView.card_target_selected.emit()
      → BattleUI._on_card_target_selected()
        → TargetSelector 确认目标
          → BattleManager.try_play_card(index, target)

用户点击敌人（目标选择模式）
  → EnemyView._gui_input()
    → TargetSelector.confirm_target()
      → TargetSelector.target_selected.emit()
        → BattleUI 继续卡牌打出流程
```

## 7. 输入管理与屏蔽

### 7.1 输入屏蔽策略

```gdscript
# GameState 管理全局输入状态
var input_enabled: bool = true
var input_block_reasons: Dictionary = {}  # reason -> bool


func block_input(reason: String) -> void:
    input_block_reasons[reason] = true
    input_enabled = false


func unblock_input(reason: String) -> void:
    input_block_reasons.erase(reason)
    if input_block_reasons.is_empty():
        input_enabled = true
```

### 7.2 需要屏蔽输入的场景

```
场景                    原因                     持续时间
──────────────────────────────────────────────────────────
动画播放中               防止操作冲突              动画时长
敌人回合                 玩家不可操作              整个敌人回合
弹窗打开                 模态对话框                弹窗存续期
场景切换                 防止重复切换              过渡动画时长
卡牌结算中               效果执行期间              效果链执行完
```

### 7.3 BattleUI 中的输入管理

```gdscript
# scripts/ui/battle_ui.gd
extends CanvasLayer

func _input(event: InputEvent) -> void:
    if not GameState.input_enabled:
        # 吞掉所有输入事件
        if event is InputEventMouseButton or event is InputEventKey:
            get_viewport().set_input_as_handled()
        return
```

### 7.4 动画队列

```gdscript
# scripts/ui/animation_controller.gd
extends Node

var _animation_queue: Array[Dictionary] = []
var _is_playing: bool = false


func queue_animation(anim_type: StringName, params: Dictionary) -> void:
    _animation_queue.append({
        type = anim_type,
        params = params,
    })
    if not _is_playing:
        _play_next()


func _play_next() -> void:
    if _animation_queue.is_empty():
        _is_playing = false
        return

    _is_playing = true
    var anim: Dictionary = _animation_queue.pop_front()

    match anim.type:
        &"card_draw":
            await _animate_card_draw(anim.params)
        &"card_play":
            await _animate_card_play(anim.params)
        &"damage":
            await _animate_damage(anim.params)
        &"block_gain":
            await _animate_block_gain(anim.params)
        &"status_apply":
            await _animate_status_apply(anim.params)

    _play_next()


func _animate_damage(params: Dictionary) -> void:
    var target: Node = params.target
    var amount: int = params.amount

    # 目标闪烁红色
    var tween := create_tween()
    tween.tween_property(target, "modulate", Color.RED, 0.05)
    tween.tween_property(target, "modulate", Color.WHITE, 0.15)

    # 弹出伤害数字
    _show_floating_number(target, str(amount), Color.RED)

    await tween.finished


func _animate_card_draw(params: Dictionary) -> void:
    var card_view: Control = params.card_view
    # 从抽牌堆位置飞到手牌位置
    var start_pos := Vector2(50, get_viewport().size.y / 2.0)
    card_view.position = start_pos
    card_view.modulate.a = 0.0

    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(card_view, "modulate:a", 1.0, 0.2)
    # 最终位置由 HandLayout 管理
    await tween.finished


func _show_floating_number(anchor: Node, text: String, color: Color) -> void:
    var label := Label.new()
    label.text = text
    label.add_theme_color_override("font_color", color)
    label.position = anchor.position + Vector2(0, -20)
    add_child(label)

    var tween := create_tween()
    tween.set_parallel(true)
    tween.tween_property(label, "position:y", label.position.y - 40, 0.6)
    tween.tween_property(label, "modulate:a", 0.0, 0.6).set_delay(0.3)
    tween.finished.connect(label.queue_free)
```
