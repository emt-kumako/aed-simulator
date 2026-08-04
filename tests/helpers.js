/** Learner-facing AED session helpers (UI seam only). */

async function stubSpeech(page) {
  await page.addInitScript(() => {
    const silent = {
      speak() {},
      cancel() {},
      pause() {},
      resume() {},
      getVoices() { return []; },
      speaking: false,
      pending: false,
      paused: false,
      onvoiceschanged: null,
      addEventListener() {},
      removeEventListener() {},
    };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => silent });
  });
}

async function openFresh(page) {
  await stubSpeech(page);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
}

async function confirmPads(page) {
  await page.waitForSelector('#padOverlay.show', { timeout: 5000 });
  await page.locator('#padOverlay').click();
}

/** Time accelerator only — not a behaviour assertion. */
async function finishCprSoon(page) {
  await page.evaluate(() => { cprSecondsLeft = 1; });
}

function status(page) {
  return page.locator('#statusTxt');
}

function ana(page) {
  return page.locator('#anaStat');
}

function outcomeMode(page) {
  return page.locator('#outcomeMode');
}

module.exports = {
  openFresh,
  confirmPads,
  finishCprSoon,
  status,
  ana,
  outcomeMode,
};
