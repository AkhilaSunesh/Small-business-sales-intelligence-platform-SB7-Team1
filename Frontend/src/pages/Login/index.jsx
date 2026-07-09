import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAppContext } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

function LoginPage() {
  const navigate = useNavigate();
  const { login, availableRoles } = useAppContext();
  const [form, setForm] = useState({ email: '', password: '', role: '' });
  const [error, setError] = useState('');
  usePageTitle('Login');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.email || !form.password || !form.role) {
      setError('Please provide an email, password, and role.');
      return;
    }

    login({ email: form.email, role: form.role });
    navigate('/dashboard');
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              MarketMind AI
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Select your role and sign in to continue.
            </p>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Login</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Access the dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sign in with your role to continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="name@example.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-200">
                User role
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-cyan-300"
              >
                <option value="" disabled>
                  Select user role
                </option>
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <Button type="submit" className="w-full">
              Continue to dashboard
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;