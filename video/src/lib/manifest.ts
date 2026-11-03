// Szenenmanifeste aus der Playwright-Aufnahme (public/capture/<reel>/manifest.json).
// Per require.context geladen, damit fehlende Aufnahmen erst beim Rendern des betroffenen Reels auffallen.

export type Box = { x: number; y: number; w: number; h: number };
export type Scene = { id: string; description: string; image: string; elements: Record<string, Box> };
export type Manifest = {
  reel: string;
  coordinateSystem: { viewport: { width: number; height: number }; deviceScaleFactor: number };
  scenes: Scene[];
  texts?: Record<string, string>;
};

declare const require: { context: (dir: string, deep: boolean, re: RegExp) => { keys(): string[]; (k: string): unknown } };
const ctx = require.context('../../public/capture', true, /manifest\.json$/);
const MANIFESTS: Record<string, Manifest> = {};
for (const k of ctx.keys()) {
  const m = ctx(k) as Manifest;
  if (m && m.reel) MANIFESTS[m.reel] = m;
}

export function manifestFor(reelId: string): Manifest {
  const m = MANIFESTS[reelId];
  if (!m) throw new Error(`Aufnahme für „${reelId}“ fehlt – zuerst „npm run capture -- ${reelId}“ ausführen.`);
  return m;
}

export function sceneOf(m: Manifest, id: string): Scene {
  const s = m.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Szene „${id}“ fehlt im Manifest von „${m.reel}“.`);
  return s;
}

export function elOf(s: Scene, key: string): Box {
  const b = s.elements[key];
  if (!b) throw new Error(`Element „${key}“ fehlt in Szene „${s.id}“.`);
  return b;
}
