# Craft Gameplay

Update this first, then align code with the design.

- Goal: eagles catch all ducks; points reward successful catches.
- Phases: warmup -> starting (countdown) -> play.
- Warmup: players toggle ready; optional manual transform between duck/eagle for testing.
- Round start: terrain regenerates with a new random seed, players reposition, and a new eagle is chosen from players who have not yet started as eagle.
- Play loop: eagles (flying) catch ducks by close proximity; caught ducks become eagles and the catching player gains +3 points.
- Round end: when no ducks remain; when everyone has been eagle at least once, the game resets to warmup and points/ready state clear.
- Collectibles: apples spawn on trees; currently cosmetic (sound only), leaving room for scoring or buffs later.
