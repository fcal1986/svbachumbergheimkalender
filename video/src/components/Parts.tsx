// Einstieg, Überschriften, Endkarte, Untertitel, Hintergrund. Inhalte kommen aus config/film.ts.
import React from 'react';
import { Easing, Img, interpolate, staticFile } from 'remotion';
import { brand, endCard, safe, subtitles, WIDTH, HEIGHT } from '../config/common';
import type { Caption, HookDef, MessageOverlay, SubtitleCue } from '../config/types';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const DISPLAY = "'Manrope', 'Inter', sans-serif";
export const TEXT = "'Inter', sans-serif";

export const Background: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 70% at 50% 18%, ${brand.navy2} 0%, ${brand.navy} 62%)` }}>
    {/* dezente Spielfeldlinien */}
    <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0, opacity: 0.07 }}>
      <circle cx={WIDTH / 2} cy={HEIGHT * 0.56} r={250} fill="none" stroke="#fff" strokeWidth={4} />
      <line x1={0} y1={HEIGHT * 0.56} x2={WIDTH} y2={HEIGHT * 0.56} stroke="#fff" strokeWidth={4} />
      <rect x={WIDTH / 2 - 300} y={-4} width={600} height={260} fill="none" stroke="#fff" strokeWidth={4} />
      <rect x={WIDTH / 2 - 300} y={HEIGHT - 256} width={600} height={260} fill="none" stroke="#fff" strokeWidth={4} />
    </svg>
  </div>
);

export const Hook: React.FC<{ hook: HookDef; t: number; until: number }> = ({ hook: h, t, until }) => {
  // Schriftgröße an die längste Zeile anpassen (Manrope 800: ≈ 0,58 em je Zeichen), max. 118 px.
  const longest = Math.max(...h.lines.map((l) => l.length));
  const fontSize = Math.min(118, Math.floor((WIDTH - 2 * safe.side) / (longest * 0.58)));
  const out = interpolate(t, [until - 0.45, until], [1, 0], clamp);
  const lift = interpolate(t, [until - 0.45, until], [0, -60], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <div style={{ position: 'absolute', left: safe.side, right: safe.side, top: 380, opacity: out, transform: `translateY(${lift}px)` }}>
      <Img src={staticFile(brand.logoOnDark)} style={{ width: 330, display: 'block', marginBottom: 60, opacity: interpolate(t, [0, 0.4], [0, 0.95], clamp) }} />
      {h.lines.map((line, i) => {
        const s = 0.15 + i * 0.32;
        const o = interpolate(t, [s, s + 0.35], [0, 1], clamp);
        const y = interpolate(t, [s, s + 0.45], [40, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
        const isAccent = line === h.accent;
        return (
          <div key={i} style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize, lineHeight: 1.08, letterSpacing: -2.5, whiteSpace: 'nowrap',
            color: isAccent ? brand.lime : brand.white, opacity: o, transform: `translateY(${y}px)` }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};

export const Captions: React.FC<{ t: number; captions: Caption[] }> = ({ t, captions }) => {
  const c = captions.find((x) => t >= x.from && t < x.to);
  if (!c) return null;
  const inP = interpolate(t, [c.from, c.from + 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(t, [c.to - 0.22, c.to], [1, 0], clamp);
  // aufeinanderfolgende Überschriften mit gleichem Titel nicht neu einblenden
  return (
    <div style={{ position: 'absolute', left: safe.side, right: safe.side, top: safe.top + 30, height: 300, opacity: Math.min(inP, outP),
      transform: `translateY(${(1 - inP) * 24}px)`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 86, lineHeight: 1.05, letterSpacing: -1.5, color: brand.white }}>
        {c.title}{c.accent ? <><br /><span style={{ color: brand.lime }}>{c.accent}</span></> : null}
      </div>
      {c.sub && <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 40, color: brand.inkSoft, marginTop: 18 }}>{c.sub}</div>}
    </div>
  );
};

export const EndCard: React.FC<{ t: number; from: number }> = ({ t, from }) => {
  const rel = t - from;
  const o = interpolate(rel, [0, 0.4], [0, 1], clamp);
  const logoY = interpolate(rel, [0, 0.6], [40, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ctaO = interpolate(rel, [0.6, 1.0], [0, 1], clamp);
  const ctaY = interpolate(rel, [0.6, 1.1], [30, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Img src={staticFile(brand.logoOnDark)} style={{ width: 700, marginTop: safe.top + 170, transform: `translateY(${logoY}px)` }} />
      <div style={{ marginTop: 90, textAlign: 'center', opacity: ctaO, transform: `translateY(${ctaY}px)` }}>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 52, color: brand.white }}>{endCard.cta}</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 112, color: brand.lime, letterSpacing: -2, marginTop: 6 }}>{endCard.url}</div>
      </div>
    </div>
  );
};

export const Subtitles: React.FC<{ t: number; cues: SubtitleCue[] }> = ({ t, cues }) => {
  if (!subtitles.burnIn) return null;
  const c = cues.find((x) => t >= x.from && t < x.to);
  if (!c) return null;
  return (
    <div style={{ position: 'absolute', left: safe.side, right: safe.side, top: subtitles.bottomY - 140, height: 130, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <span style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 40, lineHeight: 1.25, color: '#fff', background: 'rgba(1,27,50,.82)', padding: '10px 20px', borderRadius: 14, textAlign: 'center' }}>{c.text}</span>
    </div>
  );
};

// Vorbereiteter Nachrichtentext der App (z. B. WhatsApp-Anfrage), als neutrale Textkarte – keine fremde Oberfläche.
function richLine(line: string, i: number) {
  const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <div key={i} style={{ minHeight: '0.7em' }}>
      {parts.map((p, j) => (p.startsWith('*') && p.endsWith('*') ? <b key={j}>{p.slice(1, -1)}</b> : <span key={j}>{p}</span>))}
    </div>
  );
}
export const MessageCard: React.FC<{ t: number; m: MessageOverlay; text: string; area: { x: number; y: number; w: number; h: number } }> = ({ t, m, text, area }) => {
  if (t < m.from || t > m.to) return null;
  const inP = interpolate(t, [m.from, m.from + 0.45], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(t, [m.to - 0.3, m.to], [1, 0], clamp);
  const lines = text.replace(/https?:\/\/\S+/g, (u) => u.replace(/^https?:\/\//, '')).split('\n').slice(0, m.maxLines ?? 14);
  return (
    <>
    <div style={{ position: 'absolute', left: area.x, top: area.y, width: area.w, height: area.h, borderRadius: 44,
      background: 'rgba(1,27,50,.62)', opacity: Math.min(inP, outP) }} />
    <div style={{ position: 'absolute', left: area.x + 30, width: area.w - 60, bottom: HEIGHT - (area.y + area.h) + 40, opacity: Math.min(inP, outP),
      transform: `translateY(${(1 - inP) * 80}px)` }}>
      <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 26, letterSpacing: 1.5, textTransform: 'uppercase', color: brand.lime, marginBottom: 10, paddingLeft: 8 }}>{m.label}</div>
      <div style={{ background: '#fff', borderRadius: 30, borderTopLeftRadius: 8, padding: '26px 30px', fontFamily: TEXT, fontWeight: 500, fontSize: 31, lineHeight: 1.36,
        color: brand.navy, boxShadow: '0 30px 70px rgba(1,27,50,.45), 0 0 0 4px rgba(139,207,47,.85)' }}>
        {lines.map(richLine)}
      </div>
    </div>
    </>
  );
};
