// missions.js — what a sortie asks of the pilot.
// Each sortie is a chain of glowing rings over the island, flown in order,
// then home to the strip. Rings pay points, the clock pays a bonus, and the
// fuel gauge decides how greedy you can be. Ring heights are lifted clear
// of the local ground so no ring ever sits inside a hill.

import { groundHeight } from './terrain.js';

export const SORTIES = [
  {
    name: 'Harbour Run',
    brief: 'Five easy rings over the coast, then land.',
    rings: [[-900, 260, 900], [-2200, 320, -600], [-1400, 240, -2600], [300, 300, -4200], [0, 180, -5200]],
    parSeconds: 150,
  },
  {
    name: 'Ridge Line',
    brief: 'Seven rings along the high ground. Mind the stall.',
    rings: [[1200, 520, 1400], [2600, 640, -200], [2400, 560, -2200], [600, 700, -3400], [-1600, 620, -3000], [-2200, 480, -1200], [0, 220, -5200]],
    parSeconds: 210,
  },
  {
    name: 'Last Light Delivery',
    brief: 'Eight rings, low and quick, home before the tank runs dry.',
    rings: [[-700, 150, 1800], [900, 170, 600], [2100, 190, -900], [1500, 160, -2600], [-400, 180, -3200], [-1900, 150, -2100], [-1200, 170, -400], [0, 160, -5200]],
    parSeconds: 190,
  },
];

export function makeSortie(index) {
  const s = SORTIES[index % SORTIES.length];
  return {
    name: s.name,
    brief: s.brief,
    parSeconds: s.parSeconds,
    rings: s.rings.map(([x, y, z]) => ({ x, y: Math.max(y, groundHeight(x, z) + 170), z, radius: 90, taken: false })),
    next: 0,
    score: 0,
    elapsed: 0,
    done: false,
  };
}

// Returns 'ring' when the plane threads the current ring this step.
export function stepSortie(sortie, plane, dt) {
  if (sortie.done) return null;
  sortie.elapsed += dt;
  const ring = sortie.rings[sortie.next];
  if (!ring) return null;
  const d = Math.hypot(plane.x - ring.x, plane.y - ring.y, plane.z - ring.z);
  if (d < ring.radius) {
    ring.taken = true;
    sortie.next += 1;
    sortie.score += 100;
    if (sortie.next >= sortie.rings.length) sortie.done = true;
    return 'ring';
  }
  return null;
}

export function sortieResult(sortie, plane) {
  const ringsDone = sortie.rings.filter(r => r.taken).length;
  let total = sortie.score;
  if (plane.landed) {
    total += 150;
    if (sortie.elapsed < sortie.parSeconds) total += Math.round((sortie.parSeconds - sortie.elapsed) * 2);
    total += Math.round(plane.fuel);
  }
  return { ringsDone, ringsTotal: sortie.rings.length, total };
}
