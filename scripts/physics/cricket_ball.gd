# CricketBall.gd - CricStrike 3D
# Physical RigidBody3D cricket ball with aerodynamics, seam/swing Magnus forces and pitch bounce physics
class_name CricketBall
extends RigidBody3D

const GameConstants = preload("res://scripts/core/game_constants.gd")
const AudioManager = preload("res://scripts/audio/audio_manager.gd")

signal ball_delivered(initial_speed_kmh: float, target_pos: Vector3)
signal ball_pitched(pitch_position: Vector3, speed_kmh: float)
signal ball_hit(exit_speed_kmh: float, launch_angle_deg: float, direction_vector: Vector3)
signal ball_boundary(runs: int)
signal ball_stump_collision(stump_node: Node, impact_speed: float)
signal ball_stopped()

@export var ball_radius: float = GameConstants.BALL_RADIUS_M
@export var ball_mass: float = GameConstants.BALL_MASS_KG

# State
var is_active: bool = false
var has_pitched: bool = false
var has_been_hit: bool = false
var pitch_point: Vector3 = Vector3.ZERO
var delivery_speed_kmh: float = 135.0

# Aerodynamics & Swing
var swing_intensity: float = 0.0 # Range [-1.0 (Outswing/Away), +1.0 (Inswing/In)]
var seam_tilt_deg: float = 0.0    # Angular tilt of the seam in degrees
var spin_vector: Vector3 = Vector3.ZERO
var pitch_conditions: PitchConditions

# Visual trail / trajectory
var trajectory_points: Array[Vector3] = []
var max_trajectory_points: int = 120

# Internal physics tracking
var _last_velocity: Vector3 = Vector3.ZERO
var _rest_timer: float = 0.0

@onready var mesh_instance: MeshInstance3D = $MeshInstance3D
@onready var collision_shape: CollisionShape3D = $CollisionShape3D

func _ready() -> void:
	mass = ball_mass
	gravity_scale = 1.0
	continuous_cd = true
	contact_monitor = true
	max_contacts_reported = 4
	visible = false
	freeze = true
	
	if pitch_conditions == null:
		pitch_conditions = PitchConditions.new(GameConstants.PitchType.FLAT)
	
	# Set physical physics material
	var phys_mat := PhysicsMaterial.new()
	phys_mat.friction = pitch_conditions.friction
	phys_mat.bounce = pitch_conditions.restitution
	physics_material_override = phys_mat
	
	body_entered.connect(_on_body_entered)

func launch_delivery(start_pos: Vector3, target_pitch_pos: Vector3, speed_kmh: float, swing: float = 0.0, seam: float = 0.0, spin: Vector3 = Vector3.ZERO) -> void:
	visible = true
	global_position = start_pos
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
	freeze = false
	is_active = true
	has_pitched = false
	has_been_hit = false
	trajectory_points.clear()
	_rest_timer = 0.0
	
	delivery_speed_kmh = speed_kmh
	swing_intensity = swing
	seam_tilt_deg = seam
	spin_vector = spin
	
	var speed_mps := GameConstants.kmh_to_mps(speed_kmh)
	
	# Calculate ball flight trajectory to target pitch position
	var delta := target_pitch_pos - start_pos
	var horizontal_dist := Vector2(delta.x, delta.z).length()
	
	var flight_time := horizontal_dist / speed_mps
	if flight_time <= 0.05:
		flight_time = 0.05
		
	var v_y := (delta.y + 0.5 * GameConstants.GRAVITY * flight_time * flight_time) / flight_time
	var v_horizontal := Vector2(delta.x, delta.z).normalized() * speed_mps
	
	linear_velocity = Vector3(v_horizontal.x, v_y, v_horizontal.y)
	_last_velocity = linear_velocity
	angular_velocity = Vector3(-40.0, spin.y * 10.0, seam * 2.0)
	
	ball_delivered.emit(speed_kmh, target_pitch_pos)

func _physics_process(delta: float) -> void:
	if not is_active or freeze:
		return
		
	_last_velocity = linear_velocity
	
	# Record trajectory for trail / replay
	if trajectory_points.is_empty() or global_position.distance_to(trajectory_points[-1]) > 0.35:
		trajectory_points.append(global_position)
		if trajectory_points.size() > max_trajectory_points:
			trajectory_points.pop_front()
	
	# Apply Aerodynamic forces before ball pitches
	if not has_pitched and not has_been_hit:
		_apply_aerodynamics(delta)
	
	# Check boundaries
	_check_boundary_distance()
	
	# Wicketkeeper takes the ball cleanly behind stumps
	if not has_been_hit and global_position.z > 13.8 and is_active:
		is_active = false
		linear_velocity = Vector3.ZERO
		freeze = true
		ball_stopped.emit()
		return
	
	# Check rest state
	if has_pitched or has_been_hit:
		if linear_velocity.length() < 0.35:
			_rest_timer += delta
			if _rest_timer > 0.8:
				is_active = false
				ball_stopped.emit()
		else:
			_rest_timer = 0.0

func _apply_aerodynamics(_delta: float) -> void:
	var vel := linear_velocity
	var speed := vel.length()
	if speed < 1.0:
		return
		
	var frontal_area := PI * ball_radius * ball_radius
	var drag_magnitude := 0.5 * GameConstants.AIR_DENSITY * GameConstants.DRAG_COEFFICIENT * frontal_area * (speed * speed)
	var drag_force := -vel.normalized() * drag_magnitude
	apply_central_force(drag_force)
	
	if abs(swing_intensity) > 0.01:
		var flight_dir_2d := Vector2(vel.x, vel.z).normalized()
		var lateral_normal := Vector3(-flight_dir_2d.y, 0.0, flight_dir_2d.x)
		var swing_accel := swing_intensity * (speed / 35.0) * 4.2 * pitch_conditions.swing_multiplier
		var swing_force := lateral_normal * swing_accel * mass
		apply_central_force(swing_force)

func _on_body_entered(body: Node) -> void:
	if not is_active:
		return
		
	var impact_speed := _last_velocity.length()
	
	# 1. Stumps & Bails Hit
	if body.is_in_group("stumps") or body.is_in_group("bails"):
		ball_stump_collision.emit(body, impact_speed)
		return
		
	# 2. Pitch / Turf Contact
	if body.is_in_group("pitch_surface") or (body.name.to_lower().contains("pitch") and global_position.y < 0.25):
		if not has_pitched and not has_been_hit:
			has_pitched = true
			pitch_point = global_position
			
			var seam_rad := deg_to_rad(seam_tilt_deg)
			var post_bounce_vel := pitch_conditions.calculate_pitch_bounce(_last_velocity, spin_vector, seam_rad)
			linear_velocity = post_bounce_vel
			
			var audio := AudioManager.get_instance()
			if audio:
				audio.play_ball_bounce()
			
			ball_pitched.emit(pitch_point, GameConstants.mps_to_kmh(linear_velocity.length()))

func apply_bat_hit(exit_velocity: Vector3) -> void:
	has_been_hit = true
	linear_velocity = exit_velocity
	_last_velocity = exit_velocity
	
	var exit_speed_kmh := GameConstants.mps_to_kmh(exit_velocity.length())
	var launch_angle_deg := rad_to_deg(atan2(exit_velocity.y, Vector2(exit_velocity.x, exit_velocity.z).length()))
	
	ball_hit.emit(exit_speed_kmh, launch_angle_deg, exit_velocity.normalized())

func _check_boundary_distance() -> void:
	if not has_been_hit:
		return
		
	var norm_x := global_position.x / GameConstants.BOUNDARY_RADIUS_X
	var norm_z := global_position.z / GameConstants.BOUNDARY_RADIUS_Z
	var dist_ratio := (norm_x * norm_x) + (norm_z * norm_z)
	
	if dist_ratio >= 1.0 and is_active:
		is_active = false
		if has_pitched:
			ball_boundary.emit(4)
		else:
			ball_boundary.emit(6)

func reset_to_bowler_hand(bowler_hand_pos: Vector3) -> void:
	freeze = true
	global_position = bowler_hand_pos
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
	is_active = false
	has_pitched = false
	has_been_hit = false
	visible = false
	trajectory_points.clear()
