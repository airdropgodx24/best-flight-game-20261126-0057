// audio.js — small sounds made on the spot, no files needed.
// An engine hum that follows the throttle, a bright chime for a ring, a
// soft thud for the touchdown and a dull crunch when it goes wrong. The
// context starts on the first key or click, as browsers require.

export function makeAudio() {
  let ctx = null, engine = null, engineGain = null;
  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      engine = ctx.createOscillator();
      engine.type = 'sawtooth';
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      engine.connect(filter).connect(engineGain).connect(ctx.destination);
      engine.start();
      return true;
    } catch { return false; }
  }
  function blip(freq, seconds, type = 'sine', gain = 0.12) {
    if (!ensure()) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + seconds);
  }
  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    engine(throttle, flying) {
      if (!ctx || !engine) return;
      engine.frequency.value = 55 + throttle * 85;
      engineGain.gain.value = flying ? 0.03 + throttle * 0.05 : 0;
    },
    ring() { blip(880, 0.18); setTimeout(() => blip(1320, 0.22), 70); },
    touchdown() { blip(140, 0.3, 'triangle', 0.2); },
    crash() { blip(70, 0.6, 'square', 0.18); },
    stall() { blip(520, 0.12, 'square', 0.05); },
  };
}
