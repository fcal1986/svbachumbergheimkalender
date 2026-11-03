// Reel 5 – Torwarttraining: Torwarttrainer legt ein Training für E- und F-Jugend an (Mail an deren Trainer)
// → Mannschaftstrainer sieht „Zu erledigen“ → meldet seine Torhüter an → Termin zeigt „2 angemeldet“.
export default {
  id: 'torwarttraining',
  login: 'torwart',
  async run(ctx) {
    const { page, shot, scrollToEl, login, waitSaved } = ctx;

    // 1 Neuer Termin als Torwarttrainer: Terminart „Torwart“, Mannschaften E + F
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await page.locator('#f-kind-chips button').filter({ hasText: /^Torwart/ }).first().click();
    await page.fill('#f-anlass', 'Torwarttraining');
    await page.dispatchEvent('#f-anlass', 'input');
    await page.click('#f-gkteams [data-gkteam="E-Jugend"]');
    await page.click('#f-gkteams [data-gkteam="F-Jugend"]');
    await page.click('button[aria-label="Einen Tag später"]');
    await page.click('button[aria-label="Einen Tag später"]');
    await page.click('#f-durs button:has-text("60")');
    await page.locator('#f-von').fill('17:30');
    await page.locator('#f-von').dispatchEvent('change');
    await page.waitForFunction(() => /Passt/.test(document.getElementById('f-tl-status').innerText));
    await shot('01-form', 'Torwarttraining Do 15.10., 17:30–18:30, für E- und F-Jugend', {
      kindChip: '#f-kind-chips button:has-text("Torwart")',
      kindHelp: '#f-kind-help',
      gkTeams: '#f-gkteams',
      gkHelp: '#f-gkteams-field .helptext',
      dateBox: '.nf-date',
    });

    // 2 Prüfen: Mail an die Trainer der gewählten Mannschaften
    await page.click('button:has-text("Termin speichern")');
    await page.locator('text=Termin prüfen').waitFor();
    await page.waitForTimeout(500);
    await shot('02-review', 'Termin prüfen: Platz frei, Mail an die Trainer der E- und F-Jugend', {
      sheet: 'text=Termin prüfen >> xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]',
      rowWer: 'text=Torwarttraining für F, E-Jugend',
      rowMail: 'text=Max Mustermann, Lena Beispiel, Sara Muster',
      confirm: 'button:has-text("Jetzt speichern")',
    });
    await page.click('button:has-text("Jetzt speichern")');
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane !== 'neu', null, { timeout: 15000 });
    await waitSaved();

    // 3 Mannschaftstrainer (Max, E2) meldet sich an: „Zu erledigen“
    await login('trainer');
    await page.waitForSelector('text=noch kein Torhüter');
    await shot('03-todo', 'Startseite Trainer E2: Torwarttraining ohne Torhüter – Anmelden', {
      todo: 'text=noch kein Torhüter >> xpath=ancestor::*[self::div or self::button][1]',
      link: 'text=Anmelden ›',
    });

    // 4 Torhüter an-/abmelden
    await page.click('text=Anmelden ›');
    await page.locator('button:has-text("Torhüter an-/abmelden")').first().waitFor();
    await page.click('button:has-text("Torhüter an-/abmelden")');
    await page.waitForSelector('#gksheet-body input[data-kid]');
    await page.locator('#gksheet-body input[data-kid="demo-gk-1"]').check();
    await page.locator('#gksheet-body input[data-kid="demo-gk-2"]').check();
    await page.waitForTimeout(400);
    await shot('04-signup', 'Eigene Torhüter anhaken (andere Mannschaften gesperrt)', {
      sheet: '#gksheet-body',
      e2: '#gksheet-body >> text=E2-Jugend',
      ben: '#gksheet-body label:has(input[data-kid="demo-gk-1"])',
      paul: '#gksheet-body label:has(input[data-kid="demo-gk-2"])',
      save: '#gk-save',
    });

    // 5 Gespeichert: Termin zeigt die angemeldeten Torhüter
    await page.click('#gk-save');
    await waitSaved();
    const card = '.event-card:has-text("Torhüter")';
    await page.waitForFunction(() => /2 angemeldet/.test(document.querySelector('.pane.active').innerText));
    await scrollToEl(page, card, 260);
    await shot('05-done', 'Torwarttraining: 2 Torhüter der E2 angemeldet', {
      card,
      keepers: `${card} >> text=2 angemeldet >> xpath=ancestor::*[contains(@class,"gk") or self::div][2]`,
      count: `${card} >> text=2 angemeldet`,
    });
  },
};
