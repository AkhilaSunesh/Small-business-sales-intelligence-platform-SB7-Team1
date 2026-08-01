import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BusinessOverviewPage from '../index';

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

  test('handles interactive demo controls - Toggle Demo States dropdown', async () => {
    render(<BusinessOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });

    const toggleBtn = screen.getByRole('button', { name: /Toggle Demo States/i });
    fireEvent.click(toggleBtn);

    // Dropdown options should appear
    expect(screen.getByText('Enable Loading')).toBeInTheDocument();
    expect(screen.getByText('Enable Error State')).toBeInTheDocument();
    expect(screen.getByText('Enable Empty State')).toBeInTheDocument();

    // Click Enable Error State
    const errorBtn = screen.getByText('Enable Error State');
    fireEvent.click(errorBtn);

    // Should render connection error state panel
    expect(screen.getByText('Pipeline Offline')).toBeInTheDocument();

    // Click Re-initialize Gateway to recover
    const recoverBtn = screen.getByRole('button', { name: /Re-initialize Gateway/i });
    fireEvent.click(recoverBtn);

    // Verify recovery loading, then success
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  test('handles empty telemetry state display and dummy insert trigger', async () => {
    render(<BusinessOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });

    const toggleBtn = screen.getByRole('button', { name: /Toggle Demo States/i });
    fireEvent.click(toggleBtn);

    const emptyBtn = screen.getByText('Enable Empty State');
    fireEvent.click(emptyBtn);

    // Should show empty state message
    expect(screen.getByText('Dashboard Telemetry Empty')).toBeInTheDocument();
    expect(screen.getByText(/Telemetry or sales data reported on the intelligence stream/i)).toBeInTheDocument();

    const insertBtn = screen.getByRole('button', { name: /Insert Dummy Data/i });
    fireEvent.click(insertBtn);

    // Should restore telemetry
    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    }, { timeout: 1500 });
  });
});
