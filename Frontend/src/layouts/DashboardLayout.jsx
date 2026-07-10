import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useAppContext } from '../context/AppContext';

// DashboardLayout provides a collapsible sidebar and top navbar.
// The `collapsed` state controls whether the sidebar shows labels.
function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated } = useAppContext();

  const toggle = () => setCollapsed((c) => !c);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Navbar onToggle={toggle} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {/* Debug panel to surface auth state and role while troubleshooting */}
            <div className="mb-6 rounded-lg border border-white/5 bg-white/2 p-4 text-sm text-slate-300">
              <p>
                <strong className="text-white">Auth:</strong>{' '}
                {isAuthenticated ? 'authenticated' : 'not-authenticated'}
              </p>
              <p>
                <strong className="text-white">User:</strong>{' '}
                {user ? `${user.displayName} (${user.role})` : '—'}
              </p>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
