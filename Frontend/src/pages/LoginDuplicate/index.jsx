import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAppContext } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

function LoginDuplicatePage() {
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
      <div className="mx-auto max-w-md space-y-8">
        <div>
          <h1 className="text-4xl font-semibold text-white">MarketMind AI</h1>
          <p className="mt-3 text-sm text-slate-400">Sign in with your role to continue.</p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
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
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-emerald-300"
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

export default LoginDuplicatePage;