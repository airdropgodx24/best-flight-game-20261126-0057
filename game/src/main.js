// main.js — Skyline Courier: boot, screens and the game loop.
// Fly the little courier plane through the glowing rings in order, mind
// the fuel, and put her down gently on the strip. Three sorties, one
// island, dawn light. Title screen, flying, and a debrief when it ends.

import { makePlane, stepFlight } from './flight.js';
import { makeSortie, stepSortie, sortieResult, SORTIES } from './missions.js';
import { groundHeight } from './terrain.js';
import { makeCamera, updateCamera, drawScene } from './render.js';
import { drawHud } from './hud.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const input = makeInput(canvas);
const audio = makeAudio();

let screen = 'title';            // title | flying | debrief
let sortieIndex = 0;
let plane = makePlane();
let sortie = makeSortie(0);
let cam = makeCamera();
let totalScore = 0;
let stallBeepAt = 0;

const shot = new URLSearchParams(location.search).get('shot');
if (shot) setupShot(shot);

function setupShot(kind) {
  // Deterministic poses for the maker's screenshots: the game itself,
  // frozen at a good moment, never a mock-up.
  screen = 'flying';
  sortieIndex = kind === 'end' ? 2 : kind === 'play' ? 1 : 0;
  sortie = makeSortie(sortieIndex);
  plane = makePlane();
  if (kind === 'start') {
    plane.x = -880; plane.z = 1380; plane.y = groundHeight(plane.x, plane.z) + 210; plane.heading = 0.05; plane.speed = 74;
  } else if (kind === 'play') {
    plane.x = 1800; plane.z = -1500; plane.y = groundHeight(plane.x, plane.z) + 330; plane.heading = 2.6; plane.speed = 96; plane.roll = 0.4;
    sortie.rings[0].taken = true; sortie.rings[1].taken = true; sortie.next = 2; sortie.score = 200; sortie.elapsed = 74;
  } else {
    plane.x = 0; plane.z = -4150; plane.y = groundHeight(plane.x, plane.z) + 170; plane.heading = 0; plane.speed = 58; plane.pitch = -0.08;
    sortie.rings.forEach(r => { r.taken = true; }); sortie.next = sortie.rings.length; sortie.done = true;
    sortie.score = 800; sortie.elapsed = 168;
  }
  cam.mode = 'chase';
  updateCamera(cam, plane);
  draw(0);
}

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener('resize', resize);
resize();

function startSortie(index) {
  sortieIndex = index;
  plane = makePlane();
  sortie = makeSortie(index);
  cam = makeCamera();
  screen = 'flying';
  audio.unlock();
  status.textContent = 'Sortie started: ' + sortie.name;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot) update(dt, now / 1000);
  draw(now / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function update(dt, time) {
  const stick = input.read();
  if (screen === 'title') {
    if (stick.start) startSortie(0);
    return;
  }
  if (screen === 'debrief') {
    if (stick.start) startSortie((sortieIndex + 1) % SORTIES.length);
    if (stick.restart) startSortie(sortieIndex);
    return;
  }
  // Flying.
  if (stick.camera) cam.mode = cam.mode === 'chase' ? 'cockpit' : 'chase';
  if (stick.gear) plane.gearDown = !plane.gearDown;
  if (stick.restart) { startSortie(sortieIndex); return; }
  stepFlight(plane, stick, dt);
  const event = stepSortie(sortie, plane, dt);
  if (event === 'ring') { audio.ring(); status.textContent = 'Ring ' + sortie.next + ' of ' + sortie.rings.length; }
  if (plane.stalled && time - stallBeepAt > 0.7) { audio.stall(); stallBeepAt = time; }
  audio.engine(plane.throttle, !plane.landed && !plane.crashed);
  updateCamera(cam, plane);
  if (plane.landed) {
    audio.touchdown();
    totalScore += sortieResult(sortie, plane).total;
    screen = 'debrief';
    status.textContent = 'Landed safely';
  } else if (plane.crashed) {
    audio.crash();
    screen = 'debrief';
    status.textContent = 'Crashed: ' + plane.crashReason;
  }
}

function draw(time) {
  const w = canvas.width, h = canvas.height;
  updateCamera(cam, plane);
  drawScene(ctx, w, h, cam, plane, sortie, time);
  if (screen === 'title') return drawTitle(w, h);
  drawHud(ctx, w, h, plane, sortie, groundHeight(plane.x, plane.z));
  if (screen === 'debrief') drawDebrief(w, h);
}

function drawTitle(w, h) {
  ctx.fillStyle = 'rgba(8,16,26,0.55)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 54px system-ui, sans-serif';
  ctx.fillText('SKYLINE COURIER', w / 2, h * 0.3);
  ctx.fillStyle = '#fff';
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Fly the rings in order, mind the fuel, land on the strip.', w / 2, h * 0.3 + 42);
  ctx.font = '16px system-ui, sans-serif';
  const lines = [
    'Arrows or mouse — fly    W / S — throttle',
    'C — camera    G — gear    R — restart sortie',
    'Slow flight stalls. Full throttle drinks fuel. Gentle landings score.',
    '',
    'Press Enter to fly sortie 1: ' + SORTIES[0].name,
  ];
  lines.forEach((line, i) => ctx.fillText(line, w / 2, h * 0.46 + i * 28));
}

function drawDebrief(w, h) {
  const result = sortieResult(sortie, plane);
  ctx.fillStyle = 'rgba(8,16,26,0.62)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = plane.landed ? '#7ee08a' : '#ff8a7a';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(plane.landed ? 'DELIVERED' : 'SORTIE LOST', w / 2, h * 0.32);
  ctx.fillStyle = '#fff';
  ctx.font = '18px system-ui, sans-serif';
  const lines = plane.landed
    ? ['Rings ' + result.ringsDone + ' of ' + result.ringsTotal + ' — sortie score ' + result.total,
       'Fuel left ' + Math.round(plane.fuel) + '%', '', 'Enter — next sortie    R — fly this one again']
    : [plane.crashReason, 'Rings ' + result.ringsDone + ' of ' + result.ringsTotal, '', 'R — try the sortie again'];
  lines.forEach((line, i) => ctx.fillText(line, w / 2, h * 0.32 + 48 + i * 30));
}
