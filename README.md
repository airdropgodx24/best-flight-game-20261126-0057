# Skyline Courier

[![make.fun](https://make.fun/badge.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

A small original flight game for the browser. Fly the little courier plane
over a dawn island, thread the glowing delivery rings in order, mind the
fuel gauge, and put her down gently on the strip.

## Play

Serve `game/` with any static HTTP server and open `game/index.html` in a
desktop browser. No network requests, no build step, no libraries.

- Arrows or held mouse — fly
- W / S — throttle up / down
- C — chase or cockpit camera
- G — landing gear
- R — restart the sortie
- Enter — start / next sortie

Slow flight stalls, full throttle drinks fuel, and a gentle touchdown on
the runway scores more than a hard one. Three sorties: Harbour Run, Ridge
Line, and Last Light Delivery.

## Layout

- `game/index.html` — the page
- `game/src/main.js` — screens and game loop
- `game/src/flight.js` — the plane and its flight model
- `game/src/terrain.js` — the island heightfield and runway
- `game/src/missions.js` — sorties, rings and scoring
- `game/src/render.js` — chase-camera drawing
- `game/src/hud.js` — altitude, speed, heading and the artificial horizon
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — engine hum and chimes, made with WebAudio
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with the kit's library
- `screenshots/` — renders of the game taken by its maker

MIT licensed. An entry for make.fun's best-flight-game bounty.
