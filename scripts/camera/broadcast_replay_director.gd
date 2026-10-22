# broadcast_replay_director.gd - CricStrike 3D
# 3-Second Multi-Angle Slow-Motion TV Replay System
# Automatically triggers after boundary (4 or 6) or wicket dismissal with instant Skip capability
class_name BroadcastReplayDirector
extends Node

signal replay_started(title: String, detail: String)
signal replay_angle_changed(angle_index: int, angle_name: String)
signal replay_ended()

const BroadcastCamera = preload("res://scripts/camera/broadcast_camera.gd")
const AudioManager = preload("res://scripts/audio/audio_manager.gd")

@export var camera: BroadcastCamera

var is_replaying: bool = false
var replay_elapsed: float = 0.0
var total_replay_duration: float = 3.0 # Exactly 3 seconds TV replay
var current_angle_index: int = 0

# Multi-angle replay camera presets
var _replay_angles: Array[Dictionary] = [
	{
		"name": "Pitch Delivery Cam",
		"pos": Vector3(2.4, 1.2, 0.5),
		"look": Vector3(0.15, 0.9, 9.05),
		"fov": 50.0
	},
	{
		"name": "Ultra Slow-Mo Impact Cam",
		"pos": Vector3(-4.2, 1.5, 8.8),
		"look": Vector3(0.15, 0.85, 9.05),
		"fov": 42.0
	},
	{
		"name": "Reverse Broadcast Sky Cam",
		"pos": Vector3(6.5, 8.8, 18.5),
		"look": Vector3(0.0, 0.8, 4.0),
		"fov": 54.0
	}
]

var _original_cam_pos: Vector3 = Vector3.ZERO
var _original_cam_rot: Basis = Basis.IDENTITY
var _original_cam_mode: int = 0
var _event_title: String = ""
var _event_detail: String = ""

func _ready() -> void:
	set_process(false)

func start_broadcast_replay(title: String, detail: String = "") -> void:
	if is_replaying:
		return
		
	is_replaying = true
	replay_elapsed = 0.0
	current_angle_index = 0
	_event_title = title
	_event_detail = detail
	
	if camera:
		_original_cam_pos = camera.global_position
		_original_cam_rot = camera.global_transform.basis
		_original_cam_mode = camera.current_mode
		
	# Play TV Replay transition whoosh
	var audio := AudioManager.get_instance()
	if audio:
		audio.play_replay_whoosh()
		
	# Engage dramatic TV slow-motion (0.45x normal speed)
	Engine.time_scale = 0.45
	
	set_process(true)
	replay_started.emit(_event_title, _event_detail)
	_apply_replay_angle(0)

func skip_replay() -> void:
	if not is_replaying:
		return
	_terminate_replay()

func _terminate_replay() -> void:
	is_replaying = false
	set_process(false)
	
	# Restore normal simulation speed
	Engine.time_scale = 1.0
	
	if camera:
		camera.set_camera_mode(_original_cam_mode as BroadcastCamera.CameraMode)
		
	replay_ended.emit()

func _apply_replay_angle(index: int) -> void:
	current_angle_index = index
	if index < 0 or index >= _replay_angles.size():
		return
		
	var angle_data: Dictionary = _replay_angles[index]
	replay_angle_changed.emit(index + 1, angle_data.name)
	
	if camera:
		camera.global_position = angle_data.pos
		camera.fov = angle_data.fov
		var dir: Vector3 = (angle_data.look - angle_data.pos).normalized()
		if dir.length() > 0.01:
			camera.transform = Transform3D().looking_at(dir, Vector3.UP)
			camera.global_position = angle_data.pos

func _process(delta: float) -> void:
	if not is_replaying:
		return
		
	# Calculate real-time elapsed independent of time_scale
	var real_delta: float = delta / maxf(Engine.time_scale, 0.01)
	replay_elapsed += real_delta
	
	# Multi-angle switching over 3 seconds:
	# 0.0s -> 1.0s: Angle 0
	# 1.0s -> 2.0s: Angle 1
	# 2.0s -> 3.0s: Angle 2
	var expected_angle: int = clampi(int(replay_elapsed / 1.0), 0, _replay_angles.size() - 1)
	if expected_angle != current_angle_index:
		var audio := AudioManager.get_instance()
		if audio:
			audio.play_replay_whoosh()
		_apply_replay_angle(expected_angle)
		
	# Smooth subtle camera drift during angle
	if camera and current_angle_index < _replay_angles.size():
		var angle_data: Dictionary = _replay_angles[current_angle_index]
		var drift_offset := Vector3(sin(replay_elapsed * 2.0) * 0.15, 0.0, 0.0)
		var cam_pos: Vector3 = angle_data.pos + drift_offset
		camera.global_position = cam_pos
		var dir: Vector3 = (angle_data.look - cam_pos).normalized()
		if dir.length() > 0.01:
			camera.transform = Transform3D().looking_at(dir, Vector3.UP)
			camera.global_position = cam_pos
		
	if replay_elapsed >= total_replay_duration:
		_terminate_replay()
