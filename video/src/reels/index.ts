// Register aller Reels. Neue Reels: Datei in src/reels/ anlegen, hier importieren und in list.json eintragen.
import type { Reel } from '../config/types';
import platzbelegung from './platzbelegung';
import spielverlegung from './spielverlegung';
import fussballde from './fussballde';
import freiertermin from './freiertermin';
import torwarttraining from './torwarttraining';
import freundschaftsspiel from './freundschaftsspiel';
import anleitungSpielverlegung from './anleitung-spielverlegung';
import anleitungFreundschaftsspiel from './anleitung-freundschaftsspiel';
import anleitungSpielInTrainingszeit from './anleitung-spiel-in-trainingszeit';

export const REELS: Record<string, Reel> = { platzbelegung, spielverlegung, fussballde, freiertermin, torwarttraining, freundschaftsspiel, 'anleitung-spielverlegung': anleitungSpielverlegung,
  'anleitung-freundschaftsspiel': anleitungFreundschaftsspiel,
  'anleitung-spiel-in-trainingszeit': anleitungSpielInTrainingszeit };

export function reelById(id: string): Reel {
  const r = REELS[id];
  if (!r) throw new Error(`Unbekanntes Reel „${id}“.`);
  return r;
}
