# commentary_banner.gd - CricStrike 3D
# TV broadcast on-screen commentary banner displaying situational commentary lines
class_name CommentaryBanner
extends Control

@onready var header_label: Label = $Center/Panel/Margin/VBox/HBox/HeaderLabel
@onready var quote_label: Label = $Center/Panel/Margin/VBox/QuoteLabel
@onready var commentator_label: Label = $Center/Panel/Margin/VBox/CommentatorLabel
@onready var soundwave_label: Label = $Center/Panel/Margin/VBox/HBox/SoundWave

var _fade_tween: Tween
var _anim_time: float = 0.0

func _ready() -> void:
	visible = false
	var comm := CommentaryManager.get_instance()
	if comm:
		comm.commentary_triggered.connect(show_commentary_line)

func show_commentary_line(line: String, event_name: String = "LIVE COMMENTARY", commentator: String = "Danny M.") -> void:
	if _fade_tween and _fade_tween.is_valid():
		_fade_tween.kill()
		
	if header_label:
		header_label.text = "🎙 CRICSTRIKE LIVE • %s" % event_name.to_upper()
	if quote_label:
		quote_label.text = "\"%s\"" % line
	if commentator_label:
		commentator_label.text = "- %s" % commentator
		
	visible = true
	modulate.a = 0.0
	set_process(true)
	
	if is_inside_tree():
		_fade_tween = create_tween()
		if _fade_tween:
			_fade_tween.tween_property(self, "modulate:a", 1.0, 0.25)
			_fade_tween.tween_interval(3.6)
			_fade_tween.tween_property(self, "modulate:a", 0.0, 0.4)
			_fade_tween.finished.connect(func():
				visible = false
				set_process(false)
			)
	else:
		modulate.a = 1.0

func _process(delta: float) -> void:
	if not visible:
		return
	_anim_time += delta * 12.0
	if soundwave_label:
		var waves := [" ▂▃▅", "▃▅▇▅", "▅▇█▇", "▇▅▃▂", "▃▂ ▂"]
		var idx := int(_anim_time) % waves.size()
		soundwave_label.text = waves[idx]
