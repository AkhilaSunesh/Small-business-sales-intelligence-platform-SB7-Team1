import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BusinessOverviewPage from '../index';

jest.mock('../../../services/dashboardService', () => ({
  getDashboardSummary: jest.fn(() => Promise.resolve({ data: { totalRevenue: 142850, totalSales: 350, totalCustomers: 1280, totalProducts: 512 } })),
  getSalesTrend: jest.fn(() => Promise.resolve({ data: [] })),
  getTopProducts: jest.fn(() => Promise.resolve({ data: [] })),
  getAuditSummary: jest.fn(() => Promise.resolve({ data: { recentEntries: [] } })),
  getCategoryBreakdown: jest.fn(() => Promise.resolve({ data: [] })),
  getPaymentMethods: jest.fn(() => Promise.resolve({ data: [] })),
}));

jest.mock('../../../services/notificationService', () => ({
  getNotificationCounts: jest.fn(() => Promise.resolve({ data: { lowStock: 12, overdueInvoices: 3, total: 15 } })),
  getNotifications: jest.fn(() => Promise.resolve({ data: [] })),
}));

jest.mock('../../../services/recommendationService', () => ({
  getRecommendations: jest.fn(() => Promise.resolve({ data: [] })),
}));

describe('BusinessOverviewPage Component Tests', () => {
  test('renders loading telemetry skeletons initially', () => {
    render(<BusinessOverviewPage />);
    
    // Check loading indicator or skeletons are present
    const cards = screen.getAllByRole('article');
    // Initially, cards have loading class
    expect(cards.length).toBeGreaterThan(0);
  });

  test('renders full telemetry metrics and widgets after loading', async () => {
    render(<BusinessOverviewPage />);

    // Wait for the simulated delay to finish (timeout is 600ms in code)
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });

    // Check KPI metrics are rendered
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$142,850.00')).toBeInTheDocument();
    expect(screen.getByText('Total Customers')).toBeInTheDocument();
    expect(screen.getByText('1,280')).toBeInTheDocument();

    // Check lists and widgets
    expect(screen.getByText('Low Stock Products')).toBeInTheDocument();
    expect(screen.getByText('Monthly Sales Trend')).toBeInTheDocument();
    expect(screen.getByText('Sales by Category')).toBeInTheDocument();
    expect(screen.getByText('Top Selling Products')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity Timeline')).toBeInTheDocument();
  });

  test('handles refresh data click and re-fetches telemetry', async () => {
    render(<BusinessOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });

    const refreshBtn = screen.getByRole('button', { name: /Refresh Data/i });
    expect(refreshBtn).toBeInTheDocument();
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  test('renders error panel on fetch failure and allows retry', async () => {
    const dashboardService = require('../../../services/dashboardService');
    dashboardService.getDashboardSummary.mockRejectedValueOnce(new Error('Network Error'));

    render(<BusinessOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Pipeline Offline')).toBeInTheDocument();
    }, { timeout: 1500 });

    expect(screen.getByText('Network Error')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Re-initialize Gateway/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });
  });
});
