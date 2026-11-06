// Browser-only sound helpers: tiny Web Audio blips + speech synthesis.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.18) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(0.0001, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

let muted = false;
export function setMuted(v: boolean) {
  muted = v;
  if (v && typeof window !== "undefined") window.speechSynthesis?.cancel();
}
export function isMuted() {
  return muted;
}

export const sfx = {
  pop() {
    if (muted) return;
    tone(660, 0, 0.12, "triangle");
    tone(990, 0.04, 0.1, "sine", 0.1);
  },
  unpop() {
    if (muted) return;
    tone(440, 0, 0.1, "triangle", 0.12);
  },
  success() {
    if (muted) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, "triangle"));
  },
  oops() {
    if (muted) return;
    tone(300, 0, 0.18, "sawtooth", 0.08);
    tone(220, 0.15, 0.25, "sawtooth", 0.08);
  },
  fanfare() {
    if (muted) return;
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.3, "square", 0.07));
  },
  sparkle() {
    if (muted) return;
    [1319, 1568, 2093].forEach((f, i) => tone(f, i * 0.06, 0.15, "sine", 0.08));
  },
};

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /en[-_]GB/i.test(v.lang) && /female|samantha|serena|libby/i.test(v.name)) ||
    voices.find((v) => /en[-_](US|GB)/i.test(v.lang)) ||
    voices.find((v) => v.lang.startsWith("en"))
  );
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-GB";
  u.rate = opts.rate ?? 0.85;
  u.pitch = opts.pitch ?? 1.15;
  synth.speak(u);
}
