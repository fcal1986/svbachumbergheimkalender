// Anleitung: Spiel in der Trainingszeit anlegen (G1, Viertel). Trainingskarte → Uhr („Nur an diesem Tag verlegen“,
// übernimmt Tag, Zeit und Fläche) → Art „Spiel“ → Gegner, Anstoß → Training gilt als frei, wird beim Speichern abgesagt →
// Termin prüfen → Jugendleiter-Text → Kalender: Spiel vorgemerkt, Training abgesagt.
export default {
  id: 'anleitung-spiel-in-trainingszeit',
  login: 'gjugend',
  async run(ctx) {
    const { page, shot, scrollToEl, text, check, waitSaved, pickDay } = ctx;
    const card = '.event-card:has-text("Training"):has-text("G1")';

    // 1 Kalender: Fr 16.10., Training G1 auf Viertel 1
    await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');
    await pickDay('16');
    await page.locator(card).first().waitFor();
    await scrollToEl(page, card, 290);
    await shot('01-card', 'Fr 16.10.: Training G1, Viertel 1 – Uhr antippen', {
      weekStrip: '.cw-strip',
      card,
      head: `${card} >> .ev-head >> nth=0`,
      clock: `${card} >> button[title="Nur an diesem Tag verlegen"]`,
      cancel: `${card} >> button[title="Diesen Termin absagen"]`,
    });

    // 2 Uhr: Formular mit Tag, Zeit, Mannschaft und Fläche des Trainings
    await page.locator(card).first().locator('button[title="Nur an diesem Tag verlegen"]').click();
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane === 'neu');
    await page.waitForTimeout(800);
    check('prefilled', await page.evaluate(() => ({ von: document.getElementById('f-von').value, bis: document.getElementById('f-bis').value, team: document.getElementById('f-team').value })));
    await shot('02-prefilled', 'Formular übernimmt Tag, Zeit 16–17 Uhr, G1, Viertel', {
      kindChips: '#f-kind-chips',
      training: '#f-kind-chips button:has-text("Training")',
      spiel: '#f-kind-chips button:has-text("Spiel")',
    });
    await scrollToEl(page, '.nf-card', 70);
    await shot('02b-prefilled-time', 'Tag und Zeit des Trainings übernommen', {
      card: '.nf-card',
      date: '.nf-date',
    });

    // 3 Art „Spiel“, Heim, Gegner
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('#f-kind-chips button').filter({ hasText: /^Spiel$/ }).first().click();
    await page.fill('#f-opponent', 'TuS Probedorf');
    await page.dispatchEvent('#f-opponent', 'input');
    await page.waitForTimeout(400);
    await shot('03-spiel', 'Spiel, Heim, Gegner TuS Probedorf', {
      kindChip: '#f-kind-chips button:has-text("Spiel")',
      homeAway: '#f-ha',
      opponent: '#f-opponent',
      homeHelp: '#f-match-help',
      team: '#f-team-chips',
    });

    // 4 Anstoß in der Trainingszeit → Platz frei, Training wird beim Speichern abgesagt
    await page.locator('#f-kickoff').fill('16:15');
    await page.locator('#f-kickoff').dispatchEvent('change');
    await page.waitForFunction(() => /frei/.test(document.getElementById('f-kick-info').innerText));
    await page.waitForTimeout(600);
    await scrollToEl(page, '.nf-card', 70);
    check('kickInfo', await page.locator('#f-kick-info').innerText());
    await shot('04-kickoff', 'Anstoß 16:15 – Platz frei, Training wird beim Speichern abgesagt', {
      card: '.nf-card',
      date: '.nf-date',
      kickoff: '#f-kickoff',
      kickInfo: '#f-kick-info',
      trainingNote: 'text=/Absage beim Speichern/',
      save: 'button:has-text("Termin speichern")',
    });

    // 5 Termin prüfen: Training an dem Tag absagen (vorausgewählt)
    await page.click('button:has-text("Termin speichern")');
    await page.locator('button:has-text("Jetzt speichern")').waitFor();
    await page.waitForTimeout(500);
    await shot('05-review', 'Termin prüfen: Training G1 an dem Tag absagen', {
      sheet: 'text=Termin prüfen >> xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]',
      rowWann: 'text=/Anstoß 16:15/',
      training: 'text=/an dem Tag absagen/ >> xpath=ancestor::label[1]',
      confirm: 'button:has-text("Jetzt speichern")',
    });

    // 6 Gespeichert → Text für den Jugendleiter
    await page.click('button:has-text("Jetzt speichern")');
    await page.waitForSelector('#yl-modal.show');
    await page.waitForTimeout(500);
    text('jugendleiter', await page.evaluate(() => ylText));
    await shot('06-youthleader', 'Gespeichert – Text für den Jugendleiter', {
      box: '#yl-modal .modal-box',
      title: '#yl-title',
      sub: '#yl-sub',
      textBox: '#yl-text',
      waBtn: '#yl-modal button:has-text("Per WhatsApp senden")',
      copyBtn: '#yl-modal button:has-text("Kopieren")',
    });
    await waitSaved();

    // 7 Kalender: Spiel vorgemerkt, Training abgesagt
    await page.click('#yl-modal button:has-text("Schließen")');
    await page.waitForFunction(() => !document.querySelector('.modal.show'));
    if ((await page.evaluate(() => document.querySelector('.pane.active')?.dataset.pane)) !== 'termine') await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');
    await pickDay('16');
    const game = '.event-card:has-text("TuS Probedorf")';
    await page.locator(game).first().waitFor();
    await scrollToEl(page, game, 290);
    await shot('07-calendar', 'Fr 16.10.: Spiel vorgemerkt (Hälfte A, Anstoß 16:15)', {
      dayHead: 'text=/entfällt\\/verlegt/',
      game,
      status: `${game} >> text=/noch nicht bei fussball.de/`,
      ylBtn: `${game} >> text=/Nachricht an den Jugendleiter/`,
    });
    // Abgesagtes Training der G1 markieren (nur Kennzeichnung für die Aufnahme, keine sichtbare Änderung)
    const found = await page.evaluate(() => {
      const els = [...document.querySelectorAll('.pane.active [id^="ev-"]')].filter((el) => /G1/.test(el.innerText) && /(Abgesagt|Fällt aus)/.test(el.innerText));
      if (els.length) els[0].setAttribute('data-vid', 'g1-cancelled');
      return els.map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 120));
    });
    check('cancelledRow', found);
    await scrollToEl(page, '[data-vid="g1-cancelled"]', 330);
    await shot('08-cancelled', 'Training G1 am 16.10. abgesagt', {
      cancelled: '[data-vid="g1-cancelled"]',
      pill: '[data-vid="g1-cancelled"] >> text=/Abgesagt/',
    });
  },
};
