# bowler_celebration.gd - CricStrike 3D
# Player celebration controller for Bowler Wicket celebrations & high-five gestures
class_name BowlerCelebration
extends Node3D

signal celebration_started()
signal celebration_ended()

const AudioManager = preload("res://scripts/audio/audio_manager.gd")

@export var bowler_root: Node3D
@export var bowling_arm_pivot: Node3D

var is_celebrating: bool = false
var _initial_pos: Vector3 = Vector3.ZERO
var _initial_rot: Vector3 = Vector3.ZERO

func _ready() -> void:
	if bowler_root == null:
		bowler_root = self
	_initial_pos = bowler_root.position
	_initial_rot = bowler_root.rotation_degrees

func trigger_wicket_celebration() -> void:
	if is_celebrating or bowler_root == null:
		return
		
	is_celebrating = true
	celebration_started.emit()
	
	if is_inside_tree():
		var tween := create_tween()
		if tween:
			# 1. Bowler leaps up in jubilation and raises high-five arm
			tween.tween_property(bowler_root, "position:y", _initial_pos.y + 0.65, 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
			tween.parallel().tween_property(bowler_root, "rotation_degrees:y", _initial_rot.y + 25.0, 0.35)
			
			if bowling_arm_pivot:
				# Raise right arm high for high-five
				tween.parallel().tween_property(bowling_arm_pivot, "rotation_degrees:x", 160.0, 0.25).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
			
			# High-five handclap acoustic impact at apex
			tween.tween_callback(func():
				var audio := AudioManager.get_instance()
				if audio:
					audio.play_high_five()
			)
			
			# 2. Descend back with fist pump
			tween.tween_property(bowler_root, "position:y", _initial_pos.y, 0.3).set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
			if bowling_arm_pivot:
				tween.parallel().tween_property(bowling_arm_pivot, "rotation_degrees:x", 90.0, 0.3)
				
			# 3. High-five celebration hold with teammates
			tween.tween_interval(0.8)
			
			# 4. Return to mark
			if bowling_arm_pivot:
				tween.tween_property(bowling_arm_pivot, "rotation_degrees:x", 0.0, 0.3)
			tween.parallel().tween_property(bowler_root, "rotation_degrees:y", _initial_rot.y, 0.3)
			tween.finished.connect(func():
				is_celebrating = false
				celebration_ended.emit()
			)
			return

func reset_celebration() -> void:
	is_celebrating = false
	if bowler_root:
		bowler_root.position = _initial_pos
		bowler_root.rotation_degrees = _initial_rot
	if bowling_arm_pivot:
		bowling_arm_pivot.rotation_degrees = Vector3.ZERO
	celebration_ended.emit()
