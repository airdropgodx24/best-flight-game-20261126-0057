// terrain.js — the ground the courier flies over.
// A smooth heightfield built from layered sine waves, so the hills are the
// same on every run and cost nothing to store. The runway is flattened into
// the field at a fixed spot, and the sea sits at height zero.

export const WORLD = {
  size: 24000,          // metres, square
  seaLevel: 0,
  runway: { x: 0, z: -6000, length: 2600, width: 90, heading: 0 },
};

function ridge(x, z) {
  return Math.sin(x * 0.00035 + 1.7) * Math.cos(z * 0.00028 - 0.6) * 420
       + Math.sin(x * 0.0011 - 0.4) * Math.sin(z * 0.0009 + 2.1) * 160
       + Math.cos((x + z) * 0.0021) * 55;
}

export function groundHeight(x, z) {
  const d = Math.hypot(x, z);
  const falloff = Math.max(0, 1 - d / (WORLD.size * 0.62));
  let h = ridge(x, z) * falloff - 30;
  // Flatten a shelf for the airfield.
  const r = WORLD.runway;
  const along = Math.abs(z - r.z);
  const across = Math.abs(x - r.x);
  const shelf = Math.max(0, 1 - Math.max(along / (r.length * 1.15), across / (r.width * 14)));
  h = h * (1 - shelf) + 42 * shelf;
  return h;
}

export function isOverRunway(x, z, margin = 0) {
  const r = WORLD.runway;
  return Math.abs(x - r.x) <= r.width / 2 + margin
      && Math.abs(z - r.z) <= r.length / 2 + margin;
}

// Colour for a point on the ground, by height: sand, grass, scrub, rock, snow.
export function groundColour(h) {
  if (h < 2) return '#2e6f8e';        // shallow water edge
  if (h < 14) return '#c9b37e';       // sand
  if (h < 120) return '#5d9b52';      // grass
  if (h < 260) return '#7a9a4e';      // scrub
  if (h < 420) return '#8a7f6a';      // rock
  return '#e8e4da';                   // snow caps
}
