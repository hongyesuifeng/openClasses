# SlayDemo Art Documentation Review

## Findings

- `assets/` and `resources/` are mixed in the docs. Use `assets/` for art/audio/fonts and `resources/` for Godot `.tres` data, Theme, and color-token resources.
- Enemy naming is inconsistent. `design/03-enemy-design.md` uses different names from the art docs. The canonical name mapping is: 布丁怪 (slime), 泡泡蝙蝠 (bat), 见习巫女 (shadow_mage), 棉花甲士 (skeleton), 暴走熊 (gargoyle), 星座魔女 (necromancer), 布偶守卫 (stone_guardian), 布丁女王 (slime_king), 狂暴糖果熊 (orc_berserker), 甜心骑士长 (corrupted_knight), 星愿守护龙 (ancient_dragon). Reconcile before wiring EnemyData to art paths.
- P0 art scope is too large for an MVP. The docs mark many animated sprites, UI skins, backgrounds, and icons as P0 even though several sections also say Tween/code placeholders are acceptable. Treat static enemy/player images, basic card templates, health/energy UI, intent icons, one battle background, and one particle texture as the real MVP P0.
- Some file paths in tech docs still point to `res://assets/art/...`, but the art docs use `assets/ui`, `assets/vfx`, and `assets/enemies`. Standardize to the flatter paths now present under `client/slay-demo/assets/`.
- Authorization guidance is correct, but it should point to `client/slay-demo/assets/LICENSES.txt`, not a vague `assets/LICENSES.txt` outside the Godot project root.
- The visual direction is chibi cartoon / kawaii (macaroon pastel palette), while several suggested third-party sources are pixel-art-heavy or dark-fantasy-themed. For the current MVP, use third-party assets for UI/icons/VFX and project-generated placeholders for characters/enemies to keep the style coherent. Prefer sources with cute, round, pastel-friendly styles.

## Implemented Resolution

- Created `client/slay-demo/assets/` and populated it with normalized project-ready resources.
- Removed original third-party downloads after extracting the small MVP subset needed by the project.
- Added `client/slay-demo/assets/LICENSES.txt` with source, author, license, and usage records.
- Added `client/slay-demo/assets/ASSET_MANIFEST.md` with ready-to-use `res://assets/...` paths.
- Left `client/slay-demo/resources/` available for Godot data resources only.
- Added `docs/art/09-curated-asset-organization.md` to document the final asset categories and pruning rationale.

## Recommended Follow-Up

- Update tech and art docs to reference the paths in `assets/ASSET_MANIFEST.md`.
- Reconcile enemy names between design docs and art docs before implementing `EnemyData.icon` or sprite path fields.
- Replace generated placeholder enemies/backgrounds with final art later while keeping filenames stable.
