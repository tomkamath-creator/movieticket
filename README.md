# CricStrike 3D 🏏

A production-quality, 100% offline 3D mobile cricket game inspired by *Real Cricket 3D* and *WCC3*, built from the ground up for **Godot Engine 4.3** with premium esports aesthetics and mobile/Android performance optimization.

---

## 🌟 Major Features in v4.0.0 (Pro Broadcast & International Stadium Edition)

### 1. 📺 Broadcast Replay System (`scripts/camera/broadcast_replay_director.gd`)
- **Automated Slow-Motion Replay**: Automatically triggers a 3-second multi-angle slow-motion ($0.45\times$ speed) TV replay after every boundary ($4$ or $6$) and wicket dismissal.
- **Dynamic 3-Angle Director**:
  1. *Angle 1 (Pitch Delivery Cam)*: Low-angle tracking from the pitch corridor focusing on ball release and bounce.
  2. *Angle 2 (Ultra Slow-Mo Impact Cam)*: Crease close-up capturing bat-ball impact and stump dislodgement.
  3. *Angle 3 (Reverse Broadcast Sky Cam)*: Elevated stadium perspective tracking the boundary flight and crowd celebration.
- **Instant Skip Button**: Prominent, touch-friendly **"⏩ SKIP REPLAY"** button allowing players to instantly interrupt the replay and return smoothly to live gameplay.
- **TV Broadcast Overlay**: Blinking recording indicator (`● REC SLOW-MO REPLAY`), dynamic title cards, and camera angle counters (`ANGLE 1 / 3 [PITCH CAM]`).

### 2. 🏟️ Animated Stadium Crowd, Waving Team Flags & Flashlights (`scripts/arena/crowd_animator.gd`)
- **Dynamic Spectator Cheering Loops**: Multi-tiered grandstands populated with vibrant spectators in international team colors (India Blue, Australia Gold, Cricket White, Saffron, Crimson). Spectators perform synchronized traveling Mexican waves and high-energy jumping cheering surges on boundaries and wickets.
- **Waving Team Flags**: 16 perimeter flagpoles around the grandstand rim featuring fluttering national and franchise team flags with procedural wind flutter physics.
- **Smartphone Flashlights in the Stands**: 48+ twinkling LED flashlight points distributed across seating tiers with randomized twinkle phases, recreating the iconic night-match stadium atmosphere.

### 3. 🎙️ Procedural Situational Audio Commentary (`scripts/audio/commentary_manager.gd`)
- **Situational Commentary Lines**: Iconic broadcast commentary voiced and displayed on key match events:
  - *Sixes*: *"Smacked straight down the ground for a maximum!"*, *"High, handsome and into the second tier! What a colossal strike!"*
  - *Fours*: *"Pierces the infield with precision! Beautiful boundary!"*, *"Cracking shot! Races away to the fence like a tracer bullet!"*
  - *Bowled*: *"Timber! Clean bowled through the gate! Stumps are shattered!"*, *"What a peach of a delivery! Knocked him over completely!"*
  - *Caught*: *"In the air... and it's taken! Big wicket for the bowling side!"*, *"Up goes the finger! Caught in the deep, massive breakthrough!"*
  - *Half-Centuries*: *"Fifty for the batsman! A masterclass knock under pressure, and the crowd is on its feet!"*
- **Acoustic Audio Synthesis**: Procedurally synthesized broadcast commentary chimes, replay transition whooshes, high-five handclaps, and crowd standing ovation roars generated in `AudioManager`.
- **On-Screen Commentary Banner**: Sleek TV broadcast subtitle card at the top with animated sound-wave visualizer and commentator attribution.

### 4. ✋ Player Celebration Animations (`scripts/player/bowler_celebration.gd`)
- **Bowler Wicket Celebration**: Bowler leaps in jubilation with high-five arm gesture and acoustic handclap SFX on every dismissal.
- **Batsman Bat-Raise Gesture**: Batsman raises bat high to the crowd and pavilion on reaching a half-century ($50\text{ runs}$) accompanied by standing ovation roars.

### 5. 📊 In-Game Graphics Overlays & Massive 3D Stadium (`scripts/arena/stadium_builder.gd`)
- **TV Broadcast Score Bar at Bottom**: Modern esports broadcast score strip anchored at the bottom of the screen featuring team badges, overs, CRR, RRR, active batsman stats, bowler figures, and over ball badges.
- **Bowler Card on New Over**: Lower-third broadcast card sliding in on new overs with full bowler profile and spell figures.
- **Batsman 360° Wagon Wheel Pop-Up**: Radar/polar shot distribution chart showing all scored shots color-coded by runs (singles, fours, sixes) with off-side vs leg-side breakdown.
- **International Stadium 3D Model**:
  - Pristine rectangular green turf pitch ($20.12\text{m}$ pitch strip, popping/bowling/return crease white lines, pitch turf shader).
  - White foam boundary ropes with sponsor advertising wedges.
  - 4 giant $38\text{m}$ lattice floodlight towers with 32-lamp LED projector clusters.
  - 3-tiered concentric grandstands with entry vomitories, roof canopies, and player dugouts under a clear blue daylight sky dome.

---

## 🎮 Modes & Gameplay

- **Quick Match (Exhibition)**: Choose between 2, 5, or 10 overs.
- **Super Over**: High-pressure chase with 6 balls to win.
- **T20 Championship**: International tournament bracket.
- **Premier Auction & Locker Room**: Full team squad bidding and 3D player customization studio.

---

## 🚀 Headless Testing & CI (GitHub Actions)

Run headless physics, timing, replay, stadium, commentary, and celebration tests:
```bash
godot --headless --script test/run_tests.gd
```

All 17 test suites (60+ assertions) are verified automatically on Ubuntu runners via GitHub Actions.

---

## 📦 Download Direct Android APK
Download the latest verified APK directly on your phone:
👉 **[Download CricStrike 3D APK (GitHub Release)](https://github.com/tomkamath-creator/new-crick/releases)**
