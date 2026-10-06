// Kamera über einem Screenshot: Fokuspunkt (CSS-Pixel) + Zoom → Transformation in Film-Pixel.
// zoom 1 = Screenshot-Breite füllt die Karte. Der Ausschnitt wird an den Bildrändern festgehalten.
import { Easing, interpolate } from 'remotion';
import { card, type CameraKey } from '../config/film';
import { el, VIEW_H, VIEW_W, type Box } from './manifest';

export type Cam = { cx: number; cy: number; k: number };

function focusOf(sceneId: string, key: CameraKey) {
  if (key.el) {
    const b = el(sceneId, key.el);
    return { x: b.x + b.w / 2 + (key.x ?? 0), y: b.y + b.h / 2 + (key.dy ?? 0) };
  }
  return { x: key.x ?? VIEW_W / 2, y: (key.y ?? VIEW_H / 2) + (key.dy ?? 0) };
}

function clampCam(cx: number, cy: number, k: number): Cam {
  const halfW = card.w / 2 / k;
  const halfH = card.h / 2 / k;
  return {
    k,
    cx: VIEW_W <= 2 * halfW ? VIEW_W / 2 : Math.min(Math.max(cx, halfW), VIEW_W - halfW),
    cy: VIEW_H <= 2 * halfH ? VIEW_H / 2 : Math.min(Math.max(cy, halfH), VIEW_H - halfH),
  };
}

export function cameraAt(sceneId: string, keys: CameraKey[], tRel: number): Cam {
  const base = card.w / VIEW_W;
  const pts = keys.map((k) => ({ at: k.at, zoom: k.zoom, ...focusOf(sceneId, k) }));
  let a = pts[0], b = pts[0];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].at <= tRel) { a = pts[i]; b = pts[Math.min(i + 1, pts.length - 1)]; }
  }
  if (tRel < pts[0].at) { a = b = pts[0]; }
  const p = a === b ? 0 : interpolate(tRel, [a.at, b.at], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const zoom = a.zoom + (b.zoom - a.zoom) * p;
  return clampCam(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, base * zoom);
}

// CSS-Pixel des Screenshots → Pixel innerhalb der Karte.
export function toCard(cam: Cam, x: number, y: number) {
  return { x: card.w / 2 + (x - cam.cx) * cam.k, y: card.h / 2 + (y - cam.cy) * cam.k };
}
export function boxToCard(cam: Cam, b: Box, pad = 0) {
  const p = toCard(cam, b.x - pad, b.y - pad);
  return { x: p.x, y: p.y, w: (b.w + 2 * pad) * cam.k, h: (b.h + 2 * pad) * cam.k };
}
