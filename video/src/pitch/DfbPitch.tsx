// Vorstellungsfilm (16:9) für ein Gespräch mit dem DFB: Problem aus dem Vereinsalltag (echte, anonymisierte
// WhatsApp-Bilder) → neue Spielformen im Kinderfußball → Platzcoach in der echten App (Demo-Verein) → Gesprächsangebot.
// WhatsApp-Bilder liegen nur lokal in public/pitch/ (gitignored), App-Bilder kommen aus public/capture/<reel>/.
import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand } from '../config/common';
import type { Shot } from '../config/types';
import { ShotView } from '../components/ShotView';
import { manifestFor } from '../lib/manifest';
import { useFonts } from '../Film';
import { DISPLAY, TEXT } from '../components/Parts';
import { pitch, type Seg } from './dfb';

export const PW = 1920;
export const PH = 1080;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const ease = Easing.out(Easing.cubic);

// Handy rechts: Bildschirmfläche 500 × 930 (Zoom 1 = ganze App-Breite, fast ganze Höhe).
const PHONE = { x: 1250, y: 75, w: 500, h: 930, bezel: 14, radius: 58 };
const AREA = { w: PHONE.w, h: PHONE.h };

// Filmzeit → Zeit der Konfiguration (stückweise linear), wie bei den Reels.
function warp(t: number) {
  const w = pitch.warp;
  if (!w || w.length < 2) return t;
  for (let i = 0; i < w.length - 1; i++) {
    const [c0, f0] = w[i], [c1, f1] = w[i + 1];
    if (t <= f1 || i === w.length - 2) return c0 + ((t - f0) / (f1 - f0)) * (c1 - c0);
  }
  return t;
}
export const pitchDurationS = () => (pitch.warp?.length ? pitch.warp[pitch.warp.length - 1][1] : pitch.durationS);

const Bg: React.FC = () => (
  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(90% 120% at 30% 20%, ${brand.navy2} 0%, ${brand.navy} 65%)` }}>
    <svg width={PW} height={PH} style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
      <circle cx={PW / 2} cy={PH / 2} r={220} fill="none" stroke="#fff" strokeWidth={4} />
      <line x1={PW / 2} y1={0} x2={PW / 2} y2={PH} stroke="#fff" strokeWidth={4} />
      <rect x={-4} y={PH / 2 - 270} width={300} height={540} fill="none" stroke="#fff" strokeWidth={4} />
      <rect x={PW - 296} y={PH / 2 - 270} width={300} height={540} fill="none" stroke="#fff" strokeWidth={4} />
    </svg>
  </div>
);

const fadeIO = (t: number, a: number, b: number, d = 0.4) => Math.min(interpolate(t, [a, a + d], [0, 1], clamp), interpolate(t, [b - d, b], [1, 0], clamp));

// Linke Textspalte: Kicker, Überschrift (weiß + grüner Akzent), Unterzeile, optional Punkte.
const TextBlock: React.FC<{ t: number; seg: Seg }> = ({ t, seg }) => {
  const rel = t - seg.from;
  const o = fadeIO(t, seg.from, seg.to, 0.45);
  const y = interpolate(rel, [0, 0.6], [30, 0], { ...clamp, easing: ease });
  const center = !!seg.center;
  return (
    <div style={{ position: 'absolute', left: center ? 160 : 130, width: center ? PW - 320 : 1020, top: 0, bottom: 0, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: center ? 'center' : 'flex-start', textAlign: center ? 'center' : 'left', opacity: o, transform: `translateY(${y}px)` }}>
      {seg.kicker && <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: brand.lime, textTransform: 'uppercase', marginBottom: 22 }}>{seg.kicker}</div>}
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: seg.size ?? 74, lineHeight: 1.08, letterSpacing: -1.5, color: brand.white }}>
        {seg.title}
        {seg.accent && <><br /><span style={{ color: brand.lime }}>{seg.accent}</span></>}
      </div>
      {seg.sub && <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 34, lineHeight: 1.4, color: '#C7D3DE', marginTop: 30, maxWidth: center ? 1300 : 960 }}>{seg.sub}</div>}
      {seg.points && (
        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {seg.points.map((p, i) => {
            const s = seg.from + (p.at ?? 0.8 + i * 0.5);
            const po = interpolate(t, [s, s + 0.35], [0, 1], clamp);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 18, opacity: po, transform: `translateX(${(1 - po) * 24}px)` }}>
                <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, color: brand.navy, background: brand.lime, borderRadius: 12, padding: '2px 14px', minWidth: 46, textAlign: 'center' }}>{p.tag}</span>
                <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 32, color: brand.white }}>{p.text}</span>
              </div>
            );
          })}
        </div>
      )}
      {seg.note && <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 22, color: brand.inkSoft, marginTop: 40 }}>{seg.note}</div>}
    </div>
  );
};

// WhatsApp-Bild im Handy: auf Bildschirmbreite skaliert, Kamera = [Zeit, Zoom, Mittelpunkt y (Bildanteil 0–1)].
const ChatImage: React.FC<{ t: number; seg: Seg }> = ({ t, seg }) => {
  const c = seg.chat!;
  const rel = t - seg.from;
  const keys = c.cam;
  let a = keys[0], b = keys[0];
  for (let i = 0; i < keys.length; i++) if (keys[i][0] <= rel) { a = keys[i]; b = keys[Math.min(i + 1, keys.length - 1)]; }
  const p = a === b ? 0 : interpolate(rel, [a[0], b[0]], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const zoom = a[1] + (b[1] - a[1]) * p;
  const cy = a[2] + (b[2] - a[2]) * p;
  const w = PHONE.w * zoom;
  const h = w * c.ratio;
  let top = PHONE.h / 2 - cy * h;
  if (h > PHONE.h) top = Math.min(0, Math.max(PHONE.h - h, top)); else top = (PHONE.h - h) / 2;
  const cx = c.cx ?? 0.5;
  let left = PHONE.w / 2 - cx * w;
  left = Math.min(0, Math.max(PHONE.w - w, left));
  const pop = interpolate(rel, [0.2, 0.7], [0.92, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#EFE7DE' }}>
      <Img src={staticFile(c.src)} style={{ position: 'absolute', left, top, width: w, height: h, maxWidth: 'none', transform: `scale(${pop})` }} />
    </div>
  );
};

const Phone: React.FC<{ t: number; segs: Seg[] }> = ({ t, segs }) => {
  const active = segs.filter((s) => (s.chat || s.shots) && t >= s.from - 0.1 && t <= s.to + 0.35);
  const phoneSegs = segs.filter((s) => s.chat || s.shots);
  const first = phoneSegs.find((s) => t <= s.to + 0.5 && t >= s.from - 0.6);
  if (!first) return null;
  // Ein- und Ausfahren nur an den Rändern zusammenhängender Handy-Abschnitte.
  const prev = phoneSegs.find((s) => Math.abs(s.to - first.from) < 0.01);
  const next = phoneSegs.find((s) => Math.abs(s.from - (active[active.length - 1]?.to ?? first.to)) < 0.01);
  const last = active[active.length - 1] ?? first;
  const inP = prev ? 1 : interpolate(t, [first.from - 0.1, first.from + 0.6], [0, 1], { ...clamp, easing: ease });
  const outP = next ? 0 : interpolate(t, [last.to - 0.4, last.to + 0.2], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return (
    <div style={{ position: 'absolute', left: PHONE.x - PHONE.bezel, top: PHONE.y - PHONE.bezel, width: PHONE.w + 2 * PHONE.bezel, height: PHONE.h + 2 * PHONE.bezel,
      borderRadius: PHONE.radius + PHONE.bezel, background: '#0A1622', boxShadow: '0 50px 110px rgba(0,0,0,.5), 0 0 0 3px rgba(255,255,255,.12)',
      opacity: Math.min(inP, 1 - outP), transform: `translateX(${(1 - inP) * 160 + outP * 120}px)` }}>
      <div style={{ position: 'absolute', left: PHONE.bezel, top: PHONE.bezel, width: PHONE.w, height: PHONE.h, borderRadius: PHONE.radius, overflow: 'hidden', background: brand.bg }}>
        {active.map((s) => (
          <div key={s.id} style={{ position: 'absolute', inset: 0, opacity: interpolate(t, [s.from - 0.1, s.from + 0.25], [0, 1], clamp) }}>
            {s.chat && <ChatImage t={t} seg={s} />}
            {s.shots && s.shots.filter((sh) => t >= sh.from && t <= sh.to + 0.35).map((sh) => (
              <ShotView key={sh.id} shot={sh} t={t} manifest={manifestFor(sh.reel)} fit area={AREA} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Spielfeld-Grafik für die neuen Spielformen: ein Großfeld teilt sich in mehrere kleine Felder.
const KidsPitch: React.FC<{ t: number; seg: Seg }> = ({ t, seg }) => {
  const rel = t - seg.from;
  const o = fadeIO(t, seg.from, seg.to, 0.45);
  const W = 640, H = 900, X = 1180, Y = 90;
  const split = interpolate(rel, [2.2, 3.2], [0, 1], { ...clamp, easing: ease });
  const mini = (i: number) => interpolate(rel, [3.6 + i * 0.35, 4.0 + i * 0.35], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });
  const line = 'rgba(255,255,255,.9)';
  // Felder (vertikales Großfeld): links Hälfte A in 4 Minifelder (G/F), rechts Hälfte B in 2 Felder (E).
  const fields = [
    { x: 30, y: 30, w: 270, h: 200, tag: 'G', text: '3 gegen 3' },
    { x: 30, y: 250, w: 270, h: 200, tag: 'G', text: '2 gegen 2' },
    { x: 340, y: 30, w: 270, h: 200, tag: 'F', text: '3 gegen 3' },
    { x: 340, y: 250, w: 270, h: 200, tag: 'F', text: '5 gegen 5' },
    { x: 30, y: 470, w: 580, h: 190, tag: 'E', text: '5 gegen 5' },
    { x: 30, y: 680, w: 580, h: 190, tag: 'E', text: '5 gegen 5' },
  ];
  return (
    <div style={{ position: 'absolute', left: X, top: Y, width: W, height: H, opacity: o }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <pattern id="mow" width="640" height="90" patternUnits="userSpaceOnUse">
            <rect width="640" height="45" fill="#3E8E2A" /><rect y="45" width="640" height="45" fill="#45992F" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={W} height={H} rx={26} fill="url(#mow)" />
        {/* Großfeld-Linien, blenden beim Aufteilen aus */}
        <g opacity={1 - split * 0.85} stroke={line} strokeWidth={5} fill="none">
          <rect x={20} y={20} width={W - 40} height={H - 40} />
          <line x1={20} y1={H / 2} x2={W - 20} y2={H / 2} />
          <circle cx={W / 2} cy={H / 2} r={80} />
          <rect x={W / 2 - 160} y={20} width={320} height={130} />
          <rect x={W / 2 - 160} y={H - 150} width={320} height={130} />
        </g>
        {fields.map((f, i) => {
          const m = mini(i);
          if (m <= 0) return null;
          const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
          const goal = 26;
          return (
            <g key={i} opacity={Math.min(1, m)} transform={`translate(${cx} ${cy}) scale(${0.85 + 0.15 * m}) translate(${-cx} ${-cy})`}>
              <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={10} fill="rgba(255,255,255,.08)" stroke={line} strokeWidth={4} strokeDasharray={f.tag === 'E' ? undefined : '12 8'} />
              {/* Minitore: vier bei G/F, zwei bei E */}
              {(f.tag === 'E'
                ? [[f.x - 2, cy - goal], [f.x + f.w - 8, cy - goal]]
                : [[f.x - 2, f.y + 34], [f.x - 2, f.y + f.h - 34 - 2 * goal], [f.x + f.w - 8, f.y + 34], [f.x + f.w - 8, f.y + f.h - 34 - 2 * goal]]
              ).map(([gx, gy], j) => <rect key={j} x={gx} y={gy} width={10} height={2 * goal} rx={3} fill="#fff" />)}
              <rect x={cx - 26} y={cy - 46} width={52} height={52} rx={12} fill={brand.lime} />
              <text x={cx} y={cy - 10} textAnchor="middle" fontFamily="Manrope, Inter, sans-serif" fontWeight={800} fontSize={34} fill={brand.navy}>{f.tag}</text>
              <text x={cx} y={cy + 42} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={700} fontSize={26} fill="#fff">{f.text}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const EndCardDfb: React.FC<{ t: number; seg: Seg }> = ({ t, seg }) => {
  const rel = t - seg.from;
  const o = interpolate(rel, [0, 0.5], [0, 1], clamp);
  const s = (a: number) => ({ opacity: interpolate(rel, [a, a + 0.4], [0, 1], clamp), transform: `translateY(${interpolate(rel, [a, a + 0.5], [24, 0], { ...clamp, easing: ease })}px)` });
  const e = seg.end!;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: o, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 120 }}>
      <Img src={staticFile(brand.logoOnDark)} style={{ width: 560, ...s(0) }} />
      <div style={{ width: 2, height: 420, background: 'rgba(255,255,255,.18)' }} />
      <div style={{ maxWidth: 820 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, lineHeight: 1.08, color: brand.white, letterSpacing: -1.2, ...s(0.4) }}>{e.title}</div>
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 36, color: '#C7D3DE', marginTop: 24, ...s(0.8) }}>{e.sub}</div>
        <div style={{ marginTop: 56, ...s(1.3) }}>
          {e.name && <div style={{ fontFamily: TEXT, fontWeight: 700, fontSize: 36, color: brand.white }}>{e.name}</div>}
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 64, color: brand.lime, letterSpacing: -1, marginTop: 6 }}>{e.url}</div>
        </div>
      </div>
    </div>
  );
};

export const DfbPitch: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tFilm = frame / fps;
  const t = warp(tFilm);
  const segs = pitch.segments;
  const voice = pitch.audio?.voiceover;
  return (
    <AbsoluteFill style={{ backgroundColor: brand.navy }}>
      <Bg />
      {segs.filter((s) => t >= s.from - 0.2 && t <= s.to + 0.2).map((s) => (
        <React.Fragment key={s.id}>
          {s.end ? <EndCardDfb t={t} seg={s} /> : <TextBlock t={t} seg={s} />}
          {s.kids && <KidsPitch t={t} seg={s} />}
        </React.Fragment>
      ))}
      <Phone t={t} segs={segs} />
      {/* kleines Logo oben links außer auf der Endkarte */}
      {!segs.find((s) => s.end && t >= s.from) && (
        <Img src={staticFile(brand.logoOnDark)} style={{ position: 'absolute', left: 130, top: 56, width: 150, opacity: 0.9 }} />
      )}
      {voice && <Audio src={staticFile(voice.src)} volume={voice.volume} />}
    </AbsoluteFill>
  );
};

