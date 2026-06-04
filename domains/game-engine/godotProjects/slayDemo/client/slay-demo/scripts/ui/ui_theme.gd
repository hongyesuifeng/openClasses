## 全局 UI 字体主题
## 用法：
##   label.add_theme_font_override("font", UITheme.font_cn())
##   label.add_theme_font_override("font", UITheme.font_en())

extends RefCounted
class_name UITheme

const FONT_CN_PATH := "res://assets/fonts/NotoSansSC-VariableFont_wght.ttf"
const FONT_EN_PATH := "res://assets/fonts/ChakraPetch-Regular.ttf"
const FONT_EN_BOLD_PATH := "res://assets/fonts/ChakraPetch-Bold.ttf"

## 中文字体（NotoSansSC，覆盖中英文）
static func font_cn() -> FontFile:
	return ResourceLoader.load(FONT_CN_PATH, "FontFile") as FontFile


## 英文/数字字体（ChakraPetch Regular，用于数值/按钮）
static func font_en() -> FontFile:
	return ResourceLoader.load(FONT_EN_PATH, "FontFile") as FontFile


## 英文粗体（ChakraPetch Bold，用于标题）
static func font_en_bold() -> FontFile:
	return ResourceLoader.load(FONT_EN_BOLD_PATH, "FontFile") as FontFile


## 给 Label 应用中文字体（一行快捷方式）
static func apply_cn(label: Label) -> void:
	var f := font_cn()
	if f != null:
		label.add_theme_font_override("font", f)


## 给 Label 应用英文粗体（标题用）
static func apply_en_bold(label: Label) -> void:
	var f := font_en_bold()
	if f != null:
		label.add_theme_font_override("font", f)
