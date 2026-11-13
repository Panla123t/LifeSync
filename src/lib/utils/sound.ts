'use client';

let audioCtx: AudioContext | null = null;
let lastSoundTime = 0;

function isSoundAllowed(cooldownMs: number = 3000): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isMuted = localStorage.getItem('lifesync_sound_enabled') === 'false';
    if (isMuted) return false;

    const now = Date.now();
    if (now - lastSoundTime < cooldownMs) {
      return false;
    }
    lastSoundTime = now;
    return true;
  } catch {
    return true;
  }
}

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

export function getSoundSetting(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('lifesync_sound_enabled') !== 'false';
}

export function setSoundSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lifesync_sound_enabled', enabled ? 'true' : 'false');
}

export function getHapticsSetting(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('lifesync_haptics_enabled') !== 'false';
}

export function setHapticsSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lifesync_haptics_enabled', enabled ? 'true' : 'false');
}

/**
 * Mobile haptic vibration helper
 */
export function triggerHaptic(pattern: number | number[] = 50) {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      if (!getHapticsSetting()) return;
      navigator.vibrate(pattern);
    } catch {
      // Haptics not allowed or supported
    }
  }
}

/**
 * Plays a soft, subtle success chime (major chord arpeggio)
 * Cooldown: minimum 4 seconds between triggers to prevent repetitive noise
 */
export function playSuccessChime() {
  if (!isSoundAllowed(4000)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([30, 20, 40]);

  const now = ctx.currentTime;
  // C5, E5, G5, C6 notes (gentle volume)
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.09);

    gain.gain.setValueAtTime(0, now + index * 0.09);
    gain.gain.linearRampToValueAtTime(0.08, now + index * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.09 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.09);
    osc.stop(now + index * 0.09 + 0.32);
  });
}

/**
 * Plays a triumphant celebratory fanfare for leveling up
 * Cooldown: minimum 8 seconds between triggers
 */
export function playLevelUpFanfare() {
  if (!isSoundAllowed(8000)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic([60, 40, 80, 40, 100]);

  const now = ctx.currentTime;
  // G4 -> C5 -> E5 -> G5
  const sequence = [
    { freq: 392.0, time: 0.0, duration: 0.12 },
    { freq: 523.25, time: 0.12, duration: 0.12 },
    { freq: 659.25, time: 0.24, duration: 0.14 },
    { freq: 783.99, time: 0.38, duration: 0.45 },
  ];

  sequence.forEach(({ freq, time, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.01, now + time);
    gain.gain.linearRampToValueAtTime(0.12, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + duration);
  });
}

/**
 * Plays a soft, gentle water droplet sound
 * Cooldown: minimum 1.5 seconds
 */
export function playWaterSplash() {
  if (!isSoundAllowed(1500)) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  triggerHaptic(30);

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(550, now);
  osc.frequency.exponentialRampToValueAtTime(1300, now + 0.07);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}
