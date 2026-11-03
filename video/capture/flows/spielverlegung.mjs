// Reel 2 – Spielverlegung: Heimspiel E2 (Sa 17.10.) → Neue Ansetzung suchen → freier Termin in der eigenen
// Trainingszeit (Fr 16.10.) → Anfrage an den Gegner (WhatsApp-Text der App) → als Verlegung vormerken
// → fertiger DFBnet-Text für den Jugendleiter → Kalender zeigt „Vorgemerkt“.
export default {
  id: 'spielverlegung',
  login: 'trainer',
  async run(ctx) {
    const { page, shot, scrollToEl, lastOpenedText, text, check } = ctx;
    const modal = '#reschedule-modal .modal-box';

    // 1 Kalender: Woche, Samstag 17.10. mit dem Heimspiel der E2
    await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');
    await page.locator('.cw-day').nth(5).click();
    const game = page.locator('.event-card.external-card', { hasText: 'SC Beispielhausen' }).first();
    await game.waitFor();
    await scrollToEl(page, '.event-card.external-card:has-text("SC Beispielhausen")', 250);
    await shot('01-game', 'Kalender Sa 17.10.: Heimspiel E2 gegen SC Beispielhausen', {
      weekStrip: '.cw-strip',
      gameCard: '.event-card.external-card:has-text("SC Beispielhausen")',
      searchBtn: '.event-card.external-card:has-text("SC Beispielhausen") button[title="Neue Ansetzung suchen"]',
    });

    // 2 Neue Ansetzung suchen: Spieltag + Trainingstage sind vorausgewählt
    await game.locator('button[title="Neue Ansetzung suchen"]').click();
    await page.waitForSelector('#reschedule-modal.show #rs-days');
    await page.waitForTimeout(400);
    await shot('02-search', 'Ansetzungssuche: Spieltag und Trainingstage vorausgewählt, Zeitfenster je Tag', {
      box: modal,
      gameInfo: '#rs-text',
      days: '#rs-days',
      preselect: '#rs-preselect',
      times: '#rs-times',
      searchBtn: '#reschedule-modal button.yes',
    });

    // 3 Ergebnisse
    await page.click('#reschedule-modal button.yes');
    await page.waitForSelector('.rs-result-row');
    await page.locator('#rs-results').evaluate((el) => { const box = el.closest('.modal-box'); box.scrollTop = el.offsetTop - 70; });
    await page.waitForTimeout(300);
    check('resultHeadline', await page.locator('#rs-results .field-label').first().innerText());
    await shot('03-results', 'Freie Termine: in eurer Trainingszeit, Hälfte B', {
      box: modal,
      headline: '#rs-results .field-label',
      rowFr: '.rs-result-row >> nth=1',
      ownHint: '.rs-result-row >> nth=1 >> .rs-own',
      rowMi: '.rs-result-row >> nth=0',
    });

    // 4 Freitag auswählen → Anfrage an den Gegner per WhatsApp (Text der App wird abgefangen)
    await page.locator('.rs-result-row').nth(1).click();
    await page.waitForSelector('button:has-text("per WhatsApp teilen")');
    await page.locator('button:has-text("Als Verlegung vormerken")').evaluate((el) => { const box = el.closest('.modal-box'); box.scrollTop += el.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom + 24; });
    await page.waitForTimeout(300);
    await shot('04-selected', 'Freitag gewählt: Vorschlag per WhatsApp teilen oder als Verlegung vormerken', {
      box: modal,
      rowFr: '.rs-result-row >> nth=1',
      waBtn: 'button:has-text("per WhatsApp teilen")',
      markBtn: 'button:has-text("Als Verlegung vormerken")',
    });
    await page.click('button:has-text("per WhatsApp teilen")');
    text('anfrageGegner', await lastOpenedText(page));

    // 5 Gegner hat zugesagt → vormerken (Anstoß 16:15, Grund „Ferien“)
    await page.click('button:has-text("Als Verlegung vormerken")');
    await page.waitForSelector('#move-modal.show #mv-date');
    await page.locator('#mv-time').fill('16:15');
    await page.locator('#mv-time').dispatchEvent('change');
    await page.locator('#mv-reasons >> text=Ferien').click();
    await page.waitForTimeout(400);
    await shot('05-move', 'Verlegung vormerken: neues Datum, Anstoß, Grund für den DFBnet-Antrag', {
      box: '#move-modal .modal-box',
      dateTime: '#mv-date >> xpath=ancestor::div[contains(@style,"display:flex")][1]',
      reason: '#mv-reason',
      reasons: '#mv-reasons',
      training: '#mv-training',
      yes: '#mv-yes',
    });

    // 6 Vormerken → fertiger Text für den Jugendleiter (DFBnet-Verlegungsantrag)
    await page.click('#mv-yes');
    await page.waitForSelector('#yl-modal.show');
    await page.waitForTimeout(500);
    check('youthLeaderText', await page.locator('#yl-modal').innerText());
    await shot('06-youthleader', 'Vorgemerkt – fertiger Text für den DFBnet-Verlegungsantrag', {
      box: '#yl-modal .modal-box',
      title: '#yl-title',
      textBox: '#yl-modal pre, #yl-modal .yl-text, #yl-modal textarea, #yl-modal [id*="text"]',
      waBtn: '#yl-modal button:has-text("Per WhatsApp senden")',
    });

    // 7 Kalender: Freitag zeigt das Spiel „Vorgemerkt“, am Samstag „verlegt auf …“
    await page.click('#yl-modal button:has-text("Schließen")');
    await page.waitForFunction(() => !document.querySelector('.modal.show'));
    await page.locator('.cw-day').nth(4).click();
    const moved = page.locator('.event-card', { hasText: 'SC Beispielhausen' }).first();
    await moved.waitFor();
    await scrollToEl(page, '.event-card:has-text("SC Beispielhausen")', 250);
    await shot('07-planned', 'Fr 16.10.: Spiel als „Vorgemerkt“ im Kalender', {
      weekStrip: '.cw-strip',
      card: '.event-card:has-text("SC Beispielhausen")',
    });
    await page.locator('.cw-day').nth(5).click();
    await page.locator('.ia-row:has-text("Verlegt auf")').first().waitFor();
    await scrollToEl(page, '.ia-row:has-text("Verlegt auf")', 330);
    await shot('08-ghost', 'Sa 17.10.: alter Termin „Verlegt auf Fr 16.10.“ (fussball.de noch offen)', {
      weekStrip: '.cw-strip',
      ghost: '.ia-row:has-text("Verlegt auf")',
    });
  },
};
