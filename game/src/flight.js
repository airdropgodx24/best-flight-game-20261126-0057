// flight.js — the courier plane and how it flies.
// A forgiving arcade model with real trade-offs: throttle feeds speed, speed
// feeds lift, pitch trades speed for height, bank turns the nose, and the
// stall waits at the slow end. Fuel burns with throttle, so every sortie is
// a small budgeting problem.

import { groundHeight, isOverRunway } from './terrain.js';

export function makePlane() {
  return {
    x: 0, y: 300, z: 2600,         // starts south of the field, inbound
    heading: 0,                    // radians, 0 = north (-z)
    pitch: 0, roll: 0,
    speed: 62,                     // m/s
    throttle: 0.55,
    fuel: 100,                     // percent
    damage: 0,                     // percent
    airborne: true,
    gearDown: true,
    stalled: false,
    landed: false,
    crashed: false,
    crashReason: '',
  };
}

const LIMITS = { minSpeed: 26, maxSpeed: 165, stallSpeed: 34, ceiling: 2600 };

export function stepFlight(p, input, dt) {
  if (p.crashed || p.landed) return;
  // Throttle: W/S or Shift/Ctrl nudges, held keys move it smoothly.
  p.throttle = clamp(p.throttle + input.throttle * dt * 0.45, 0, 1);
  // Pitch and roll answer the stick; both ease back toward level slowly.
  p.pitch = clamp(p.pitch + input.pitch * dt * 1.15, -0.62, 0.62);
  p.roll = clamp(p.roll + input.roll * dt * 1.7, -1.15, 1.15);
  p.roll *= Math.pow(0.35, dt);
  // Speed: engine pushes, drag and climbing bleed it off.
  const thrust = p.throttle * 26;
  const drag = 0.0016 * p.speed * p.speed;
  const gravityTrade = -Math.sin(p.pitch) * 9.8;
  p.speed = clamp(p.speed + (thrust - drag + gravityTrade) * dt, LIMITS.minSpeed * 0.4, LIMITS.maxSpeed);
  p.stalled = p.speed < LIMITS.stallSpeed;
  // Heading follows bank; the slower you fly, the lazier the turn.
  const turnRate = Math.sin(p.roll) * 0.55 * Math.min(1, p.speed / 70);
  p.heading += turnRate * dt;
  // Vertical speed from pitch and lift; a stall drops the nose for you.
  let climb = Math.sin(p.pitch) * p.speed * 0.62;
  if (p.stalled) climb -= 14;
  p.y += climb * dt;
  p.y = Math.min(p.y, LIMITS.ceiling);
  // Move forward.
  p.x += Math.sin(p.heading) * p.speed * dt;
  p.z -= Math.cos(p.heading) * p.speed * dt;
  // Fuel: idle sips, full throttle drinks.
  p.fuel = Math.max(0, p.fuel - dt * (0.25 + p.throttle * 1.5));
  if (p.fuel <= 0) p.throttle = 0;
  // Ground contact: a landing on the strip, or the end of the story.
  const ground = groundHeight(p.x, p.z);
  if (p.y <= ground + 2) {
    const gentle = climb > -7 && p.speed < 78 && Math.abs(p.roll) < 0.5;
    if (gentle && isOverRunway(p.x, p.z, 30)) {
      p.landed = true;
      p.y = ground + 2;
    } else {
      p.crashed = true;
      p.crashReason = isOverRunway(p.x, p.z, 30) ? 'Hard landing on the strip' : 'Terrain strike';
    }
  }
}

export function compassDegrees(heading) {
  const deg = Math.round((heading * 180 / Math.PI) % 360);
  return (deg + 360) % 360;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
