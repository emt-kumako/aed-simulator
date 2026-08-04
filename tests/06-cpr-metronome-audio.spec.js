const { test, expect } = require('@playwright/test');
const { openFresh, confirmPads, ana } = require('./helpers');

/**
 * Feedback loop for "CPR starts but no metronome sound".
 * Asserts the session actually arms audio playback (buffer or oscillator fallback)
 * when the CPR panel appears — not merely that the panel is visible.
 */
test.describe('CPR metronome audio', () => {
  test('when CPR panel shows, beep path can produce audio', async ({ page }) => {
    await openFresh(page);

    await page.evaluate(() => {
      window.__beepCalls = 0;
      window.__audioPlayOk = 0;
      // Wrap after page scripts define beep — patch once CPR is about to start
      const install = () => {
        if (typeof beep !== 'function' || beep.__patched) return;
        const orig = beep;
        window.beep = function patchedBeep() {
          window.__beepCalls += 1;
          const before = window.__audioPlayOk;
          // Probe whether audio graph can start a source right now
          try {
            if (_audioCtx) {
              if (_audioCtx.state === 'suspended') {
                // resume is async; count attempt
              }
              if (_beepBuf) {
                const src = _audioCtx.createBufferSource();
                src.buffer = _beepBuf;
                src.connect(_audioCtx.destination);
                src.start(0);
                src.stop(0.01);
                window.__audioPlayOk += 1;
              } else {
                const osc = _audioCtx.createOscillator();
                const gain = _audioCtx.createGain();
                gain.gain.value = 0.0001;
                osc.connect(gain);
                gain.connect(_audioCtx.destination);
                osc.start();
                osc.stop(_audioCtx.currentTime + 0.01);
                window.__audioPlayOk += 1;
              }
            }
          } catch (e) {
            window.__beepError = String(e);
          }
          return orig.apply(this, arguments);
        };
        beep.__patched = true;
      };
      install();
      setInterval(install, 50);
    });

    await page.locator('#bLockNoShock').click();
    await page.locator('#btnPwr').click();
    await confirmPads(page);
    await expect(ana(page)).toContainText('不建議電擊', { timeout: 10_000 });
    await expect(page.locator('#cprPanel')).toHaveClass(/show/, { timeout: 8_000 });

    // Wait for metronome ticks
    await page.waitForFunction(() => window.__beepCalls >= 2, null, { timeout: 5_000 });

    const diag = await page.evaluate(() => ({
      beepCalls: window.__beepCalls,
      audioPlayOk: window.__audioPlayOk,
      beepReady: typeof _beepReady !== 'undefined' ? _beepReady : null,
      hasBuf: typeof _beepBuf !== 'undefined' ? !!_beepBuf : null,
      hasHtmlAudio: typeof _beepAudio !== 'undefined' ? !!_beepAudio : null,
      ctxState: typeof _audioCtx !== 'undefined' && _audioCtx ? _audioCtx.state : null,
      beepError: window.__beepError || null,
    }));

    expect(diag.beepCalls, `diag=${JSON.stringify(diag)}`).toBeGreaterThanOrEqual(2);
    expect(diag.audioPlayOk, `diag=${JSON.stringify(diag)}`).toBeGreaterThanOrEqual(1);
    // iOS-safe path must be armed (HTMLAudio and/or running AudioContext)
    expect(
      diag.hasHtmlAudio || diag.ctxState === 'running',
      `diag=${JSON.stringify(diag)}`
    ).toBeTruthy();
  });
});
