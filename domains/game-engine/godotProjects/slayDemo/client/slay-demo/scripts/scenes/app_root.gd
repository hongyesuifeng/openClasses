extends Node


func _ready() -> void:
	var data_loader: Variant = _autoload("DataLoader")
	var scene_router: Variant = _autoload("SceneRouter")
	data_loader.load_all()
	var errors: PackedStringArray = data_loader.validate_all()
	if not errors.is_empty():
		for error in errors:
			push_error(error)
		return

	scene_router.call_deferred("go_to", "main_menu")


func _autoload(autoload_name: String) -> Variant:
	return get_node_or_null("/root/%s" % autoload_name)
