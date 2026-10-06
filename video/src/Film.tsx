// Gesamtfilm: Hintergrund → Einstieg → Handy-Karte mit Shots → Überschriften → Endkarte (+ optional Audio/Untertitel).
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { audio, brand, card, endCard, hookSection, narration, shots, type HookId, type SubtitleCue } from './config/film';
import { ShotView } from './components/ShotView';
import { Background, Captions, EndCard, Hook, Subtitles } from './components/Parts';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const FONTS: [string, number, string][] = [
  ['Inter', 600, 'fonts/inter-latin-600-normal.woff2'], ['Inter', 700, 'fonts/inter-latin-700-normal.woff2'],
  ['Manrope', 800, 'fonts/manrope-latin-800-normal.woff2'],
];

function useFonts() {
  const [handle] = useState(() => delayRender('Schriften laden'));
  useEffect(() => {
    Promise.all(FONTS.map(([fam, w, src]) => new FontFace(fam, `url(${staticFile(src)}) format('woff2')`, { weight: String(w) }).load()
      .then((f) => document.fonts.add(f)))).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
  }, [handle]);
}

export type FilmProps = { hook: HookId };

export const cuesFor = (hook: HookId): SubtitleCue[] =>
  narration.cues.map((c) => (c.text === '__HOOK__' ? { ...c, text: narration.hookLine(hook) } : c));

export const Film: React.FC<FilmProps> = ({ hook }) => {
  useFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cardStart = shots[0].from;
  const cardEnd = endCard.from + 0.1;
  const cardIn = interpolate(t, [cardStart, cardStart + 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cardOut = interpolate(t, [cardEnd - 0.5, cardEnd], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const cardVisible = t >= cardStart && t <= cardEnd;

  // Musik unter Sprache absenken (nur wenn Musik und Sprache konfiguriert sind).
  const music = audio.music;
  const musicVolume = (f: number) => {
    if (!music) return 0;
    const ts = f / fps;
    const speaking = audio.voiceover && narration.cues.some((c) => ts >= c.from - 0.2 && ts <= c.to + 0.2);
    return speaking ? music.duckedVolume : music.volume;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: brand.navy }}>
      <Background />
      {t < hookSection.to && <Hook hook={hook} t={t} until={hookSection.to} />}
      {cardVisible && (
        <div style={{
          position: 'absolute', left: card.x, top: card.y, width: card.w, height: card.h, borderRadius: card.radius, overflow: 'hidden',
          background: brand.bg, boxShadow: '0 40px 90px rgba(0,0,0,.45), 0 0 0 6px rgba(255,255,255,.08)',
          transform: `translateY(${(1 - cardIn) * 900 + cardOut * 120}px) scale(${1 - cardOut * 0.06})`, opacity: 1 - cardOut,
        }}>
          {shots.filter((s) => t >= s.from && t <= s.to + 0.35).map((s) => <ShotView key={s.id} shot={s} t={t} />)}
        </div>
      )}
      <Captions t={t} />
      {t >= endCard.from && <EndCard t={t} />}
      <Subtitles t={t} cues={cuesFor(hook)} />
      {audio.voiceover && <Audio src={staticFile(audio.voiceover.src)} volume={audio.voiceover.volume} />}
      {music && <Audio src={staticFile(music.src)} volume={musicVolume} />}
    </AbsoluteFill>
  );
};
