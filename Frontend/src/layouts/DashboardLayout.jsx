import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useAppContext } from '../context/AppContext';
import { FiLoader, FiAlertTriangle, FiCheckCircle, FiInbox } from 'react-icons/fi';

// DashboardLayout provides a collapsible sidebar and top navbar.
// The `collapsed` state controls whether the sidebar shows labels.
function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated, demoMode, setDemoMode } = useAppContext();

  const toggle = () => setCollapsed((c) => !c);

  return (
    <div className="min-h-screen flex">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-h-screen flex-1 flex-col pl-0 pb-16 xl:pb-0">
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

      {/* Premium Floating QA Developer Toolbar */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-1.5 rounded-2xl border border-cyan-500/20 bg-slate-950/90 p-2.5 shadow-2xl backdrop-blur-md transition-all hover:border-cyan-500/40 sm:bottom-6 sm:right-6">
        <div className="text-[9px] font-bold uppercase tracking-widest text-cyan-400/80 mb-0.5 select-none">
          QA Controls
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDemoMode('loaded')}
            className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-all cursor-pointer ${
              demoMode === 'loaded'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
            title="Loaded"
          >
            <FiCheckCircle className="text-[11px] text-emerald-400" />
            <span>Loaded</span>
          </button>
          <button
            type="button"
            onClick={() => setDemoMode('loading')}
            className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-all cursor-pointer ${
              demoMode === 'loading'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
            title="Loading"
          >
            <FiLoader className={`text-[11px] text-cyan-450 ${demoMode === 'loading' ? 'animate-spin' : ''}`} />
            <span>Loading</span>
          </button>
          <button
            type="button"
            onClick={() => setDemoMode('error')}
            className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-all cursor-pointer ${
              demoMode === 'error'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
            title="Error"
          >
            <FiAlertTriangle className="text-[11px] text-rose-400" />
            <span>Error</span>
          </button>
          <button
            type="button"
            onClick={() => setDemoMode('empty')}
            className={`flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold transition-all cursor-pointer ${
              demoMode === 'empty'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
            title="Empty"
          >
            <FiInbox className="text-[11px] text-amber-400" />
            <span>Empty</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
