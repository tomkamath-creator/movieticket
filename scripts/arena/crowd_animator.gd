# crowd_animator.gd - CricStrike 3D
# Coordinates dynamic spectator cheering loops, Mexican waves, waving team flags and twinkling flashlights
class_name CrowdAnimator
extends Node3D

@export var crowd_root: Node3D
@export var flags_root: Node3D
@export var flashlights_root: Node3D

var _anim_time: float = 0.0
var excitement_level: float = 1.0 # 1.0 normal, 2.5 on boundary/wicket
var target_excitement: float = 1.0

var _crowd_nodes: Array[Node3D] = []
var _crowd_initial_y: Array[float] = []
var _flag_nodes: Array[Node3D] = []
var _flashlight_nodes: Array[Node3D] = []
var _flashlight_phases: Array[float] = []

func _ready() -> void:
	if crowd_root:
		for child in crowd_root.get_children():
			if child is Node3D:
				_crowd_nodes.append(child as Node3D)
				_crowd_initial_y.append(child.position.y)
				
	if flags_root:
		for child in flags_root.get_children():
			if child is Node3D:
				_flag_nodes.append(child as Node3D)
				
	if flashlights_root:
		for child in flashlights_root.get_children():
			if child is Node3D:
				_flashlight_nodes.append(child as Node3D)
				_flashlight_phases.append(randf() * TAU)

func trigger_cheer_surge(intensity: float = 2.5, duration: float = 3.0) -> void:
	target_excitement = intensity
	if is_inside_tree() and get_tree() != null:
		var cheer_timer := get_tree().create_timer(duration, true, false, true)
		cheer_timer.timeout.connect(func():
			target_excitement = 1.0
		)

func _process(delta: float) -> void:
	_anim_time += delta
	excitement_level = lerpf(excitement_level, target_excitement, delta * 3.0)
	
	# 1. Animate Spectator Cheering & Traveling Wave
	var count := _crowd_nodes.size()
	for i in range(count):
		var node := _crowd_nodes[i]
		if not is_instance_valid(node):
			continue
		var angle_phase := float(i) / float(max(1, count)) * TAU * 3.0
		# Traveling wave + bouncing jump
		var wave: float = sin(_anim_time * 3.5 - angle_phase)
		var jump: float = maxf(0.0, wave) * 0.28 * excitement_level
		var base_y: float = _crowd_initial_y[i] if i < _crowd_initial_y.size() else 0.0
		node.position.y = base_y + jump
		# Slight excited sway
		node.rotation_degrees.z = sin(_anim_time * 4.0 + angle_phase) * 6.0 * excitement_level

	# 2. Animate Waving Team Flags (Fluttering in the stadium wind)
	for i in range(_flag_nodes.size()):
		var flag := _flag_nodes[i]
		if not is_instance_valid(flag):
			continue
		var wind_wave := sin(_anim_time * 6.0 + float(i) * 0.75) * 18.0
		var wind_gust := cos(_anim_time * 3.2 + float(i)) * 8.0
		flag.rotation_degrees.y = wind_wave
		flag.rotation_degrees.z = wind_gust

	# 3. Animate Twinkling Smartphone Flashlights in the stands
	for i in range(_flashlight_nodes.size()):
		var light := _flashlight_nodes[i]
		if not is_instance_valid(light):
			continue
		var phase: float = _flashlight_phases[i] if i < _flashlight_phases.size() else 0.0
		var twinkle: float = sin(_anim_time * 5.0 + phase)
		# Twinkle scale pulsing
		var s: float = 0.8 + 0.5 * maxf(0.0, twinkle)
		light.scale = Vector3(s, s, s)
		light.visible = twinkle > -0.3
