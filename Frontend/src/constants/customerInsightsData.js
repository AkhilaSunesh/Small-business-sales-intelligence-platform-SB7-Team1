// Mock data for Customer Insights (Milestone 2 Day 4)
// TODO: API INTEGRATION POINT - Replace with backend call: GET /api/v1/customers/insights

export const customerSummaryStats = {
  loyalCount: 1240,
  occasionalCount: 3850,
  highValueCount: 620,
};

export const customerDistributionData = [
  { name: 'Loyal Customers', value: 1240, category: 'Loyal', color: '#10b981' },
  { name: 'Occasional Customers', value: 3850, category: 'Occasional', color: '#f59e0b' },
  { name: 'High-Value Customers', value: 620, category: 'High-Value', color: '#06b6d4' },
];

export const customerGroupList = [
  { id: 'CUST-101', name: 'Eleanor Vance', category: 'High-Value', totalOrders: 42, totalSpend: '$14,250' },
  { id: 'CUST-102', name: 'Marcus Sterling', category: 'Loyal', totalOrders: 28, totalSpend: '$8,920' },
  { id: 'CUST-103', name: 'Sophia Chen', category: 'High-Value', totalOrders: 35, totalSpend: '$11,400' },
  { id: 'CUST-104', name: 'David Miller', category: 'Occasional', totalOrders: 6, totalSpend: '$1,250' },
  { id: 'CUST-105', name: 'Jessica Taylor', category: 'Loyal', totalOrders: 24, totalSpend: '$7,340' },
  { id: 'CUST-106', name: 'Robert Fox', category: 'Occasional', totalOrders: 4, totalSpend: '$890' },
  { id: 'CUST-107', name: 'Amara Okafor', category: 'High-Value', totalOrders: 31, totalSpend: '$9,800' },
  { id: 'CUST-108', name: 'Liam Wilson', category: 'Loyal', totalOrders: 19, totalSpend: '$5,600' },
  { id: 'CUST-109', name: 'Olivia Garcia', category: 'Occasional', totalOrders: 5, totalSpend: '$950' },
  { id: 'CUST-110', name: 'Ethan Patel', category: 'Loyal', totalOrders: 22, totalSpend: '$6,780' },
];
