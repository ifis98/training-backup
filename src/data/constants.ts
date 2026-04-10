// ByteSense Brand Colors
export const C = {
  fn: "'Outfit', system-ui, sans-serif",
  red: "#CC1010",
  redL: "#FF3030",
  redBg: "#FFF5F5",
  teal: "#14B8A6",
  tealBg: "#CCFBF1",
  tealD: "#0D9488",
  dark: "#0C0C0E",
  dark2: "#141418",
  dark3: "#1C1C22",
  white: "#FFFFFF",
  snow: "#F8F8FA",
  ivory: "#F0F0F4",
  mist: "#E4E4EC",
  ash: "#9898A8",
  slate: "#5C5C6C",
  charcoal: "#2A2A34",
  border: "#E0E0E8",
  borderD: "#2A2A30",
  gold: "#C9A84C",
  goldBg: "#FEF9E7",
  green: "#059669",
  greenBg: "#D1FAE5",
  blue: "#2563EB",
  blueBg: "#DBEAFE",
  violet: "#7C3AED",
  amber: "#D97706",
  amberBg: "#FEF3C7",
  cyan: "#0891B2",
  cyanBg: "#CFFAFE",
  rose: "#DB2777",
  roseBg: "#FCE7F3",
};

export interface Role {
  id: string;
  label: string;
  short: string;
  icon: string;
  color: string;
  bg: string;
  identity: string;
  duties: string[];
  goals: string[];
}

export const ROLES: Role[] = [
  {id:"owner",label:"Practice Owner / Lead Doctor",short:"Owner",icon:"◆",color:C.red,bg:C.redBg,
    identity:"The Visionary Leader who transforms the practice into a health intelligence center",
    duties:["Set the cultural standard: every qualifying patient hears about ByteSense","Deliver the 30-second clinical recommendation during exams","Lead morning huddles with patient flags","Review and share monthly metrics","Celebrate every accepted case publicly","Lead by example — wear the device, share your data"],
    goals:["100% presentation rate to qualifying patients","Monthly metrics review with full team","Lead at least 2 team training refreshers per quarter"]},
  {id:"associate",label:"Associate Dentist",short:"Associate",icon:"◇",color:C.blue,bg:C.blueBg,
    identity:"The Clinical Authority whose recommendation carries the weight of a degree",
    duties:["Screen for grinding signs during every exam","Deliver clinical recommendation to qualifying patients","Warm handoff to TC with clinical context","Document grinding findings in the chart"],
    goals:["Recommend ByteSense to every qualifying patient","Complete warm handoff for every recommendation","Document clinical findings supporting each recommendation"]},
  {id:"hygienist",label:"Hygienist",short:"Hygienist",icon:"○",color:C.green,bg:C.greenBg,
    identity:"The Health Detective who starts every conversation",
    duties:["Screen every patient for grinding signs during hygiene","Introduce ByteSense naturally when signs are found","Warm handoff to the doctor with context","Flag patients in charts before appointments","Participate in morning huddle with flags"],
    goals:["Introduce ByteSense to qualifying patients daily","Maintain screening consistency every appointment","Earn $25–$50 bonus per accepted case from introductions"]},
  {id:"tc",label:"Treatment Coordinator",short:"TC",icon:"□",color:C.violet,bg:"#EDE9FE",
    identity:"The Guide who makes value tangible and helps patients say yes",
    duties:["Deliver the full value-first case presentation","Handle all objections with empathy and precision","Manage the financial conversation with confidence","Schedule scan, delivery, and follow-up appointments","Follow up with undecided patients within 48 hours","Collect consent forms and payment","Execute the post-delivery follow-up timeline","Generate referrals and reviews from satisfied patients"],
    goals:["40%+ case acceptance rate","Follow up with every undecided patient within 48 hours","Earn $50–$75 bonus per closed case","Generate 2+ referrals per month from satisfied patients"]},
  {id:"om",label:"Office Manager",short:"Manager",icon:"△",color:C.amber,bg:C.amberBg,
    identity:"The System Architect who makes every gear turn",
    duties:["Track weekly metrics: presentations, acceptances, conversion rate, revenue","Manage scheduling for all ByteSense appointments","Run monthly compliance checklist","Integrate ByteSense into morning huddle structure","Process team bonus payouts","Identify and diagnose performance gaps using the 7 root causes"],
    goals:["Maintain weekly metrics dashboard","Scan rejection rate below 5%","Process bonuses accurately","Diagnose gaps — never blame"]},
  {id:"assistant",label:"Dental Assistant",short:"Assistant",icon:"▽",color:C.cyan,bg:C.cyanBg,
    identity:"The Quality Gatekeeper whose precision ensures excellence",
    duties:["Take precision scans meeting all quality criteria","Submit cases via Medit Link Web","Set up bitely app and pair device at delivery","Walk patients through first-night instructions","Record video testimonials at delivery and 2-week follow-up"],
    goals:["Zero rejected scans — 100% quality pass rate","Complete delivery and app setup within 15 minutes","Every patient leaves with working app and scheduled follow-up"]},
  {id:"frontdesk",label:"Front Desk / Receptionist",short:"Front Desk",icon:"●",color:C.rose,bg:C.roseBg,
    identity:"The First and Last Voice who sets the tone for every experience",
    duties:["Mention ByteSense at check-in","Follow up at checkout with patients who were presented but didn't accept","Handle phone inquiries about ByteSense","Schedule all ByteSense appointments","Make 48-hour follow-up calls to undecided patients","Capture referrals and request Google reviews","Add ByteSense to recall messages"],
    goals:["Earn $15–$25 bonus per consultation that converts","Schedule follow-ups for all undecided patients","Capture 2+ referrals per month","Pre-schedule all appointments for every ByteSense patient"]},
];

export interface Phase {
  id: string;
  label: string;
  desc: string;
  color: string;
  minScore: number;
  maxScore: number;
}

export const PH: Phase[] = [
  {id:"beginner",label:"Phase 0 — Getting Started",desc:"Communication and dental office basics",color:C.rose,minScore:-1,maxScore:30},
  {id:"core",label:"Phase 1 — Clinical Foundations",desc:"Teeth grinding, traditional guards, patient journey",color:C.red,minScore:0,maxScore:100},
  {id:"product",label:"Phase 2 — ByteSense Mastery",desc:"Product knowledge, sensors, patient identification",color:C.blue,minScore:0,maxScore:100},
  {id:"sales",label:"Phase 3 — Sales Psychology & Persuasion",desc:"Cialdini, objection mastery, emotional architecture",color:C.violet,minScore:0,maxScore:100},
  {id:"financial",label:"Phase 4 — Financial Confidence",desc:"Owning the money conversation — Hormozi, Klaff, Belfort",color:C.amber,minScore:-1,maxScore:60},
  {id:"operations",label:"Phase 5 — Operations",desc:"Scanning, delivery, app setup",color:C.cyan,minScore:0,maxScore:100},
  {id:"advanced",label:"Phase 6 — Advanced Communication",desc:"Warm handoffs, 8 trust micro-moments",color:C.green,minScore:0,maxScore:100},
  {id:"flywheel",label:"Phase 7 — The Flywheel",desc:"Referrals, reviews, raving fans, lifetime advocacy",color:C.gold,minScore:0,maxScore:100},
  {id:"role-specific",label:"Phase 8 — Your Role(s)",desc:"Position-specific training for your duties",color:C.tealD,minScore:0,maxScore:100},
];

export interface CheckQuestion {
  q: string;
  opts: string[];
  correct: number;
}

export interface Module {
  id: string;
  phase: string;
  title: string;
  time: string;
  roles: string[];
  content: string;
  checks: CheckQuestion[];
}

export const BL = [[
  {q:"How many night guards does your practice currently sell per month?",opts:["0–2","3–5","6–10","11–20","20+"]},
  {q:"Roughly how many night guards or splints does your office deliver monthly?",opts:["0–2","3–5","6–10","11–20","More than 20"]},
],[
  {q:"When you notice grinding signs — flat spots, chips, gumline notches — how often does your team mention it?",opts:["Rarely","Sometimes","Usually","Almost always","Every time"]},
  {q:"If you see evidence a patient grinds — worn teeth, cracks, grooves near the gumline — how consistently does someone mention it?",opts:["Almost never","Half the time","Most of the time","Nearly always","100%"]},
],[
  {q:"How would you rate your understanding of teeth grinding — causes, signs, and health effects?",opts:["Very limited","Basic","Good","Advanced","Expert"]},
  {q:"If asked to explain grinding to a patient — causes, signs, effects — how confident would you be?",opts:["Not confident","Somewhat","Reasonably","Very confident","Could teach it"]},
],[
  {q:"When recommending a guard, how does your team explain why?",opts:["Just say they need one","Basic: protects teeth","Explain damage + prevention","Connect to sleep, stress, health","Full presentation with examples"]},
  {q:"How thorough is the explanation when suggesting a guard?",opts:["Minimal","Brief protection mention","Explain damage and why it matters","Connect to overall health","Detailed with education"]},
],[
  {q:"When a patient says no, what happens next?",opts:["Move on","Chart note","Address concern immediately","Process for common objections","Structured system + follow-up"]},
  {q:"If a patient declines a guard, how does your team handle it?",opts:["Drop it","Note and move on","Understand and address","Use objection process","Full system with follow-up"]},
],[
  {q:"How smooth is the transition when patients move between team members?",opts:["No process","Informal","Basic handoff","Introduction with context","Intentional every time"]},
  {q:"How are patients passed between team members during visits?",opts:["No system","Random","Quick mention","Introduce with context","Coordinated every time"]},
],[
  {q:"Does your practice track treatment acceptance rates?",opts:["No tracking","Rough estimates","Track some","Track most monthly","Track everything weekly"]},
  {q:"How do you measure whether patients accept recommendations?",opts:["Don't measure","General sense","Track a few things","Monthly on most","Weekly with full team"]},
],[
  {q:"How comfortable discussing the cost of a premium health product?",opts:["Very uncomfortable","Somewhat","Neutral","Comfortable","Very confident"]},
  {q:"When discussing a wellness product investment, how do you feel?",opts:["Dread it","Uneasy","It's fine","Natural","Totally confident"]},
],[
  {q:"After delivering an appliance, does your team follow up?",opts:["Never","Only if they call","Occasionally","Next visit","Within 1–2 weeks always"]},
  {q:"What does post-delivery follow-up look like?",opts:["None","When they reach out","Sometimes","Next appointment","Structured within 2 weeks"]},
],[
  {q:"Describe your morning huddle:",opts:["Don't do them","Informal","Quick schedule review","Schedule + flags","Full: schedule, flags, goals, wins"]},
  {q:"What does a typical morning meeting look like?",opts:["None","Hit or miss","Brief schedule","Review with highlights","Structured with goals"]},
]];
