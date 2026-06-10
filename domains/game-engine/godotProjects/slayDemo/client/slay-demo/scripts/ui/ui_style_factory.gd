## 全局 UI 样式工厂 — 粉紫马卡龙主题
## 所有场景共用，避免在各个 scene 里重复定义按钮/面板样式。
##
## 用法：
##   const UIStyleFactory := preload("res://scripts/ui/ui_style_factory.gd")
##   var btn := UIStyleFactory.make_pink_button("确认", Vector2(200, 48))

extends RefCounted
class_name UIStyleFactory


# ── 色板常量（全场景统一） ──────────────────
const CLR_PINK        := Color(0.95, 0.55, 0.65)
const CLR_PINK_LIGHT  := Color(1.0, 0.71, 0.76)
const CLR_GOLD        := Color(1.0, 0.84, 0.0)
const CLR_TEXT_WARM   := Color(0.98, 0.92, 0.82)
const CLR_PANEL_BG    := Color(0.14, 0.10, 0.22, 0.88)
const CLR_BORDER      := Color(0.55, 0.35, 0.70, 0.90)
const CLR_TINT        := Color(0.04, 0.02, 0.06, 0.35)
const CLR_HP_PINK     := Color(0.95, 0.45, 0.55)
const CLR_BLOCK_BLUE  := Color(0.52, 0.82, 1.0)
const CLR_ENERGY_BLUE := Color(0.72, 0.94, 1.0)
const CLR_ACTION_BG   := Color(0.25, 0.20, 0.32, 0.85)
const CLR_ACTION_BORDER := Color(0.45, 0.38, 0.55, 0.8)
const CLR_ACTION_TEXT := Color(0.88, 0.82, 0.92)


# ── 按钮：粉金主按钮（确认/购买/回血等） ─────
static func make_pink_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var s := StyleBoxFlat.new()
	s.bg_color = CLR_PINK
	s.border_color = CLR_GOLD
	s.set_border_width_all(2)
	s.set_corner_radius_all(14)
	s.content_margin_left = 12
	s.content_margin_top = 6
	s.content_margin_right = 12
	s.content_margin_bottom = 6
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_color_override("font_color", Color(1.0, 1.0, 1.0))
	btn.add_theme_color_override("font_hover_color", CLR_GOLD)
	btn.add_theme_font_size_override("font_size", 16)

	var hover := s.duplicate() as StyleBoxFlat
	hover.bg_color = Color(1.0, 0.65, 0.72)
	btn.add_theme_stylebox_override("hover", hover)

	var disabled := s.duplicate() as StyleBoxFlat
	disabled.bg_color = Color(0.4, 0.35, 0.42, 0.7)
	disabled.border_color = Color(0.5, 0.45, 0.55, 0.5)
	btn.add_theme_stylebox_override("disabled", disabled)

	return btn


# ── 按钮：灰色次要按钮（返回/取消/跳过等） ───
static func make_action_button(text: String, min_size: Vector2) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = min_size
	var s := StyleBoxFlat.new()
	s.bg_color = CLR_ACTION_BG
	s.border_color = CLR_ACTION_BORDER
	s.set_border_width_all(1)
	s.set_corner_radius_all(14)
	s.content_margin_left = 12
	s.content_margin_top = 6
	s.content_margin_right = 12
	s.content_margin_bottom = 6
	btn.add_theme_stylebox_override("normal", s)
	btn.add_theme_color_override("font_color", CLR_ACTION_TEXT)
	btn.add_theme_font_size_override("font_size", 16)

	var hover := s.duplicate() as StyleBoxFlat
	hover.bg_color = Color(0.35, 0.28, 0.42, 0.92)
	btn.add_theme_stylebox_override("hover", hover)

	return btn


# ── 面板样式：浅紫 + 金边（商品卡片/遗物展示） ──
static func make_card_panel_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = CLR_PANEL_BG
	s.border_color = Color(0.85, 0.70, 0.30, 0.85)
	s.set_border_width_all(2)
	s.set_corner_radius_all(12)
	s.content_margin_left = 10
	s.content_margin_top = 8
	s.content_margin_right = 10
	s.content_margin_bottom = 8
	return s


# ── 事件/商店选项卡：浅色纸张 + 粉金边 ────────
static func make_choice_panel_style() -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(1.0, 0.90, 0.78, 0.94)
	s.border_color = Color(0.88, 0.58, 0.72, 0.92)
	s.set_border_width_all(2)
	s.set_corner_radius_all(16)
	s.content_margin_left = 16
	s.content_margin_top = 14
	s.content_margin_right = 16
	s.content_margin_bottom = 14
	return s


# ── 小圆按钮样式（右上角帮助/设置） ────────
static func make_round_btn_style(color: Color) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = color
	s.set_corner_radius_all(16)
	return s


# ── 通用深色面板样式（玩家面板/状态栏背景） ──
static func make_panel_style(bg_color: Color = CLR_PANEL_BG,
		border_color: Color = CLR_BORDER,
		radius: int = 8,
		border_w: int = 1) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg_color
	s.border_color = border_color
	s.set_border_width_all(border_w)
	s.set_corner_radius_all(radius)
	s.content_margin_left = 6
	s.content_margin_top = 4
	s.content_margin_right = 6
	s.content_margin_bottom = 4
	return s
