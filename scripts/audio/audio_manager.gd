# audio_manager.gd - CricStrike 3D
# Generates and plays procedural sound effects for real cricket broadcast impact:
# Bat strike crack, leather ball turf bounce, wooden stump rattle, crowd roar/cheer,
# TV commentary stinger, broadcast replay whoosh, player high-five, and standing ovation
class_name AudioManager
extends Node

static var _instance: AudioManager

var sfx_bat_crack: AudioStreamWAV
var sfx_stump_rattle: AudioStreamWAV
var sfx_ball_bounce: AudioStreamWAV
var sfx_crowd_cheer: AudioStreamWAV
var sfx_commentary_stinger: AudioStreamWAV
var sfx_replay_whoosh: AudioStreamWAV
var sfx_high_five: AudioStreamWAV
var sfx_standing_ovation: AudioStreamWAV

var _player_pool: Array[AudioStreamPlayer] = []
var _pool_size: int = 8

static func get_instance() -> AudioManager:
	if _instance != null and is_instance_valid(_instance):
		return _instance
	return null

func _notification(what: int) -> void:
	if what == NOTIFICATION_PREDELETE:
		if _instance == self:
			_instance = null

func _ready() -> void:
	_instance = self
	_generate_all_procedural_audio()
	_create_player_pool()

func _create_player_pool() -> void:
	for i in range(_pool_size):
		var player := AudioStreamPlayer.new()
		player.bus = "Master"
		add_child(player)
		_player_pool.append(player)

func _get_available_player() -> AudioStreamPlayer:
	for p in _player_pool:
		if not p.playing:
			return p
	return _player_pool[0] if _player_pool.size() > 0 else null

func play_bat_crack(is_six: bool = false) -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_bat_crack
	player.pitch_scale = randf_range(0.95, 1.08)
	player.volume_db = 2.0 if is_six else 0.0
	if player.is_inside_tree():
		player.play()
	if is_six:
		play_crowd_cheer(true)

func play_stump_rattle() -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_stump_rattle
	player.pitch_scale = randf_range(0.92, 1.05)
	player.volume_db = 3.0
	if player.is_inside_tree():
		player.play()
	play_crowd_cheer(false)

func play_ball_bounce() -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_ball_bounce
	player.pitch_scale = randf_range(0.90, 1.10)
	player.volume_db = -2.0
	if player.is_inside_tree():
		player.play()

func play_crowd_cheer(is_six: bool = false) -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_crowd_cheer
	player.pitch_scale = 1.05 if is_six else 0.95
	player.volume_db = 1.0 if is_six else -3.0
	if player.is_inside_tree():
		player.play()

func play_commentary_stinger() -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_commentary_stinger
	player.pitch_scale = randf_range(0.98, 1.02)
	player.volume_db = 1.5
	if player.is_inside_tree():
		player.play()

func play_replay_whoosh() -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_replay_whoosh
	player.pitch_scale = randf_range(0.95, 1.05)
	player.volume_db = 0.5
	if player.is_inside_tree():
		player.play()

func play_high_five() -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_high_five
	player.pitch_scale = randf_range(0.96, 1.04)
	player.volume_db = 2.0
	if player.is_inside_tree():
		player.play()

func play_standing_ovation() -> void:
	var player := _get_available_player()
	if player == null: return
	player.stream = sfx_standing_ovation
	player.pitch_scale = 1.0
	player.volume_db = 3.0
	if player.is_inside_tree():
		player.play()

func _generate_all_procedural_audio() -> void:
	sfx_bat_crack = _create_bat_crack_stream()
	sfx_stump_rattle = _create_stump_rattle_stream()
	sfx_ball_bounce = _create_ball_bounce_stream()
	sfx_crowd_cheer = _create_crowd_cheer_stream()
	sfx_commentary_stinger = _create_commentary_stinger_stream()
	sfx_replay_whoosh = _create_replay_whoosh_stream()
	sfx_high_five = _create_high_five_stream()
	sfx_standing_ovation = _create_standing_ovation_stream()

func _create_bat_crack_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 0.28
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		# Sharp acoustic impulse + wooden resonance (750Hz decaying rapidly)
		var env: float = exp(-t * 28.0)
		var tone: float = sin(t * 750.0 * TAU) * 0.5 + sin(t * 1450.0 * TAU) * 0.3
		var noise: float = (randf() * 2.0 - 1.0) * 0.45
		var sample_val: float = (tone + noise) * env
		var s8: int = clampi(int(sample_val * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream

func _create_stump_rattle_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 0.55
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		# Multi-wood click rattle (stumps + bails flying)
		var env: float = exp(-t * 8.5)
		var clack1: float = sin(t * 520.0 * TAU) * exp(-fposmod(t, 0.08) * 35.0)
		var clack2: float = sin(t * 880.0 * TAU) * exp(-fposmod(t + 0.03, 0.11) * 30.0)
		var sample_val: float = (clack1 * 0.6 + clack2 * 0.5) * env
		var s8: int = clampi(int(sample_val * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream

func _create_ball_bounce_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 0.14
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var env: float = exp(-t * 42.0)
		var thud: float = sin(t * 160.0 * TAU) * env
		var s8: int = clampi(int(thud * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream

func _create_crowd_cheer_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 1.8
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	var last_noise: float = 0.0
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		# Crowd roar envelope: swell then slow fade
		var env: float = smoothstep(0.0, 0.25, t) * (1.0 - smoothstep(0.8, duration, t))
		# Lowpass pink noise for stadium crowd acoustic
		var white: float = randf() * 2.0 - 1.0
		last_noise = lerpf(last_noise, white, 0.12)
		var sample_val: float = last_noise * env * 0.75
		var s8: int = clampi(int(sample_val * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream

func _create_commentary_stinger_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 0.65
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		# Two rising bright broadcast chime bells: 587.3Hz (D5) -> 880Hz (A5)
		var env1: float = exp(-maxf(0.0, t) * 12.0)
		var tone1: float = sin(t * 587.33 * TAU) * 0.5 * env1
		var t2: float = t - 0.16
		var env2: float = exp(-maxf(0.0, t2) * 9.0) if t2 > 0.0 else 0.0
		var tone2: float = sin(t * 880.0 * TAU) * 0.6 * env2 if t2 > 0.0 else 0.0
		var sample_val: float = tone1 + tone2
		var s8: int = clampi(int(sample_val * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream

func _create_replay_whoosh_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 0.45
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	var filter_state: float = 0.0
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var progress: float = t / duration
		# Envelope builds and decays like a camera whip / wipe
		var env: float = sin(progress * PI)
		# Frequency sweep
		var cutoff: float = lerpf(0.05, 0.45, sin(progress * PI))
		var white: float = randf() * 2.0 - 1.0
		filter_state = lerpf(filter_state, white, cutoff)
		var sample_val: float = filter_state * env * 0.85
		var s8: int = clampi(int(sample_val * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream

func _create_high_five_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 0.22
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var env: float = exp(-t * 36.0)
		var slap: float = (sin(t * 920.0 * TAU) * 0.4 + (randf() * 2.0 - 1.0) * 0.6) * env
		var s8: int = clampi(int(slap * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream

func _create_standing_ovation_stream() -> AudioStreamWAV:
	var sample_rate: int = 22050
	var duration: float = 2.4
	var num_samples: int = int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)
	
	var last_val: float = 0.0
	for i in range(num_samples):
		var t: float = float(i) / float(sample_rate)
		var env: float = smoothstep(0.0, 0.4, t) * (1.0 - smoothstep(1.6, duration, t))
		var white: float = randf() * 2.0 - 1.0
		last_val = lerpf(last_val, white, 0.18)
		# Rhythmic claps superimposed on crowd roar
		var clap_trigger: float = 1.0 if fposmod(t * 4.2 + (randf() * 0.1), 1.0) < 0.04 else 0.0
		var claps: float = (randf() * 2.0 - 1.0) * clap_trigger * 0.5
		var sample_val: float = (last_val * 0.7 + claps) * env
		var s8: int = clampi(int(sample_val * 127.0), -128, 127)
		data[i] = s8 & 0xFF
		
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_8_BITS
	stream.mix_rate = sample_rate
	stream.data = data
	return stream
