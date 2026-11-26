// render.js — drawing the world from the chase camera.
// A simple software 3D view on a 2D canvas: terrain as shaded strips of
// quads marching to the horizon, the sea as a flat band, rings and the
// runway projected into the frame, and the courier plane drawn large in
// the foreground with its propeller turning. No library, no images.

import { groundHeight, groundColour, WORLD } from './terrain.js';

export function makeCamera() {
  return { mode: 'chase', x: 0, y: 0, z: 0, heading: 0, pitch: 0 };
}

export function updateCamera(cam, plane) {
  cam.heading = plane.heading;
  cam.pitch = plane.pitch * 0.55;
  if (cam.mode === 'cockpit') {
    cam.x = plane.x; cam.y = plane.y + 2; cam.z = plane.z;
  } else {
    const back = 34, up = 11;
    cam.x = plane.x - Math.sin(plane.heading) * back;
    cam.y = plane.y + up;
    cam.z = plane.z + Math.cos(plane.heading) * back;
  }
}

function project(cam, x, y, z, w, h) {
  const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
  const sinH = Math.sin(-cam.heading), cosH = Math.cos(-cam.heading);
  const rx = dx * cosH - dz * sinH;
  const rz = dx * sinH + dz * cosH;
  if (rz > -8) return null;
  const f = h * 0.9;
  const sx = w / 2 + (rx / -rz) * f;
  const sy = h / 2 - ((dy - Math.tan(cam.pitch) * -rz) / -rz) * f;
  return { x: sx, y: sy, depth: -rz };
}

export function drawScene(ctx, w, h, cam, plane, sortie, time) {
  // Sky: dawn gradient with a low sun and drifting cloud bands.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#7fb2dd');
  sky.addColorStop(0.55, '#cfe3f2');
  sky.addColorStop(1, '#f6e3c2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sun = project(cam, cam.x + Math.sin(cam.heading + 0.7) * 9000, cam.y + 900, cam.z - Math.cos(cam.heading + 0.7) * 9000, w, h);
  if (sun) {
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath(); ctx.arc(sun.x, sun.y, 26, 0, Math.PI * 2); ctx.fill();
  }
  drawClouds(ctx, w, h, cam, time);
  drawTerrain(ctx, w, h, cam);
  drawRunway(ctx, w, h, cam);
  drawRings(ctx, w, h, cam, sortie, time);
  if (cam.mode === 'chase') drawPlane(ctx, w, h, plane, time);
  else drawCockpit(ctx, w, h, plane);
}

function drawClouds(ctx, w, h, cam, time) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 14; i++) {
    const cx = ((i * 1730 + time * 12) % 12000) - 6000 + cam.x;
    const cz = ((i * 2710) % 12000) - 6000 + cam.z;
    const p = project(cam, cx, cam.y + 420 + (i % 4) * 60, cz, w, h);
    if (!p) continue;
    const s = Math.min(90, 9000 / p.depth);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, s * 1.8, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTerrain(ctx, w, h, cam) {
  // March strips of ground away from the camera, far to near.
  const step = 220, rows = 26, cols = 17;
  const sinH = Math.sin(cam.heading), cosH = Math.cos(cam.heading);
  for (let r = rows - 1; r >= 0; r--) {
    const near = 120 + r * step, far = near + step;
    for (let c = -Math.floor(cols / 2); c <= Math.floor(cols / 2); c++) {
      const side = c * step;
      const corners = [
        [cam.x + sinH * near + cosH * side, cam.z - cosH * near + sinH * side],
        [cam.x + sinH * near + cosH * (side + step), cam.z - cosH * near + sinH * (side + step)],
        [cam.x + sinH * far + cosH * (side + step), cam.z - cosH * far + sinH * (side + step)],
        [cam.x + sinH * far + cosH * side, cam.z - cosH * far + sinH * side],
      ];
      const pts = corners.map(([x, z]) => project(cam, x, Math.max(groundHeight(x, z), 0), z, w, h));
      if (pts.some(p => !p)) continue;
      const midH = groundHeight(corners[0][0], corners[0][1]);
      ctx.fillStyle = midH <= 0 ? '#3d7ea6' : groundColour(midH);
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath(); ctx.fill();
    }
  }
}

function drawRunway(ctx, w, h, cam) {
  const r = WORLD.runway;
  const y = 44;
  const corners = [
    [r.x - r.width / 2, r.z - r.length / 2], [r.x + r.width / 2, r.z - r.length / 2],
    [r.x + r.width / 2, r.z + r.length / 2], [r.x - r.width / 2, r.z + r.length / 2],
  ];
  const pts = corners.map(([x, z]) => project(cam, x, y, z, w, h));
  if (pts.some(p => !p)) return;
  ctx.fillStyle = '#3a3f45';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath(); ctx.fill();
  // Centreline dashes.
  ctx.fillStyle = '#f2f2f2';
  for (let i = 0; i < 12; i++) {
    const z = r.z - r.length / 2 + (i + 0.5) * (r.length / 12);
    const a = project(cam, r.x - 3, y + 1, z - 40, w, h);
    const b = project(cam, r.x + 3, y + 1, z + 40, w, h);
    if (!a || !b) continue;
    ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.max(2, Math.abs(b.x - a.x)), Math.max(2, Math.abs(b.y - a.y)));
  }
}

function drawRings(ctx, w, h, cam, sortie, time) {
  sortie.rings.forEach((ring, i) => {
    if (ring.taken) return;
    const p = project(cam, ring.x, ring.y, ring.z, w, h);
    if (!p) return;
    const size = Math.max(6, (ring.radius / p.depth) * h * 0.9);
    const isNext = i === sortie.next;
    ctx.strokeStyle = isNext ? '#ffb02e' : 'rgba(255,176,46,0.35)';
    ctx.lineWidth = isNext ? 6 : 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.stroke();
    if (isNext) {
      ctx.fillStyle = '#ffb02e';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RING ' + (i + 1), p.x, p.y - size - 10);
      const pulse = 1 + Math.sin(time * 3) * 0.06;
      ctx.strokeStyle = 'rgba(255,176,46,0.4)';
      ctx.beginPath(); ctx.arc(p.x, p.y, size * pulse, 0, Math.PI * 2); ctx.stroke();
    }
  });
}

function drawPlane(ctx, w, h, plane, time) {
  const cx = w / 2, cy = h * 0.62;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(plane.roll * 0.8);
  // Wings and tail.
  ctx.fillStyle = '#c8442c';
  ctx.fillRect(-150, -6, 300, 14);
  ctx.fillRect(-46, 26, 92, 9);
  ctx.fillStyle = '#e8e2d4';
  ctx.fillRect(-150, -6, 34, 14);
  ctx.fillRect(116, -6, 34, 14);
  // Fuselage.
  ctx.fillStyle = '#f0ead8';
  ctx.beginPath(); ctx.ellipse(0, 4, 26, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#31556e';
  ctx.beginPath(); ctx.ellipse(0, -12, 15, 20, 0, 0, Math.PI * 2); ctx.fill();
  // Propeller blur at the nose.
  ctx.fillStyle = 'rgba(40,40,40,0.35)';
  ctx.beginPath(); ctx.ellipse(0, -52, 40, 6 + Math.sin(time * 40) * 2, 0, 0, Math.PI * 2); ctx.fill();
  // Courier stripe and parcel door.
  ctx.fillStyle = '#ffb02e';
  ctx.fillRect(-26, 14, 52, 7);
  ctx.restore();
}

function drawCockpit(ctx, w, h, plane) {
  ctx.fillStyle = '#22282f';
  ctx.fillRect(0, h * 0.78, w, h * 0.22);
  ctx.fillRect(w * 0.42, h * 0.7, w * 0.16, h * 0.1);
  ctx.fillStyle = '#ffd977';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SKYLINE COURIER', w / 2, h * 0.86);
}
