const { test, expect } = require('@playwright/test');
const { openFresh, confirmPads, status } = require('./helpers');

test.describe('Ticket #4 — 錯序可按、即時糾正', () => {
  test('未開機按電擊會纠正且不進入電擊流程', async ({ page }) => {
    await openFresh(page);
    await page.locator('#shockWrap .btn-shock').click();
    await expect(status(page)).toContainText('請先按下電源鍵開機');
    await expect(status(page)).not.toContainText('執行電擊');
  });

  test('未開機按插頭會纠正', async ({ page }) => {
    await openFresh(page);
    await page.locator('#btnPlug').click();
    await expect(status(page)).toContainText('請先按下電源鍵開機');
  });

  test('開機後未貼片完成前按電擊會纠正', async ({ page }) => {
    await openFresh(page);
    await page.locator('#bLockShock').click();
    await page.locator('#btnPwr').click();
    // Close pad overlay without using confirmPads path? confirmPads marks ready.
    // Instead click shock while overlay still open / before confirm.
    await page.waitForSelector('#padOverlay.show', { timeout: 5000 });
    await page.locator('#shockWrap .btn-shock').click({ force: true });
    await expect(status(page)).toContainText(/貼片|電源|連接/);
    await expect(status(page)).not.toContainText('執行電擊');
  });

  test('分析中按電擊會纠正', async ({ page }) => {
    await openFresh(page);
    await page.locator('#bLockNoShock').click();
    await page.locator('#btnPwr').click();
    await confirmPads(page);
    await expect(page.locator('#anaStat')).toContainText('自動分析中', { timeout: 5_000 });
    await page.locator('#shockWrap .btn-shock').click({ force: true });
    await expect(status(page)).toContainText('正在分析心律，請勿觸碰患者');
    await expect(status(page)).not.toContainText('執行電擊');
  });
});
