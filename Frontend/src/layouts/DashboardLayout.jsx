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
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-h-screen flex-1 flex-col pl-0">
        <Navbar onToggle={toggle} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {/* Professional Authentication Status Card */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-xs text-slate-300 backdrop-blur-sm">
              <p className="font-semibold text-white uppercase tracking-wider text-[10px] mb-1">
                Authentication Status
              </p>
              <p className="mt-1 leading-5">
                Logged in as:{' '}
                <span className="text-cyan-300 font-semibold">
                  {user?.role === 'Owner'
                    ? 'Business Owner'
                    : user?.role === 'Store Manager'
                    ? 'Store Manager'
                    : user?.role === 'Sales Executive'
                    ? 'Sales Executive'
                    : user?.role === 'Admin'
                    ? 'Admin'
                    : user?.role || 'Guest'}
                </span>
                {user?.displayName && (
                  <span className="text-slate-400"> ({user.displayName})</span>
                )}
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
