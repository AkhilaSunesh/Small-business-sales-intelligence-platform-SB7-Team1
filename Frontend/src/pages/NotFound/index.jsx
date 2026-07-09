import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/ui/Button';

function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="glass-panel max-w-2xl rounded-[2rem] p-8 text-center sm:p-10">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">404</p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">Page not found</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          The route you requested does not exist in the current scaffold. Use the navigation to go
          back to a valid section.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <FiArrowLeft />
            Back to dashboard
          </Link>
          <Button type="button" variant="ghost" className="px-5">
            Explore other pages
          </Button>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;