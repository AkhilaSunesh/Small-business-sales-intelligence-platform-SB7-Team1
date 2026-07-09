// Mock data for dashboard demo
export const summaryStats = {
  totalRevenue: '$124,560',
  totalOrders: '4,812',
  avgOrderValue: '$25.85',
  activeProducts: '132',
};

// last 30 days mock revenue data
export const salesOver30Days = Array.from({ length: 30 }).map((_, i) => {
  const day = new Date();
  day.setDate(day.getDate() - (29 - i));
  const date = day.toISOString().slice(5, 10); // MM-DD
  return { date, revenue: Math.round(200 + Math.random() * 1200) };
});

// top products by revenue
export const topProducts = [
  { product: 'Widget A', revenue: 45234 },
  { product: 'Widget B', revenue: 32100 },
  { product: 'Widget C', revenue: 21500 },
  { product: 'Widget D', revenue: 17450 },
  { product: 'Widget E', revenue: 14300 },
];
