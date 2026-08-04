const { test, expect } = require('@playwright/test');
const {
  openFresh, confirmPads, finishCprSoon, status, ana, outcomeMode,
} = require('./helpers');

test.describe('Ticket #2 — 隨機／鎖定 + 不可電擊完整輪', () => {
  test('教官鎖定不建議電擊後，貼片完成自動分析且學員面無臨床心律名', async ({ page }) => {
    await openFresh(page);
    await page.locator('#bLockNoShock').click();
    await expect(outcomeMode(page)).toContainText('鎖定');
    await expect(outcomeMode(page)).toContainText('不建議電擊');

    await page.locator('#btnPwr').click();
    await confirmPads(page);

    await expect(ana(page)).toContainText('不建議電擊', { timeout: 10_000 });
    await expect(status(page)).toContainText('不建議電擊');

    const learnerBits = [
      await status(page).innerText(),
      await ana(page).innerText(),
      await page.locator('#rbadge').innerText(),
    ].join(' ');
    for (const bad of ['VT', 'VF', 'Asystole', 'PEA']) {
      expect(learnerBits).not.toContain(bad);
    }
  });

  test('同輪再分析結局固定為不建議電擊', async ({ page }) => {
    await openFresh(page);
    await page.locator('#bLockNoShock').click();
    await page.locator('#btnPwr').click();
    await confirmPads(page);
    await expect(ana(page)).toContainText('不建議電擊', { timeout: 10_000 });

    await expect(page.locator('#cprPanel')).toHaveClass(/show/);
    await finishCprSoon(page);
    await expect(ana(page)).toContainText('不建議電擊', { timeout: 10_000 });
  });

  test('鎖定跨重置仍在；恢復隨機後模式回到隨機', async ({ page }) => {
    await openFresh(page);
    await page.locator('#bLockNoShock').click();
    await page.locator('#btnPwr').click();
    await confirmPads(page);
    await expect(ana(page)).toContainText('不建議電擊', { timeout: 10_000 });

    await page.getByRole('button', { name: /重置/ }).click();
    await expect(outcomeMode(page)).toContainText('鎖定');
    await expect(outcomeMode(page)).toContainText('不建議電擊');

    await page.locator('#bUnlockRandom').click();
    await expect(outcomeMode(page)).toContainText('隨機');
  });

  test('未鎖定開機後教官區顯示本輪隨機結局', async ({ page }) => {
    await openFresh(page);
    await page.locator('#btnPwr').click();
    await expect(outcomeMode(page)).toContainText('隨機');
    await expect(outcomeMode(page)).toHaveText(/建議電擊|不建議電擊/);
  });
});
