// Gesamtfilm eines Reels: Hintergrund → Einstieg → Handy-Karte mit Shots → Überschriften → Nachrichtenkarten → Endkarte.
// Inhalt kommt aus src/reels/<id>.ts, Bilder/Koordinaten aus public/capture/<id>/manifest.json.
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { brand, card, endCardLen, hookSection } from './config/common';
import type { Reel, SubtitleCue } from './config/types';
import { reelById } from './reels';
import { manifestFor } from './lib/manifest';
import { ShotView } from './components/ShotView';
import { Background, Captions, EndCard, Hook, MessageCard, Subtitles } from './components/Parts';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const FONTS: [string, number, string][] = [
  ['Inter', 500, 'fonts/inter-latin-500-normal.woff2'], ['Inter', 600, 'fonts/inter-latin-600-normal.woff2'],
  ['Inter', 700, 'fonts/inter-latin-700-normal.woff2'], ['Manrope', 800, 'fonts/manrope-latin-800-normal.woff2'],
];

function useFonts() {
  const [handle] = useState(() => delayRender('Schriften laden'));
  useEffect(() => {
    Promise.all(FONTS.map(([fam, w, src]) => new FontFace(fam, `url(${staticFile(src)}) format('woff2')`, { weight: String(w) }).load()
      .then((f) => document.fonts.add(f)))).then(() => continueRender(handle)).catch((e) => { console.error(e); continueRender(handle); });
  }, [handle]);
}

export type FilmProps = { reel: string; hook?: string };

export const cuesFor = (reel: Reel, hook: string): SubtitleCue[] =>
  reel.narration.map((c) => (c.text === '__HOOK__' ? { ...c, text: reel.hooks[hook].label } : c));

export const Film: React.FC<FilmProps> = ({ reel: reelId, hook: hookProp }) => {
  useFonts();
  const reel = reelById(reelId);
  const manifest = manifestFor(reelId);
  const hook = hookProp && reel.hooks[hookProp] ? hookProp : reel.mainHook;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const endFrom = reel.durationS - endCardLen;

  const cardStart = reel.shots[0].from;
  const cardEnd = endFrom + 0.1;
  const cardIn = interpolate(t, [cardStart, cardStart + 0.7], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cardOut = interpolate(t, [cardEnd - 0.5, cardEnd], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const cardVisible = t >= cardStart && t <= cardEnd;

  // Musik unter Sprache absenken (nur wenn Musik und Sprache konfiguriert sind).
  const music = reel.audio?.music;
  const voice = reel.audio?.voiceover;
  const musicVolume = (f: number) => {
    if (!music) return 0;
    const ts = f / fps;
    const speaking = voice && reel.narration.some((c) => ts >= c.from - 0.2 && ts <= c.to + 0.2);
    return speaking ? music.duckedVolume : music.volume;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: brand.navy }}>
      <Background />
      {t < hookSection.to && <Hook hook={reel.hooks[hook]} t={t} until={hookSection.to} />}
      {cardVisible && (
        <div style={{
          position: 'absolute', left: card.x, top: card.y, width: card.w, height: card.h, borderRadius: card.radius, overflow: 'hidden',
          background: brand.bg, boxShadow: '0 40px 90px rgba(0,0,0,.45), 0 0 0 6px rgba(255,255,255,.08)',
          transform: `translateY(${(1 - cardIn) * 900 + cardOut * 120}px) scale(${1 - cardOut * 0.06})`, opacity: 1 - cardOut,
        }}>
          {reel.shots.filter((s) => t >= s.from && t <= s.to + 0.35).map((s) => <ShotView key={s.id} shot={s} t={t} manifest={manifest} fit={reel.cameraFit} />)}
        </div>
      )}
      {(reel.messages ?? []).map((m, i) => (
        <MessageCard key={i} t={t} m={m} text={(manifest.texts ?? {})[m.textKey] ?? `[Text „${m.textKey}“ fehlt]`} area={card} />
      ))}
      <Captions t={t} captions={reel.captions} />
      {t >= endFrom && <EndCard t={t} from={endFrom} />}
      <Subtitles t={t} cues={cuesFor(reel, hook)} />
      {voice && <Audio src={staticFile(voice.src)} volume={voice.volume} />}
      {music && <Audio src={staticFile(music.src)} volume={musicVolume} />}
    </AbsoluteFill>
  );
};
