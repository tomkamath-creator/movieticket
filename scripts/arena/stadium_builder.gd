# StadiumBuilder.gd - CricStrike 3D
# Complete Massive 3D International Cricket Stadium Builder
# Pristine rectangular green turf pitch, white boundary ropes, giant LED floodlight towers,
# multi-tiered spectator grandstands, dual electronic broadcast jumbo scoreboards, dugouts,
# animated spectator cheering loops, waving team flags, and twinkling smartphone flashlights.
class_name StadiumBuilder
extends Node3D

const GameConstants = preload("res://scripts/core/game_constants.gd")
const CrowdAnimator = preload("res://scripts/arena/crowd_animator.gd")

@export var build_on_ready: bool = true

var crowd_animator: CrowdAnimator

func _ready() -> void:
	if build_on_ready:
		build_stadium()

func build_stadium() -> void:
	# 1. Pristine Rectangular Green Turf Pitch
	_build_pitch_strip()
	
	# 2. Crease Markings (Popping, Bowling, Return creases)
	_build_crease_markings()
	
	# 3. Striped Outfield Oval
	_build_outfield()
	
	# 4. White Boundary Foam Ropes & Sponsor Wedges
	_build_boundary_rope()
	
	# 5. Sight Screens (Both ends)
	_build_sight_screens()
	
	# 6. Multi-Tiered Spectator Grandstands
	_build_stadium_stands()
	
	# 7. Animated Spectator Crowd, Waving Team Flags & Flashlights
	_build_spectator_crowd_and_features()
	
	# 8. Dual Electronic Broadcast Jumbo Scoreboards
	_build_jumbo_scoreboards()
	
	# 9. Home & Away Team Dugouts
	_build_dugouts()
	
	# 10. Giant LED Floodlight Towers
	_build_floodlight_towers()

func _build_pitch_strip() -> void:
	var pitch_body := StaticBody3D.new()
	pitch_body.name = "PitchSurface"
	pitch_body.add_to_group("pitch_surface")
	
	# Pitch dimensions: 3.05m width, 0.08m depth, 20.12m + 2.5m run-up buffer = 22.62m length
	var pitch_mesh := BoxMesh.new()
	pitch_mesh.size = Vector3(GameConstants.PITCH_WIDTH, 0.08, GameConstants.PITCH_LENGTH + 2.5)
	
	var pitch_shader := load("res://shaders/pitch_turf.gdshader")
	if pitch_shader:
		var s_mat := ShaderMaterial.new()
		s_mat.shader = pitch_shader
		pitch_mesh.material = s_mat
	else:
		var pitch_mat := StandardMaterial3D.new()
		pitch_mat.albedo_color = Color(0.68, 0.62, 0.44) # Pristine natural turf blend
		pitch_mat.roughness = 0.72
		pitch_mesh.material = pitch_mat
	
	var mesh_inst := MeshInstance3D.new()
	mesh_inst.mesh = pitch_mesh
	mesh_inst.position = Vector3(0.0, -0.04, 0.0)
	
	var col_shape := CollisionShape3D.new()
	var box_shape := BoxShape3D.new()
	box_shape.size = pitch_mesh.size
	col_shape.shape = box_shape
	col_shape.position = mesh_inst.position
	
	pitch_body.add_child(mesh_inst)
	pitch_body.add_child(col_shape)
	add_child(pitch_body)

func _build_crease_markings() -> void:
	var lines_node := Node3D.new()
	lines_node.name = "CreaseMarkings"
	
	var white_mat := StandardMaterial3D.new()
	white_mat.albedo_color = Color(0.98, 0.98, 0.98)
	white_mat.roughness = 0.35
	
	# Both ends: Striker (Z = +10.06) and Bowler (Z = -10.06)
	var ends: Array[float] = [GameConstants.PITCH_LENGTH * 0.5, -GameConstants.PITCH_LENGTH * 0.5]
	for z_end: float in ends:
		var sign_dir: float = -1.0 if z_end > 0 else 1.0
		
		# 1. Bowling Crease (through the stumps, width 2.64m)
		var bowl_crease := _create_line_mesh(Vector3(GameConstants.RETURN_CREASE_WIDTH, 0.005, 0.05), white_mat)
		bowl_crease.position = Vector3(0.0, 0.003, z_end)
		lines_node.add_child(bowl_crease)
		
		# 2. Popping Crease (1.22m in front of bowling crease, width 3.66m)
		var popping_z: float = z_end + (sign_dir * GameConstants.POPPING_CREASE_OFFSET)
		var pop_crease := _create_line_mesh(Vector3(3.66, 0.005, 0.06), white_mat)
		pop_crease.position = Vector3(0.0, 0.003, popping_z)
		lines_node.add_child(pop_crease)
		
		# 3. Return Creases (perpendicular to bowling crease, 2.44m long)
		var sides: Array[float] = [-1.32, 1.32]
		for side: float in sides:
			var ret_crease := _create_line_mesh(Vector3(0.05, 0.005, 2.44), white_mat)
			ret_crease.position = Vector3(side, 0.003, z_end + (sign_dir * 0.61))
			lines_node.add_child(ret_crease)
			
	add_child(lines_node)

func _create_line_mesh(size: Vector3, mat: Material) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	bm.material = mat
	mi.mesh = bm
	return mi

func _build_outfield() -> void:
	var outfield_body := StaticBody3D.new()
	outfield_body.name = "OutfieldTurf"
	outfield_body.add_to_group("outfield")
	
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = 80.0
	cylinder.bottom_radius = 80.0
	cylinder.height = 0.1
	cylinder.radial_segments = 64
	
	var outfield_shader := load("res://shaders/striped_outfield.gdshader")
	if outfield_shader:
		var s_mat := ShaderMaterial.new()
		s_mat.shader = outfield_shader
		cylinder.material = s_mat
	else:
		var grass_mat := StandardMaterial3D.new()
		grass_mat.albedo_color = Color(0.18, 0.48, 0.16)
		grass_mat.roughness = 0.8
		cylinder.material = grass_mat
	
	var mesh_inst := MeshInstance3D.new()
	mesh_inst.mesh = cylinder
	mesh_inst.position = Vector3(0.0, -0.05, 0.0)
	
	var col := CollisionShape3D.new()
	var cyl_shape := CylinderShape3D.new()
	cyl_shape.radius = 80.0
	cyl_shape.height = 0.1
	col.shape = cyl_shape
	col.position = mesh_inst.position
	
	outfield_body.add_child(mesh_inst)
	outfield_body.add_child(col)
	add_child(outfield_body)

func _build_boundary_rope() -> void:
	var rope_node := Node3D.new()
	rope_node.name = "BoundaryRope"
	
	var segments := 72
	var rope_mat := StandardMaterial3D.new()
	rope_mat.albedo_color = Color(0.96, 0.96, 0.96) # Crisp white boundary rope
	rope_mat.roughness = 0.4
	
	var wedge_mat := StandardMaterial3D.new()
	wedge_mat.albedo_color = Color(0.95, 0.45, 0.1) # Bright sponsor advertising wedge
	
	var prev_point := Vector3(GameConstants.BOUNDARY_RADIUS_X, 0.1, 0.0)
	for i in range(1, segments + 1):
		var angle := (i / float(segments)) * TAU
		var cur_point := Vector3(
			cos(angle) * GameConstants.BOUNDARY_RADIUS_X,
			0.1,
			sin(angle) * GameConstants.BOUNDARY_RADIUS_Z
		)
		
		# Place cushion segment
		var cushion := MeshInstance3D.new()
		var bm := BoxMesh.new()
		var seg_len := prev_point.distance_to(cur_point)
		bm.size = Vector3(0.35, 0.22, seg_len + 0.1)
		bm.material = wedge_mat if i % 2 == 0 else rope_mat
		cushion.mesh = bm
		
		var mid_pos := (prev_point + cur_point) * 0.5
		cushion.position = mid_pos
		var dir := (cur_point - mid_pos).normalized()
		if dir.length() > 0.01:
			cushion.transform = Transform3D().looking_at(dir, Vector3.UP)
			cushion.position = mid_pos
		rope_node.add_child(cushion)
		
		prev_point = cur_point
		
	add_child(rope_node)

func _build_sight_screens() -> void:
	var screen_mat := StandardMaterial3D.new()
	screen_mat.albedo_color = Color(0.98, 0.98, 0.98) # Pristine white contrast screen
	screen_mat.roughness = 0.25
	
	for z_pos in [-70.0, 70.0]:
		var screen_mesh := BoxMesh.new()
		screen_mesh.size = Vector3(14.0, 6.5, 0.6)
		screen_mesh.material = screen_mat
		
		var mi := MeshInstance3D.new()
		mi.mesh = screen_mesh
		mi.position = Vector3(0.0, 3.25, z_pos)
		add_child(mi)

func _build_stadium_stands() -> void:
	var stands_node := Node3D.new()
	stands_node.name = "GrandstandTiers"
	
	var concrete_mat := StandardMaterial3D.new()
	concrete_mat.albedo_color = Color(0.34, 0.38, 0.44)
	concrete_mat.roughness = 0.9
	
	var seats_blue := StandardMaterial3D.new()
	seats_blue.albedo_color = Color(0.12, 0.38, 0.72)
	
	var seats_red := StandardMaterial3D.new()
	seats_red.albedo_color = Color(0.72, 0.16, 0.18)
	
	# 3 Stepped spectator tiers around the circumference
	for tier in range(3):
		var tier_radius: float = 82.0 + (tier * 6.5)
		var tier_height: float = 3.0 + (tier * 4.2)
		
		var tube := TorusMesh.new()
		tube.inner_radius = tier_radius - 1.5
		tube.outer_radius = tier_radius + 4.5
		tube.rings = 40
		tube.ring_segments = 8
		tube.material = seats_blue if tier % 2 == 0 else seats_red
		
		var mi := MeshInstance3D.new()
		mi.mesh = tube
		mi.position = Vector3(0.0, tier_height, 0.0)
		stands_node.add_child(mi)
		
	# Upper Stadium Roof Canopy
	var roof_mesh := TorusMesh.new()
	roof_mesh.inner_radius = 92.0
	roof_mesh.outer_radius = 104.0
	roof_mesh.rings = 36
	roof_mesh.ring_segments = 6
	var roof_mat := StandardMaterial3D.new()
	roof_mat.albedo_color = Color(0.85, 0.88, 0.92)
	roof_mat.metallic = 0.3
	roof_mesh.material = roof_mat
	
	var roof_inst := MeshInstance3D.new()
	roof_inst.mesh = roof_mesh
	roof_inst.position = Vector3(0.0, 19.5, 0.0)
	stands_node.add_child(roof_inst)
	
	add_child(stands_node)

func _build_spectator_crowd_and_features() -> void:
	var crowd_root := Node3D.new()
	crowd_root.name = "CrowdRoot"
	
	var flags_root := Node3D.new()
	flags_root.name = "FlagsRoot"
	
	var flashlights_root := Node3D.new()
	flashlights_root.name = "FlashlightsRoot"
	
	# Colors for spectator crowd in international stadium: Blue, Gold, Green, Red, White
	var crowd_colors: Array[Color] = [
		Color(0.12, 0.42, 0.85), # Team India Blue
		Color(0.96, 0.78, 0.12), # Team Australia Gold
		Color(0.15, 0.65, 0.25), # Cricket Green
		Color(0.88, 0.22, 0.22), # Vibrant Red
		Color(0.94, 0.94, 0.96)  # Neutral White
	]
	
	# 1. Populate Spectator Crowd Clusters across tiers
	var spectator_mesh := CapsuleMesh.new()
	spectator_mesh.radius = 0.24
	spectator_mesh.height = 0.85
	
	var crowd_points_per_tier := 32
	for tier in range(3):
		var tier_radius: float = 83.5 + (tier * 6.5)
		var tier_height: float = 3.6 + (tier * 4.2)
		
		for i in range(crowd_points_per_tier):
			var angle := (float(i) / float(crowd_points_per_tier)) * TAU
			var spectator := MeshInstance3D.new()
			spectator.mesh = spectator_mesh
			
			var mat := StandardMaterial3D.new()
			mat.albedo_color = crowd_colors[i % crowd_colors.size()]
			spectator.material_override = mat
			
			var c_pos := Vector3(cos(angle) * tier_radius, tier_height, sin(angle) * tier_radius)
			spectator.position = c_pos
			var to_center := (Vector3(0.0, 1.0, 0.0) - c_pos).normalized()
			if to_center.length() > 0.01:
				spectator.transform = Transform3D().looking_at(to_center, Vector3.UP)
				spectator.position = c_pos
			crowd_root.add_child(spectator)

	# 2. Populate Waving Team Flags along upper tier perimeter
	var flag_pole_mat := StandardMaterial3D.new()
	flag_pole_mat.albedo_color = Color(0.75, 0.75, 0.8)
	flag_pole_mat.metallic = 0.7
	
	var flag_colors: Array[Color] = [
		Color(0.1, 0.4, 0.9),  # Blue
		Color(0.95, 0.5, 0.1), # Saffron/Orange
		Color(0.95, 0.8, 0.1), # Gold
		Color(0.1, 0.7, 0.3)   # Green
	]
	
	var num_flags := 16
	for f in range(num_flags):
		var f_angle := (float(f) / float(num_flags)) * TAU
		var f_radius := 96.0
		var f_height := 16.0
		
		var flag_holder := Node3D.new()
		var f_pos := Vector3(cos(f_angle) * f_radius, f_height, sin(f_angle) * f_radius)
		flag_holder.position = f_pos
		var to_fcenter := (Vector3(0.0, f_height, 0.0) - f_pos).normalized()
		if to_fcenter.length() > 0.01:
			flag_holder.transform = Transform3D().looking_at(to_fcenter, Vector3.UP)
			flag_holder.position = f_pos
		
		# Flagpole
		var pole := MeshInstance3D.new()
		var p_mesh := CylinderMesh.new()
		p_mesh.top_radius = 0.06
		p_mesh.bottom_radius = 0.08
		p_mesh.height = 4.2
		p_mesh.material = flag_pole_mat
		pole.mesh = p_mesh
		pole.position = Vector3(0.0, 2.1, 0.0)
		flag_holder.add_child(pole)
		
		# Flag cloth
		var cloth := MeshInstance3D.new()
		var c_mesh := BoxMesh.new()
		c_mesh.size = Vector3(1.8, 1.1, 0.04)
		var c_mat := StandardMaterial3D.new()
		c_mat.albedo_color = flag_colors[f % flag_colors.size()]
		c_mat.roughness = 0.45
		cloth.mesh = c_mesh
		cloth.material_override = c_mat
		cloth.position = Vector3(0.95, 3.4, 0.0)
		flag_holder.add_child(cloth)
		
		flags_root.add_child(flag_holder)

	# 3. Populate Twinkling Smartphone Flashlights in the stands
	var flashlight_mat := StandardMaterial3D.new()
	flashlight_mat.albedo_color = Color(1.0, 1.0, 1.0)
	flashlight_mat.emission_enabled = true
	flashlight_mat.emission = Color(0.95, 0.98, 1.0)
	flashlight_mat.emission_energy_multiplier = 4.0
	
	var flash_mesh := SphereMesh.new()
	flash_mesh.radius = 0.16
	flash_mesh.height = 0.32
	flash_mesh.material = flashlight_mat
	
	var num_flashlights := 48
	for fl in range(num_flashlights):
		var fl_angle := (float(fl) / float(num_flashlights)) * TAU + (randf() * 0.1)
		var fl_tier := fl % 3
		var fl_radius := 84.0 + (fl_tier * 6.5) + randf_range(-1.2, 1.2)
		var fl_height := 3.8 + (fl_tier * 4.2) + randf_range(0.2, 0.8)
		
		var flash_node := MeshInstance3D.new()
		flash_node.mesh = flash_mesh
		flash_node.position = Vector3(cos(fl_angle) * fl_radius, fl_height, sin(fl_angle) * fl_radius)
		flashlights_root.add_child(flash_node)

	add_child(crowd_root)
	add_child(flags_root)
	add_child(flashlights_root)
	
	# Instantiate CrowdAnimator to run procedural crowd motion loop
	crowd_animator = CrowdAnimator.new()
	crowd_animator.name = "CrowdAnimator"
	crowd_animator.crowd_root = crowd_root
	crowd_animator.flags_root = flags_root
	crowd_animator.flashlights_root = flashlights_root
	add_child(crowd_animator)

func _build_jumbo_scoreboards() -> void:
	var boards_node := Node3D.new()
	boards_node.name = "ElectronicJumboScoreboards"
	
	var frame_mat := StandardMaterial3D.new()
	frame_mat.albedo_color = Color(0.12, 0.14, 0.18)
	frame_mat.metallic = 0.85
	
	var screen_mat := StandardMaterial3D.new()
	screen_mat.albedo_color = Color(0.05, 0.08, 0.14)
	screen_mat.emission_enabled = true
	screen_mat.emission = Color(0.2, 0.45, 0.85)
	screen_mat.emission_energy_multiplier = 1.6
	
	# Dual Jumbo Electronic Scoreboards: North Pavilion End (Z = -82m) & South City End (Z = +82m)
	var board_positions := [
		Vector3(0.0, 16.5, -82.0),
		Vector3(0.0, 16.5, 82.0)
	]
	
	for i in range(board_positions.size()):
		var b_pos: Vector3 = board_positions[i]
		var board_holder := Node3D.new()
		board_holder.position = b_pos
		if b_pos.z > 0:
			board_holder.rotation_degrees.y = 180.0
			
		# Structural Pylons
		for px in [-7.0, 7.0]:
			var leg := MeshInstance3D.new()
			var leg_mesh := BoxMesh.new()
			leg_mesh.size = Vector3(0.8, 16.0, 0.8)
			leg_mesh.material = frame_mat
			leg.mesh = leg_mesh
			leg.position = Vector3(px, -8.0, 0.0)
			board_holder.add_child(leg)
			
		# Outer Bezel
		var frame := MeshInstance3D.new()
		var frame_mesh := BoxMesh.new()
		frame_mesh.size = Vector3(16.5, 9.2, 0.9)
		frame_mesh.material = frame_mat
		frame.mesh = frame_mesh
		board_holder.add_child(frame)
		
		# Digital LED Screen Display
		var screen := MeshInstance3D.new()
		var s_mesh := BoxMesh.new()
		s_mesh.size = Vector3(15.2, 8.0, 0.2)
		s_mesh.material = screen_mat
		screen.mesh = s_mesh
		screen.position = Vector3(0.0, 0.0, 0.46)
		board_holder.add_child(screen)
		
		# 3D Digital Header Label
		var label := Label3D.new()
		label.text = "CRICSTRIKE 3D\nLIVE BROADCAST"
		label.font_size = 64
		label.pixel_size = 0.008
		label.modulate = Color(0.2, 0.9, 1.0)
		label.position = Vector3(0.0, 0.0, 0.58)
		board_holder.add_child(label)
		
		boards_node.add_child(board_holder)
		
	add_child(boards_node)

func _build_dugouts() -> void:
	var dugouts_node := Node3D.new()
	dugouts_node.name = "TeamDugouts"
	
	var frame_mat := StandardMaterial3D.new()
	frame_mat.albedo_color = Color(0.2, 0.24, 0.3)
	
	var bench_mat := StandardMaterial3D.new()
	bench_mat.albedo_color = Color(0.15, 0.35, 0.65)
	
	var canopy_mat := StandardMaterial3D.new()
	canopy_mat.albedo_color = Color(0.9, 0.92, 0.96, 0.85)
	canopy_mat.roughness = 0.3
	
	# Home and Away dugouts along the boundary perimeter
	var dugout_positions := [
		Vector3(-66.0, 0.0, 6.0),
		Vector3(-66.0, 0.0, -6.0)
	]
	
	for pos in dugout_positions:
		var d_node := Node3D.new()
		d_node.position = pos
		d_node.rotation_degrees.y = 90.0
		
		# Dugout Floor
		var floor_mesh := BoxMesh.new()
		floor_mesh.size = Vector3(8.0, 0.15, 3.2)
		floor_mesh.material = frame_mat
		var fl := MeshInstance3D.new()
		fl.mesh = floor_mesh
		fl.position = Vector3(0.0, 0.08, 0.0)
		d_node.add_child(fl)
		
		# Team Player Benches
		var bench_mesh := BoxMesh.new()
		bench_mesh.size = Vector3(7.2, 0.5, 0.6)
		bench_mesh.material = bench_mat
		var bench := MeshInstance3D.new()
		bench.mesh = bench_mesh
		bench.position = Vector3(0.0, 0.45, -0.6)
		d_node.add_child(bench)
		
		# Curved Canopy Roof
		var roof := MeshInstance3D.new()
		var r_mesh := BoxMesh.new()
		r_mesh.size = Vector3(8.4, 0.12, 3.5)
		r_mesh.material = canopy_mat
		roof.mesh = r_mesh
		roof.position = Vector3(0.0, 2.5, 0.0)
		roof.rotation_degrees.x = 8.0
		d_node.add_child(roof)
		
		dugouts_node.add_child(d_node)
		
	add_child(dugouts_node)

func _build_floodlight_towers() -> void:
	var light_tower_node := Node3D.new()
	light_tower_node.name = "Floodlights"
	
	var tower_mat := StandardMaterial3D.new()
	tower_mat.albedo_color = Color(0.72, 0.74, 0.78)
	tower_mat.metallic = 0.65
	tower_mat.roughness = 0.35
	
	var glow_mat := StandardMaterial3D.new()
	glow_mat.albedo_color = Color(1.0, 0.98, 0.92)
	glow_mat.emission_enabled = true
	glow_mat.emission = Color(1.0, 0.98, 0.88)
	glow_mat.emission_energy_multiplier = 3.5
	
	var corner_positions := [
		Vector3(-58.0, 0.0, -58.0),
		Vector3(58.0, 0.0, -58.0),
		Vector3(-58.0, 0.0, 58.0),
		Vector3(58.0, 0.0, 58.0)
	]
	
	for pos in corner_positions:
		# Pylon lattice column (38m height)
		var pylon := MeshInstance3D.new()
		var pylon_mesh := CylinderMesh.new()
		pylon_mesh.top_radius = 0.7
		pylon_mesh.bottom_radius = 1.8
		pylon_mesh.height = 38.0
		pylon_mesh.material = tower_mat
		pylon.mesh = pylon_mesh
		pylon.position = pos + Vector3(0.0, 19.0, 0.0)
		light_tower_node.add_child(pylon)
		
		# Floodlight head panel with LED cluster
		var head := MeshInstance3D.new()
		var head_mesh := BoxMesh.new()
		head_mesh.size = Vector3(8.5, 5.2, 1.4)
		head_mesh.material = glow_mat
		head.mesh = head_mesh
		var head_pos: Vector3 = (pos as Vector3) + Vector3(0.0, 38.0, 0.0)
		head.position = head_pos
		var light_dir: Vector3 = (Vector3(0.0, 2.0, 0.0) - head_pos).normalized()
		head.transform = Transform3D().looking_at(light_dir, Vector3.UP)
		head.position = head_pos
		light_tower_node.add_child(head)
		
	add_child(light_tower_node)
