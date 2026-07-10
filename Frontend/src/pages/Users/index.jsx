import { usePageTitle } from '../../hooks/usePageTitle';

function UsersPage() {
  usePageTitle('User Management');

  return (
    <div>
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
        <h1 className="text-2xl font-semibold text-white">User Management</h1>
        <p className="mt-2 text-sm text-slate-400">Placeholder user management page.</p>
      </section>
    </div>
  );
}

export default UsersPage;
