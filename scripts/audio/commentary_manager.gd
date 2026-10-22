# commentary_manager.gd - CricStrike 3D
# Procedural situational audio and broadcast commentary engine
# Triggers iconic broadcast lines on boundaries, maximums, wickets, milestones, and match events
class_name CommentaryManager
extends Node

signal commentary_triggered(line: String, event_name: String, commentator_name: String)

static var _instance: CommentaryManager

enum CommentaryEvent {
	MAXIMUM_SIX,
	BOUNDARY_FOUR,
	WICKET_BOWLED,
	WICKET_CAUGHT,
	HALF_CENTURY,
	NEW_OVER,
	DOT_BALL,
	TIGHT_CHASE,
	MATCH_WON
}

const COMMENTATOR_NAMES: Array[String] = [
	"Ravi S.",
	"Danny M.",
	"Nasser H.",
	"Harsha B.",
	"Michael H."
]

var _lines_database: Dictionary = {
	CommentaryEvent.MAXIMUM_SIX: [
		"Smacked straight down the ground for a maximum!",
		"High, handsome and into the second tier! What a colossal strike!",
		"Into orbit! That's gone all the way for a sensational six!",
		"That has been dispatched with sheer authority! 88 meters into the stands!",
		"Clean as a whistle! Over mid-wicket for a gigantic maximum!"
	],
	CommentaryEvent.BOUNDARY_FOUR: [
		"Pierces the infield with surgical precision! Beautiful boundary!",
		"Cracking shot! Races away to the fence like a tracer bullet!",
		"Exquisite timing off the meat of the bat for four!",
		"Glorious cover drive! Beats the chasing fielder to the rope!",
		"Deft touch down to third man - that's four all the way!"
	],
	CommentaryEvent.WICKET_BOWLED: [
		"Timber! Clean bowled through the gate! Stumps are shattered!",
		"What a peach of a delivery! Knocked him over completely!",
		"Bowled him! Straight through the defense and the bails fly!",
		"Castled! Absolute beauty of a ball, completely beating the bat!"
	],
	CommentaryEvent.WICKET_CAUGHT: [
		"In the air... and it's taken! Big wicket for the bowling side!",
		"Up goes the finger! Caught in the deep, massive breakthrough!",
		"Edged and safely pouched! A crucial dismissal!",
		"Sensational catch diving forward! The batsman has to walk!"
	],
	CommentaryEvent.HALF_CENTURY: [
		"Fifty for the batsman! A masterclass knock under pressure, and the crowd is on its feet!",
		"Raise your bat! A brilliant, well-constructed half-century!",
		"What a milestone! Reaches fifty with supreme composure and style!"
	],
	CommentaryEvent.NEW_OVER: [
		"New over begins, bowler striding back to the mark.",
		"End of the over, bowling change coming up as the field spreads.",
		"Captain summons a bowling change - let's see how the field is set."
	],
	CommentaryEvent.DOT_BALL: [
		"Dot ball! Tight bowling, building up the pressure.",
		"Beaten outside off! Superb seam movement from the bowler.",
		"Right on the money! Defended solidly into the covers."
	],
	CommentaryEvent.TIGHT_CHASE: [
		"The required run rate is climbing, every single run is pure gold now!",
		"Nail-biting finish on the cards - boundaries are needed right here!"
	],
	CommentaryEvent.MATCH_WON: [
		"What a victory! CricStrike 3D champions, sealed in sensational fashion!",
		"It's all over! A breathtaking win celebrated by the entire dugout!"
	]
}

static func get_instance() -> CommentaryManager:
	if _instance != null and is_instance_valid(_instance):
		return _instance
	return null

func _notification(what: int) -> void:
	if what == NOTIFICATION_PREDELETE:
		if _instance == self:
			_instance = null

func _ready() -> void:
	_instance = self

func trigger_event(event: CommentaryEvent, context_text: String = "") -> String:
	var pool: Array = _lines_database.get(event, [])
	if pool.is_empty():
		return ""
		
	var line: String
	if not context_text.is_empty():
		line = context_text
	else:
		line = pool[randi() % pool.size()]
		
	var commentator: String = COMMENTATOR_NAMES[randi() % COMMENTATOR_NAMES.size()]
	
	# Play acoustic stinger
	var audio := AudioManager.get_instance()
	if audio:
		audio.play_commentary_stinger()
		
	commentary_triggered.emit(line, _get_event_name(event), commentator)
	return line

func trigger_custom_line(line: String, event_name: String = "MATCH EVENT") -> void:
	var commentator: String = COMMENTATOR_NAMES[randi() % COMMENTATOR_NAMES.size()]
	var audio := AudioManager.get_instance()
	if audio:
		audio.play_commentary_stinger()
	commentary_triggered.emit(line, event_name, commentator)

func _get_event_name(event: CommentaryEvent) -> String:
	match event:
		CommentaryEvent.MAXIMUM_SIX: return "MAXIMUM 6"
		CommentaryEvent.BOUNDARY_FOUR: return "BOUNDARY 4"
		CommentaryEvent.WICKET_BOWLED: return "WICKET (BOWLED)"
		CommentaryEvent.WICKET_CAUGHT: return "WICKET (CAUGHT)"
		CommentaryEvent.HALF_CENTURY: return "MILESTONE: 50"
		CommentaryEvent.NEW_OVER: return "NEW OVER"
		CommentaryEvent.DOT_BALL: return "DOT BALL"
		CommentaryEvent.TIGHT_CHASE: return "PRESSURE CHASE"
		CommentaryEvent.MATCH_WON: return "MATCH WON"
	return "COMMENTARY"
