// Mock data for Anomaly Alerts (Milestone 2 Day 5)
// TODO: API INTEGRATION POINT - Replace with backend call: GET /api/v1/anomalies/alerts

export const mockAnomalyAlerts = [
  {
    id: 'ALR-001',
    title: 'Low sales detected today.',
    description: 'Daily transaction volume dropped 45% compared to seasonal benchmark for Tuesday afternoon.',
    date: '2026-07-21',
    severity: 'Critical',
    category: 'Sales Volume',
  },
  {
    id: 'ALR-002',
    title: 'Inventory unusually high.',
    description: 'Stock level for "Deluxe Gadget Kit" exceeds maximum warehouse capacity by 120 units.',
    date: '2026-07-20',
    severity: 'Warning',
    category: 'Inventory Stock',
  },
  {
    id: 'ALR-003',
    title: 'Sudden spike in product returns.',
    description: 'Return request rate for "Wireless Earbuds" reached 18.5% over the past 48 hours.',
    date: '2026-07-19',
    severity: 'Critical',
    category: 'Product Quality',
  },
  {
    id: 'ALR-004',
    title: 'Sales significantly lower than average.',
    description: 'Weekly gross profit in Electronics category is 28% below the 30-day moving average.',
    date: '2026-07-18',
    severity: 'Warning',
    category: 'Revenue Health',
  },
  {
    id: 'ALR-005',
    title: 'Unusual checkout retry surge.',
    description: 'Payment gateway recorded 35 failed checkout attempts within a 15-minute window.',
    date: '2026-07-17',
    severity: 'Info',
    category: 'Payment System',
  },
];
