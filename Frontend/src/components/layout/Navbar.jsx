import { FiMenu } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { getPageMeta } from '../../constants/navigation';
import { useAppContext } from '../../context/AppContext';
import PropTypes from 'prop-types';

function Navbar({ onToggle }) {
  const location = useLocation();
  const meta = getPageMeta(location.pathname);
  const { user, logout } = useAppContext();

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
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/70">Dashboard</p>
          <h2 className="truncate text-xl font-semibold text-white">{meta.title}</h2>
          <p className="truncate text-sm text-slate-400">{meta.description}</p>
        </div>

        {user ? (
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 md:flex">
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Signed in as</p>
              <p className="text-sm font-semibold text-white">{user.displayName}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-cyan-200 transition hover:bg-white/10"
            >
              Logout
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