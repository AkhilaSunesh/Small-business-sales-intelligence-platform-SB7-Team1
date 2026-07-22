export const FORECAST_DATA_BY_RANGE = {
  '6m': {
    summary: {
      predictedSales: '14,250 units',
      expectedRevenue: '$425,800',
      forecastGrowth: '+14.8%',
      predictionAccuracy: '96.4%',
    },
    items: [
      { month: 'January', predictedSales: 1200, revenue: 36000, growth: '+5.2%' },
      { month: 'February', predictedSales: 1350, revenue: 40500, growth: '+12.5%' },
      { month: 'March', predictedSales: 1500, revenue: 45000, growth: '+11.1%' },
      { month: 'April', predictedSales: 1800, revenue: 54000, growth: '+20.0%' },
      { month: 'May', predictedSales: 2100, revenue: 63000, growth: '+16.7%' },
      { month: 'June', predictedSales: 2400, revenue: 72000, growth: '+14.3%' },
      { month: 'July', predictedSales: 2900, revenue: 87000, growth: '+20.8%' },
    ],
  },
  '30d': {
    summary: {
      predictedSales: '3,850 units',
      expectedRevenue: '$115,500',
      forecastGrowth: '+9.4%',
      predictionAccuracy: '95.8%',
    },
    items: [
      { month: 'Week 1', predictedSales: 850, revenue: 25500, growth: '+4.2%' },
      { month: 'Week 2', predictedSales: 920, revenue: 27600, growth: '+8.2%' },
      { month: 'Week 3', predictedSales: 1010, revenue: 30300, growth: '+9.8%' },
      { month: 'Week 4', predictedSales: 1070, revenue: 32100, growth: '+5.9%' },
    ],
  },
  '7d': {
    summary: {
      predictedSales: '980 units',
      expectedRevenue: '$29,400',
      forecastGrowth: '+6.1%',
      predictionAccuracy: '97.2%',
    },
    items: [
      { month: 'Mon', predictedSales: 120, revenue: 3600, growth: '+3.0%' },
      { month: 'Tue', predictedSales: 135, revenue: 4050, growth: '+12.5%' },
      { month: 'Wed', predictedSales: 140, revenue: 4200, growth: '+3.7%' },
      { month: 'Thu', predictedSales: 130, revenue: 3900, growth: '-7.1%' },
      { month: 'Fri', predictedSales: 160, revenue: 4800, growth: '+23.1%' },
      { month: 'Sat', predictedSales: 155, revenue: 4650, growth: '-3.1%' },
      { month: 'Sun', predictedSales: 140, revenue: 4200, growth: '-9.7%' },
    ],
  },
  '1y': {
    summary: {
      predictedSales: '28,500 units',
      expectedRevenue: '$855,000',
      forecastGrowth: '+18.2%',
      predictionAccuracy: '94.5%',
    },
    items: [
      { month: 'Jan', predictedSales: 1800, revenue: 54000, growth: '+8.0%' },
      { month: 'Feb', predictedSales: 1950, revenue: 58500, growth: '+8.3%' },
      { month: 'Mar', predictedSales: 2100, revenue: 63000, growth: '+7.7%' },
      { month: 'Apr', predictedSales: 2300, revenue: 69000, growth: '+9.5%' },
      { month: 'May', predictedSales: 2450, revenue: 73500, growth: '+6.5%' },
      { month: 'Jun', predictedSales: 2600, revenue: 78000, growth: '+6.1%' },
      { month: 'Jul', predictedSales: 2800, revenue: 84000, growth: '+7.7%' },
      { month: 'Aug', predictedSales: 2900, revenue: 87000, growth: '+3.6%' },
      { month: 'Sep', predictedSales: 3100, revenue: 93000, growth: '+6.9%' },
      { month: 'Oct', predictedSales: 3300, revenue: 99000, growth: '+6.5%' },
      { month: 'Nov', predictedSales: 3600, revenue: 108000, growth: '+9.1%' },
      { month: 'Dec', predictedSales: 4100, revenue: 123000, growth: '+13.9%' },
    ],
  },
};

export const FILTER_OPTIONS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '6m', label: 'Last 6 Months' },
  { id: '1y', label: 'Last Year' },
];
