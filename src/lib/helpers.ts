import { CheckQuestion } from '@/data/constants';

export const scrollTop = () => window.scrollTo?.({ top: 0, behavior: "instant" as ScrollBehavior });

export function shuffle<T>(a: T[], s: number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * i);
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export interface ShuffledQuestion {
  q: string;
  opts: string[];
  correct: number;
}

export function shuffleQuestion(q: CheckQuestion, seed: number): ShuffledQuestion {
  const items = q.opts.map((o, i) => ({ t: o, c: i === q.correct }));
  const sh = shuffle(items, seed + q.q.length * 7);
  return { q: q.q, opts: sh.map(x => x.t), correct: sh.findIndex(x => x.c) };
}

// Preferred voices ranked by naturalness
const PREFERRED_VOICES = [
  "Google UK English Female",
  "Google US English",
  "Microsoft Zira",
  "Samantha",
  "Karen",
  "Daniel",
  "Moira",
  "Tessa",
  "Google UK English Male",
];

let cachedVoice: SpeechSynthesisVoice | null = null;

function getBestVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis?.getVoices() || [];
  for (const pref of PREFERRED_VOICES) {
    const match = voices.find(v => v.name.includes(pref));
    if (match) { cachedVoice = match; return match; }
  }
  // Fallback: any English voice
  const eng = voices.find(v => v.lang.startsWith('en'));
  if (eng) { cachedVoice = eng; return eng; }
  return voices[0] || null;
}

// Load voices (they may load async)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; };
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/^- /gm, '')
    .replace(/^· /gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function speak(text: string) {
  window.speechSynthesis?.cancel();
  const cleaned = cleanTextForSpeech(text);

  // Split into sentences for more natural pacing
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  const voice = getBestVoice();

  sentences.forEach((sentence, i) => {
    const u = new SpeechSynthesisUtterance(sentence);
    u.rate = 0.92;
    u.pitch = 1.05;
    if (voice) u.voice = voice;

    // Small pause between sentences by adding silence
    if (i > 0) {
      const pause = new SpeechSynthesisUtterance('');
      pause.rate = 0.1;
      if (voice) pause.voice = voice;
      window.speechSynthesis?.speak(pause);
    }

    window.speechSynthesis?.speak(u);
  });
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
}

export function startSTT(cb: (text: string) => void) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = false;
  r.lang = "en-US";
  r.onresult = (e: any) => cb(e.results[0][0].transcript);
  r.start();
  return r;
}
