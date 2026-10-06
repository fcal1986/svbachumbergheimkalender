// Reel 1 – Platzbelegung: Startseite → Training anlegen → Überschneidung → „Hälfte B buchen“ → Prüfen → Speichern.
export default {
  id: 'platzbelegung',
  login: 'trainer',
  async run(ctx) {
    const { page, shot, scrollToEl, scrollTimeline } = ctx;
    // 1 Startseite: Platzbelegung heute
    await page.waitForSelector('#stp-live .lp-status');
    await scrollToEl(page, 'section.st-platz', 96);
    await shot('01-start', 'Startseite: Platzbelegung heute, live', {
      platzSection: 'section.st-platz',
      livePitch: '#stp-live .lp',
      statusPill: '#stp-live .lp-status',
      weekStrip: 'section.st-platz .stw-strip',
      navNeu: 'button.navbtn[data-nav="neu"]',
    });

    // 2 Neuer Termin
    await page.click('button.navbtn[data-nav="neu"]');
    await page.waitForSelector('#f-kind-chips button');
    await shot('02-form', 'Neuer Termin: Terminart wählen', {
      chipTraining: '#f-kind-chips button:has-text("Training")',
      teamChips: '#f-team-chips',
      dateBox: '.nf-date',
    });

    // 3 Training, 17:00, 90 Minuten → Konflikt (D1 trainiert auf Hälfte A)
    await page.click('#f-kind-chips button:has-text("Training")');
    await page.click('#f-durs button:has-text("90")');
    await page.locator('#f-von').fill('17:00');
    await page.locator('#f-von').dispatchEvent('change');
    await page.waitForFunction(() => /belegt/.test(document.getElementById('f-tl-status').innerText));
    await scrollToEl(page, '.nf-card', 70);
    await scrollTimeline(page, 15 * 60 + 45);
    await shot('03-conflict', 'Training E2, Di 17:00–18:30, ganzer Platz: Überschneidung mit D1 erkannt', {
      timeCard: '.nf-card',
      von: '#f-von',
      dur90: '#f-durs button:has-text("90")',
      timeline: '#f-tl',
      status: '#f-tl-status',
      pickA: '#f-tl button[aria-label="Hälfte A"]',
      pickB: '#f-tl button[aria-label="Hälfte B"]',
      suggestion: 'button:has-text("Hälfte B buchen")',
      suggestionBox: '#fb-share-note',
      save: 'button:has-text("Termin speichern")',
    });

    // 4 Vorschlag der App „Hälfte B buchen“ antippen → „Passt“
    await page.click('button:has-text("Hälfte B buchen")');
    await page.waitForFunction(() => /Passt/.test(document.getElementById('f-tl-status').innerText));
    await scrollToEl(page, '.nf-card', 70);
    await scrollTimeline(page, 15 * 60 + 45);
    await shot('04-ok', 'Vorschlag übernommen: Hälfte B frei, Speichern möglich', {
      timeline: '#f-tl',
      status: '#f-tl-status',
      pickA: '#f-tl button[aria-label="Hälfte A"]',
      pickB: '#f-tl button[aria-label="Hälfte B"]',
      save: 'button:has-text("Termin speichern")',
    });
    ctx.check('statusAfterFix', await page.locator('#f-tl-status').innerText());

    // 5 Speichern → Prüfansicht der App
    await page.click('button:has-text("Termin speichern")');
    const sheet = page.locator('text=Termin prüfen').locator('xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]');
    await sheet.waitFor();
    await page.waitForTimeout(500); // Einblend-Animation
    await shot('05-review', 'Prüfansicht vor dem Speichern: Hälfte B, Platz frei', {
      sheet: 'text=Termin prüfen >> xpath=ancestor::*[.//button[contains(.,"Jetzt speichern")]][1]',
      rowWo: 'text=Hälfte B >> nth=-1',
      rowPlatz: 'text=/✓ ?frei/ >> nth=-1',
      confirm: 'button:has-text("Jetzt speichern")',
    });

    // 6 Jetzt speichern (geht an den lokalen Mock) → Termin erscheint im Kalender
    await page.click('button:has-text("Jetzt speichern")');
    await page.waitForFunction(() => document.querySelector('.pane.active')?.dataset.pane !== 'neu', null, { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector('#saving-pill.show'), null, { timeout: 15000 });
    await page.waitForTimeout(800);
    await scrollToEl(page, '#st-week', 0);
    await page.locator('#st-week').first().evaluate((el) => { let sc = el.parentElement; while (sc && sc.scrollTop === 0 && sc !== document.body) sc = sc.parentElement; if (sc) sc.scrollTop = 0; });
    await shot('06-saved', 'Nach dem Speichern: „Als Nächstes“ zeigt das neue Training, Platzbelegung aktualisiert', {
      nextCard: 'text=E2 · Training >> xpath=ancestor::*[.//*[contains(text(),"Als Nächstes")]][1]',
      nextTitle: 'text=E2 · Training',
      livePitch: '#stp-live .lp',
    });
    await scrollToEl(page, 'section.st-platz .tl', 230);
    await shot('07-timeline', 'Zeitleiste heute: E2 auf Hälfte B neben D1 auf Hälfte A', {
      timeline: 'section.st-platz .tl',
      blockE2: 'section.st-platz .tl >> text=E2 >> xpath=ancestor::*[self::button or self::div][contains(@style,"left")][1]',
      blockD1: 'section.st-platz .tl >> text=D1 >> xpath=ancestor::*[self::button or self::div][contains(@style,"left")][1]',
    });
  },
};
