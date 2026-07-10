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
    description: 'Access dashboard content after login.',
  },
  '/upload': {
    title: 'Upload Center',
    description: 'Upload documents and files for review.',
  },
  '/inventory': {
    title: 'Inventory View',
    description: 'Inspect product and stock records.',
  },
  '/reports': {
    title: 'Reports',
    description: 'Business and sales reports.',
  },
  '/settings': {
    title: 'Settings',
    description: 'Application and account settings.',
  },
  '/users': {
    title: 'User Management',
    description: 'Manage users and roles.',
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
    description: 'MarketMind AI role-based login and dashboard access.',
  };
}