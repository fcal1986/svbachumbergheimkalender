// Kurzvideo: freie Fläche direkt im Spielfeldbild antippen = buchen (ab 03.11.2026 · 1/2, Backlog 113).
// Start → Bild „Jetzt auf dem Platz“ → „+ frei“ antippen → „Neuer Termin“ mit Tag, Fläche und Zeit → Prüfen → Speichern
// → Bild zeigt die neue Belegung. Tipp: auch Kleinspielfeld (und Hallendrittel) antippen.
export default {
  id: 'spielfeld-buchen',
  login: 'trainer',
  async run(ctx) {
    const { page, shot, scrollToEl, check, waitSaved } = ctx;
    await page.click('button.navbtn[data-nav="start"]');
    await page.waitForSelector('.lp-freeq.book');
    await scrollToEl(page, '.lp', 150);
    await shot('01-start', 'Start: Jetzt auf dem Platz – freie Viertel mit „+ frei“', {
      pitch: '.lp >> nth=0',
      field: '.lp-field >> nth=0',
      free1: '.lp-freeq.book >> nth=0',
      free2: '.lp-freeq.book >> nth=1',
      klein: '.lp-klein >> nth=0',
    });
    check('freeTiles', await page.locator('.lp-freeq.book').allInnerTexts());

    await page.locator('.lp-freeq.book').first().click();
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane === 'neu');
    await page.waitForTimeout(900);
    check('form', await page.evaluate(() => ({ von: document.getElementById('f-von').value, bis: document.getElementById('f-bis').value, team: document.getElementById('f-team').value })));
    await scrollToEl(page, '.nf-card', 70);
    await shot('02-form', 'Neuer Termin: Tag, Zeit 16:15–17:00 und Hälfte A übernommen', {
      card: '.nf-card',
      date: '.nf-date',
      von: '#f-von',
      bis: '#f-bis',
      passt: 'text=/Hälfte A ✓ ?Passt/',
      save: 'button:has-text("Termin speichern")',
    });

    await page.click('button:has-text("Termin speichern")');
    await page.locator('button:has-text("Jetzt speichern")').waitFor();
    await page.waitForTimeout(500);
    await shot('03-review', 'Termin prüfen: Training E2, Hälfte A frei', {
      sheet: 'text=Termin prüfen >> xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]',
      confirm: 'button:has-text("Jetzt speichern")',
    });
    await page.click('button:has-text("Jetzt speichern")');
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane === 'start');
    await waitSaved();
    await page.waitForTimeout(2800); // Hinweis „Gespeichert“ ausblenden lassen
    await scrollToEl(page, '.lp', 150);
    check('afterSave', await page.locator('.lp-field').first().innerText());
    await shot('04-booked', 'Bild zeigt jetzt E2 auf Hälfte A', {
      pitch: '.lp >> nth=0',
      field: '.lp-field >> nth=0',
      mine: '.lp-occ.mine >> nth=0',
    });

    // Tipp: auch das Kleinspielfeld antippen
    await page.locator('.lp-klein.book').first().click();
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane === 'neu');
    await page.waitForTimeout(900);
    check('kleinForm', await page.evaluate(() => ({ von: document.getElementById('f-von').value, bis: document.getElementById('f-bis').value })));
    await scrollToEl(page, '.nf-card', 70);
    await shot('05-klein', 'Kleinspielfeld antippen: Formular mit Kleinspielfeld', {
      card: '.nf-card',
      klein: 'text=/Kleinspielfeld ✓ ?Passt/ >> nth=0',
      von: '#f-von',
      bis: '#f-bis',
    });
  },
};
