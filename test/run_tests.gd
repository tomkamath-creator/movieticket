# run_tests.gd - CricStrike 3D
# Headless CI Test Runner for GitHub Actions and Local Testing
extends SceneTree

func _init() -> void:
	print("==================================================")
	print("   CRICSTRIKE 3D - HEADLESS TEST RUNNER (PHASE 6)  ")
	print("==================================================")
	
	var all_passed: bool = true
	var test_paths: Array[String] = [
		"res://test/test_pitch_physics.gd",
		"res://test/test_timing_engine.gd",
		"res://test/test_stump_collision.gd",
		"res://test/test_ai_bowler.gd",
		"res://test/test_bowling_meters.gd",
		"res://test/test_umpire_rules.gd",
		"res://test/test_scoreboard.gd",
		"res://test/test_fielder_state.gd",
		"res://test/test_player_customization.gd",
		"res://test/test_game_modes.gd",
		"res://test/test_character_animations.gd",
		"res://test/test_asset_downloader.gd",
		"res://test/test_ui_and_cinematics.gd",
		"res://test/test_broadcast_replay.gd",
		"res://test/test_audio_commentary.gd",
		"res://test/test_stadium_and_crowd.gd",
		"res://test/test_player_celebrations.gd"
	]
	
	for path in test_paths:
		print(">> Starting test suite: %s" % path)
		var test_script = load(path)
		if test_script == null:
			printerr("Failed to load test script: %s" % path)
			all_passed = false
			continue
			
		var test_instance = test_script.new()
		var suite_ok: bool = false
		if test_instance.has_method("run_all_tests"):
			suite_ok = test_instance.run_all_tests()
		elif test_script.has_method("run_all_tests"):
			suite_ok = test_script.run_all_tests()
		else:
			printerr("Test script %s has no run_all_tests method" % path)
			suite_ok = false
			
		if not suite_ok:
			all_passed = false
		print(">> Finished test suite: %s (OK: %s)" % [path, suite_ok])
		print("")

	print("==================================================")
	if all_passed:
		print("   ALL TESTS PASSED SUCCESSFULLY! (PHASE 6 COMPLETE) ")
		print("==================================================")
		quit(0)
	else:
		printerr("   TEST SUITE FAILED! CHECK LOGS ABOVE.         ")
		print("==================================================")
		quit(1)
