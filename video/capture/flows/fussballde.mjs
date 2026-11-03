// Reel 3 – fussball.de-Abgleich (Vorstand): Hinweis „Zu erledigen“ → Mannschaften abgleichen (D2 übernehmen)
// → Spiele stehen automatisch im Kalender → Heimspiel belegt den Platz → Verlegung von fussball.de erkannt.
export default {
  id: 'fussballde',
  login: 'vorstand',
  async run(ctx) {
    const { page, shot, scrollToEl } = ctx;

    // 1 Startseite: Zu erledigen – Abweichungen zwischen Platzcoach und fussball.de
    await page.waitForSelector('text=Abweichungen zwischen Platzcoach');
    await shot('01-todo', 'Startseite Vorstand: „Mannschaften: 2 Abweichungen … Prüfen“', {
      todo: 'text=Abweichungen zwischen Platzcoach >> xpath=ancestor::*[self::div or self::button][1]',
      check: 'text=Prüfen ›',
    });

    // 2 Mannschaften abgleichen
    await page.click('text=Prüfen ›');
    await page.waitForSelector('#team-sync-card .ts-row');
    await page.waitForTimeout(1500); // Seitenwechsel + sanftes Scrollen der App abwarten
    await scrollToEl(page, '#team-sync-card', 76);
    await shot('02-sync', 'Mannschaften abgleichen: D2 neu bei fussball.de, 2. Herren ohne Spiele', {
      card: '#team-sync-card',
      intro: '#team-sync-card .sub',
      rowNew: '#team-sync-card .ts-row >> nth=0',
      pillNew: '#team-sync-card .ts-pill.add',
      adopt: '#team-sync-card .ts-row >> nth=0 >> button:has-text("Übernehmen")',
      rowGone: '#team-sync-card .ts-row >> nth=1',
    });

    // 3 Übernehmen
    await page.locator('#team-sync-card .ts-row').first().locator('button:has-text("Übernehmen")').click();
    await page.waitForFunction(() => !/D-Junioren 2/.test(document.getElementById('team-sync-card').innerText));
    await page.waitForTimeout(400);
    await scrollToEl(page, '#team-sync-card', 76);
    await shot('03-adopted', 'D2 übernommen – nur noch die 2. Herren offen', {
      card: '#team-sync-card',
      rowGone: '#team-sync-card .ts-row >> nth=0',
      matched: 'text=/Mannschaften passen/',
    });

    // 4 Kalender Sa 17.10.: Spiele von fussball.de stehen von selbst drin (auch auswärts, ohne Platz zu belegen)
    await page.click('button.navbtn[data-nav="termine"]');
    await page.waitForSelector('.cw-day');
    await page.locator('.cw-day').nth(5).click();
    await page.locator('.event-card.external-card').first().waitFor();
    await scrollToEl(page, '.event-card.external-card', 238);
    await shot('04-games', 'Sa 17.10.: Spiele von fussball.de automatisch im Kalender', {
      weekStrip: '.cw-strip',
      away: '.event-card.external-card:has-text("Auswärtsspiel")',
      awayNote: 'text=belegt keinen eigenen Platz',
      home: '.event-card.external-card:has-text("SC Beispielhausen")',
      link: '.event-card.external-card:has-text("Auswärtsspiel") >> text=Zum Spiel',
    });

    // 5 Startseite, Tag Sa 17.10.: Heimspiel der E2 belegt automatisch eine Platzhälfte
    await page.click('button.navbtn[data-nav="start"]');
    await page.locator('.stw-day').nth(4).click();
    await page.waitForSelector('#stp-live .lp');
    await page.waitForTimeout(500);
    await scrollToEl(page, 'section.st-platz', 96);
    await shot('05-pitch', 'Platz am Sa 17.10.: E2-Heimspiel belegt Hälfte A automatisch', {
      livePitch: '#stp-live .lp',
      gameTile: '#stp-live .lp >> text=E2 · Spiel',
      timeline: 'section.st-platz .tl',
    });

    // 6 Kalender Sa 24.10.: fussball.de hat ein Spiel verlegt → „verlegt vom …“
    await page.click('button.navbtn[data-nav="termine"]');
    await page.locator('[onclick*="calStep(1)"]').first().click();
    await page.locator('.cw-day').nth(5).click();
    const moved = '.event-card.external-card:has-text("TSV Bergweiler")';
    await page.locator(moved).first().waitFor();
    await scrollToEl(page, moved, 250);
    await shot('06-moved', 'Sa 24.10.: von fussball.de verlegtes Spiel mit Hinweis „verlegt vom 31.10.“', {
      weekStrip: '.cw-strip',
      card: moved,
      badge: `${moved} >> text=/verlegt vom/`,
    });
  },
};
