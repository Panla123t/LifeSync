'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Mobile haptic vibration helper
 */
export function triggerHaptic(pattern: number | number[] = 50) {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptics not allowed or supported
    }
  }
}

/**
 * Plays a bright, cheerful success chime (major chord arpeggio)
 */
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([40, 30, 60]);

  const now = ctx.currentTime;
  // C5, E5, G5, C6 notes
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.08);

    gain.gain.setValueAtTime(0, now + index * 0.08);
    gain.gain.linearRampToValueAtTime(0.18, now + index * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.08);
    osc.stop(now + index * 0.08 + 0.4);
  });
}

/**
 * Plays a triumphant celebratory fanfare for leveling up or hitting 100% goals
 */
export function playLevelUpFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([80, 50, 100, 50, 150]);

  const now = ctx.currentTime;
  // G4 -> C5 -> E5 -> G5 (held)
  const sequence = [
    { freq: 392.0, time: 0.0, duration: 0.12 },
    { freq: 523.25, time: 0.12, duration: 0.12 },
    { freq: 659.25, time: 0.24, duration: 0.14 },
    { freq: 783.99, time: 0.38, duration: 0.5 },
  ];

  sequence.forEach(({ freq, time, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.01, now + time);
    gain.gain.linearRampToValueAtTime(0.22, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + duration);
  });
}

/**
 * Plays a soft, refreshing water droplet sound
 */
export function playWaterSplash() {
  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(40);

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.16);
}
