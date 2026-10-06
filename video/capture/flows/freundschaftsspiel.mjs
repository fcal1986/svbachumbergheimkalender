// Reel 6 – Freundschaftsspiel: Heimspiel E2 (Mi 21.10., Anstoß 17:00) → Platzprüfung „✓ frei“ (eigenes Training zählt)
// → Training absagen? → Text für den Jugendleiter (DFBnet) → Kalender „Vorgemerkt“ → Auswärts belegt keinen Platz.
export default {
  id: 'freundschaftsspiel',
  login: 'trainer',
  async run(ctx) {
    const { page, shot, scrollToEl, check, waitSaved, pickDay } = ctx;

    // 1 Neuer Termin: Spiel, Heim, Gegner, Mittwoch 21.10., Anstoß 17:00
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await page.locator('#f-kind-chips button').filter({ hasText: /^Spiel$/ }).first().click();
    await page.fill('#f-opponent', 'TuS Probedorf');
    await page.dispatchEvent('#f-opponent', 'input');
    for (let i = 0; i < 8; i++) await page.click('button[aria-label="Einen Tag später"]');
    await page.locator('#f-kickoff').fill('17:00');
    await page.locator('#f-kickoff').dispatchEvent('change');
    await page.waitForFunction(() => /frei/.test(document.getElementById('f-kick-info').innerText));
    check('kickInfo', await page.locator('#f-kick-info').innerText());
    await shot('01-home', 'Freundschaftsspiel Heim gegen TuS Probedorf', {
      kindChip: '#f-kind-chips button:has-text("Spiel")',
      homeAway: '#f-ha',
      opponent: '#f-opponent',
      homeHelp: '#f-match-help',
    });
    await scrollToEl(page, '.nf-card', 70);
    await shot('02-kickoff', 'Anstoß 17:00 – Platz 16:45–18:00 frei (eigenes Training zählt als frei)', {
      card: '.nf-card',
      date: '.nf-date',
      kickoff: '#f-kickoff',
      kickInfo: '#f-kick-info',
    });

    // 2 Speichern → Training an dem Tag absagen?
    await page.click('button:has-text("Termin speichern")');
    await page.locator('button:has-text("Jetzt speichern")').waitFor();
    await page.click('button:has-text("Jetzt speichern")');
    await page.waitForSelector('#modal.show');
    await page.waitForTimeout(400);
    await shot('03-cancel', 'Rückfrage: Training der E2 an diesem Tag absagen?', {
      box: '#modal .modal-box',
      yes: '#modal button.yes',
    });

    // 3 Absagen → Text für den Jugendleiter (DFBnet-Ansetzung)
    await page.click('#modal button.yes');
    await page.waitForSelector('#yl-modal.show');
    await page.waitForTimeout(500);
    check('youthLeaderText', await page.locator('#yl-modal').innerText());
    await shot('04-youthleader', 'Text für den Jugendleiter: Freundschaftsspiel im DFBnet ansetzen', {
      box: '#yl-modal .modal-box',
      title: '#yl-title',
      textBox: '#yl-modal pre, #yl-modal .yl-text, #yl-modal textarea, #yl-modal [id*="text"]',
      waBtn: '#yl-modal button:has-text("Per WhatsApp senden")',
    });

    // 4 Kalender Mi 21.10.: Spiel „Vorgemerkt“, Training abgesagt
    await page.locator('#yl-modal button:has-text("Schließen")').click();
    await page.waitForFunction(() => !document.querySelector('.modal.show'));
    await waitSaved();
    await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');
    await pickDay('21');
    const card = '.event-card:has-text("TuS Probedorf")';
    await page.locator(card).first().waitFor();
    await scrollToEl(page, card, 250);
    await shot('05-planned', 'Mi 21.10.: Freundschaftsspiel „Vorgemerkt · noch nicht bei fussball.de“', {
      weekStrip: '.cw-strip',
      card,
    });

    // 5 Auswärts: belegt keinen Platz bei uns
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await page.locator('#f-kind-chips button').filter({ hasText: /^Spiel$/ }).first().click();
    await page.click('#f-ha button[data-ha="away"]');
    await page.fill('#f-opponent', 'SC Beispielhausen');
    await page.dispatchEvent('#f-opponent', 'input');
    await page.waitForTimeout(500);
    await shot('06-away', 'Auswärts: belegt keinen Platz bei uns, Ansetzung macht der Gastgeber', {
      homeAway: '#f-ha',
      opponent: '#f-opponent',
      address: '#f-address',
      awayHelp: '#f-match-help',
    });
  },
};
