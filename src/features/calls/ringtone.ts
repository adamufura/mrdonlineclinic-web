/** Pleasant dual-tone phone ring using Web Audio (no external file). */

let ctx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let activeOscillators: OscillatorNode[] = [];

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext();
  }
  return ctx;
}

function playChord() {
  const audio = getCtx();
  if (audio.state === 'suspended') {
    void audio.resume();
  }

  const now = audio.currentTime;
  const freqs = [440, 554.37]; // A4 + C#5 — warm major third
  const duration = 0.45;

  for (const freq of freqs) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration);
    activeOscillators.push(osc);
    osc.onended = () => {
      activeOscillators = activeOscillators.filter((o) => o !== osc);
    };
  }
}

export function startRingtone(): void {
  stopRingtone();
  playChord();
  intervalId = setInterval(playChord, 2000);
}

export function stopRingtone(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  for (const osc of activeOscillators) {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
  }
  activeOscillators = [];
}
