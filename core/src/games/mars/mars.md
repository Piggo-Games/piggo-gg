# Mars Gameplay

Update this first, then align code with the design.

- Goal: land an astronaut on Mars.
- Loop: manage money, launch payloads to orbit, scale satellite revenue, develop Starboat, then complete the Mars mission.
- Launch: once a ship is ready, the player can hit a launch button to send it to orbit.
- Payloads: ships carry satellites; 3rd party satellites pay a one-time fee once in orbit.
- FarLink: we can produce FarLink satellites for a fee; each one increases revenue over time while in orbit.
- Starting vehicle: one Flamin-9 rocket; dual stage with a recoverable booster.
- Post-launch costs: after every launch, the lower stage requires a repair fee and a new upper stage must be produced.
- Starboat: larger dual stage with both stages reusable; can carry more payload to orbit and refuel in orbit for Mars transfer.

## UI (Mobile Vertical)
- Money display: single `$` total that animates up/down; green when >= 0, red when < 0.
- Date ticker: day/month/year display that increments over time; starts at Dec 22 2015.
- Launchpad carousel: left/right arrows to switch pads; each pad tracks its own rocket, readiness, and payload.
- Pad status card: rocket type, readiness state, payload summary, next required action.
- Rocket management button: opens build/repair/upgrade for the selected pad.
- Payload builder button: configure satellites for the selected rocket.
- Launch button: enabled only when rocket + payload are ready; shows countdown when armed.
- Research button: opens R&D (Starboat unlocks, refuel tech, manufacturing efficiency).
- Orbit panel: satellites in orbit, FarLink count, revenue contribution.
- Progress strip: Mars mission checklist + readiness meter.
- 
## Tickets

[x] implement money display
[x] implement date ticker
[x] add controls UI
[ ] implement launchpad carousel
[ ] implement pad status card
[ ] implement rocket management button
[ ] implement payload builder button
[ ] implement launch button
[ ] implement rocket flying graphic
[ ] track the rocket while it's flying (CameraSystem.follow)
