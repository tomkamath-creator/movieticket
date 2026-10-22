# GameModeManager.gd - CricStrike 3D
# Singleton / Coordinator for match settings across Quick Match, Super Over, and Tournament
class_name GameModeManager
extends RefCounted

enum Mode {
	QUICK_MATCH,
	SUPER_OVER,
	TOURNAMENT,
	AUCTION
}

const GameConstants = preload("res://scripts/core/game_constants.gd")

var current_mode: Mode = Mode.QUICK_MATCH
var team_player: String = "India"
var team_opponent: String = "Australia"
var selected_overs: int = 5
var selected_pitch: GameConstants.PitchType = GameConstants.PitchType.FLAT
var selected_difficulty: GameConstants.Difficulty = GameConstants.Difficulty.MEDIUM

# Super Over State
var super_over_target: int = 16 # Target to defend or chase in 6 balls
var player_is_chasing: bool = true

static var _instance: GameModeManager

static func get_instance() -> GameModeManager:
	if _instance == null or not is_instance_valid(_instance):
		_instance = GameModeManager.new()
	return _instance

func setup_quick_match(t_player: String, t_opp: String, overs: int, pitch: GameConstants.PitchType, diff: GameConstants.Difficulty) -> void:
	current_mode = Mode.QUICK_MATCH
	team_player = t_player
	team_opponent = t_opp
	selected_overs = overs
	selected_pitch = pitch
	selected_difficulty = diff

func setup_super_over(t_player: String, t_opp: String, is_chasing: bool, target: int = 16, diff: GameConstants.Difficulty = GameConstants.Difficulty.HARD) -> void:
	current_mode = Mode.SUPER_OVER
	team_player = t_player
	team_opponent = t_opp
	selected_overs = 1
	player_is_chasing = is_chasing
	super_over_target = target
	selected_difficulty = diff
	selected_pitch = GameConstants.PitchType.FLAT
