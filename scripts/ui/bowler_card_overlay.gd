# bowler_card_overlay.gd - CricStrike 3D
# TV broadcast graphics card sliding in on new overs / bowling changes
class_name BowlerCardOverlay
extends Control

signal card_dismissed()

@onready var title_label: Label = $Panel/VBox/TitleLabel
@onready var name_label: Label = $Panel/VBox/NameLabel
@onready var style_label: Label = $Panel/VBox/StyleLabel
@onready var stats_label: Label = $Panel/VBox/StatsLabel

var _slide_tween: Tween

func _ready() -> void:
	visible = false

func show_bowler_card(bowler_name: String, bowling_style: String, figures_str: String, display_sec: float = 3.5) -> void:
	if _slide_tween and _slide_tween.is_valid():
		_slide_tween.kill()
		
	if name_label: name_label.text = bowler_name.to_upper()
	if style_label: style_label.text = bowling_style
	if stats_label: stats_label.text = figures_str
	
	visible = true
	position.x = -360.0
	
	if is_inside_tree():
		_slide_tween = create_tween()
		if _slide_tween:
			# Slide in from left
			_slide_tween.tween_property(self, "position:x", 24.0, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
			_slide_tween.tween_interval(display_sec)
			# Slide out to left
			_slide_tween.tween_property(self, "position:x", -360.0, 0.3).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
			_slide_tween.finished.connect(func():
				visible = false
				card_dismissed.emit()
			)
	else:
		position.x = 24.0

func hide_immediate() -> void:
	if _slide_tween and _slide_tween.is_valid():
		_slide_tween.kill()
	visible = false
