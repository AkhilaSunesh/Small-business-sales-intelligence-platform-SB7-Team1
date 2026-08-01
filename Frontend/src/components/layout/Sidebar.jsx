import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  FiBarChart2,
  FiBox,
  FiUploadCloud,
  FiLogIn,
  FiFileText,
  FiSettings,
  FiUsers,
  FiFilePlus,
  FiList,
  FiSmile,
  FiZap,
  FiAlertTriangle,
  FiTrendingUp,
  FiBriefcase,
} from 'react-icons/fi';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/classNames';

const iconMap = {
  dashboard: FiBarChart2,
  upload: FiUploadCloud,
  inventory: FiBox,
  login: FiLogIn,
  reports: FiFileText,
  settings: FiSettings,
  users: FiUsers,
  createInvoice: FiFilePlus,
  invoiceList: FiList,
  customerInsights: FiSmile,
  recommendations: FiZap,
  anomalyAlerts: FiAlertTriangle,
  forecastReports: FiTrendingUp,
  forecastVsActual: FiTrendingUp,
  businessOverview: FiBriefcase,
};

function Sidebar({ collapsed = false }) {
  const { navItems } = useAppContext();
  const { t } = useTranslation();

  return (
    <>
      {/* Full sidebar for larger screens */}
      <aside
        className={cn(
          'hidden shrink-0 border-r border-white/10 bg-slate-950/80 px-5 py-6 backdrop-blur xl:flex xl:flex-col',
          collapsed ? 'w-20' : 'w-72',
        )}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/20">
            <span className="text-lg font-semibold">M</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">MarketMind AI</p>
              <h1 className="text-lg font-semibold text-white">{t('dashboard')}</h1>
            </div>
          )}
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] ?? FiBarChart2;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Icon className="text-lg" />
                {!collapsed && <span>{t(item.label === 'User Management' ? 'userManagement' : item.label.toLowerCase())}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <p className="font-medium text-white">{t('navigation')}</p>
          <p className="mt-2 leading-6 text-slate-300">{t('roleNavDesc')}</p>
        </div>
      </aside>

      {/* Compact sidebar for small screens (icon-only) */}
      <aside className="flex xl:hidden w-16 flex-col border-r border-white/5 bg-slate-950/80 py-4">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">M</div>
        </div>
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] ?? FiBarChart2;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                title={t(item.label === 'User Management' ? 'userManagement' : item.label.toLowerCase())}
                className={({ isActive }) =>
                  cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-medium transition-colors',
                    isActive ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )
                }
              >
                <Icon className="text-lg" />
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
};

export default Sidebar;