export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'Upload', path: '/upload', icon: 'upload' },
  { label: 'Inventory', path: '/inventory', icon: 'inventory' },
  { label: 'Login', path: '/login', icon: 'login' },
  { label: 'Login Copy', path: '/login-duplicate', icon: 'login' },
];

const PAGE_META = {
  '/dashboard': {
    title: 'Dashboard Overview',
    description: 'Monitor sales performance and business insights in real time.',
  },
  '/create-invoice': {
    title: 'Create Invoice',
    description: 'Create customer invoices and calculate billing automatically.',
  },
  '/invoices': {
    title: 'Invoice List',
    description: 'View, search, filter, and manage customer invoices.',
  },
  '/customer-insights': {
    title: 'Customer Insights',
    description: 'Analyze customer behavior, retention, and lifetime value.',
  },
  '/recommendations': {
    title: 'Recommendations',
    description: 'AI-powered product and business recommendations.',
  },
  '/anomalies': {
    title: 'Anomaly Alerts',
    description: 'Detect unusual sales patterns and business anomalies.',
  },
  '/forecasts': {
    title: 'Forecast Reports',
    description: 'Predict future sales trends using AI forecasting.',
  },
  '/upload': {
    title: 'Upload Center',
    description: 'Upload CSV files for inventory and sales analysis.',
  },
  '/inventory': {
    title: 'Inventory',
    description: 'Manage products, stock levels, and inventory records.',
  },
  '/reports': {
    title: 'Reports',
    description: 'Generate and download business reports.',
  },
  '/settings': {
    title: 'Settings',
    description: 'Manage account preferences, security, notifications, and application settings.',
  },
  '/users': {
    title: 'User Management',
    description: 'Manage users, roles, permissions, and account status.',
  },
  '/login': {
    title: 'Login',
    description: 'Sign in with your role to continue.',
  },
  '/login-duplicate': {
    title: 'Alternate Login',
    description: 'Sign in with your role to continue.',
  },
};

export function getPageMeta(pathname) {
  return PAGE_META[pathname] ?? {
    title: 'MarketMind AI',
    description: 'AI-Powered Sales Intelligence Platform',
  };
}