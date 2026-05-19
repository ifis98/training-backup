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
  "Google US English",
  "Microsoft Aria",
  "Microsoft Zira",
  "Samantha",
  "Alex",
  "Google UK English Female",
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

// Maps intake main_blocker to the most relevant module ID to surface first
export const BLOCKER_MODULE_MAP: Record<string, string[]> = {
  explain_patients: ['p3', 's1', 'p1'],          // Patient ID, persuasion, ByteSense positioning
  submit_case:      ['o1', 'o2', 'o3'],           // Scanning, delivery, consent
  staff_training:   ['b1', 'b2', 'c1'],           // Comm basics, dental exam, grinding
  pricing:          ['f1', 's4', 's2'],            // Money convo, pricing moment, objections
  clinical:         ['c1', 'c2', 'p1'],            // Grinding, guards, positioning
  technical:        ['o1', 'o6', 'o2'],            // Scanning protocol, device issues, delivery
  nothing:          [],                            // No pin — use default order
};

export function getBlockerFirstModuleIds(mainBlocker: string): string[] {
  return BLOCKER_MODULE_MAP[mainBlocker] ?? [];
}

// Knowledge Score Engine
export function computeKnowledgeScore(
  blScore: number | null,
  doneCount: number,
  totalModules: number,
  simPatients: number,
): number {
  const baselineNorm = Math.min((blScore ?? 0), 100); // baseline 0-100 used directly
  const moduleRate = totalModules > 0 ? (doneCount / totalModules) * 100 : 0;
  const simRate = Math.min((simPatients / 3) * 100, 100);
  return Math.round(baselineNorm * 0.3 + moduleRate * 0.4 + simRate * 0.3);
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "score_excellent";
  if (score >= 50) return "score_good";
  return "score_needs_work";
}

export function getScoreColor(score: number, colors: { green: string; gold: string; red: string }): string {
  if (score >= 80) return colors.green;
  if (score >= 50) return colors.gold;
  return colors.red;
}

export interface Recommendation {
  phaseId: string;
  phaseLabel: string;
  moduleId: string;
  moduleTitle: string;
  time: string;
  priority: "high" | "medium" | "low";
  color: string;
}

export function getRecommendations(
  done: string[],
  myM: { id: string; phase: string; title: string; time: string }[],
  phases: { id: string; label: string; color: string }[],
  max = 5,
): Recommendation[] {
  const incomplete = myM.filter(m => !done.includes(m.id));
  return incomplete.slice(0, max).map((m, i) => {
    const ph = phases.find(p => p.id === m.phase);
    return {
      phaseId: m.phase,
      phaseLabel: ph?.label || m.phase,
      moduleId: m.id,
      moduleTitle: m.title,
      time: m.time,
      priority: i < 2 ? "high" : i < 4 ? "medium" : "low",
      color: ph?.color || "#888",
    };
  });
}

export interface ImprovementArea {
  category: string;
  phaseId: string;
  completion: number;
  tips: string[];
  color: string;
}

export function getImprovementAreas(
  done: string[],
  myM: { id: string; phase: string; title: string }[],
  phases: { id: string; label: string; color: string; desc: string }[],
): ImprovementArea[] {
  const TIPS: Record<string, string[]> = {
    beginner: ["Practice the 30-second elevator pitch", "Role-play introductions with a colleague"],
    core: ["Review grinding signs checklist before each shift", "Study the damage progression timeline"],
    product: ["Memorize the 6 sensor capabilities", "Practice explaining the byteSense Score"],
    sales: ["Use Cialdini's reciprocity in your next case", "Practice the 'Feel-Felt-Found' objection framework"],
    financial: ["Rehearse the value-first price reveal", "Frame cost as daily investment, not lump sum"],
    operations: ["Review scan quality criteria before next scan", "Practice the app setup flow until under 5 minutes"],
    advanced: ["Master the warm handoff script", "Identify 2 trust micro-moments per patient visit"],
    flywheel: ["Ask for a review at the 2-week follow-up", "Create a referral tracking system"],
    "role-specific": ["Review your role's monthly goals weekly", "Shadow a top performer in your role"],
  };

  return phases
    .map(ph => {
      const pm = myM.filter(m => m.phase === ph.id);
      if (!pm.length) return null;
      const doneCount = pm.filter(m => done.includes(m.id)).length;
      const completion = Math.round((doneCount / pm.length) * 100);
      if (completion === 100) return null;
      const categoryName = ph.label.replace(/Phase \d+ — /, '');
      return {
        category: categoryName,
        phaseId: ph.id,
        completion,
        tips: TIPS[ph.id] || ["Complete remaining modules in this phase"],
        color: ph.color,
      };
    })
    .filter(Boolean) as ImprovementArea[];
}

export function startSTT(cb: (text: string) => void, onEnd?: () => void) {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-US";
  r.onresult = (e: any) => {
    let transcript = "";
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    cb(transcript);
  };
  r.onerror = () => { onEnd?.(); };
  r.onend = () => { onEnd?.(); };
  r.start();
  return r;
}
