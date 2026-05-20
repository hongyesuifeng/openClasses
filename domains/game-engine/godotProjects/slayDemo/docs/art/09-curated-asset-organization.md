# Curated Asset Organization

> Applies to `client/slay-demo/assets/`.

## Design Basis

SlayDemo is a learning-focused, Slay-the-Spire-like card roguelike MVP. The current playable target is one warrior, one Act, 6-8 enemies, card combat, map progression, rewards, and basic UI feedback.

For this stage, assets should make the prototype readable before they make it visually final. The selected set therefore favors:

- Static player/enemy placeholders that can be animated with Tween.
- Card templates, card icons, intent icons, HP/block/energy UI, and panels/buttons.
- A small set of battle/menu/map backgrounds.
- Minimal hit/particle VFX and card interaction audio.
- Two fonts: `ChakraPetch` for stylized Latin/card numbers and `NotoSansSC` for Chinese UI.

## Kept Categories

| Directory | Purpose | Notes |
| --- | --- | --- |
| `assets/card/templates/` | Card fronts, card back, cost crystal | Keep filenames stable when replacing art. |
| `assets/card/icons/` | MVP card type/action icons | Use icon + color block instead of full illustration for now. |
| `assets/player/` | Warrior sprite and portrait | One character only for MVP. |
| `assets/enemies/` | Static enemy placeholders | Covers the current art enemy list. |
| `assets/ui/` | Buttons, panels, bars, map icons, intent icons | Enough for menu, battle HUD, map, rewards, and dialogs. |
| `assets/backgrounds/` | Main menu, map, dungeon/cave/Boss battle backgrounds | Background count stays intentionally small. |
| `assets/vfx/` | Basic particles and hit effects | Godot particle/tween logic should do most of the work. |
| `assets/audio/sfx/` | Card place/slide sounds | Small feedback layer for card interactions. |
| `assets/fonts/` | `ChakraPetch`, `NotoSansSC` | Removed redundant display/body fonts. |

## Removed Assets

The raw `assets/third_party/` download packs were removed because project-ready normalized copies already exist in the directories above. This deleted bulk unused variants such as boardgame pieces, dice/chips/card suits, large particle sheets, unused UI skins, unused icon variants, zip archives, source package metadata, and non-MVP engine exports.

Unused fonts were also removed:

- `KenneyFuture.ttf`
- `KenneyFutureNarrow.ttf`
- `Roboto-VariableFont_wdth,wght.ttf`

## Usage Rules

- Runtime code should reference `res://assets/...` normalized paths only.
- Do not reference raw source-pack paths; they are no longer part of the project.
- When replacing placeholders with final art, preserve existing filenames where possible.
- If a new asset is added, update `client/slay-demo/assets/ASSET_MANIFEST.md` and `client/slay-demo/assets/LICENSES.txt`.
- Godot `.tres`, themes, color tokens, and game data belong in `client/slay-demo/resources/`, not `assets/`.

