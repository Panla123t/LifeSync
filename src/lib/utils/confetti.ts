'use client';

import confetti from 'canvas-confetti';

/**
 * Fires a celebratory burst of colorful confetti from the center of the screen
 */
export function fireConfettiBurst() {
  if (typeof window === 'undefined') return;

  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#06B6D4', '#F59E0B', '#EC4899', '#8B5CF6'],
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Confetti error:', err);
  }
}

/**
 * Multi-cannon side blast for major achievements (e.g. 100% daily hydration goal or Level Up!)
 */
export function fireLevelUpCannons() {
  if (typeof window === 'undefined') return;

  try {
    const end = Date.now() + 1800; // 1.8 seconds celebration
    const colors = ['#10B981', '#34D399', '#FBBF24', '#F59E0B', '#38BDF8'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (err) {
    console.warn('Level up cannons error:', err);
  }
}

/**
 * Fire streak celebration: bright orange and gold sparkler burst
 */
export function fireStreakFlame() {
  if (typeof window === 'undefined') return;

  try {
    confetti({
      particleCount: 60,
      angle: 90,
      spread: 60,
      origin: { y: 0.75 },
      colors: ['#F97316', '#FBBF24', '#EF4444', '#F59E0B'],
      shapes: ['circle'],
      scalar: 1.2,
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Streak flame confetti error:', err);
  }
}
