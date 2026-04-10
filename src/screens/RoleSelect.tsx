import { C, ROLES, BL } from '@/data/constants';
import { scrollTop } from '@/lib/helpers';
import { AppState } from '@/hooks/useAppState';
import { t, Lang } from '@/data/translations';

interface RoleSelectProps {
  s: AppState;
  u: (d: Partial<AppState>) => void;
  lang?: Lang;
}

export default function RoleSelect({ s, u, lang = "en" }: RoleSelectProps) {
  const T = (key: string) => t(lang, key);
  return (
    <div style={{ fontFamily: C.fn, background: C.snow, minHeight: "100vh" }}>
      <div style={{ background: C.white, padding: "32px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: C.ash, marginBottom: 6, textTransform: "uppercase" }}>{T("step1_role")}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: C.charcoal, marginBottom: 4 }}>Hi, {s.name}.</h2>
          <p style={{ fontSize: 14, color: C.slate, marginBottom: 6 }}>{T("select_roles_desc")}</p>
          <p style={{ fontSize: 12, color: C.tealD, marginBottom: 20, fontWeight: 600 }}>{T("tap_roles")}</p>

          {ROLES.map(r => {
            const sel = s.roles.includes(r.id);
            return (
              <div key={r.id}
                onClick={() => u({ roles: sel ? s.roles.filter(x => x !== r.id) : [...s.roles, r.id] })}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", marginBottom: 5, background: sel ? r.bg : C.white, border: `1.5px solid ${sel ? r.color : C.border}`, borderLeft: `4px solid ${r.color}`, cursor: "pointer" }}>
                <div style={{ width: 22, height: 22, border: `2px solid ${sel ? r.color : C.mist}`, background: sel ? r.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: C.white, fontWeight: 800 }}>{sel ? "✓" : ""}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: C.slate }}>{r.identity}</div>
                </div>
              </div>
            );
          })}

          {s.roles.length > 0 && (
            <button onClick={() => { u({ phase: "baseline", blIdx: 0, bl: [], blQs: BL.map((v, i) => v[(s.seed + i) % v.length]) }); scrollTop(); }}
              style={{ background: C.red, color: "#fff", border: "none", padding: "14px 28px", fontSize: 14, fontWeight: 700, fontFamily: C.fn, cursor: "pointer", width: "100%", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {T("continue_roles")} — {s.roles.length} {T("roles_selected")} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
