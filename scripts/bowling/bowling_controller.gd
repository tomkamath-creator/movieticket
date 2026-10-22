# BowlingController.gd - CricStrike 3D
# Master Bowling Controller coordinating Player Bowler Mechanics, AI Bowler & Delivery States
class_name BowlingController
extends Node3D

signal bowling_state_changed(new_state: BowlingState)
signal delivery_released(delivery_config: BowlerTypes.DeliveryConfig)
signal delivery_completed()

const GameConstants = preload("res://scripts/core/game_constants.gd")
const BowlerTypes = preload("res://scripts/bowling/bowler_types.gd")
const PitchConditions = preload("res://scripts/core/pitch_conditions.gd")
const CricketBall = preload("res://scripts/physics/cricket_ball.gd")
const PitchMarker = preload("res://scripts/bowling/pitch_marker.gd")
const BowlingMeters = preload("res://scripts/bowling/bowling_meters.gd")
const AIBowler = preload("res://scripts/bowling/ai_bowler.gd")

enum BowlingState {
	IDLE,
	AIMING,
	SWING_METER,
	SPEED_METER,
	RUN_UP,
	IN_FLIGHT,
	OVER_END
}

@export var is_player_bowling: bool = false
@export var ball_ref: CricketBall
@export var pitch_marker: PitchMarker
@export var bowler_node: Node3D

var current_state: BowlingState = BowlingState.IDLE
var ai_bowler: AIBowler
var meters: BowlingMeters
var current_pitch_conditions: PitchConditions

# Active delivery configuration
var current_delivery: BowlerTypes.DeliveryConfig

# Bowler Run-up kinematics
var bowler_crease_pos := Vector3(0.4, 0.0, -GameConstants.PITCH_LENGTH * 0.5 + 0.3)
var bowler_start_runup_pos := Vector3(0.4, 0.0, -GameConstants.PITCH_LENGTH * 0.5 - 6.5)
var _runup_progress: float = 0.0
var _runup_duration: float = 1.2

func _ready() -> void:
	meters = BowlingMeters.new()
	ai_bowler = AIBowler.new(GameConstants.Difficulty.MEDIUM)
	current_pitch_conditions = PitchConditions.new(GameConstants.PitchType.FLAT)
	
	if pitch_marker:
		pitch_marker.visible = false

func set_difficulty(diff: GameConstants.Difficulty) -> void:
	if ai_bowler:
		ai_bowler.difficulty = diff

func set_pitch_conditions(pitch_cond: PitchConditions) -> void:
	current_pitch_conditions = pitch_cond

func start_new_delivery(player_is_bowling: bool = false, batsman_is_rhb: bool = true) -> void:
	is_player_bowling = player_is_bowling
	
	if is_player_bowling:
		_start_player_bowling()
	else:
		_start_ai_bowling(batsman_is_rhb)

# --- AI BOWLING FLOW ---
func _start_ai_bowling(batsman_is_rhb: bool) -> void:
	current_state = BowlingState.AIMING
	bowling_state_changed.emit(current_state)
	
	# AI plans delivery
	current_delivery = ai_bowler.plan_next_delivery(current_pitch_conditions, batsman_is_rhb)
	
	# Position pitch marker
	if pitch_marker:
		pitch_marker.update_marker_position(current_delivery.target_pitch_pos)
		pitch_marker.show_immediate()
		
	# Start bowler run-up
	_start_runup()

# --- PLAYER BOWLING FLOW ---
func _start_player_bowling() -> void:
	current_state = BowlingState.AIMING
	bowling_state_changed.emit(current_state)
	
	current_delivery = BowlerTypes.DeliveryConfig.new()
	if pitch_marker:
		pitch_marker.is_interactive = true
		pitch_marker.show_immediate()

func player_confirm_pitch_target() -> void:
	if current_state != BowlingState.AIMING:
		return
	if pitch_marker:
		current_delivery.target_pitch_pos = pitch_marker.target_position
		
	current_state = BowlingState.SWING_METER
	bowling_state_changed.emit(current_state)
	meters.start_swing_meter(0.6, 1.0) # Start oscillating swing meter

func player_stop_swing_meter() -> Dictionary:
	if current_state != BowlingState.SWING_METER:
		return {}
	var res := meters.lock_swing()
	current_delivery.swing_intensity = res["swing"]
	
	current_state = BowlingState.SPEED_METER
	bowling_state_changed.emit(current_state)
	meters.start_speed_meter(115.0, 150.0, 1.0)
	return res

func player_stop_speed_meter() -> Dictionary:
	if current_state != BowlingState.SPEED_METER:
		return {}
	var res := meters.lock_speed()
	current_delivery.speed_kmh = res["speed"]
	
	_start_runup()
	return res

func _get_or_create_anim_player() -> AnimationPlayer:
	if bowler_node == null:
		return null
	var ap: AnimationPlayer = null
	var players := bowler_node.find_children("", "AnimationPlayer", true, false)
	if players.size() > 0:
		ap = players[0] as AnimationPlayer
	else:
		var skels := bowler_node.find_children("", "Skeleton3D", true, false)
		if skels.size() > 0:
			var parent_node := skels[0].get_parent()
			ap = AnimationPlayer.new()
			ap.name = "AnimationPlayer"
			parent_node.add_child(ap)
	if ap:
		var lib: AnimationLibrary = load("res://assets/animations/cricket_animations.tres")
		if lib:
			if ap.has_animation_library(""):
				ap.remove_animation_library("")
			ap.add_animation_library("", lib)
	return ap

# --- RUN-UP & LAUNCH ---
func _start_runup() -> void:
	current_state = BowlingState.RUN_UP
	bowling_state_changed.emit(current_state)
	_runup_progress = 0.0
	
	if bowler_node:
		bowler_node.global_position = bowler_start_runup_pos
		bowler_node.visible = true
		bowler_node.rotation.x = 0.0
		bowler_node.rotation.z = 0.0
		var hm := bowler_node.find_child("HumanoidModel", true, false)
		if hm and hm.has_method("configure_role"):
			hm.configure_role("bowler")
		if hm and hm.has_method("play_anim"):
			hm.play_anim("runup")
		var ap := _get_or_create_anim_player()
		if ap and ap.has_animation("runup"):
			ap.play("runup")
			ap.speed_scale = 1.2
		
	# Trigger difficulty-based marker fade during approach
	if pitch_marker and not is_player_bowling:
		pitch_marker.start_fade(current_delivery.marker_fade_time_sec, 0.3)

func _physics_process(delta: float) -> void:
	meters.update_process(delta)
	
	if current_state == BowlingState.RUN_UP:
		_runup_progress += delta / _runup_duration
		
		if bowler_node:
			bowler_node.rotation.x = 0.0
			bowler_node.rotation.z = 0.0
			bowler_node.global_position = bowler_start_runup_pos.lerp(bowler_crease_pos, _runup_progress)
			# Transition to delivery stride action in final phase of approach
			if _runup_progress >= 0.7:
				var hm := bowler_node.find_child("HumanoidModel", true, false)
				if hm and hm.has_method("play_anim"):
					hm.play_anim("bowl")
				var ap := _get_or_create_anim_player()
				if ap and ap.current_animation != "bowl" and ap.has_animation("bowl"):
					ap.play("bowl")
					ap.speed_scale = 1.4
			
			# Animate bowling arm windmill rotation during delivery stride
			var arm_pivot := bowler_node.get_node_or_null("BowlingArmPivot") as Node3D
			if arm_pivot:
				arm_pivot.rotation_degrees.x = -_runup_progress * 360.0
			
		if _runup_progress >= 1.0:
			_release_ball()

func _release_ball() -> void:
	current_state = BowlingState.IN_FLIGHT
	bowling_state_changed.emit(current_state)
	
	var release_pos := bowler_crease_pos + Vector3(0.0, 2.15, 0.0)
	
	if ball_ref:
		ball_ref.launch_delivery(
			release_pos,
			current_delivery.target_pitch_pos,
			current_delivery.speed_kmh,
			current_delivery.swing_intensity,
			current_delivery.seam_deviation_deg,
			current_delivery.spin_vector
		)
		
	delivery_released.emit(current_delivery)

func complete_delivery() -> void:
	current_state = BowlingState.IDLE
	bowling_state_changed.emit(current_state)
	meters.reset()
	if bowler_node:
		var ap := _get_or_create_anim_player()
		if ap:
			if ap.has_animation("stance"):
				ap.play("stance")
				ap.speed_scale = 1.0
			else:
				ap.stop()
	if pitch_marker:
		pitch_marker.hide_immediate()
	delivery_completed.emit()
