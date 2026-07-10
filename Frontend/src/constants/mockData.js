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

// Mock data for Reports page
export const reportsSalesData = [
  { id: 'INV001', product: 'Premium Widget', category: 'Electronics', quantity: 5, amount: '$1,250', date: '2025-07-09', status: 'Completed' },
  { id: 'INV002', product: 'Standard Gadget', category: 'Accessories', quantity: 12, amount: '$840', date: '2025-07-08', status: 'Completed' },
  { id: 'INV003', product: 'Deluxe Pro Tool', category: 'Tools', quantity: 3, amount: '$2,100', date: '2025-07-08', status: 'Pending' },
  { id: 'INV004', product: 'Basic Kit', category: 'Starter Pack', quantity: 8, amount: '$480', date: '2025-07-07', status: 'Completed' },
  { id: 'INV005', product: 'Premium Widget', category: 'Electronics', quantity: 6, amount: '$1,500', date: '2025-07-07', status: 'Completed' },
  { id: 'INV006', product: 'Smart Device', category: 'IoT', quantity: 4, amount: '$3,200', date: '2025-07-06', status: 'Completed' },
  { id: 'INV007', product: 'Standard Gadget', category: 'Accessories', quantity: 10, amount: '$700', date: '2025-07-06', status: 'Cancelled' },
  { id: 'INV008', product: 'Industrial Grade', category: 'Heavy Duty', quantity: 2, amount: '$4,500', date: '2025-07-05', status: 'Completed' },
  { id: 'INV009', product: 'Basic Kit', category: 'Starter Pack', quantity: 15, amount: '$900', date: '2025-07-05', status: 'Completed' },
  { id: 'INV010', product: 'Deluxe Pro Tool', category: 'Tools', quantity: 7, amount: '$4,900', date: '2025-07-04', status: 'Completed' },
  { id: 'INV011', product: 'Smart Device', category: 'IoT', quantity: 2, amount: '$1,600', date: '2025-07-04', status: 'Pending' },
  { id: 'INV012', product: 'Premium Widget', category: 'Electronics', quantity: 9, amount: '$2,250', date: '2025-07-03', status: 'Completed' },
];

// Reports summary cards data
export const reportsStats = {
  totalRevenue: '$33,720',
  totalSales: '94',
  totalOrders: '12',
  topSellingProduct: 'Premium Widget',
};
