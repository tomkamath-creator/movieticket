# BattingHUD.gd - CricStrike 3D
# Complete Touch UI, Virtual Controls, Timing Feedback HUD & Bowling System Integration
class_name BattingHUD
extends CanvasLayer

signal deliver_requested(speed_kmh: float, swing: float, seam: float, target_pos: Vector3)
signal pitch_condition_changed(new_type: GameConstants.PitchType)
signal difficulty_changed(new_diff: GameConstants.Difficulty)
signal camera_toggle_requested()
signal role_toggled(is_bowling: bool)

const GameConstants = preload("res://scripts/core/game_constants.gd")
const ShotLibrary = preload("res://scripts/batting/shot_library.gd")
const TimingEngine = preload("res://scripts/batting/timing_engine.gd")
const BattingController = preload("res://scripts/batting/batting_controller.gd")
const CricketBall = preload("res://scripts/physics/cricket_ball.gd")
const BroadcastCamera = preload("res://scripts/camera/broadcast_camera.gd")
const VirtualJoystick = preload("res://scripts/ui/virtual_joystick.gd")
const BowlingMetersUI = preload("res://scripts/ui/bowling_meters_ui.gd")
const BowlerCardOverlay = preload("res://scripts/ui/bowler_card_overlay.gd")
const BroadcastReplayOverlay = preload("res://scripts/ui/broadcast_replay_overlay.gd")
const CommentaryBanner = preload("res://scripts/ui/commentary_banner.gd")

@export var batsman: BattingController
@export var ball: CricketBall
@export var camera_controller: BroadcastCamera

# UI Elements
@onready var joystick: VirtualJoystick = $BottomLeftControls/VirtualJoystick
@onready var bottom_left_controls: Control = $BottomLeftControls
@onready var bottom_right_controls: Control = $BottomRightControls
@onready var shot_name_label: Label = $TopCenter/ShotNameLabel
@onready var timing_banner: Label = $CenterContainer/TimingBanner
@onready var stats_label: Label = $TopCenter/StatsLabel
@onready var grounded_btn: Button = $BottomRightControls/VBoxContainer/GroundedButton
@onready var lofted_btn: Button = $BottomRightControls/VBoxContainer/LoftedButton
@onready var bowl_debug_btn: Button = $TopRightControls/BowlDebugButton
@onready var pitch_btn: Button = $TopRightControls/PitchButton
@onready var difficulty_btn: Button = $TopRightControls/DifficultyButton
@onready var camera_btn: Button = $TopRightControls/CameraButton
@onready var role_btn: Button = $TopRightControls/RoleButton
@onready var pause_btn: Button = get_node_or_null("TopRightControls/PauseButton")
@onready var bowling_meters_ui: BowlingMetersUI = $BowlingMetersUI
@onready var bowler_card: BowlerCardOverlay = get_node_or_null("BowlerCardOverlay")
@onready var replay_overlay: BroadcastReplayOverlay = get_node_or_null("BroadcastReplayOverlay")
@onready var commentary_banner: CommentaryBanner = get_node_or_null("CommentaryBanner")
@onready var pause_menu: Control = get_node_or_null("PauseMenu")
@onready var resume_btn: Button = get_node_or_null("PauseMenu/Center/Panel/Margin/VBox/ResumeBtn")
@onready var pause_camera_btn: Button = get_node_or_null("PauseMenu/Center/Panel/Margin/VBox/PauseCameraBtn")
@onready var restart_btn: Button = get_node_or_null("PauseMenu/Center/Panel/Margin/VBox/RestartBtn")
@onready var exit_menu_btn: Button = get_node_or_null("PauseMenu/Center/Panel/Margin/VBox/ExitMenuBtn")

var current_difficulty: GameConstants.Difficulty = GameConstants.Difficulty.MEDIUM
var current_pitch_type: GameConstants.PitchType = GameConstants.PitchType.FLAT
var is_bowling_role: bool = false

# Sample delivery presets for testing
var _delivery_presets: Array[Dictionary] = [
	{"name": "Good Length Fast Outswinger", "speed": 142.0, "swing": -0.65, "seam": 2.0, "target": Vector3(0.25, 0.05, 5.5)},
	{"name": "Full Inswinger", "speed": 138.0, "swing": 0.70, "seam": -1.5, "target": Vector3(-0.15, 0.05, 7.2)},
	{"name": "Toe-Crusher Yorker", "speed": 148.0, "swing": 0.20, "seam": 0.0, "target": Vector3(0.0, 0.02, 8.8)},
	{"name": "Bouncer (Short Pitch)", "speed": 135.0, "swing": 0.0, "seam": 3.0, "target": Vector3(0.2, 0.05, 2.5)},
	{"name": "Slow Off-Cutter", "speed": 112.0, "swing": 0.0, "seam": -4.0, "target": Vector3(0.3, 0.05, 6.0)}
]
var _preset_index: int = 0

func _ready() -> void:
	# Connect Joystick
	if joystick:
		joystick.joystick_vector_changed.connect(_on_joystick_vector_changed)
		joystick.shot_sector_changed.connect(_on_shot_sector_changed)
		
	# Connect Buttons
	if grounded_btn:
		grounded_btn.pressed.connect(func(): _on_shot_button_pressed(GameConstants.ShotElevation.GROUNDED))
	if lofted_btn:
		lofted_btn.pressed.connect(func(): _on_shot_button_pressed(GameConstants.ShotElevation.LOFTED))
	if bowl_debug_btn:
		bowl_debug_btn.pressed.connect(_on_bowl_debug_pressed)
	if pitch_btn:
		pitch_btn.pressed.connect(_on_cycle_pitch_type)
	if difficulty_btn:
		difficulty_btn.pressed.connect(_on_cycle_difficulty)
	if camera_btn:
		camera_btn.pressed.connect(_on_camera_button_pressed)
	if camera_controller:
		camera_controller.camera_mode_changed.connect(_on_camera_mode_changed)
		_on_camera_mode_changed(camera_controller.get_mode_name())
	if role_btn:
		role_btn.pressed.connect(_on_toggle_role)
	if pause_btn:
		pause_btn.pressed.connect(_on_pause_pressed)
	if resume_btn:
		resume_btn.pressed.connect(_on_resume_pressed)
	if pause_camera_btn:
		pause_camera_btn.pressed.connect(_on_pause_camera_pressed)
	if restart_btn:
		restart_btn.pressed.connect(_on_restart_pressed)
	if exit_menu_btn:
		exit_menu_btn.pressed.connect(_on_exit_menu_pressed)

func bind_replay_director(director: Node) -> void:
	if replay_overlay and director:
		replay_overlay.bind_replay_director(director)

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		_handle_back_request()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		_handle_back_request()

func _handle_back_request() -> void:
	if pause_menu and pause_menu.visible:
		_on_resume_pressed()
	else:
		_on_pause_pressed()

func _on_pause_pressed() -> void:
	if pause_menu == null:
		return
	get_tree().paused = true
	_update_pause_camera_btn_text()
	pause_menu.visible = true

func _on_resume_pressed() -> void:
	if pause_menu == null:
		return
	pause_menu.visible = false
	get_tree().paused = false

func _on_pause_camera_pressed() -> void:
	if camera_controller:
		camera_controller.cycle_camera_mode()
		_update_pause_camera_btn_text()

func _update_pause_camera_btn_text() -> void:
	if pause_camera_btn and camera_controller:
		pause_camera_btn.text = "🎥 CAMERA: %s" % camera_controller.get_mode_name().to_upper()

func _on_restart_pressed() -> void:
	get_tree().paused = false
	get_tree().reload_current_scene()

func _on_exit_menu_pressed() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_toggle_role() -> void:
	is_bowling_role = not is_bowling_role
	if is_bowling_role:
		role_btn.text = "Role: Bowling"
		if bottom_left_controls: bottom_left_controls.visible = false
		if bottom_right_controls: bottom_right_controls.visible = false
		if bowling_meters_ui:
			bowling_meters_ui.show_aiming_step()
	else:
		role_btn.text = "Role: Batting"
		if bottom_left_controls: bottom_left_controls.visible = true
		if bottom_right_controls: bottom_right_controls.visible = true
		if bowling_meters_ui:
			bowling_meters_ui.hide_meters()
			
	role_toggled.emit(is_bowling_role)

func _on_joystick_vector_changed(vector: Vector2) -> void:
	if batsman:
		batsman.set_joystick_direction(vector)

func _on_shot_sector_changed(sector_name: String) -> void:
	if shot_name_label:
		shot_name_label.text = "Target: %s" % sector_name

func _on_shot_button_pressed(elevation: GameConstants.ShotElevation) -> void:
	if not batsman:
		return
		
	var result := batsman.trigger_shot(elevation)
	if result:
		_show_timing_feedback(result)

func _show_timing_feedback(result: TimingEngine.TimingResult) -> void:
	if not timing_banner:
		return
		
	timing_banner.text = result.feedback_text
	timing_banner.visible = true
	
	match result.rating:
		GameConstants.TimingRating.PERFECT:
			timing_banner.modulate = Color(0.1, 1.0, 0.4) # Bright Green
		GameConstants.TimingRating.EARLY, GameConstants.TimingRating.LATE:
			timing_banner.modulate = Color(0.95, 0.85, 0.1) # Yellow
		GameConstants.TimingRating.TOO_EARLY, GameConstants.TimingRating.TOO_LATE:
			timing_banner.modulate = Color(1.0, 0.5, 0.1) # Orange
		GameConstants.TimingRating.EDGE_OUTSIDE, GameConstants.TimingRating.EDGE_INSIDE:
			timing_banner.modulate = Color(0.9, 0.3, 0.9) # Purple edge
		_:
			timing_banner.modulate = Color(0.9, 0.2, 0.2) # Red missed
			
	_start_fade_timer()

func _start_fade_timer() -> void:
	if is_inside_tree():
		var tween := create_tween()
		if tween:
			tween.tween_interval(1.2)
			tween.tween_property(timing_banner, "modulate:a", 0.0, 0.4)
			tween.finished.connect(func():
				timing_banner.visible = false
				timing_banner.modulate.a = 1.0
			)
	else:
		timing_banner.visible = false

func _on_camera_button_pressed() -> void:
	if camera_controller:
		camera_controller.cycle_camera_mode()

func _on_camera_mode_changed(mode_name: String) -> void:
	if camera_btn:
		camera_btn.text = "Cam: %s" % mode_name
	_update_pause_camera_btn_text()

func _on_bowl_debug_pressed() -> void:
	var preset: Dictionary = _delivery_presets[_preset_index]
	_preset_index = (_preset_index + 1) % _delivery_presets.size()
	
	if stats_label:
		stats_label.text = "Bowling: %s (%.0f km/h)" % [preset["name"], preset["speed"]]
		
	deliver_requested.emit(preset["speed"], preset["swing"], preset["seam"], preset["target"])

func _on_cycle_pitch_type() -> void:
	current_pitch_type = ((int(current_pitch_type) + 1) % 4) as GameConstants.PitchType
	pitch_condition_changed.emit(current_pitch_type)
	_update_hud_display()

func _on_cycle_difficulty() -> void:
	current_difficulty = ((int(current_difficulty) + 1) % 4) as GameConstants.Difficulty
	if batsman:
		batsman.difficulty = current_difficulty
	difficulty_changed.emit(current_difficulty)
	_update_hud_display()

func _update_hud_display() -> void:
	if pitch_btn:
		var p_name: String
		match current_pitch_type:
			GameConstants.PitchType.GREEN: p_name = "Pitch: Green"
			GameConstants.PitchType.DUSTY: p_name = "Pitch: Dusty"
			GameConstants.PitchType.FLAT:  p_name = "Pitch: Flat"
			GameConstants.PitchType.WET:   p_name = "Pitch: Wet"
		pitch_btn.text = p_name

	if difficulty_btn:
		var d_name: String
		match current_difficulty:
			GameConstants.Difficulty.EASY:   d_name = "Diff: Easy"
			GameConstants.Difficulty.MEDIUM: d_name = "Diff: Medium"
			GameConstants.Difficulty.HARD:   d_name = "Diff: Hard"
			GameConstants.Difficulty.LEGEND: d_name = "Diff: Legend"
		difficulty_btn.text = d_name

func _on_ball_boundary(runs: int) -> void:
	if timing_banner:
		timing_banner.visible = true
		timing_banner.text = "FOUR! BOUNDARY!" if runs == 4 else "MAXIMUM! SIX RUNS!"
		timing_banner.modulate = Color(0.2, 0.9, 1.0)
		_start_fade_timer()

func _on_stump_collision(_stump: Node, _speed: float) -> void:
	if timing_banner:
		timing_banner.visible = true
		timing_banner.text = "BOWLED! WICKET DOWN!"
		timing_banner.modulate = Color(1.0, 0.2, 0.2)
		_start_fade_timer()
