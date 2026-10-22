# MatchController.gd - CricStrike 3D
# Complete Over & Innings Match Loop coordinating Umpire, Scoreboard, Fielders,
# 3-Second TV Broadcast Replay, Bowler Celebrations, Batsman Milestones & Commentary
class_name MatchController
extends Node

signal match_state_updated(status_message: String)
signal innings_won(winner_team: String, margin_message: String)

const GameConstants = preload("res://scripts/core/game_constants.gd")
const UmpireRules = preload("res://scripts/umpire/umpire_rules.gd")
const ScoreboardData = preload("res://scripts/match/scoreboard_data.gd")
const FieldingManager = preload("res://scripts/fielding/fielding_manager.gd")
const BowlingController = preload("res://scripts/bowling/bowling_controller.gd")
const BattingController = preload("res://scripts/batting/batting_controller.gd")
const CricketBall = preload("res://scripts/physics/cricket_ball.gd")
const AudioManager = preload("res://scripts/audio/audio_manager.gd")
const ScoreboardUI = preload("res://scripts/ui/scoreboard_ui.gd")
const WagonWheelView = preload("res://scripts/ui/wagon_wheel_view.gd")
const BroadcastCamera = preload("res://scripts/camera/broadcast_camera.gd")
const UmpireController = preload("res://scripts/umpire/umpire_controller.gd")
const CommentaryManager = preload("res://scripts/audio/commentary_manager.gd")
const BroadcastReplayDirector = preload("res://scripts/camera/broadcast_replay_director.gd")
const BowlerCelebration = preload("res://scripts/player/bowler_celebration.gd")
const StadiumBuilder = preload("res://scripts/arena/stadium_builder.gd")
const BattingHUD = preload("res://scripts/ui/batting_hud.gd")

@export var ball_ref: CricketBall
@export var batsman_ref: BattingController
@export var bowling_controller: BowlingController
@export var fielding_manager: FieldingManager
@export var scoreboard_ui: ScoreboardUI
@export var wagon_wheel_view: WagonWheelView
@export var broadcast_camera: BroadcastCamera
@export var bowler_umpire: UmpireController
@export var replay_director: BroadcastReplayDirector
@export var bowler_celebration: BowlerCelebration
@export var stadium_builder: StadiumBuilder
@export var hud_ref: BattingHUD

var scoreboard: ScoreboardData

# Per-ball tracking
var _current_ball_has_bat_hit: bool = false
var _current_ball_exit_vel: Vector3 = Vector3.ZERO
var _current_shot_heading: float = 0.0
var _current_ball_resolved: bool = false

func _ready() -> void:
	var mode_mgr := GameModeManager.get_instance()
	var overs := mode_mgr.selected_overs if mode_mgr else 5
	var target := mode_mgr.super_over_target if (mode_mgr and mode_mgr.current_mode == GameModeManager.Mode.SUPER_OVER and mode_mgr.player_is_chasing) else -1
	scoreboard = ScoreboardData.new(overs, target)
	
	if scoreboard_ui:
		scoreboard_ui.bind_scoreboard(scoreboard)
		scoreboard_ui.wagon_wheel_toggled.connect(_on_wagon_wheel_toggled)
		
	scoreboard.half_century_achieved.connect(_on_half_century_achieved)
	scoreboard.over_completed.connect(_on_over_completed)
		
	# Connect Ball signals
	if ball_ref:
		ball_ref.ball_delivered.connect(_on_ball_delivered)
		ball_ref.ball_hit.connect(_on_ball_hit)
		ball_ref.ball_boundary.connect(_on_ball_boundary)
		ball_ref.ball_stump_collision.connect(_on_stump_collision)
		ball_ref.ball_stopped.connect(_on_ball_stopped)
		
	# Connect Fielding signals
	if fielding_manager:
		fielding_manager.ball_caught.connect(_on_ball_caught)
		fielding_manager.ball_stopped_by_field.connect(_on_ball_fielded)

func _on_wagon_wheel_toggled() -> void:
	if wagon_wheel_view:
		if wagon_wheel_view.visible:
			wagon_wheel_view.visible = false
		else:
			wagon_wheel_view.open_wagon_wheel(scoreboard)

func _on_half_century_achieved(batsman_name: String, _runs: int, _balls: int) -> void:
	match_state_updated.emit("⭐ 50 UP! HALF-CENTURY FOR %s! ⭐" % batsman_name.to_upper())
	if batsman_ref:
		batsman_ref.celebrate_bat_raise()
	if stadium_builder and stadium_builder.crowd_animator:
		stadium_builder.crowd_animator.trigger_cheer_surge(3.5, 4.0)
		
	# Auto-open wagon wheel milestone pop-up
	if is_inside_tree() and get_tree() != null:
		var timer := get_tree().create_timer(2.4, true, false, true)
		timer.timeout.connect(func():
			if wagon_wheel_view and not wagon_wheel_view.visible:
				wagon_wheel_view.open_wagon_wheel(scoreboard)
		)

func _on_over_completed(_over_number: int, _is_maiden: bool) -> void:
	var comm := CommentaryManager.get_instance()
	if comm:
		comm.trigger_event(CommentaryManager.CommentaryEvent.NEW_OVER)
		
	if hud_ref and hud_ref.bowler_card and scoreboard and scoreboard.current_bowler:
		var bowler := scoreboard.current_bowler
		var spell_text := "Overs: %s | Maidens: %d | Runs: %d | Wickets: %d | Econ: %.2f" % [
			bowler.get_overs_string(),
			bowler.maidens,
			bowler.runs_conceded,
			bowler.wickets,
			bowler.get_economy()
		]
		hud_ref.bowler_card.show_bowler_card(bowler.name, "Fast Bowler • Express (145 km/h)", spell_text)

func _on_ball_delivered(_speed_kmh: float, _target_pos: Vector3) -> void:
	_current_ball_has_bat_hit = false
	_current_ball_exit_vel = Vector3.ZERO
	_current_shot_heading = 0.0
	_current_ball_resolved = false

func _on_ball_hit(exit_speed_kmh: float, launch_angle_deg: float, direction_vec: Vector3) -> void:
	_current_ball_has_bat_hit = true
	_current_ball_exit_vel = direction_vec * GameConstants.kmh_to_mps(exit_speed_kmh)
	
	var audio := AudioManager.get_instance()
	if audio:
		audio.play_bat_crack(exit_speed_kmh > 120.0 and launch_angle_deg > 20.0)
	
	# Calculate 0-360 deg heading in stadium ground plane
	var heading_rad := atan2(direction_vec.x, -direction_vec.z)
	_current_shot_heading = fposmod(rad_to_deg(heading_rad), 360.0)
	
	if fielding_manager:
		fielding_manager.on_ball_hit(ball_ref, _current_ball_exit_vel)

func _on_ball_boundary(runs: int) -> void:
	if _current_ball_resolved:
		return
	_current_ball_resolved = true
	
	var call := UmpireRules.evaluate_boundary(runs == 4)
	var shot_dist := GameConstants.BOUNDARY_RADIUS_Z
	scoreboard.record_delivery(call, _current_shot_heading, shot_dist, runs == 6)
	match_state_updated.emit(call.call_text)
	
	# Audio commentary
	var comm := CommentaryManager.get_instance()
	if comm:
		comm.trigger_event(
			CommentaryManager.CommentaryEvent.MAXIMUM_SIX if runs == 6 else CommentaryManager.CommentaryEvent.BOUNDARY_FOUR
		)
		
	# Stadium crowd cheer loop surge
	if stadium_builder and stadium_builder.crowd_animator:
		stadium_builder.crowd_animator.trigger_cheer_surge(3.0, 3.5)
		
	var audio := AudioManager.get_instance()
	if audio:
		audio.play_crowd_cheer(runs == 6)
		
	# 3-Second Multi-Angle Slow-Motion TV Replay System with Skip Button
	if replay_director:
		var title: String = "MAXIMUM 6!" if runs == 6 else "BOUNDARY 4!"
		var detail: String = "88m MONSTER HIT" if runs == 6 else "CRACKING SHOT TO THE FENCE"
		replay_director.start_broadcast_replay(title, detail)
	elif broadcast_camera:
		broadcast_camera.set_camera_mode(BroadcastCamera.CameraMode.BALL_TRACKING)
		Engine.time_scale = 0.8
		if is_inside_tree() and get_tree() != null:
			var slow_timer := get_tree().create_timer(1.8, true, false, true)
			slow_timer.timeout.connect(func():
				Engine.time_scale = 1.0
				if broadcast_camera:
					broadcast_camera.set_camera_mode(BroadcastCamera.CameraMode.BEHIND_BATSMAN)
			)
		else:
			Engine.time_scale = 1.0
	_reset_for_next_ball()

func _on_stump_collision(_stump: Node, _speed: float) -> void:
	var audio := AudioManager.get_instance()
	if audio:
		audio.play_stump_rattle()
		
	if _current_ball_resolved:
		return
	_current_ball_resolved = true
	
	var call := UmpireRules.evaluate_bowled(true)
	scoreboard.record_delivery(call, _current_shot_heading, 0.0, false)
	match_state_updated.emit(call.call_text)
	
	# Commentary
	var comm := CommentaryManager.get_instance()
	if comm:
		comm.trigger_event(CommentaryManager.CommentaryEvent.WICKET_BOWLED)
		
	# Wicket cinematics, celebrations & 3s TV Replay
	_trigger_wicket_cinematics(true)
	_reset_for_next_ball()

func _on_ball_caught(f_name: String) -> void:
	if _current_ball_resolved:
		return
	_current_ball_resolved = true
	
	var call := UmpireRules.evaluate_caught(_current_ball_has_bat_hit, true)
	if call:
		call.call_text = "OUT! CAUGHT by %s!" % f_name
		scoreboard.record_delivery(call, _current_shot_heading, 25.0, true)
		match_state_updated.emit(call.call_text)
		
	# Commentary
	var comm := CommentaryManager.get_instance()
	if comm:
		comm.trigger_event(CommentaryManager.CommentaryEvent.WICKET_CAUGHT)
		
	_trigger_wicket_cinematics(false)
	_reset_for_next_ball()

func _trigger_wicket_cinematics(is_bowled: bool) -> void:
	if bowler_umpire:
		bowler_umpire.signal_out()
		
	# Bowler high-five celebration
	if bowler_celebration:
		bowler_celebration.trigger_wicket_celebration()
		
	# Stadium crowd roar & surge
	if stadium_builder and stadium_builder.crowd_animator:
		stadium_builder.crowd_animator.trigger_cheer_surge(2.5, 3.5)
		
	var audio := AudioManager.get_instance()
	if audio:
		audio.play_crowd_cheer(false)
		
	# 3-Second Multi-Angle Slow-Motion TV Replay System with Skip Button
	if replay_director:
		var title: String = "WICKET DISMISSAL!"
		var detail: String = "CLEAN BOWLED" if is_bowled else "CAUGHT IN DEEP"
		replay_director.start_broadcast_replay(title, detail)
	elif broadcast_camera:
		broadcast_camera.set_camera_mode(BroadcastCamera.CameraMode.UMPIRE_POV)
		Engine.time_scale = 0.75
		if is_inside_tree() and get_tree() != null:
			var out_timer := get_tree().create_timer(2.4, true, false, true)
			out_timer.timeout.connect(func():
				Engine.time_scale = 1.0
				if broadcast_camera:
					broadcast_camera.set_camera_mode(BroadcastCamera.CameraMode.BEHIND_BATSMAN)
			)
		else:
			Engine.time_scale = 1.0

func _on_ball_fielded(f_name: String) -> void:
	if _current_ball_resolved:
		return
	_current_ball_resolved = true
	
	# Evaluate runs completed based on distance from pitch
	var runs_run: int = 1
	var field_pos := ball_ref.global_position if ball_ref else Vector3.ZERO
	var dist_from_stumps := Vector2(field_pos.x, field_pos.z).length()
	
	if dist_from_stumps > 42.0:
		runs_run = 2
	elif dist_from_stumps > 25.0:
		runs_run = 1
	else:
		runs_run = 0 # Dot ball / fielded in inner ring
		
	var call := UmpireRules.UmpireCall.new(
		UmpireRules.DecisionType.RUNS_SCORED if runs_run > 0 else UmpireRules.DecisionType.DOT_BALL,
		runs_run,
		false,
		false,
		true,
		("%d Run(s) - Fielded by %s" % [runs_run, f_name]) if runs_run > 0 else ("Dot Ball - Fielded by %s" % f_name)
	)
	scoreboard.record_delivery(call, _current_shot_heading, dist_from_stumps, false)
	match_state_updated.emit(call.call_text)
	_reset_for_next_ball()

func _on_ball_stopped() -> void:
	if _current_ball_resolved:
		return
	_current_ball_resolved = true
	
	# If ball stopped with no bat contact and no wickets, evaluate Wide / Legality or Dot ball
	if ball_ref:
		var legality := UmpireRules.evaluate_delivery_legality(
			-GameConstants.PITCH_LENGTH * 0.5 - 0.2, # legal foot landing
			ball_ref.pitch_point,
			batsman_ref.is_right_handed if batsman_ref else true
		)
		if legality:
			scoreboard.record_delivery(legality, 0.0, 0.0, false)
			match_state_updated.emit(legality.call_text)
			_reset_for_next_ball()
			return
			
	var dot_call := UmpireRules.UmpireCall.new(
		UmpireRules.DecisionType.DOT_BALL,
		0,
		false,
		false,
		true,
		"Dot Ball"
	)
	scoreboard.record_delivery(dot_call, 0.0, 0.0, false)
	match_state_updated.emit("Dot Ball")
	
	# Situational commentary on dot ball
	var comm := CommentaryManager.get_instance()
	if comm and randf() < 0.35:
		comm.trigger_event(CommentaryManager.CommentaryEvent.DOT_BALL)
		
	_reset_for_next_ball()

func _reset_for_next_ball() -> void:
	if fielding_manager:
		fielding_manager.reset_all_fielders()
	if bowling_controller:
		bowling_controller.complete_delivery()
