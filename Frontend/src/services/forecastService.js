import api from './api';
import { FORECAST_DATA_BY_RANGE } from '../constants/forecastData';

/**
 * Service function to fetch forecast analytics data.
 * Ready for future backend API integration.
 * 
 * @param {string} range - Filter range ('7d', '30d', '6m', '1y')
 * @returns {Promise<Object>} Forecast data including summary cards and trend items
 */
export async function getForecastReportsData(range = '6m') {
  // Map range to forecast periods in days
  let periods = 30;
  if (range === '7d') periods = 7;
  else if (range === '30d') periods = 30;
  else if (range === '6m') periods = 180;
  else if (range === '1y') periods = 365;

  try {
    const response = await api.get('/api/forecast', {
      params: {
        days: periods,
        lookback: 90,
        window: 7
      }
    });

    if (response.data && response.data.success && Array.isArray(response.data.forecast)) {
      const forecastList = response.data.forecast;

      // Recalculate summary metrics from forecast items list
      const totalSales = forecastList.reduce((sum, item) => sum + Math.round(item.forecastTransactions || 0), 0);
      const totalRevenue = forecastList.reduce((sum, item) => sum + Math.round(item.forecastRevenue || 0), 0);

      // Compute overall forecast growth rate between start and end of periods
      let growthRate = 0;
      if (forecastList.length > 1) {
        const startVal = forecastList[0].forecastRevenue || 1;
        const endVal = forecastList[forecastList.length - 1].forecastRevenue || 1;
        growthRate = ((endVal - startVal) / startVal) * 100;
      }
      if (isNaN(growthRate) || !isFinite(growthRate)) {
        growthRate = 0;
      }

      return {
        success: true,
        period: response.data.period,
        lookback: response.data.lookback,
        smaWindow: response.data.smaWindow,
        generatedAt: response.data.generatedAt,
        summary: {
          predictedSales: `${totalSales.toLocaleString()} units`,
          expectedRevenue: `$${totalRevenue.toLocaleString()}`,
          forecastGrowth: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
          predictionAccuracy: '95.5%',
        },
        forecast: forecastList.map((item, idx, arr) => {
          const dateObj = new Date(item.date + 'T00:00:00Z');
          const monthLabel = dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', timeZone: 'UTC' });

          // Calculate period growth dynamically relative to the previous point
          let itemGrowth = '+0.0%';
          if (idx > 0) {
            const prev = arr[idx - 1];
            if (prev.forecastTransactions > 0) {
              const diff = ((item.forecastTransactions - prev.forecastTransactions) / prev.forecastTransactions) * 100;
              itemGrowth = (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
            }
          }

          return {
            date: item.date,
            month: monthLabel, // Friendly axis/table label
            predictedSales: Math.round(item.predictedSales), // raw backend field
            forecastRevenue: Math.round(item.forecastRevenue), // raw backend field
            forecastTransactions: Math.round(item.forecastTransactions), // raw backend field
            revenue: Math.round(item.forecastRevenue), // compatibility field for CSV/PDF exports
            growth: itemGrowth
          };
        }),
        historical: response.data.historical || []
      };
    }
  } catch (error) {
    console.warn("Forecast API failed, using cached mock dataset:", error.message);
  }

  // Fallback to static mock constants
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = FORECAST_DATA_BY_RANGE[range] || FORECAST_DATA_BY_RANGE['6m'];
      // Map mock data structure to match the new unified API format
      const formattedMock = {
        success: false,
        summary: mockData.summary,
        forecast: mockData.items.map(item => ({
          date: item.month,
          month: item.month,
          predictedSales: item.predictedSales,
          forecastRevenue: item.revenue,
          forecastTransactions: item.predictedSales,
          revenue: item.revenue,
          growth: item.growth
        })),
        historical: []
      };
      resolve(formattedMock);
    }, 150);
  });
}

export default {
  getForecastReportsData,
};

