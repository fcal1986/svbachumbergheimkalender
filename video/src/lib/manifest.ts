// Typisierter Zugriff auf das Szenenmanifest aus der Playwright-Aufnahme.
import raw from '../../public/capture/manifest.json';

export type Box = { x: number; y: number; w: number; h: number };
export type Scene = { id: string; description: string; image: string; elements: Record<string, Box> };
type Manifest = {
  coordinateSystem: { viewport: { width: number; height: number }; deviceScaleFactor: number };
  scenes: Scene[];
};

export const manifest = raw as unknown as Manifest;
export const VIEW_W = manifest.coordinateSystem.viewport.width; // CSS-Pixel
export const VIEW_H = manifest.coordinateSystem.viewport.height;

export function scene(id: string): Scene {
  const s = manifest.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`Szene „${id}“ fehlt im Manifest – zuerst „npm run capture“ ausführen.`);
  return s;
}

export function el(sceneId: string, key: string): Box {
  const b = scene(sceneId).elements[key];
  if (!b) throw new Error(`Element „${key}“ fehlt in Szene „${sceneId}“ (Manifest).`);
  return b;
}
