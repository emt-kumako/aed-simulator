const { test, expect } = require('@playwright/test');
const {
  openFresh, confirmPads, finishCprSoon, status, ana, outcomeMode,
} = require('./helpers');

async function runClassReadyFlow(page) {
  await openFresh(page);

  await expect(page.getByRole('button', { name: /重置／重抽/ })).toBeVisible();

  await page.locator('#bLockNoShock').click();
  await page.locator('#btnPwr').click();
  await confirmPads(page);
  await expect(ana(page)).toContainText('不建議電擊', { timeout: 10_000 });
  await finishCprSoon(page);
  await expect(ana(page)).toContainText('不建議電擊', { timeout: 10_000 });

  await page.getByRole('button', { name: /重置／重抽/ }).click();
  await expect(outcomeMode(page)).toContainText('鎖定');

  await page.locator('#bUnlockRandom').click();
  await page.locator('#bLockShock').click();
  await page.locator('#btnPwr').click();
  await confirmPads(page);
  await expect(page.locator('#shockWrap')).toHaveClass(/active/, { timeout: 12_000 });
  await page.locator('#shockWrap .btn-shock').click();
  await expect(status(page)).toContainText(/電擊完成|CPR/, { timeout: 5_000 });

  await page.getByRole('button', { name: /重置／重抽/ }).click();
  await page.locator('#bUnlockRandom').click();
  await page.locator('#shockWrap .btn-shock').click();
  await expect(status(page)).toContainText('請先按下電源鍵開機');
}

test.describe('Ticket #5 — 可上課驗收包（手機／平板 seam）', () => {
  test('直向手機可完成兩種結局、鎖定／隨機與重置語意', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await runClassReadyFlow(page);
  });

  test('直向平板可完成兩種結局、鎖定／隨機與重置語意', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await runClassReadyFlow(page);
  });
});
