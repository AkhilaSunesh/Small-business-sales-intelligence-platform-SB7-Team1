/**
 * mockDataGenerator.js
 * 
 * Generates consistent, realistic mock data for Dashboard and Forecast vs Actual
 * screens. Incorporates date range and category filtering, and ensures results are 
 * stable (non-flickering) by using deterministic generation functions.
 */

// Simple deterministic random generator based on a seed
function seedRandom(seedString) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

// Category profiles for volume/value variations
const CATEGORY_PROFILES = {
  all: { valMult: 1.0, volMult: 1.0, avgPrice: 35, items: ['Smart Watch', 'Organic Honey', 'Designer Jeans', 'Notebook Pack', 'Wireless Earbuds', 'Fresh Avocados', 'Leather Wallet', 'Gel Pen Set', 'USB-C Cable'] },
  Electronics: { valMult: 0.45, volMult: 0.15, avgPrice: 120, items: ['Smart Watch', 'Wireless Earbuds', 'USB-C Cable', 'Bluetooth Speaker', 'Power Bank'] },
  Grocery: { valMult: 0.20, volMult: 0.55, avgPrice: 12, items: ['Organic Honey', 'Fresh Avocados', 'Whole Wheat Bread', 'Organic Milk', 'Greek Yogurt'] },
  Fashion: { valMult: 0.22, volMult: 0.18, avgPrice: 55, items: ['Designer Jeans', 'Leather Wallet', 'Cotton T-Shirt', 'Running Shoes', 'Sunglasses'] },
  Stationery: { valMult: 0.08, volMult: 0.35, avgPrice: 8, items: ['Notebook Pack', 'Gel Pen Set', 'Desk Organizer', 'Sketchbook', 'Highlighters'] },
  Others: { valMult: 0.05, volMult: 0.12, avgPrice: 22, items: ['Coffee Mug', 'Scented Candle', 'Water Bottle', 'Phone Stand'] }
};

// Generate date range boundaries and points
export function parseDateRange(dateRange, startDate, endDate) {
  const now = new Date('2026-08-01T00:00:00Z');
  let start = new Date(now);
  let points = 30;
  let interval = 'day'; // 'hour' | 'day' | 'week' | 'month'

  switch (dateRange) {
    case 'today':
      start.setUTCHours(0, 0, 0, 0);
      points = 24;
      interval = 'hour';
      break;
    case '7d':
      start.setUTCDate(now.getUTCDate() - 6);
      points = 7;
      interval = 'day';
      break;
    case '3m':
      start.setUTCMonth(now.getUTCMonth() - 3);
      points = 12; // weekly blocks
      interval = 'week';
      break;
    case '6m':
      start.setUTCMonth(now.getUTCMonth() - 6);
      points = 6; // monthly blocks
      interval = 'month';
      break;
    case '1y':
      start.setUTCMonth(now.getUTCMonth() - 12);
      points = 12;
      interval = 'month';
      break;
    case 'custom':
      if (startDate && endDate) {
        const s = new Date(startDate + 'T00:00:00Z');
        const e = new Date(endDate + 'T23:59:59Z');
        const diffMs = e - s;
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        start = s;
        if (diffDays <= 2) {
          points = diffDays * 24;
          interval = 'hour';
        } else if (diffDays <= 45) {
          points = diffDays;
          interval = 'day';
        } else if (diffDays <= 180) {
          points = Math.ceil(diffDays / 7);
          interval = 'week';
        } else {
          points = Math.ceil(diffDays / 30);
          interval = 'month';
        }
      } else {
        // Fallback to 30d
        start.setUTCDate(now.getUTCDate() - 29);
        points = 30;
        interval = 'day';
      }
      break;
    case '30d':
    default:
      start.setUTCDate(now.getUTCDate() - 29);
      points = 30;
      interval = 'day';
      break;
  }

  return { start, points, interval };
}

// Format the date/label based on interval
function formatLabel(date, interval, stepIndex) {
  if (interval === 'hour') {
    const hr = date.getUTCHours();
    return `${hr.toString().padStart(2, '0')}:00`;
  }
  if (interval === 'day') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }
  if (interval === 'week') {
    return `Wk ${stepIndex + 1} (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })})`;
  }
  if (interval === 'month') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  return date.toISOString().slice(5, 10);
}

/**
 * Generates main dashboard metrics and chart values
 */
export function generateDashboardData({ dateRange, category, startDate, endDate }) {
  const { start, points, interval } = parseDateRange(dateRange, startDate, endDate);
  const profile = CATEGORY_PROFILES[category] || CATEGORY_PROFILES.all;

  // Base metrics for "All" / Last 30 Days
  const baseRevenue = 124560;
  const baseOrders = 4812;
  const baseActiveProducts = 132;

  // Scale based on range and category
  let rangeMultiplier = 1.0;
  if (dateRange === 'today') rangeMultiplier = 0.04;
  else if (dateRange === '7d') rangeMultiplier = 0.25;
  else if (dateRange === '3m') rangeMultiplier = 3.0;
  else if (dateRange === '6m') rangeMultiplier = 6.0;
  else if (dateRange === '1y') rangeMultiplier = 12.0;
  else if (dateRange === 'custom') {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const days = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
    rangeMultiplier = days / 30;
  }

  const finalValMult = profile.valMult * rangeMultiplier;
  const finalVolMult = profile.volMult * rangeMultiplier;

  // Calculate Summary metrics
  const totalRevVal = Math.round(baseRevenue * finalValMult);
  const totalOrdVal = Math.round(baseOrders * finalVolMult);
  const avgOrdVal = totalOrdVal > 0 ? (totalRevVal / totalOrdVal) : profile.avgPrice;
  const activeProdCount = category === 'all' ? baseActiveProducts : profile.items.length;

  const summary = {
    totalRevenue: `$${totalRevVal.toLocaleString()}`,
    totalOrders: totalOrdVal.toLocaleString(),
    avgOrderValue: `$${avgOrdVal.toFixed(2)}`,
    activeProducts: activeProdCount.toString(),
  };

  // Generate Daily/Weekly/Monthly Sales Trend Chart
  const trend = [];
  const rng = seedRandom(dateRange + category + (startDate || '') + (endDate || ''));

  let currentDate = new Date(start);
  for (let i = 0; i < points; i++) {
    const factor = 0.6 + rng() * 0.8; // random wave between 0.6 and 1.4
    const dailyBaseRev = (baseRevenue / 30) * profile.valMult;
    let stepRev = Math.round(dailyBaseRev * factor);

    if (interval === 'hour') {
      // hourly curves (lower at night, higher in afternoon)
      const hr = currentDate.getUTCHours();
      const timeFactor = hr >= 8 && hr <= 20 ? 1.4 : 0.2;
      stepRev = Math.round((dailyBaseRev / 24) * factor * timeFactor);
    } else if (interval === 'week') {
      stepRev = Math.round(dailyBaseRev * 7 * factor);
    } else if (interval === 'month') {
      stepRev = Math.round(dailyBaseRev * 30 * factor);
    }

    trend.push({
      date: formatLabel(currentDate, interval, i),
      revenue: stepRev,
      orders: Math.round(stepRev / avgOrdVal) || 1,
    });

    // Advance date
    if (interval === 'hour') currentDate.setUTCHours(currentDate.getUTCHours() + 1);
    else if (interval === 'day') currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    else if (interval === 'week') currentDate.setUTCDate(currentDate.getUTCDate() + 7);
    else if (interval === 'month') currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
  }

  // Generate Top Products Chart
  const topProducts = profile.items.map((prodName, idx) => {
    const rngProd = seedRandom(prodName + category + dateRange);
    const prodRev = Math.round((totalRevVal * (0.35 - idx * 0.05)) * (0.8 + rngProd() * 0.4));
    return {
      product: prodName,
      revenue: Math.max(100, prodRev),
      sales: Math.round(prodRev / (profile.avgPrice * (0.9 + rngProd() * 0.2))) || 1,
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return { summary, trend, topProducts, loading: false, error: null };
}

/**
 * Generates Forecast vs Actual data
 */
export function generateForecastVsActualData({ dateRange, category, startDate, endDate }) {
  const { start, points, interval } = parseDateRange(dateRange, startDate, endDate);
  const profile = CATEGORY_PROFILES[category] || CATEGORY_PROFILES.all;

  const rng = seedRandom('forecast' + dateRange + category + (startDate || '') + (endDate || ''));
  
  // Forecast vs Actual points
  const items = [];
  let totalForecastRev = 0;
  let totalActualRev = 0;
  let totalForecastVol = 0;
  let totalActualVol = 0;

  const avgPrice = profile.avgPrice;
  const baseRev = (100000 / 30) * profile.valMult; // reference base revenue per day

  let currentDate = new Date(start);
  for (let i = 0; i < points; i++) {
    // Generate actual and forecast waves
    const baseVal = baseRev * (interval === 'hour' ? 0.04 : interval === 'week' ? 7 : interval === 'month' ? 30 : 1.0);
    const trendFactor = 0.8 + (i / points) * 0.3; // moderate upward trend
    
    // Forecast is what AI expected
    const forecastFactor = (0.7 + rng() * 0.6) * trendFactor;
    const forecastRevenue = Math.round(baseVal * forecastFactor);
    const forecastSales = Math.round(forecastRevenue / avgPrice) || 1;

    // Actual revenue deviates from Forecast by a small margin (+-10%)
    const actualDeviation = 0.92 + rng() * 0.15; // 92% to 107%
    const actualRevenue = Math.round(forecastRevenue * actualDeviation);
    const actualSales = Math.round(actualRevenue / avgPrice) || 1;

    const diffRev = actualRevenue - forecastRevenue;
    const diffSales = actualSales - forecastSales;

    // Accuracy per point = 100 - absolute percentage difference
    const diffPct = Math.abs(diffRev) / (forecastRevenue || 1);
    const accuracy = Math.max(50, 100 - (diffPct * 100));

    items.push({
      date: formatLabel(currentDate, interval, i),
      rawDate: currentDate.toISOString().slice(0, 10),
      forecastRevenue,
      actualRevenue,
      forecastSales,
      actualSales,
      differenceRevenue: diffRev,
      differenceSales: diffSales,
      accuracyPct: accuracy,
    });

    totalForecastRev += forecastRevenue;
    totalActualRev += actualRevenue;
    totalForecastVol += forecastSales;
    totalActualVol += actualSales;

    // Advance date
    if (interval === 'hour') currentDate.setUTCHours(currentDate.getUTCHours() + 1);
    else if (interval === 'day') currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    else if (interval === 'week') currentDate.setUTCDate(currentDate.getUTCDate() + 7);
    else if (interval === 'month') currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
  }

  const accuracyPct = totalForecastRev > 0 ? Math.max(50, 100 - (Math.abs(totalActualRev - totalForecastRev) / totalForecastRev * 100)) : 95.5;
  const growthRate = points > 1 ? ((items[items.length - 1].actualRevenue - items[0].actualRevenue) / (items[0].actualRevenue || 1)) * 100 : 5.5;

  const summary = {
    totalForecastRevenue: `$${totalForecastRev.toLocaleString()}`,
    totalActualRevenue: `$${totalActualRev.toLocaleString()}`,
    forecastAccuracy: `${accuracyPct.toFixed(1)}%`,
    revenueDifference: `${totalActualRev >= totalForecastRev ? '+' : ''}$${(totalActualRev - totalForecastRev).toLocaleString()}`,
    salesDifference: `${totalActualVol >= totalForecastVol ? '+' : ''}${(totalActualVol - totalForecastVol).toLocaleString()} units`,
    growthPercent: `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
    rawRevenueDiff: totalActualRev - totalForecastRev,
    rawSalesDiff: totalActualVol - totalForecastVol,
  };

  return { summary, items };
}

/**
 * Generates transactional records for Drill-down displays
 */
export function generateDrillDownData({ type, id, filters }) {
  const { category, dateRange, startDate, endDate } = filters;
  const profile = CATEGORY_PROFILES[category === 'all' ? 'all' : category];
  const itemsList = profile.items;

  const rng = seedRandom(type + (id || '') + category + dateRange + (startDate || '') + (endDate || ''));
  const count = 15 + Math.round(rng() * 20); // 15 to 35 rows

  const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'Cancelled'];
  const paymentMethods = ['Credit Card', 'Debit Card', 'UPI', 'Cash', 'Net Banking'];

  const rows = [];
  const baseDate = new Date('2026-07-28');

  for (let i = 0; i < count; i++) {
    const txId = `TXN${10000 + Math.round(rng() * 89999)}`;
    const product = itemsList[Math.floor(rng() * itemsList.length)];
    
    // Find category for the product
    let itemCategory = category;
    if (itemCategory === 'all') {
      itemCategory = 'Others';
      for (const [catName, catProf] of Object.entries(CATEGORY_PROFILES)) {
        if (catName !== 'all' && catProf.items.includes(product)) {
          itemCategory = catName;
          break;
        }
      }
    }

    const itemPrice = CATEGORY_PROFILES[itemCategory]?.avgPrice || 25;
    const price = Math.round(itemPrice * (0.8 + rng() * 0.4));
    const quantity = 1 + Math.round(rng() * 4);
    const amount = price * quantity;
    const status = statuses[Math.floor(rng() * statuses.length)];
    const payment = paymentMethods[Math.floor(rng() * paymentMethods.length)];

    const dateOffset = Math.floor(rng() * 7);
    const txDate = new Date(baseDate);
    txDate.setDate(txDate.getDate() - dateOffset);
    const dateFormatted = txDate.toISOString().slice(0, 10);

    rows.push({
      id: txId,
      date: dateFormatted,
      product,
      category: itemCategory,
      quantity,
      amount: `$${amount.toLocaleString()}`,
      rawAmount: amount,
      status,
      paymentMethod: payment,
    });
  }

  // Filter or augment based on drill-down type
  if (type === 'product' && id) {
    // Show only transactions for the clicked product
    return rows.map(r => ({ ...r, product: id })).slice(0, 12);
  }
  
  if (type === 'date' && id) {
    // Show transactions matching that date
    return rows.map(r => ({ ...r, date: id }));
  }

  return rows;
}
