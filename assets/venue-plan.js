/* Platzcoach Pilot #135: Spielorte und nur tatsächlich zugeteilte Hallenfenster.
   Reine Fachfunktionen: kein Browserzugriff, keine personenbezogenen Daten. */
(function (root) {
  'use strict';
  const HOME = 'home';
  const validDate = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
  const day = d => { const n = new Date(d + 'T12:00:00').getDay(); return n === 0 ? 7 : n; };
  const minutes = t => { const m = /^(\d\d):(\d\d)$/.exec(String(t || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : NaN; };
  const clock = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  function hall(cfg, id) {
    const plan = cfg && cfg.hallPlan;
    return (plan && Array.isArray(plan.venues) ? plan.venues : []).find(v => v.id === id) || null;
  }
  function windows(cfg, date, id) {
    if (id === HOME) return [{ from: '00:00', to: '23:59', parts: 4 }];
    const plan = cfg && cfg.hallPlan, v = hall(cfg, id);
    if (!validDate(date) || !plan || !v || date < plan.from || date > plan.until) return [];
    return (v.windows || []).filter(w => w.day === day(date) && minutes(w.from) < minutes(w.to));
  }
  function venues(cfg, date) {
    const name = cfg && cfg.venue && cfg.venue.name || 'Sportplatz';
    const list = [{ id: HOME, name, kind: 'pitch', parts: 4 }];
    const plan = cfg && cfg.hallPlan;
    if (!plan || !validDate(date)) return list;
    for (const v of plan.venues || []) {
      if (windows(cfg, date, v.id).length) list.push({ id: v.id, name: v.name, kind: 'hall', parts: v.parts });
    }
    return list;
  }
  function permitted(cfg, date, id, from, to, parts) {
    if (!validDate(date) || !(minutes(from) < minutes(to))) return false;
    if (id === HOME) return true; // Bestehende Außenplatz-Regeln bleiben unberührt.
    const v = hall(cfg, id), list = Array.isArray(parts) ? parts : [];
    if (!v || !list.length || list.some(p => !Number.isInteger(p) || p < 1 || p > v.parts)) return false;
    return windows(cfg, date, id).some(w => from >= w.from && to <= w.to);
  }
  function free(cfg, date, id, lane, occupied) {
    const v = hall(cfg, id);
    if (!v || !Number.isInteger(lane) || lane < 1 || lane > v.parts) return [];
    const intervals = [];
    for (const w of windows(cfg, date, id)) {
      const from = minutes(w.from), to = minutes(w.to);
      const busy = (occupied || []).filter(o => !o.cancelled && o.venueId === id &&
        o.lanes && o.lanes[0] <= lane && o.lanes[1] >= lane)
        .map(o => [Math.max(from, minutes(o.t)), Math.min(to, minutes(o.bis))])
        .filter(([a, b]) => a < b).sort((a, b) => a[0] - b[0]);
      let cur = from;
      for (const [a, b] of busy) {
        if (a - cur >= 15) intervals.push({ from: clock(cur), to: clock(a) });
        cur = Math.max(cur, b);
      }
      if (to - cur >= 15) intervals.push({ from: clock(cur), to: clock(to) });
    }
    return intervals;
  }
  root.PlatzcoachVenues = Object.freeze({ HOME, hall, windows, venues, permitted, free });
})(globalThis);
