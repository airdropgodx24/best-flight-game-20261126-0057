// hud.js — the instruments the pilot flies by.
// Altitude, speed and heading in lit tapes at the screen edges, an artificial
// horizon in the middle, throttle and fuel bars below, and the sortie card
// up top: next ring, distance, score and the clock.

import { compassDegrees } from './flight.js';

export function drawHud(ctx, w, h, plane, sortie, ground) {
  drawHorizon(ctx, w, h, plane);
  drawTape(ctx, 26, h * 0.3, 'ALT', Math.round(plane.y - ground) + ' m');
  drawTape(ctx, w - 126, h * 0.3, 'SPD', Math.round(plane.speed * 3.6) + ' km/h');
  drawCompass(ctx, w, plane);
  drawBars(ctx, w, h, plane);
  drawSortieCard(ctx, w, plane, sortie);
  if (plane.stalled) drawWarning(ctx, w, h, 'STALL — NOSE DOWN, POWER ON');
  if (plane.fuel < 20 && plane.fuel > 0) drawWarning(ctx, w, h, 'LOW FUEL');
  if (plane.fuel <= 0) drawWarning(ctx, w, h, 'TANK DRY — GLIDE HOME');
}

function drawHorizon(ctx, w, h, plane) {
  const cx = w / 2, cy = h * 0.46, r = 64;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.translate(cx, cy);
  ctx.rotate(-plane.roll * 0.8);
  ctx.fillStyle = 'rgba(80,150,210,0.85)';
  ctx.fillRect(-r, -r - plane.pitch * 90, r * 2, r);
  ctx.fillStyle = 'rgba(120,90,55,0.9)';
  ctx.fillRect(-r, -plane.pitch * 90, r * 2, r);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-r, -plane.pitch * 90); ctx.lineTo(r, -plane.pitch * 90); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  // Fixed aircraft symbol.
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy); ctx.lineTo(cx - 10, cy); ctx.lineTo(cx, cy + 8);
  ctx.lineTo(cx + 10, cy); ctx.lineTo(cx + 34, cy);
  ctx.stroke();
}

function drawTape(ctx, x, y, label, value) {
  ctx.fillStyle = 'rgba(10,18,28,0.72)';
  ctx.fillRect(x, y, 100, 58);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(x, y, 100, 58);
  ctx.fillStyle = '#9fd8ff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + 50, y + 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(value, x + 50, y + 46);
}

function drawCompass(ctx, w, plane) {
  const deg = compassDegrees(plane.heading);
  ctx.fillStyle = 'rgba(10,18,28,0.72)';
  ctx.fillRect(w / 2 - 130, 14, 260, 34);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(w / 2 - 130, 14, 260, 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  const nearest = Math.round(deg / 45) * 45 % 360;
  ctx.fillText('HDG ' + String(deg).padStart(3, '0') + '° ' + (names[nearest] || ''), w / 2, 37);
}

function drawBars(ctx, w, h, plane) {
  const x = w / 2 - 150, y = h - 58;
  bar(ctx, x, y, 'THR', plane.throttle, '#7ee08a');
  bar(ctx, x, y + 24, 'FUEL', plane.fuel / 100, plane.fuel < 20 ? '#ff6b5e' : '#ffd23e');
}

function bar(ctx, x, y, label, frac, colour) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y + 13);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 46, y, 254, 15);
  ctx.fillStyle = colour;
  ctx.fillRect(x + 46, y, 254 * Math.max(0, Math.min(1, frac)), 15);
}

function drawSortieCard(ctx, w, plane, sortie) {
  const ring = sortie.rings[sortie.next];
  ctx.fillStyle = 'rgba(10,18,28,0.72)';
  ctx.fillRect(16, 14, 300, 86);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(16, 14, 300, 86);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(sortie.name.toUpperCase(), 28, 38);
  ctx.fillStyle = '#fff';
  ctx.font = '14px system-ui, sans-serif';
  const mins = Math.floor(sortie.elapsed / 60), secs = Math.floor(sortie.elapsed % 60);
  ctx.fillText('Score ' + sortie.score + '   Time ' + mins + ':' + String(secs).padStart(2, '0'), 28, 60);
  if (ring) {
    const d = Math.round(Math.hypot(plane.x - ring.x, plane.y - ring.y, plane.z - ring.z));
    ctx.fillText('Ring ' + (sortie.next + 1) + ' of ' + sortie.rings.length + ' — ' + d + ' m', 28, 82);
  } else {
    ctx.fillText('All rings done — land on the strip!', 28, 82);
  }
}

function drawWarning(ctx, w, h, text) {
  ctx.fillStyle = 'rgba(160,30,20,0.85)';
  ctx.fillRect(w / 2 - 170, h * 0.2, 340, 36);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h * 0.2 + 24);
}
