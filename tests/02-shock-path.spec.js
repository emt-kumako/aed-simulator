const { test, expect } = require('@playwright/test');
const {
  openFresh, confirmPads, finishCprSoon, status, ana,
} = require('./helpers');

test.describe('Ticket #3 — 建議電擊完整輪', () => {
  test('鎖定建議電擊後可充電、電擊、進入 CPR，再分析仍建議電擊', async ({ page }) => {
    await openFresh(page);
    await page.locator('#bLockShock').click();
    await page.locator('#btnPwr').click();
    await confirmPads(page);

    await expect(ana(page)).toContainText('建議電擊', { timeout: 10_000 });
    await expect(page.locator('#shockWrap')).toHaveClass(/active/, { timeout: 12_000 });

    await page.locator('#shockWrap .btn-shock').click();
    await expect(status(page)).toContainText(/電擊完成|CPR/, { timeout: 5_000 });
    await expect(page.locator('#cprPanel')).toHaveClass(/show/);

    await finishCprSoon(page);
    await expect(ana(page)).toContainText('建議電擊', { timeout: 10_000 });

    const learnerBits = [
      await status(page).innerText(),
      await ana(page).innerText(),
      await page.locator('#rbadge').innerText(),
    ].join(' ');
    for (const bad of ['VT', 'VF', 'Asystole', 'PEA']) {
      expect(learnerBits).not.toContain(bad);
    }
  });

  test('充電完成前按電擊不得完成電擊流程', async ({ page }) => {
    await openFresh(page);
    await page.locator('#bLockShock').click();
    await page.locator('#btnPwr').click();
    await confirmPads(page);
    await expect(ana(page)).toContainText('建議電擊', { timeout: 10_000 });
    // Charge arming is delayed; assert before shockWrap becomes active
    await expect(page.locator('#shockWrap')).not.toHaveClass(/active/);
    await page.locator('#shockWrap .btn-shock').click();
    await expect(status(page)).toContainText('請等待充電完成');
    await expect(status(page)).not.toContainText('執行電擊');
  });
});
