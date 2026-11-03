// Anleitung Freundschaftsspiel (lang): Neu → Spiel, Heim, Gegner → Freien Termin suchen → Termine anhaken, per WhatsApp
// vorschlagen (offene Terminanfrage) → Konto → Terminanfragen → „Zugesagt“ → Formular vorbefüllt, Platz frei → Prüfen
// (Training absagen) → Speichern → Text für den Jugendleiter → Kalender „Vorgemerkt“ → Tipp: Auswärts belegt keinen Platz.
export default {
  id: 'anleitung-freundschaftsspiel',
  login: 'trainer',
  async run(ctx) {
    const { page, shot, scrollToEl, lastOpenedText, text, check, waitSaved, pickDay } = ctx;
    const sfBox = '#slot-modal .modal-box';
    const chip = (box, t) => page.locator(`#slot-modal ${box} .weekday-chip`).filter({ hasText: new RegExp('^' + t + '$') }).first();
    const scrollIn = async (sel, offset) => {
      await page.locator(sel).first().evaluate((el, off) => { const b = el.closest('.modal-box'); b.scrollTop += el.getBoundingClientRect().top - b.getBoundingClientRect().top - off; }, offset);
      await page.waitForTimeout(250);
    };

    // 1 Neuer Termin: Spiel, Heim, Gegner, Mannschaft
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await page.locator('#f-kind-chips button').filter({ hasText: /^Spiel$/ }).first().click();
    await page.fill('#f-opponent', 'TuS Probedorf');
    await page.dispatchEvent('#f-opponent', 'input');
    await page.waitForTimeout(300);
    await shot('01-form', 'Neu → Spiel, Heim, Gegner, Mannschaft E2', {
      kindChip: '#f-kind-chips button:has-text("Spiel")',
      homeAway: '#f-ha',
      opponent: '#f-opponent',
      homeHelp: '#f-match-help',
      team: '#f-team-chips',
      finder: 'button:has-text("Freien Termin suchen")',
    });

    // 2 Freien Termin suchen: Oktober + November, mittwochs und freitags (Trainingstage), ab 16:30
    await page.click('button:has-text("Freien Termin suchen")');
    await page.waitForSelector('#slot-modal.show #sf-months');
    await chip('#sf-days', 'Mi').click();
    await chip('#sf-days', 'Fr').click();
    await chip('#sf-days', 'Di').click();
    await chip('#sf-months', 'Nov').click();
    await page.locator('#sf-start').fill('16:30');
    await page.locator('#sf-start').dispatchEvent('change');
    await page.waitForTimeout(500);
    await shot('02-criteria', 'Freien Termin finden: Hälfte, Okt + Nov, Mi + Fr, 2 Std, ab 16:30', {
      box: sfBox,
      what: '#sf-what',
      months: '#sf-months',
      days: '#sf-days',
      durs: '#sf-durs',
      start: '#sf-start',
    });
    await scrollIn('#sf-results', 10);
    await shot('03-results', 'Ergebnis: Kalender grün/gelb/grau', {
      box: sfBox,
      summary: '#sf-results > p >> nth=0',
      okt: '#sf-results .sf-month >> nth=0',
      nov: '#sf-results .sf-month >> nth=1',
      legend: '#sf-results .sf-legend',
      row1: '#sf-results .rs-result-row >> nth=0',
    });

    // 3 Zwei Termine anhaken → per WhatsApp vorschlagen (wird als offene Anfrage gemerkt)
    const rows = page.locator('#sf-results .rs-result-row');
    await rows.nth(0).locator('input[type=checkbox]').check();
    await rows.nth(1).locator('input[type=checkbox]').check();
    await page.waitForSelector('#slot-modal button:has-text("2 Vorschläge per WhatsApp teilen")');
    await page.locator('#slot-modal button:has-text("2 Vorschläge per WhatsApp teilen")').evaluate((el) => { const b = el.closest('.modal-box'); b.scrollTop += el.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom + 150; });
    await page.waitForTimeout(250);
    await shot('04-checked', 'Fr 16.10. und Fr 23.10. angehakt → 2 Vorschläge per WhatsApp teilen', {
      box: sfBox,
      row1: '#sf-results .rs-result-row >> nth=0',
      row2: '#sf-results .rs-result-row >> nth=1',
      take2: '#sf-results .rs-result-row >> nth=1 >> button:has-text("Übernehmen")',
      waBtn: '#slot-modal button:has-text("2 Vorschläge per WhatsApp teilen")',
      hint: '#slot-modal .sf-hint',
    });
    await page.click('#slot-modal button:has-text("2 Vorschläge per WhatsApp teilen")');
    text('anfrageGegner', await lastOpenedText(page));
    await page.waitForFunction(() => !document.querySelector('#slot-modal.show'));
    await waitSaved();

    // 4 Zusage: Konto → Terminanfragen → „Zugesagt“
    await page.click('button.navbtn[data-nav="konto"]');
    if (await page.locator('.ksub-back').count()) await page.click('.ksub-back');
    await page.waitForSelector('#kacc-anfragen');
    await page.waitForTimeout(400);
    await shot('05-konto', 'Konto: Terminanfragen · 1 offen', {
      section: '#kacc-anfragen',
    });
    await page.click('#kacc-anfragen .kacc-head');
    await page.waitForSelector('.req-card');
    await page.waitForTimeout(500);
    check('requestCard', await page.locator('.req-card').first().innerText());
    await shot('06-request', 'Offene Anfrage mit beiden Terminen „✓ frei“', {
      card: '.req-card',
      head: '.req-card .req-head',
      opt1: '.req-card .req-opt >> nth=0',
      opt2: '.req-card .req-opt >> nth=1',
      yes2: '.req-card .req-opt >> nth=1 >> button:has-text("Zugesagt")',
      acts: '.req-card .req-acts',
    });
    await page.locator('.req-card .req-opt').nth(1).locator('button:has-text("Zugesagt")').click();
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane === 'neu');
    await page.waitForFunction(() => /frei/.test(document.getElementById('f-kick-info').innerText));
    await page.waitForTimeout(2600); // Hinweis „Aus der Anfrage übernommen“ ausblenden lassen

    // 5 Formular ist vorbefüllt: Datum, Anstoß, Platz frei → Prüfen → Speichern
    await scrollToEl(page, '.nf-card', 70);
    check('kickInfo', await page.locator('#f-kick-info').innerText());
    await shot('07-taken', 'Aus der Anfrage übernommen: Fr 23.10., Anstoß 16:45, Platz frei', {
      card: '.nf-card',
      date: '.nf-date',
      kickoff: '#f-kickoff',
      kickInfo: '#f-kick-info',
      trainingNote: 'text=/Absage beim Speichern/',
      save: 'button:has-text("Termin speichern")',
    });
    await page.click('button:has-text("Termin speichern")');
    await page.locator('button:has-text("Jetzt speichern")').waitFor();
    await page.waitForTimeout(500);
    await shot('08-review', 'Termin prüfen: Hälfte B frei, Training an dem Tag absagen', {
      sheet: 'text=Termin prüfen >> xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]',
      rowWann: 'text=/Anstoß 16:45 \\(Platz/',
      rowPlatz: 'text=/✓ ?frei/ >> nth=-1',
      training: 'text=/an dem Tag absagen/ >> xpath=ancestor::label[1]',
      confirm: 'button:has-text("Jetzt speichern")',
    });

    // 6 Gespeichert → Text für den Jugendleiter (Ansetzung im DFBnet)
    await page.click('button:has-text("Jetzt speichern")');
    await page.waitForSelector('#yl-modal.show');
    await page.waitForTimeout(500);
    text('jugendleiter', await page.evaluate(() => ylText));
    await shot('09-youthleader', 'Gespeichert – Text für den Jugendleiter (Ansetzung im DFBnet)', {
      box: '#yl-modal .modal-box',
      title: '#yl-title',
      sub: '#yl-sub',
      textBox: '#yl-text',
      waBtn: '#yl-modal button:has-text("Per WhatsApp senden")',
      copyBtn: '#yl-modal button:has-text("Kopieren")',
    });
    await waitSaved();

    // 7 Danach: Kalender Fr 23.10. – Spiel „Vorgemerkt“, Training abgesagt
    await page.click('#yl-modal button:has-text("Schließen")');
    await page.waitForFunction(() => !document.querySelector('.modal.show'));
    if ((await page.evaluate(() => document.querySelector('.pane.active')?.dataset.pane)) !== 'termine') await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');
    await pickDay('23');
    const card = '.event-card:has-text("TuS Probedorf")';
    await page.locator(card).first().waitFor();
    await scrollToEl(page, card, 250);
    await shot('10-planned', 'Fr 23.10.: Freundschaftsspiel „Vorgemerkt · noch nicht bei fussball.de“', {
      weekStrip: '.cw-strip',
      card,
      status: `${card} >> text=/noch nicht bei fussball.de/`,
      ylBtn: `${card} >> text=/Nachricht an den Jugendleiter/`,
    });

    // 8 Tipp: Auswärtsspiel belegt keinen Platz
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await page.locator('#f-kind-chips button').filter({ hasText: /^Spiel$/ }).first().click();
    await page.click('#f-ha button[data-ha="away"]');
    await page.fill('#f-opponent', 'SC Beispielhausen');
    await page.dispatchEvent('#f-opponent', 'input');
    await page.waitForTimeout(500);
    await shot('11-away', 'Auswärts: belegt keinen Platz, Ansetzung macht der Gastgeber', {
      homeAway: '#f-ha',
      opponent: '#f-opponent',
      address: '#f-address',
      awayHelp: '#f-match-help',
    });
  },
};
