# test_player_celebrations.gd - CricStrike 3D
# Verification of player celebration animations (high-fives, bat-raises) and TV graphics overlays
class_name TestPlayerCelebrations
extends RefCounted

const BowlerCelebration = preload("res://scripts/player/bowler_celebration.gd")
const BattingController = preload("res://scripts/batting/batting_controller.gd")
const ScoreboardData = preload("res://scripts/match/scoreboard_data.gd")
const UmpireRules = preload("res://scripts/umpire/umpire_rules.gd")
const BowlerCardOverlay = preload("res://scripts/ui/bowler_card_overlay.gd")
const WagonWheelView = preload("res://scripts/ui/wagon_wheel_view.gd")

func run_all_tests() -> bool:
	var passed: bool = true
	print("--- Running TestPlayerCelebrations ---")
	
	# 1. Test Bowler Celebration & High-Five
	var bowler_node := Node3D.new()
	var arm_pivot := Node3D.new()
	bowler_node.add_child(arm_pivot)
	
	var celebration := BowlerCelebration.new()
	celebration.bowler_root = bowler_node
	celebration.bowling_arm_pivot = arm_pivot
	bowler_node.add_child(celebration)
	celebration._ready()
	
	var bowler_celeb_started: bool = false
	celebration.celebration_started.connect(func(): bowler_celeb_started = true)
	
	celebration.trigger_wicket_celebration()
	if not _assert_true(bowler_celeb_started, "Bowler celebration_started signal emitted on wicket"):
		passed = false
	if not _assert_true(celebration.is_celebrating, "Bowler is in celebrating state"):
		passed = false

	# 2. Test Batsman Bat-Raise Celebration
	var batsman := BattingController.new()
	var bat_pivot := Node3D.new()
	batsman.bat_node = bat_pivot
	batsman.add_child(bat_pivot)
	batsman._ready()
	
	var batsman_celeb_started: bool = false
	batsman.celebration_started.connect(func(): batsman_celeb_started = true)
	
	batsman.celebrate_bat_raise()
	if not _assert_true(batsman_celeb_started, "Batsman celebration_started signal emitted on bat raise"):
		passed = false
	if not _assert_true(batsman.is_celebrating, "Batsman is in celebrating state"):
		passed = false

	# 3. Test Half-Century Milestone Emission in ScoreboardData
	var sb := ScoreboardData.new(5, -1)
	var fifty_emitted: bool = false
	var fifty_runs: int = 0
	sb.half_century_achieved.connect(func(_name: String, runs: int, _balls: int):
		fifty_emitted = true
		fifty_runs = runs
	)
	
	# Striker at 48 runs, scores a boundary 4 to cross 50
	sb.striker.runs = 48
	var four_call := UmpireRules.UmpireCall.new(UmpireRules.DecisionType.FOUR, 4, false, false, true, "FOUR!")
	sb.record_delivery(four_call, 90.0, 65.0, false)
	
	if not _assert_true(fifty_emitted and fifty_runs >= 50, "half_century_achieved signal emitted on crossing 50 runs"):
		passed = false

	# 4. Test Bowler Card Overlay
	var card_scene: PackedScene = load("res://scenes/bowler_card_overlay.tscn")
	if not _assert_true(card_scene != null, "bowler_card_overlay.tscn loaded"):
		passed = false
	var card: BowlerCardOverlay = card_scene.instantiate() as BowlerCardOverlay
	card.show_bowler_card("Mitchell Starc", "Left-Arm Fast • Express", "Overs: 2.0 | Wickets: 2")
	if not _assert_true(card.visible, "BowlerCardOverlay visible when shown"):
		passed = false
	card.hide_immediate()
	if not _assert_true(not card.visible, "BowlerCardOverlay hidden on hide_immediate"):
		passed = false

	# 5. Test Wagon Wheel Pop-Up View
	var wagon_scene: PackedScene = load("res://scenes/wagon_wheel_view.tscn")
	if not _assert_true(wagon_scene != null, "wagon_wheel_view.tscn loaded"):
		passed = false
	var wagon_view: WagonWheelView = wagon_scene.instantiate() as WagonWheelView
	wagon_view.open_wagon_wheel(sb)
	if not _assert_true(wagon_view.visible, "WagonWheelView visible when opened"):
		passed = false
	if not _assert_true(wagon_view.scoreboard_ref == sb, "WagonWheelView bound to scoreboard data"):
		passed = false

	wagon_view.free()
	card.free()
	batsman.free()
	bowler_node.free()
	return passed

func _assert_true(condition: bool, message: String) -> bool:
	if condition:
		print("  [PASS] %s" % message)
		return true
	else:
		printerr("  [FAIL] %s" % message)
		return false
