# LockerRoomAthlete.gd - CricStrike 3D
# 3D Humanoid Athlete for Locker Room Pedestal Inspection & Real-time Customization
class_name LockerRoomAthlete
extends Node3D

const PlayerProfile = preload("res://scripts/player/player_profile.gd")

@onready var ty_model: Node3D = get_node_or_null("TyModel")
@onready var bat_pivot: Node3D = get_node_or_null("BatPivot")

var anim_player: AnimationPlayer
var _upper_mat: StandardMaterial3D
var _lower_mat: StandardMaterial3D
var _skin_mat: StandardMaterial3D
var _bat_mat: StandardMaterial3D

func _ready() -> void:
	_setup_materials()
	_setup_animations()

func _setup_materials() -> void:
	_upper_mat = StandardMaterial3D.new()
	_upper_mat.roughness = 0.6
	
	_lower_mat = StandardMaterial3D.new()
	_lower_mat.roughness = 0.7
	
	_skin_mat = StandardMaterial3D.new()
	_skin_mat.roughness = 0.75
	
	_bat_mat = StandardMaterial3D.new()
	_bat_mat.roughness = 0.45

	var upper_geo = find_child("Boy01_UpperBody_Geo", true, false)
	if upper_geo and upper_geo is MeshInstance3D:
		upper_geo.set_surface_override_material(0, _upper_mat)

	var lower_geo = find_child("Boy01_LowerBody_Geo", true, false)
	if lower_geo and lower_geo is MeshInstance3D:
		lower_geo.set_surface_override_material(0, _lower_mat)

	var head_geo = find_child("Boy01_Head_Geo", true, false)
	if head_geo and head_geo is MeshInstance3D:
		head_geo.set_surface_override_material(0, _skin_mat)

	var hands_geo = find_child("Boy01_Hands_Geo", true, false)
	if hands_geo and hands_geo is MeshInstance3D:
		hands_geo.set_surface_override_material(0, _skin_mat)

	var blade = find_child("Blade", true, false)
	if blade and blade is MeshInstance3D:
		blade.set_surface_override_material(0, _bat_mat)

func _setup_animations() -> void:
	var players := find_children("", "AnimationPlayer", true, false)
	if players.size() > 0:
		anim_player = players[0] as AnimationPlayer
	else:
		var skels := find_children("", "Skeleton3D", true, false)
		if skels.size() > 0:
			var parent_node := skels[0].get_parent()
			anim_player = AnimationPlayer.new()
			anim_player.name = "AnimationPlayer"
			parent_node.add_child(anim_player)
			
	if anim_player:
		var lib: AnimationLibrary = load("res://assets/animations/cricket_animations.tres")
		if lib:
			if anim_player.has_animation_library(""):
				anim_player.remove_animation_library("")
			anim_player.add_animation_library("", lib)
		if anim_player.has_animation("stance"):
			anim_player.play("stance")

	# Reparent bat to right hand bone
	var skels := find_children("", "Skeleton3D", true, false)
	if skels.size() > 0 and bat_pivot:
		var skel: Skeleton3D = skels[0] as Skeleton3D
		var hand_bone := skel.find_bone("mixamorig_RightHand")
		if hand_bone >= 0 and bat_pivot.get_parent() != skel:
			var bone_attach = BoneAttachment3D.new()
			bone_attach.bone_name = "mixamorig_RightHand"
			skel.add_child(bone_attach)
			bat_pivot.reparent(bone_attach)
			bat_pivot.position = Vector3(0.04, -0.05, 0.08)
			bat_pivot.rotation_degrees = Vector3(15.0, 45.0, -90.0)

func apply_profile(profile: PlayerProfile) -> void:
	if profile == null:
		return
	if ty_model and ty_model.has_method("apply_profile"):
		ty_model.apply_profile(profile)
	if _upper_mat == null:
		_setup_materials()
		
	# 1. Build Scale
	scale = profile.get_build_scale()
	
	# 2. Jersey Colors
	if _upper_mat:
		_upper_mat.albedo_color = profile.jersey_primary_color
	if _lower_mat:
		_lower_mat.albedo_color = profile.trousers_color
		
	# 3. Skin Tone
	if _skin_mat:
		_skin_mat.albedo_color = profile.get_skin_color()
		
	# 4. Bat Willow
	if _bat_mat:
		_bat_mat.albedo_color = profile.get_bat_color()
