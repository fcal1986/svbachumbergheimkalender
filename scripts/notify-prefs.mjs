// scripts/notify-prefs.mjs
//
// Benachrichtigungs-Einstellungen für Admins (ab 05.10.2026): pro Bereich getrennt für Push und Mail.
// Gespeichert in users.json → notifyPrefs: { push: {bereich: bool}, mail: {bereich: bool} }; fehlende
// Werte gelten wie NOTIFY_DEFAULTS. Gleiche Bereiche und Vorgaben wie in der App (index.html, NOTIFY_AREAS).
// Trainer haben keine Einstellungen; für sie gelten die festen Regeln in notify-email.mjs.

export const NOTIFY_DEFAULTS = {
  push: { own: true, other: false, club: true, moves: true, admin: false, reg: true },
  mail: { own: true, other: true, club: true, moves: true, admin: true, reg: true },
};

export function adminWants(user, channel, area) {
  const p = user && user.notifyPrefs && user.notifyPrefs[channel];
  if (p && typeof p[area] === 'boolean') return p[area];
  return !!(NOTIFY_DEFAULTS[channel] && NOTIFY_DEFAULTS[channel][area]);
}
