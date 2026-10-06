// Reel 4 – Freien Termin suchen (Vorstand): Schulfest anlegen → „Freien Termin suchen“ → Mai/Juni 2027, samstags,
// 5 Std ab 10 Uhr → Kalender grün/gelb/grau → Vorschlag übernehmen → „Passt“ → prüfen → speichern.
export default {
  id: 'freiertermin',
  login: 'vorstand',
  async run(ctx) {
    const { page, shot, scrollToEl, check } = ctx;
    const modal = '#slot-modal .modal-box';
    const chip = (box, t) => page.locator(`${box} .weekday-chip`).filter({ hasText: new RegExp('^' + t + '$') }).first();

    // 1 Neuer Termin: Sonstiges, „Schulfest“, für alle Teams
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await page.fill('#f-anlass', 'Schulfest');
    await page.dispatchEvent('#f-anlass', 'input');
    await page.locator('#f-team-chips button').filter({ hasText: /^Alle Teams$/ }).click();
    await page.waitForTimeout(400);
    await scrollToEl(page, '#f-kind-chips', 90);
    await shot('01-form', 'Neuer Termin „Schulfest“ für alle Teams', {
      kindChips: '#f-kind-chips',
      title: '#f-anlass',
      teamAll: '#f-team-chips button:has-text("Alle Teams")',
      finder: 'button:has-text("Freien Termin suchen")',
    });

    // 2 Freien Termin suchen: Mai + Juni 2027, samstags, 5 Std, ab 10 Uhr
    await page.click('button:has-text("Freien Termin suchen")');
    await page.waitForSelector('#slot-modal.show #sf-months');
    await chip('#sf-months', 'Mai 27').click();
    await chip('#sf-months', 'Jun 27').click();
    await chip('#sf-months', 'Okt').click();
    await chip('#sf-days', 'Sa').click();
    await chip('#sf-days', 'Di').click();
    await chip('#sf-durs', '5 Std').click();
    await page.locator('#sf-start').fill('10:00');
    await page.locator('#sf-start').dispatchEvent('change');
    await page.waitForTimeout(500);
    await shot('02-criteria', 'Suche: Ganzer Platz, Mai/Juni 2027, samstags, 5 Std ab 10 Uhr', {
      box: modal,
      what: '#sf-what',
      months: '#sf-months',
      days: '#sf-days',
      durs: '#sf-durs',
      start: '#sf-start',
    });

    // 3 Ergebnis: Kalender mit grün/gelb/grau und Vorschläge
    await page.locator('#sf-results').evaluate((el) => { const b = el.closest('.modal-box'); b.scrollTop = el.offsetTop - 60; });
    await page.waitForTimeout(300);
    check('result', await page.locator('#sf-results').innerText());
    const pick = '#sf-results >> text=Sa, 29.05.2027 >> xpath=ancestor::*[.//button[contains(.,"Übernehmen")]][1]';
    await shot('03-results', 'Ergebnis: freie Samstage grün, andere Uhrzeit gelb, belegt grau', {
      box: modal,
      summary: '#sf-results >> text=/Ergebnis/',
      grid: '#sf-results >> text=Mai 27 >> xpath=ancestor::*[.//*[contains(text(),"Jun 27")]][1]',
      legend: '#sf-results >> text=Wunschzeit frei',
      suggestions: '#sf-results >> text=Vorschläge',
      pick,
      pickBtn: `${pick} >> button:has-text("Übernehmen")`,
    });

    // 4 Übernehmen → Formular mit Datum/Zeit, Belegung „Passt“
    await page.locator(pick).locator('button:has-text("Übernehmen")').click();
    await page.waitForFunction(() => !document.querySelector('#slot-modal.show'));
    await page.waitForFunction(() => /Passt/.test(document.getElementById('f-tl-status').innerText));
    await scrollToEl(page, '.nf-card', 70);
    await shot('04-taken', 'Übernommen: Sa 29.05.2027, 10–15 Uhr, ganzer Platz – Passt', {
      timeCard: '.nf-card',
      timeline: '#f-tl',
      status: '#f-tl-status',
      save: 'button:has-text("Termin speichern")',
    });

    // 5 Prüfen und speichern
    await page.click('button:has-text("Termin speichern")');
    await page.locator('text=Termin prüfen').waitFor();
    await page.waitForTimeout(500);
    await shot('05-review', 'Termin prüfen: Schulfest, Sa 29.05.2027, ganzer Platz frei', {
      sheet: 'text=Termin prüfen >> xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]',
      rowPlatz: 'text=/✓ ?frei/ >> nth=-1',
      confirm: 'button:has-text("Jetzt speichern")',
    });
    await page.click('button:has-text("Jetzt speichern")');
    await ctx.waitSaved();
  },
};
