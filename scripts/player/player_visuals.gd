# PlayerVisuals.gd - CricStrike 3D
# Complete High-End 3D Athletic Cricket Player Character
# Professional proportions, dynamic equipment rigging, team kits, and upright procedural animations
class_name PlayerVisuals
extends Node3D

const PlayerProfile = preload("res://scripts/player/player_profile.gd")

@export var profile: PlayerProfile
@export var current_role: String = "batsman"

# Hierarchy references
var root_rig: Node3D
var torso_mesh: MeshInstance3D
var head_mesh: MeshInstance3D
var neck_mesh: MeshInstance3D
var left_leg: MeshInstance3D
var right_leg: MeshInstance3D
var left_pad: MeshInstance3D
var right_pad: MeshInstance3D
var left_boot: MeshInstance3D
var right_boot: MeshInstance3D
var hair_mesh: MeshInstance3D
var beard_mesh: MeshInstance3D
var helmet_mesh: MeshInstance3D
var grill_mesh: MeshInstance3D
var helmet_peak: MeshInstance3D
var bat_blade: MeshInstance3D
var bat_handle: MeshInstance3D
var bat_sticker: MeshInstance3D
var bat_pivot: Node3D
var ball_in_hand: MeshInstance3D
var jersey_text_label: Label3D
var left_arm: Node3D
var right_arm: Node3D
var left_glove: MeshInstance3D
var right_glove: MeshInstance3D
var left_thigh: Node3D
var right_thigh: Node3D

var _anim_name: String = "stance"
var _anim_time: float = 0.0
var _initial_bat_rot: Vector3 = Vector3(15.0, 45.0, -90.0)

func _ready() -> void:
	_resolve_nodes()
	if profile == null:
		profile = PlayerProfile.new()
		profile.load_from_file()
	apply_profile(profile)
	configure_role(current_role)

func _resolve_nodes() -> void:
	root_rig = find_child("Rig", true, false) as Node3D
	torso_mesh = find_child("Torso", true, false) as MeshInstance3D
	head_mesh = find_child("Head", true, false) as MeshInstance3D
	neck_mesh = find_child("Neck", true, false) as MeshInstance3D
	hair_mesh = find_child("Hair", true, false) as MeshInstance3D
	beard_mesh = find_child("Beard", true, false) as MeshInstance3D
	helmet_mesh = find_child("Helmet", true, false) as MeshInstance3D
	grill_mesh = find_child("Grill", true, false) as MeshInstance3D
	helmet_peak = find_child("Peak", true, false) as MeshInstance3D
	left_leg = find_child("LeftLeg", true, false) as MeshInstance3D
	right_leg = find_child("RightLeg", true, false) as MeshInstance3D
	left_pad = find_child("LeftPad", true, false) as MeshInstance3D
	right_pad = find_child("RightPad", true, false) as MeshInstance3D
	left_boot = find_child("LeftBoot", true, false) as MeshInstance3D
	right_boot = find_child("RightBoot", true, false) as MeshInstance3D
	bat_pivot = find_child("BatPivot", true, false) as Node3D
	bat_blade = find_child("Blade", true, false) as MeshInstance3D
	bat_handle = find_child("Handle", true, false) as MeshInstance3D
	bat_sticker = find_child("Sticker", true, false) as MeshInstance3D
	ball_in_hand = find_child("BallInHand", true, false) as MeshInstance3D
	jersey_text_label = find_child("JerseyBackLabel", true, false) as Label3D
	left_arm = find_child("LeftUpperArm", true, false) as Node3D
	right_arm = find_child("RightUpperArm", true, false) as Node3D
	left_glove = find_child("LeftGlove", true, false) as MeshInstance3D
	right_glove = find_child("RightGlove", true, false) as MeshInstance3D
	left_thigh = find_child("LeftThigh", true, false) as Node3D
	right_thigh = find_child("RightThigh", true, false) as Node3D
	if bat_pivot:
		_initial_bat_rot = bat_pivot.rotation_degrees

func apply_profile(p_profile: PlayerProfile) -> void:
	profile = p_profile
	_resolve_nodes()
	if root_rig == null:
		return
		
	# 1. Apply Build Bone/Node Scaling
	root_rig.scale = profile.get_build_scale()
	
	# 2. Skin Material
	var skin_color: Color = profile.get_skin_color()
	if head_mesh: _set_mesh_color(head_mesh, skin_color, 0.7)
	if neck_mesh: _set_mesh_color(neck_mesh, skin_color, 0.7)
		
	# 3. Jersey & Number
	if torso_mesh:
		_set_mesh_color(torso_mesh, profile.jersey_primary_color, 0.6)
		
	if jersey_text_label:
		jersey_text_label.text = "%s\n%d" % [profile.player_name.to_upper(), profile.jersey_number]
		jersey_text_label.modulate = profile.jersey_accent_color
		
	# 4. Trousers (Legs)
	if left_leg: _set_mesh_color(left_leg, profile.trousers_color, 0.7)
	if right_leg: _set_mesh_color(right_leg, profile.trousers_color, 0.7)
		
	# 5. Batting Pads
	if left_pad: _set_mesh_color(left_pad, profile.pads_color, 0.5)
	if right_pad: _set_mesh_color(right_pad, profile.pads_color, 0.5)
		
	# 6. Hair & Beard Visibility / Shapes
	_apply_hair_and_beard()
	
	# 7. Helmet & Grill
	if helmet_mesh: _set_mesh_color(helmet_mesh, profile.helmet_color, 0.4)
	if grill_mesh: grill_mesh.visible = profile.has_face_grill
		
	# 8. Bat & Stickers
	if bat_blade: _set_mesh_color(bat_blade, profile.get_bat_color(), 0.45)
	if bat_sticker: _apply_bat_sticker()

func configure_role(role: String) -> void:
	current_role = role.to_lower()
	_resolve_nodes()
	
	match current_role:
		"batsman":
			if helmet_mesh: helmet_mesh.visible = true
			if left_pad: left_pad.visible = true
			if right_pad: right_pad.visible = true
			if left_glove: left_glove.visible = true
			if right_glove: right_glove.visible = true
			if bat_pivot: bat_pivot.visible = true
			if ball_in_hand: ball_in_hand.visible = false
			play_anim("stance")
			
		"bowler":
			if helmet_mesh: helmet_mesh.visible = false
			if left_pad: left_pad.visible = false
			if right_pad: right_pad.visible = false
			if left_glove: left_glove.visible = false
			if right_glove: right_glove.visible = false
			if bat_pivot: bat_pivot.visible = false
			if ball_in_hand: ball_in_hand.visible = true
			play_anim("stance")
			
		"fielder":
			if helmet_mesh: helmet_mesh.visible = false
			if left_pad: left_pad.visible = false
			if right_pad: right_pad.visible = false
			if left_glove: left_glove.visible = false
			if right_glove: right_glove.visible = false
			if bat_pivot: bat_pivot.visible = false
			if ball_in_hand: ball_in_hand.visible = false
			play_anim("stance")
			
		"wicketkeeper":
			if helmet_mesh: helmet_mesh.visible = true
			if left_pad: left_pad.visible = true
			if right_pad: right_pad.visible = true
			if left_glove: left_glove.visible = true
			if right_glove: right_glove.visible = true
			if bat_pivot: bat_pivot.visible = false
			if ball_in_hand: ball_in_hand.visible = false
			play_anim("keeper")
			
		"umpire":
			if helmet_mesh: helmet_mesh.visible = false
			if left_pad: left_pad.visible = false
			if right_pad: right_pad.visible = false
			if left_glove: left_glove.visible = false
			if right_glove: right_glove.visible = false
			if bat_pivot: bat_pivot.visible = false
			if ball_in_hand: ball_in_hand.visible = false
			# Umpire attire: light blue shirt and black pants
			if torso_mesh: _set_mesh_color(torso_mesh, Color(0.35, 0.65, 0.95), 0.6)
			if left_leg: _set_mesh_color(left_leg, Color(0.12, 0.12, 0.14), 0.8)
			if right_leg: _set_mesh_color(right_leg, Color(0.12, 0.12, 0.14), 0.8)
			play_anim("stance")

func play_anim(anim_name: String) -> void:
	_anim_name = anim_name.to_lower()
	_anim_time = 0.0

func _process(delta: float) -> void:
	_anim_time += delta
	_update_procedural_animation(delta)

func _update_procedural_animation(delta: float) -> void:
	# Enforce strictly upright posture: rotation.x = 0, rotation.z = 0
	rotation.x = 0.0
	rotation.z = 0.0
	
	match _anim_name:
		"stance":
			if current_role == "batsman" and bat_pivot and bat_pivot.visible:
				# Rhythmic natural bat tap on turf
				var tap := sin(_anim_time * 5.0) * 8.0
				bat_pivot.rotation_degrees.x = _initial_bat_rot.x + maxf(0.0, tap)
				if left_arm: left_arm.rotation_degrees.z = 15.0 + sin(_anim_time * 2.5) * 2.0
				if right_arm: right_arm.rotation_degrees.z = -15.0 - sin(_anim_time * 2.5) * 2.0
			elif current_role == "wicketkeeper":
				# Keeper crouch breathing
				var bob := sin(_anim_time * 3.0) * 0.02
				if root_rig: root_rig.position.y = -0.22 + bob
			else:
				# Athletic alert breathing
				var breath := sin(_anim_time * 2.0) * 0.015
				if root_rig: root_rig.position.y = breath
				
		"sprint", "runup":
			var run_speed: float = 12.0 if _anim_name == "sprint" else 10.0
			var leg_stride := sin(_anim_time * run_speed) * 32.0
			var arm_swing := cos(_anim_time * run_speed) * 35.0
			
			if left_thigh: left_thigh.rotation_degrees.x = leg_stride
			if right_thigh: right_thigh.rotation_degrees.x = -leg_stride
			if left_arm: left_arm.rotation_degrees.x = -arm_swing
			if right_arm: right_arm.rotation_degrees.x = arm_swing
			
		"keeper":
			if left_thigh: left_thigh.rotation_degrees.x = 35.0
			if right_thigh: right_thigh.rotation_degrees.x = 35.0
			if root_rig: root_rig.position.y = -0.25
			
		"umpire_out":
			# Raise right arm index finger
			if right_arm:
				right_arm.rotation_degrees.x = lerpf(right_arm.rotation_degrees.x, 170.0, delta * 6.0)

func _set_mesh_color(mesh_inst: MeshInstance3D, col: Color, roughness: float = 0.5) -> void:
	if mesh_inst == null:
		return
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.roughness = roughness
	mesh_inst.material_override = mat

func _apply_hair_and_beard() -> void:
	if hair_mesh:
		hair_mesh.visible = (profile.hair_style_index > 0)
		if hair_mesh.visible:
			match profile.hair_style_index:
				1: hair_mesh.scale = Vector3(1.02, 1.02, 1.02)
				2: hair_mesh.scale = Vector3(1.06, 1.15, 1.06)
				_: hair_mesh.scale = Vector3.ONE
	
	if beard_mesh:
		beard_mesh.visible = (profile.beard_style_index > 0)
		if beard_mesh.visible:
			match profile.beard_style_index:
				1: beard_mesh.scale = Vector3(1.01, 0.85, 1.02)
				2: beard_mesh.scale = Vector3(1.05, 1.10, 1.05)
				_: beard_mesh.scale = Vector3.ONE

func _apply_bat_sticker() -> void:
	if bat_sticker == null:
		return
	var sticker_mat := StandardMaterial3D.new()
	match profile.bat_sticker_index:
		0: sticker_mat.albedo_color = Color(0.85, 0.20, 0.15, 1.0)
		1: sticker_mat.albedo_color = Color(0.15, 0.75, 0.95, 1.0)
		2:
			sticker_mat.albedo_color = Color(0.95, 0.82, 0.25, 1.0)
			sticker_mat.metallic = 0.6
		_:
			sticker_mat.albedo_color = Color.WHITE
	bat_sticker.material_override = sticker_mat
