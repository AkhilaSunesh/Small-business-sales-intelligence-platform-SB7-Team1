import { FiMenu } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { getPageMeta } from '../../constants/navigation';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const pathMap = {
  '/dashboard': { titleKey: 'dashboardOverview', descKey: 'dashboardDesc' },
  '/upload': { titleKey: 'uploadCenter', descKey: 'uploadDesc' },
  '/inventory': { titleKey: 'inventoryView', descKey: 'inventoryDesc' },
  '/reports': { titleKey: 'reportsTitle', descKey: 'reportsDesc' },
  '/settings': { titleKey: 'settings', descKey: 'manageProfile' },
  '/users': { titleKey: 'usersTitle', descKey: 'usersDesc' },
};

function Navbar({ onToggle }) {
  const location = useLocation();
  const meta = getPageMeta(location.pathname);
  const { user, logout } = useAppContext();
  const { t } = useTranslation();

  const keys = pathMap[location.pathname] || { titleKey: 'appName', descKey: '' };
  const title = keys.titleKey ? t(keys.titleKey) : meta.title;
  const description = keys.descKey ? t(keys.descKey) : meta.description;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200"
          aria-label="Toggle navigation"
        >
          <FiMenu />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70">{t('dashboard')}</p>
          <h2 className="truncate text-xl font-semibold text-white">{title}</h2>
          <p className="truncate text-sm text-slate-400">{description}</p>
        </div>

        {user ? (
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 md:flex">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{t('navbarSignedAs')}</p>
              <p className="text-sm font-semibold text-white">{user.displayName}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-cyan-200 transition hover:bg-white/10"
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