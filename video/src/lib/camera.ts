// Kamera über einem Screenshot: Fokuspunkt (CSS-Pixel) + Zoom → Transformation in Film-Pixel.
// zoom 1 = Screenshot-Breite füllt die Karte. Der Ausschnitt wird an den Bildrändern festgehalten.
import { Easing, interpolate } from 'remotion';
import { card } from '../config/common';
import type { CameraKey } from '../config/types';
import { elOf, type Box, type Scene } from './manifest';

export type Cam = { cx: number; cy: number; k: number };
export type View = { w: number; h: number };

function focusOf(scene: Scene, view: View, key: CameraKey, fit: boolean) {
  if (key.el) {
    const b = elOf(scene, key.el);
    if (fit) {
      // Breite Elemente: mittig und höchstens so weit zoomen, dass sie mit 10 CSS-px Rand ganz sichtbar bleiben.
      const maxZoom = Math.max(1, view.w / (b.w + 20));
      const wide = b.w > view.w * 0.6;
      return { x: wide ? view.w / 2 : b.x + b.w / 2 + (key.x ?? 0), y: b.y + b.h / 2 + (key.dy ?? 0), zoom: Math.min(key.zoom, maxZoom) };
    }
    return { x: b.x + b.w / 2 + (key.x ?? 0), y: b.y + b.h / 2 + (key.dy ?? 0), zoom: key.zoom };
  }
  return { x: key.x ?? view.w / 2, y: (key.y ?? view.h / 2) + (key.dy ?? 0), zoom: key.zoom };
}

function clampCam(view: View, cx: number, cy: number, k: number): Cam {
  const halfW = card.w / 2 / k;
  const halfH = card.h / 2 / k;
  return {
    k,
    cx: view.w <= 2 * halfW ? view.w / 2 : Math.min(Math.max(cx, halfW), view.w - halfW),
    cy: view.h <= 2 * halfH ? view.h / 2 : Math.min(Math.max(cy, halfH), view.h - halfH),
  };
}

export function cameraAt(scene: Scene, view: View, keys: CameraKey[], tRel: number, fit = false): Cam {
  const base = card.w / view.w;
  const pts = keys.map((k) => ({ at: k.at, ...focusOf(scene, view, k, fit) }));
  let a = pts[0], b = pts[0];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].at <= tRel) { a = pts[i]; b = pts[Math.min(i + 1, pts.length - 1)]; }
  }
  if (tRel < pts[0].at) { a = b = pts[0]; }
  const p = a === b ? 0 : interpolate(tRel, [a.at, b.at], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const zoom = a.zoom + (b.zoom - a.zoom) * p;
  return clampCam(view, a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p, base * zoom);
}

// CSS-Pixel des Screenshots → Pixel innerhalb der Karte.
export function toCard(cam: Cam, x: number, y: number) {
  return { x: card.w / 2 + (x - cam.cx) * cam.k, y: card.h / 2 + (y - cam.cy) * cam.k };
}
export function boxToCard(cam: Cam, b: Box, pad = 0) {
  const p = toCard(cam, b.x - pad, b.y - pad);
  return { x: p.x, y: p.y, w: (b.w + 2 * pad) * cam.k, h: (b.h + 2 * pad) * cam.k };
}
