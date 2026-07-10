import { usePageTitle } from '../../hooks/usePageTitle';

function SettingsPage() {
  usePageTitle('Settings');

  return (
    <div>
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Placeholder settings page.</p>
      </section>
    </div>
  );
}

export default SettingsPage;
