# test_audio_commentary.gd - CricStrike 3D
# Verification of procedural situational commentary lines and synthesized audio streams
class_name TestAudioCommentary
extends RefCounted

const CommentaryManager = preload("res://scripts/audio/commentary_manager.gd")
const AudioManager = preload("res://scripts/audio/audio_manager.gd")
const CommentaryBanner = preload("res://scripts/ui/commentary_banner.gd")

func run_all_tests() -> bool:
	var passed: bool = true
	print("--- Running TestAudioCommentary ---")
	
	# 1. Instantiate AudioManager and check newly added procedural audio streams
	var audio := AudioManager.new()
	audio._ready()
	
	if not _assert_true(audio.sfx_commentary_stinger != null, "sfx_commentary_stinger generated"):
		passed = false
	if not _assert_true(audio.sfx_replay_whoosh != null, "sfx_replay_whoosh generated"):
		passed = false
	if not _assert_true(audio.sfx_high_five != null, "sfx_high_five generated"):
		passed = false
	if not _assert_true(audio.sfx_standing_ovation != null, "sfx_standing_ovation generated"):
		passed = false
		
	# 2. Instantiate CommentaryManager
	var comm := CommentaryManager.new()
	comm._ready()
	
	var received_line: String = ""
	var received_event: String = ""
	var received_comm_name: String = ""
	comm.commentary_triggered.connect(func(l: String, ev: String, cn: String):
		received_line = l
		received_event = ev
		received_comm_name = cn
	)
	
	# Test Maximum Six Commentary Line
	var six_line := comm.trigger_event(CommentaryManager.CommentaryEvent.MAXIMUM_SIX)
	if not _assert_true(not six_line.is_empty(), "MAXIMUM_SIX line triggered: %s" % six_line):
		passed = false
	if not _assert_true(received_event == "MAXIMUM 6", "Event tagged as MAXIMUM 6"):
		passed = false
	if not _assert_true(not received_comm_name.is_empty(), "Commentator name assigned: %s" % received_comm_name):
		passed = false

	# Test Boundary Four Commentary Line
	var four_line := comm.trigger_event(CommentaryManager.CommentaryEvent.BOUNDARY_FOUR)
	if not _assert_true(not four_line.is_empty(), "BOUNDARY_FOUR line triggered: %s" % four_line):
		passed = false

	# Test Wicket Bowled & Caught
	var bowled_line := comm.trigger_event(CommentaryManager.CommentaryEvent.WICKET_BOWLED)
	if not _assert_true(not bowled_line.is_empty() and received_event == "WICKET (BOWLED)", "WICKET_BOWLED line triggered and event tagged"):
		passed = false
		
	var caught_line := comm.trigger_event(CommentaryManager.CommentaryEvent.WICKET_CAUGHT)
	if not _assert_true(not caught_line.is_empty() and received_event == "WICKET (CAUGHT)", "WICKET_CAUGHT line triggered and event tagged"):
		passed = false

	# Test Half Century Milestone
	var fifty_line := comm.trigger_event(CommentaryManager.CommentaryEvent.HALF_CENTURY)
	if not _assert_true(not fifty_line.is_empty(), "HALF_CENTURY line triggered: %s" % fifty_line):
		passed = false

	# 3. Commentary Banner Scene Verification
	var banner_scene: PackedScene = load("res://scenes/commentary_banner.tscn")
	if not _assert_true(banner_scene != null, "commentary_banner.tscn loaded"):
		passed = false
	var banner: CommentaryBanner = banner_scene.instantiate() as CommentaryBanner
	if not _assert_true(banner.has_node("Center/Panel/Margin/VBox/QuoteLabel"), "CommentaryBanner has QuoteLabel"):
		passed = false
	if not _assert_true(banner.has_node("Center/Panel/Margin/VBox/HBox/SoundWave"), "CommentaryBanner has SoundWave visualizer"):
		passed = false
		
	banner.show_commentary_line("Smacked straight down the ground for a maximum!", "MAXIMUM 6", "Danny M.")
	if not _assert_true(banner.visible, "CommentaryBanner visible on line trigger"):
		passed = false

	banner.free()
	comm.free()
	audio.free()
	AudioManager._instance = null
	CommentaryManager._instance = null
	return passed

func _assert_true(condition: bool, message: String) -> bool:
	if condition:
		print("  [PASS] %s" % message)
		return true
	else:
		printerr("  [FAIL] %s" % message)
		return false
