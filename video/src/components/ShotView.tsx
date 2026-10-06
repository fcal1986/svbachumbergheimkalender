// Ein Shot: echter App-Screenshot mit Kamerafahrt, dezenten Highlights und Cursor.
import React from 'react';
import { Img, interpolate, staticFile, Easing } from 'remotion';
import { brand, card, cursor as cursorCfg, type Shot } from '../config/film';
import { boxToCard, cameraAt, toCard, type Cam } from '../lib/camera';
import { el, scene, VIEW_W, VIEW_H } from '../lib/manifest';

const FADE = 0.3;

export const ShotView: React.FC<{ shot: Shot; t: number }> = ({ shot, t }) => {
  const rel = t - shot.from;
  const sc = scene(shot.scene);
  const cam = cameraAt(shot.scene, shot.camera, rel);
  const opacity = interpolate(rel, [0, FADE], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <Img
        src={staticFile(sc.image)}
        style={{
          // Breite direkt in Film-Pixeln (kein scale()), damit Chrome aus dem 3×-Screenshot scharf skaliert.
          position: 'absolute', left: card.w / 2 - cam.cx * cam.k, top: card.h / 2 - cam.cy * cam.k,
          width: VIEW_W * cam.k, height: VIEW_H * cam.k, maxWidth: 'none',
        }}
      />
      {(shot.highlights ?? []).map((h, i) => (
        <HighlightRing key={i} cam={cam} box={el(shot.scene, h.el)} pad={h.pad ?? 4} rel={rel} from={h.from} to={h.to} dim={h.dim} />
      ))}
      {(shot.taps ?? []).map((tp, i) => {
        const b = el(shot.scene, tp.el);
        return <Cursor key={i} cam={cam} x={b.x + b.w / 2 + (tp.dx ?? 0)} y={b.y + b.h / 2 + (tp.dy ?? 0)} rel={rel} at={tp.at} />;
      })}
    </div>
  );
};

const HighlightRing: React.FC<{ cam: Cam; box: { x: number; y: number; w: number; h: number }; pad: number; rel: number; from: number; to: number; dim?: boolean }> = ({ cam, box, pad, rel, from, to, dim }) => {
  const o = interpolate(rel, [from, from + 0.25, to - 0.25, to], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (o <= 0) return null;
  const r = boxToCard(cam, box, pad);
  const grow = interpolate(rel, [from, from + 0.35], [1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <div style={{
      position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, opacity: o, borderRadius: 18,
      transform: `scale(${grow})`, border: `5px solid ${brand.lime}`,
      boxShadow: `0 0 0 3px rgba(255,255,255,.85), 0 0 28px rgba(139,207,47,.55)${dim ? ', 0 0 0 4000px rgba(1,27,50,.28)' : ''}`,
    }} />
  );
};

const Cursor: React.FC<{ cam: Cam; x: number; y: number; rel: number; at: number }> = ({ cam, x, y, rel, at }) => {
  const { moveS, pressS, size } = cursorCfg;
  const start = at - moveS - 0.25;
  const end = at + 0.55;
  if (rel < start || rel > end) return null;
  const target = toCard(cam, x, y);
  const from = { x: target.x + 240, y: target.y + 300 };
  const p = interpolate(rel, [start + 0.15, at - 0.05], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  // leicht gebogene Bahn
  const bx = from.x + (target.x - from.x) * p - Math.sin(p * Math.PI) * 40;
  const by = from.y + (target.y - from.y) * p;
  const opacity = interpolate(rel, [start, start + 0.15, end - 0.2, end], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const press = interpolate(rel, [at - 0.02, at + pressS / 2, at + pressS], [1, 0.82, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring = interpolate(rel, [at, at + 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <>
      {rel >= at && ring < 1 && (
        <div style={{
          position: 'absolute', left: target.x - 60, top: target.y - 60, width: 120, height: 120, borderRadius: 999,
          border: `6px solid ${brand.lime}`, opacity: 1 - ring, transform: `scale(${0.35 + ring * 0.9})`,
        }} />
      )}
      <svg width={size} height={size} viewBox="0 0 32 32" style={{
        position: 'absolute', left: bx - 7, top: by - 4, opacity, transform: `scale(${press})`, transformOrigin: '7px 4px',
        filter: 'drop-shadow(0 6px 10px rgba(1,27,50,.35))',
      }}>
        <path d="M7 4 L7 26 L12.5 20.5 L16.5 29 L20.5 27.2 L16.6 18.8 L24.5 18.8 Z" fill="#fff" stroke={brand.navy} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </>
  );
};
