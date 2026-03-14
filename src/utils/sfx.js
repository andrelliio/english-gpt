/**
 * Утилита для звуковых эффектов и вибрации
 * Использует Web Audio API для генерации звуков без внешних файлов
 */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, volume = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export const sfx = {
  click: () => {
    playTone(440, 'sine', 0.1, 0.05);
    if (navigator.vibrate) navigator.vibrate(5);
  },
  
  success: () => {
    playTone(523.25, 'sine', 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.2), 100); // E5
    if (navigator.vibrate) navigator.vibrate(10);
  },
  
  error: () => {
    playTone(220, 'sawtooth', 0.2, 0.05); // A3
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  },
  
  levelUp: () => {
    const tones = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    tones.forEach((t, i) => {
      setTimeout(() => playTone(t, 'sine', 0.3, 0.1), i * 150);
    });
    if (navigator.vibrate) navigator.vibrate([30, 100, 30, 100]);
  }
};
