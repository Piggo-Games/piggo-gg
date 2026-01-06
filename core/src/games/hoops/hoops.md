# Hoops Gameplay

Update this first, then align code with the design.

## TODOs
[x] 3-point line works
[x] ball should always extend away from the player (can't be inside the player)

## Draft v0
- Goal: score by getting the ball through the opponent hoop; first to 11 resets the match.
- Teams: 2v2; team 1 defends the left hoop and scores on the right hoop (and vice versa).
- Court: parallelogram court with a hoop on each end; ball spawns at center on reset.
- Possession: ball attaches to the handler and orbits around them with mouse movement (Item-style control).
- Controls: WASD move, MB1 shoot, MB2 pass, Shift dash, Esc menu.
- Pass: low arc to the cursor target; ball becomes loose for anyone to collect.
- Shoot: arcs toward the opponent hoop; shot power scales with distance to the hoop.
- Dash: short burst with cooldown; if a defender dashes into the ball carrier, they steal.
- Scoring: ball passing through the hoop triggers a point and a short reset.

## Iteration 1 (engagement tweaks)
- Encourage movement and spacing by limiting auto-pickup to a small radius when the ball is low.
- Make defense proactive: dash has a brief steal window and a short cooldown cadence.
- Reward range: longer shots use a higher arc tuned by distance to the hoop.
