const { test, expect } = require('@playwright/test');
const { openFresh } = require('./helpers');

test.describe('Layout — ECG shorter, shock control larger', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shock button and label use enlarged sizes; ECG min-height is reduced', async ({ page }) => {
    await openFresh(page);

    const metrics = await page.evaluate(() => {
      const btn = document.querySelector('.btn-shock');
      const label = document.querySelector('.shock-label-txt');
      const canvas = document.querySelector('canvas#ecg');
      const btnCs = getComputedStyle(btn);
      const labelCs = getComputedStyle(label);
      const canvasCs = getComputedStyle(canvas);
      return {
        btnW: parseFloat(btnCs.width),
        btnH: parseFloat(btnCs.height),
        labelSize: parseFloat(labelCs.fontSize),
        canvasMinH: canvasCs.minHeight,
      };
    });

    // 390px wide: old clamp floor 84 → new 97; label floor 11 → 13
    expect(metrics.btnW).toBeGreaterThanOrEqual(96);
    expect(metrics.btnH).toBeGreaterThanOrEqual(96);
    expect(metrics.labelSize).toBeGreaterThanOrEqual(12.5);
    expect(metrics.canvasMinH).toBe('42.5px');
  });
});
