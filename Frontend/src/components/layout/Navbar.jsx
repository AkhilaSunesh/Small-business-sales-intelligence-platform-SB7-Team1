import { FiMenu } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { getPageMeta } from '../../constants/navigation';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const pathMap = {
  '/dashboard': { titleKey: 'dashboard', descKey: 'dashboardDesc' },
  '/create-invoice': { titleKey: 'create invoice', descKey: 'createInvoiceDesc' },
  '/invoices': { titleKey: 'invoice list', descKey: 'invoiceListDesc' },
  '/customer-insights': { titleKey: 'customer insights', descKey: 'customerInsightsDesc' },
  '/recommendations': { titleKey: 'recommendations', descKey: 'recommendationsDesc' },
  '/anomalies': { titleKey: 'anomaly alerts', descKey: 'anomalyAlertsDesc' },
  '/forecasts': { titleKey: 'forecast reports', descKey: 'forecastReportsDesc' },
  '/upload': { titleKey: 'uploadCenter', descKey: 'uploadDesc' },
  '/inventory': { titleKey: 'inventory', descKey: 'inventoryDesc' },
  '/reports': { titleKey: 'reportsTitle', descKey: 'reportsDesc' },
  '/settings': { titleKey: 'settings', descKey: 'settingsDesc' },
  '/users': { titleKey: 'usersTitle', descKey: 'usersDesc' },
};

function Navbar({ onToggle }) {
  const location = useLocation();
  const meta = getPageMeta(location.pathname);
  const { user, logout } = useAppContext();
  const { t } = useTranslation();

  const keys = pathMap[location.pathname] || { titleKey: '', descKey: '' };
  const title = keys.titleKey ? t(keys.titleKey) : meta.title;
  const description = keys.descKey ? t(keys.descKey) : meta.description;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 cursor-pointer"
          aria-label="Toggle navigation"
        >
          <FiMenu />
        </button>

        <div className="min-w-0 flex-1">
          {/* Top Platform Title & Subtitle Branding Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs uppercase tracking-[0.24em] text-cyan-300/80 mb-0.5 font-semibold">
            <span>MarketMind AI</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="text-[10px] text-slate-400 normal-case tracking-normal font-normal">
              AI-Powered Sales Intelligence Platform
            </span>
          </div>
          
          <h2 className="truncate text-xl font-semibold text-white">{title}</h2>
          <p className="truncate text-sm text-slate-400 mt-0.5">{description}</p>
        </div>

        {user ? (
          /* Professional Top Right Profile Card */
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 md:flex backdrop-blur-sm">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400 font-semibold">Logged in as</p>
              <p className="text-sm font-semibold text-white mt-0.5">{user.displayName}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/85 font-bold mt-0.5">
                {user.role === 'Owner'
                  ? 'Business Owner'
                  : user.role === 'Store Manager'
                  ? 'Store Manager'
                  : user.role === 'Sales Executive'
                  ? 'Sales Executive'
                  : user.role === 'Admin'
                  ? 'Admin'
                  : user.role}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-cyan-200 transition hover:bg-white/10 cursor-pointer font-semibold"
            >
              {t('logout')}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

Navbar.propTypes = {
  onToggle: PropTypes.func,
};

export default Navbar;