// Kompositionen: der volle Film (Einstieg per Prop wählbar) und kurze Einstiegsvorschauen.
// Varianten entstehen nur über Props/Konfiguration – die Animationslogik bleibt unverändert.
import React from 'react';
import { Composition } from 'remotion';
import { Film, type FilmProps } from './Film';
import { DURATION_S, FPS, HEIGHT, mainHook, PREVIEW_S, WIDTH } from './config/film';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition<any, FilmProps>
      id="PlatzcoachFilm"
      component={Film}
      durationInFrames={DURATION_S * FPS}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ hook: mainHook }}
    />
    <Composition<any, FilmProps>
      id="EinstiegVorschau"
      component={Film}
      durationInFrames={PREVIEW_S * FPS}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ hook: 'werwann' }}
    />
  </>
);
