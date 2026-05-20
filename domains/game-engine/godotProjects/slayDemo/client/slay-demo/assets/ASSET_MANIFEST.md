# SlayDemo Curated Asset Manifest

## Directory Policy

- Art, UI, fonts, and audio live in `res://assets/`.
- Godot data resources such as `.tres`, global themes, and color tokens should stay in `res://resources/`.
- This folder contains only normalized, project-ready assets. Raw downloaded packs were removed after extracting the small subset needed for the MVP.
- Game code should reference only the paths listed below.

## Selection Rationale

- Keep assets that support the current MVP loop: main menu, map, battle, rewards, one warrior, 6-8 enemies, card UI, intent icons, health/energy UI, and basic VFX/audio feedback.
- Prefer static sprites plus Godot Tween/particles over large animation sheets.
- Keep `ChakraPetch` for stylized Latin/card numbers and `NotoSansSC` for Chinese UI text.
- Remove raw third-party packs, unused boardgame pieces, bulk icon variants, unused particle sheets, unused UI skin variants, and redundant fonts.

## Ready-To-Use Paths

### Cards

- `res://assets/card/templates/card_template_common.png`
- `res://assets/card/templates/card_template_uncommon.png`
- `res://assets/card/templates/card_template_rare.png`
- `res://assets/card/templates/card_template_legendary.png`
- `res://assets/card/templates/card_back.png`
- `res://assets/card/templates/cost_crystal.png`
- `res://assets/card/icons/card_icon_attack.png`
- `res://assets/card/icons/card_icon_skill.png`
- `res://assets/card/icons/card_icon_power.png`
- `res://assets/card/icons/card_icon_strike.png`
- `res://assets/card/icons/card_icon_defend.png`
- `res://assets/card/icons/card_icon_buff.png`
- `res://assets/card/icons/card_icon_debuff.png`

### UI

- `res://assets/ui/buttons/ui_btn_normal.png`
- `res://assets/ui/buttons/ui_btn_hover.png`
- `res://assets/ui/buttons/ui_btn_pressed.png`
- `res://assets/ui/buttons/ui_btn_disabled.png`
- `res://assets/ui/panels/ui_panel_dark.png`
- `res://assets/ui/panels/ui_panel_light.png`
- `res://assets/ui/bars/ui_hp_bar_bg.png`
- `res://assets/ui/bars/ui_hp_bar_fill.png`
- `res://assets/ui/bars/ui_block_bar_fill.png`
- `res://assets/ui/icons/ui_energy_crystal.png`
- `res://assets/ui/icons/ui_energy_base.png`

### Intents And Icons

- `res://assets/ui/intents/intent_sword.png`
- `res://assets/ui/intents/intent_shield.png`
- `res://assets/ui/intents/intent_buff.png`
- `res://assets/ui/intents/intent_debuff.png`
- `res://assets/ui/intents/intent_question.png`
- `res://assets/ui/intents/intent_stun.png`
- `res://assets/ui/icons/icon_settings.png`
- `res://assets/ui/icons/icon_audio_on.png`
- `res://assets/ui/icons/icon_audio_off.png`
- `res://assets/ui/icons/icon_close.png`
- `res://assets/ui/icons/icon_question.png`
- `res://assets/ui/icons/icon_shop.png`
- `res://assets/ui/icons/icon_elite.png`
- `res://assets/ui/icons/icon_boss.png`

### Characters And Enemies

- `res://assets/player/sprites/player_warrior_idle.png`
- `res://assets/player/portrait/player_portrait.png`
- `res://assets/enemies/slime/enemy_slime_idle.png`
- `res://assets/enemies/skeleton/enemy_skeleton_idle.png`
- `res://assets/enemies/mushroom/enemy_mushroom_idle.png`
- `res://assets/enemies/bat/enemy_bat_idle.png`
- `res://assets/enemies/gargoyle/enemy_gargoyle_idle.png`
- `res://assets/enemies/shadow_mage/enemy_shadow_mage_idle.png`
- `res://assets/enemies/corrupted_knight/enemy_corrupted_knight_idle.png`
- `res://assets/enemies/ancient_dragon/enemy_ancient_dragon_idle.png`

### Backgrounds, VFX, Fonts, Audio

- `res://assets/backgrounds/bg_battle_dungeon.png`
- `res://assets/backgrounds/bg_battle_cave.png`
- `res://assets/backgrounds/bg_battle_boss.png`
- `res://assets/backgrounds/bg_main_menu.png`
- `res://assets/backgrounds/bg_map.png`
- `res://assets/vfx/particles/particle_spark.png`
- `res://assets/vfx/particles/particle_fire.png`
- `res://assets/vfx/particles/particle_poison.png`
- `res://assets/vfx/particles/particle_shield.png`
- `res://assets/vfx/effects/hit_slash.png`
- `res://assets/vfx/effects/magic_burst.png`
- `res://assets/fonts/ChakraPetch-Regular.ttf`
- `res://assets/fonts/ChakraPetch-Bold.ttf`
- `res://assets/fonts/NotoSansSC-VariableFont_wght.ttf`
- `res://assets/audio/sfx/card_place_1.ogg`
- `res://assets/audio/sfx/card_slide_1.ogg`

## Notes

- Enemy/player/background/card-template PNGs are functional placeholders, not final art.
- The normalized files are enough for MVP UI binding and combat-scene placeholders.
- When replacing placeholders with final art, preserve the same filenames to avoid code churn.
- License/provenance records are kept in `res://assets/LICENSES.txt`.
