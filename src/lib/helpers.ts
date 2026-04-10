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

export function speak(text: string) {
  window.speechSynthesis?.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, "").replace(/\n/g, ". "));
  u.rate = 0.95;
  window.speechSynthesis?.speak(u);
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
