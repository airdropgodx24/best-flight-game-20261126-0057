// input.js — keyboard and mouse, turned into stick movements.
// Arrows or WASD fly, W/S work the throttle, the mouse steers while held,
// C swaps camera, G toggles gear, R restarts the sortie, Enter starts.

export function makeInput(canvas) {
  const keys = new Set();
  const state = {
    pitch: 0, roll: 0, throttle: 0,
    cameraPressed: false, gearPressed: false, restartPressed: false, startPressed: false,
  };
  let mouseDown = false, mouseX = 0, mouseY = 0;

  addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys.add(e.key.toLowerCase());
    if (e.key.toLowerCase() === 'c') state.cameraPressed = true;
    if (e.key.toLowerCase() === 'g') state.gearPressed = true;
    if (e.key.toLowerCase() === 'r') state.restartPressed = true;
    if (e.key === 'Enter' || e.key === ' ') state.startPressed = true;
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  canvas.addEventListener('pointerdown', (e) => { mouseDown = true; mouseX = e.clientX; mouseY = e.clientY; });
  addEventListener('pointerup', () => { mouseDown = false; });
  addEventListener('pointermove', (e) => {
    if (!mouseDown) return;
    state.roll = clamp((e.clientX - mouseX) / 90, -1, 1);
    state.pitch = clamp((mouseY - e.clientY) / 90, -1, 1);
  });

  return {
    read() {
      let pitch = 0, roll = 0, throttle = 0;
      if (keys.has('arrowup') || keys.has('w') && keys.has('shift')) pitch += 1;
      if (keys.has('arrowdown')) pitch -= 1;
      if (keys.has('arrowleft') || keys.has('a')) roll -= 1;
      if (keys.has('arrowright') || keys.has('d')) roll += 1;
      if (keys.has('w')) throttle += 1;
      if (keys.has('s')) throttle -= 1;
      if (mouseDown) { pitch = state.pitch; roll = state.roll; }
      const out = {
        pitch, roll, throttle,
        camera: state.cameraPressed, gear: state.gearPressed,
        restart: state.restartPressed, start: state.startPressed,
      };
      state.cameraPressed = state.gearPressed = state.restartPressed = state.startPressed = false;
      return out;
    },
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
