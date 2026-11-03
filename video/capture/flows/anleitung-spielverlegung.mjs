// Anleitung Spielverlegung (lang): Heimspiel → Neue Ansetzung suchen → Ergebnisse → 2 Vorschläge an den Gegner
// (als offene Terminanfrage gemerkt) → Konto → Terminanfragen → „Zugesagt“ → Verlegung vormerken (Anstoß, Heimrecht, Grund, Platz, Training) → Jugendleiter-Text
// → Kalender (neuer Termin „Vorgemerkt“, alter Termin „Verlegt auf …“) → Nachricht später erneut aufrufen.
export default {
  id: 'anleitung-spielverlegung',
  login: 'trainer',
  async run(ctx) {
    const { page, shot, scrollToEl, lastOpenedText, text, check, waitSaved, pickDay } = ctx;
    const modal = '#reschedule-modal .modal-box';
    const gameSel = '.event-card.external-card:has-text("SC Beispielhausen")';
    const scrollBox = async (sel, toSel, offset) => {
      await page.locator(toSel).first().evaluate((el, off) => { const b = el.closest('.modal-box'); b.scrollTop += el.getBoundingClientRect().top - b.getBoundingClientRect().top - off; }, offset);
      await page.waitForTimeout(250);
    };

    // 1 Spiel im Kalender finden
    await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');
    await pickDay('17');
    await page.locator(gameSel).first().waitFor();
    await scrollToEl(page, gameSel, 250);
    await shot('01-game', 'Kalender Sa 17.10.: Heimspiel E2 gegen SC Beispielhausen mit Lupe „Neue Ansetzung suchen“', {
      weekStrip: '.cw-strip',
      gameCard: gameSel,
      gameHead: `${gameSel} .ev-head`,
      searchBtn: `${gameSel} button[title="Neue Ansetzung suchen"]`,
      moveBtn: `${gameSel} button[title="Verlegung vormerken"]`,
    });

    // 2 Suche einstellen
    await page.locator(gameSel).first().locator('button[title="Neue Ansetzung suchen"]').click();
    await page.waitForSelector('#reschedule-modal.show #rs-days');
    await page.waitForTimeout(400);
    await shot('02-search', 'Ansetzungssuche: Spiel, Wochentage (Spieltag + Trainingstage vorausgewählt)', {
      box: modal,
      title: '#reschedule-modal h3',
      gameInfo: '#rs-text',
      days: '#rs-days',
      preselect: '#rs-preselect',
      times: '#rs-times',
      searchBtn: '#reschedule-modal button.yes',
    });
    await scrollBox(modal, '#rs-times', 60);
    await shot('03-times', 'Uhrzeit je Wochentag und was gesucht wird', {
      box: modal,
      times: '#rs-times',
      rule: '#rs-times + .hint',
      searchBtn: '#reschedule-modal button.yes',
    });

    // 3 Ergebnisse lesen
    await page.click('#reschedule-modal button.yes');
    await page.waitForSelector('.rs-result-row');
    await scrollBox(modal, '#rs-results', 14);
    await shot('04-results', 'Freie Termine: Anstoß, Hälfte, in eurer Trainingszeit / gleicher Tag – je Zeile „Übernehmen“', {
      box: modal,
      headline: '#rs-results .field-label',
      rowMi: '.rs-result-row >> nth=0',
      rowFr: '.rs-result-row >> nth=1',
      rowSa: '.rs-result-row >> nth=2',
      infoFr: '.rs-result-row >> nth=1 >> small',
      infoSa: '.rs-result-row >> nth=2 >> small',
      takeFr: '.rs-result-row >> nth=1 >> button:has-text("Übernehmen")',
    });

    // 4 Zwei Vorschläge anhaken → per WhatsApp an den Gegner (wird als offene Anfrage gemerkt)
    await page.locator('.rs-result-row').nth(0).locator('input[type=checkbox]').check();
    await page.locator('.rs-result-row').nth(1).locator('input[type=checkbox]').check();
    await page.waitForSelector('button:has-text("2 Vorschläge per WhatsApp teilen")');
    await scrollBox(modal, '.rs-result-row >> nth=0', 40);
    await shot('05-two', 'Zwei Termine angehakt', {
      box: modal,
      rowMi: '.rs-result-row >> nth=0',
      rowFr: '.rs-result-row >> nth=1',
    });
    await page.locator('button:has-text("2 Vorschläge per WhatsApp teilen")').evaluate((el) => { const box = el.closest('.modal-box'); box.scrollTop += el.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom + 90; });
    await page.waitForTimeout(250);
    await shot('06-share', '„2 Vorschläge per WhatsApp teilen“ – wird als offene Anfrage gemerkt', {
      box: modal,
      waBtn: 'button:has-text("2 Vorschläge per WhatsApp teilen")',
      hint: '#reschedule-modal .sf-hint',
    });
    await page.click('button:has-text("2 Vorschläge per WhatsApp teilen")');
    text('anfrageGegner', await lastOpenedText(page));
    await page.waitForFunction(() => !document.querySelector('#reschedule-modal.show'));
    await waitSaved();

    // 5 Offene Anfrage im Konto → Terminanfragen
    await page.click('button.navbtn[data-nav="konto"]');
    await page.waitForSelector('#kacc-anfragen');
    await page.waitForTimeout(400);
    await shot('07-konto', 'Konto: „Terminanfragen · 1 offen“', {
      section: '#kacc-anfragen',
      navKonto: 'button.navbtn[data-nav="konto"]',
    });
    await page.click('#kacc-anfragen .kacc-head');
    await page.waitForSelector('.req-card');
    await page.waitForTimeout(500);
    await scrollToEl(page, '.req-card', 250);
    const req = await page.locator('.req-card').first().innerText();
    check('requestCard', req);
    await shot('08-request', 'Offene Anfrage: beide Termine mit „✓ frei“, Zugesagt / Erneut teilen / Absage', {
      card: '.req-card',
      head: '.req-card .req-head',
      optMi: '.req-card .req-opt >> nth=0',
      optFr: '.req-card .req-opt >> nth=1',
      okFr: '.req-card .req-opt >> nth=1 >> .req-st',
      yesFr: '.req-card .req-opt >> nth=1 >> button:has-text("Zugesagt")',
      acts: '.req-card .req-acts',
    });
    await page.locator('.req-card .req-opt').nth(1).locator('button:has-text("Zugesagt")').click();

    // 6 Verlegung vormerken (Datum und Anstoß sind aus der Anfrage vorbefüllt)
    await page.waitForSelector('#move-modal.show #mv-date');
    await page.locator('#mv-time').fill('16:15');
    await page.locator('#mv-time').dispatchEvent('change');
    await page.waitForTimeout(300);
    await shot('09-move', 'Verlegung vormerken: Datum + Anstoß, Heimrecht getauscht (optional), Grund', {
      box: '#move-modal .modal-box',
      text: '#mv-text',
      dateTime: '#mv-date >> xpath=ancestor::div[contains(@style,"display:flex")][1]',
      swap: '#mv-swap-row',
      reason: '#mv-reason',
      reasons: '#mv-reasons',
    });
    await page.locator('#mv-reasons >> text=Ferien').click();
    await page.waitForTimeout(300);
    await scrollBox('#move-modal .modal-box', '#mv-reasons', 40);
    await shot('10-move-bottom', 'Grund „Ferien“, Platz am neuen Termin frei, Training am neuen Tag absagen', {
      box: '#move-modal .modal-box',
      reason: '#mv-reason',
      reasons: '#mv-reasons',
      training: '#mv-training',
      hint: '#mv-hint',
      yes: '#mv-yes',
    });

    // 7 Vormerken → Nachricht an den Jugendleiter (DFBnet-Spielverlegungsantrag)
    await page.click('#mv-yes');
    await page.waitForSelector('#yl-modal.show');
    await page.waitForTimeout(500);
    text('jugendleiter', await page.evaluate(() => ylText));
    await shot('11-youthleader', 'Vorgemerkt – fertiger Text für den DFBnet-Verlegungsantrag', {
      box: '#yl-modal .modal-box',
      title: '#yl-title',
      sub: '#yl-sub',
      textBox: '#yl-text',
      waBtn: '#yl-modal button:has-text("Per WhatsApp senden")',
      copyBtn: '#yl-modal button:has-text("Kopieren")',
    });
    await waitSaved();
    check('demoCommitsAfterMove', true);

    // 9 Danach im Kalender: neuer Termin „Vorgemerkt“, alter Termin „Verlegt auf …“
    await page.click('#yl-modal button:has-text("Schließen")');
    await page.waitForFunction(() => !document.querySelector('.modal.show'));

    // 8 Anfrage hat sich erledigt
    await page.click('button.navbtn[data-nav="konto"]');
    if (await page.locator('.ksub-back').count()) await page.click('.ksub-back');
    await page.waitForSelector('#kacc-anfragen');
    await page.waitForTimeout(400);
    await shot('12a-konto-done', 'Konto: Terminanfragen „keine offen“ – erledigt sich mit dem Vormerken', {
      section: '#kacc-anfragen',
    });
    await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');

    await pickDay('16');
    const moved = '.event-card:has-text("SC Beispielhausen")';
    await page.locator(moved).first().waitFor();
    await scrollToEl(page, moved, 250);
    await shot('12-planned', 'Fr 16.10.: Spiel „Vorgemerkt · fussball.de noch offen“', {
      weekStrip: '.cw-strip',
      card: moved,
      label: `${moved} >> text=Vorgemerkt`,
      badge: `${moved} >> text=/verlegt vom/`,
      moveBtn: `${moved} button[title="Verlegung vormerken"]`,
    });
    await pickDay('17');
    await page.locator('.ia-row:has-text("Verlegt auf")').first().waitFor();
    await scrollToEl(page, '.ia-row:has-text("Verlegt auf")', 330);
    await shot('13-ghost', 'Sa 17.10.: alter Termin „Verlegt auf Fr 16.10.“', {
      weekStrip: '.cw-strip',
      ghost: '.ia-row:has-text("Verlegt auf")',
    });

    // 9 Später erneut: Kalender-Symbol am Spiel → „Nachricht an Jugendleiter (DFBnet)“
    await pickDay('16');
    await page.locator(moved).first().waitFor();
    await page.locator(moved).first().locator('button[title="Verlegung vormerken"]').click();
    await page.waitForSelector('#move-modal.show #mv-yl');
    await page.waitForTimeout(400);
    await scrollBox('#move-modal .modal-box', '#mv-yl', 330);
    await shot('14-reopen', 'Vormerkung öffnen: Nachricht an Jugendleiter erneut senden oder Vormerkung aufheben', {
      box: '#move-modal .modal-box',
      ylBtn: '#mv-yl',
      removeBtn: '#mv-remove',
    });
  },
};
