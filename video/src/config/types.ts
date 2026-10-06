// Typen für Reel-Konfigurationen. Nur Typen – keine Werte (damit Node die Reel-Dateien ohne Bundler lesen kann).

export type HookDef = { label: string; lines: string[]; accent?: string };
export type CameraKey = { at: number; el?: string; x?: number; y?: number; zoom: number; dy?: number };
export type Highlight = { el: string; from: number; to: number; pad?: number; dim?: boolean };
export type Tap = { el: string; at: number; dx?: number; dy?: number };
export type Shot = {
  id: string;
  scene: string; // Szene im Manifest des Reels
  from: number; // Sekunden im Film
  to: number;
  camera: CameraKey[]; // at relativ zum Shot-Beginn
  highlights?: Highlight[]; // relativ zum Shot-Beginn
  taps?: Tap[]; // relativ zum Shot-Beginn
};
export type Caption = { from: number; to: number; title: string; accent?: string; sub?: string };
export type SubtitleCue = { from: number; to: number; text: string };
// Textkarte über der Handy-Karte, z. B. die von der App vorbereitete WhatsApp-Nachricht (Text aus dem Manifest).
export type MessageOverlay = { from: number; to: number; textKey: string; label: string; maxLines?: number };

export type Reel = {
  id: string;
  title: string; // Arbeitstitel
  audience: string; // Zielgruppe (Doku)
  durationS: number;
  hooks: Record<string, HookDef>;
  mainHook: string;
  shots: Shot[];
  captions: Caption[];
  messages?: MessageOverlay[];
  narration: SubtitleCue[]; // '__HOOK__' = Text des gewählten Einstiegs; Zeiten geschätzt
  claims: string[]; // Belegte Aussagen (Doku/Prüfung)
  // Kamera: Zoom so begrenzen, dass ein fokussiertes Element immer ganz in die Breite passt (Reel 1: aus, Bestand).
  cameraFit?: boolean;
  audio?: { voiceover?: { src: string; volume: number }; music?: { src: string; volume: number; duckedVolume: number } };
};
