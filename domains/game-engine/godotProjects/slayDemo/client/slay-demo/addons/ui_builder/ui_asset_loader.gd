class_name UIAssetLoader

const ASSETS_PATH := "res://ui_manifest/manifest.assets.json"

static var _cache: Dictionary = {}
static var _assets: Dictionary = {}
static var _loaded := false


static func load_texture(asset_key: String) -> Texture2D:
	if _cache.has(asset_key):
		return _cache[asset_key]
	var path := resolve_path(asset_key)
	if path.is_empty():
		return null
	if not FileAccess.file_exists(path):
		push_warning("UIAssetLoader: 文件不存在 key=%s path=%s" % [asset_key, path])
		return null
	var tex := load(path) as Texture2D
	_cache[asset_key] = tex
	return tex


static func resolve_path(asset_key: String) -> String:
	_ensure_loaded()
	var parts := asset_key.split(".")
	var node: Variant = _assets
	for part in parts:
		if node is Dictionary and node.has(part):
			node = node[part]
		else:
			push_warning("UIAssetLoader: key 不存在 '%s'" % asset_key)
			return ""
	if node is String:
		return node
	if node is Dictionary and node.has("normal"):
		return node["normal"]
	if node is Dictionary and node.has("path"):
		return node["path"]
	push_warning("UIAssetLoader: key '%s' 不是路径字符串" % asset_key)
	return ""


static func get_nine_patch(asset_key: String) -> Array:
	_ensure_loaded()
	var parts := asset_key.split(".")
	var node: Variant = _assets
	for part in parts:
		if node is Dictionary and node.has(part):
			node = node[part]
		else:
			return []
	if node is Dictionary and node.has("nine_patch"):
		return node["nine_patch"]
	return []


static func _ensure_loaded() -> void:
	if _loaded:
		return
	_loaded = true
	var file := FileAccess.open(ASSETS_PATH, FileAccess.READ)
	if file == null:
		push_warning("UIAssetLoader: 找不到 manifest.assets.json")
		return
	var json := JSON.new()
	var err := json.parse(file.get_as_text())
	file.close()
	if err != OK:
		push_warning("UIAssetLoader: manifest.assets.json 解析失败")
		return
	_assets = json.data


static func clear_cache() -> void:
	_cache.clear()
	_assets.clear()
	_loaded = false
