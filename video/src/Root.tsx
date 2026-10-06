// Kompositionen: je Reel ein Film „Reel-<id>“ (Einstieg per Prop wählbar) und „Vorschau-<id>“ (erste Sekunden).
// Varianten entstehen nur über Props/Konfiguration – die Animationslogik bleibt unverändert.
import React from 'react';
import { Composition } from 'remotion';
import { Film, type FilmProps } from './Film';
import { FPS, HEIGHT, PREVIEW_S, WIDTH } from './config/common';
import { REELS } from './reels';

export const RemotionRoot: React.FC = () => (
  <>
    {Object.values(REELS).map((r) => (
      <React.Fragment key={r.id}>
        <Composition<any, FilmProps> id={`Reel-${r.id}`} component={Film} durationInFrames={r.durationS * FPS} fps={FPS}
          width={WIDTH} height={HEIGHT} defaultProps={{ reel: r.id, hook: r.mainHook }} />
        <Composition<any, FilmProps> id={`Vorschau-${r.id}`} component={Film} durationInFrames={PREVIEW_S * FPS} fps={FPS}
          width={WIDTH} height={HEIGHT} defaultProps={{ reel: r.id, hook: r.mainHook }} />
      </React.Fragment>
    ))}
  </>
);
