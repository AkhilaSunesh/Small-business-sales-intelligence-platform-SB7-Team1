import '@testing-library/jest-dom';
import React from 'react';

// Mock Recharts for JSDOM
jest.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }) => <div data-testid="ResponsiveContainer">{children}</div>,
    AreaChart: () => <div data-testid="AreaChart" />,
    Area: () => <div data-testid="Area" />,
    BarChart: () => <div data-testid="BarChart" />,
    Bar: () => <div data-testid="Bar" />,
    PieChart: () => <div data-testid="PieChart" />,
    Pie: () => <div data-testid="Pie" />,
    Cell: () => <div data-testid="Cell" />,
    LineChart: () => <div data-testid="LineChart" />,
    ComposedChart: () => <div data-testid="ComposedChart" />,
    Line: () => <div data-testid="Line" />,
    XAxis: () => <div data-testid="XAxis" />,
    YAxis: () => <div data-testid="YAxis" />,
    Tooltip: () => <div data-testid="Tooltip" />,
    Legend: () => <div data-testid="Legend" />,
    CartesianGrid: () => <div data-testid="CartesianGrid" />,
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str) => str,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window scrollTo
window.scrollTo = jest.fn();

// Mock window print
window.print = jest.fn();
