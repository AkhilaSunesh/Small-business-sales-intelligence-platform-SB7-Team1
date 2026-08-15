const { sanitizeDailyRevenueSeries } = require('../controllers/dashboard.controller');

describe('dashboard daily sales sanitization', () => {
  test('caps extreme daily revenue spikes using IQR bounds', () => {
    const series = [120, 110, 130, 125, 118, 122, 1350];
    const cleaned = sanitizeDailyRevenueSeries(series);

    expect(cleaned[cleaned.length - 1]).toBeLessThan(1350);
    expect(cleaned[cleaned.length - 1]).toBeGreaterThan(130);
    expect(cleaned).toHaveLength(series.length);
  });

  test('leaves normal values unchanged', () => {
    const series = [110, 115, 120, 118, 122, 130, 129];
    const cleaned = sanitizeDailyRevenueSeries(series);

    expect(cleaned).toEqual(series);
  });
});
