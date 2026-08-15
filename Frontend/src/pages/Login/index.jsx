import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAppContext } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FiRefreshCw, FiEye, FiEyeOff } from 'react-icons/fi';
import { loginUser } from '../../services/authService';

function LoginPage() {
  const navigate = useNavigate();
  const { login, availableRoles } = useAppContext();
  const [form, setForm] = useState({ email: '', password: '', role: '', captchaInput: '' });
  const [captcha, setCaptcha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  usePageTitle('Login');

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutoFill = (selectedRole) => {
    // Map frontend role labels to the seeded backend email accounts
    const emailMap = {
      Admin:           'admin@marketmind.dev',
      Owner:           'owner@marketmind.dev',
      'Store Manager': 'manager@marketmind.dev',
      'Sales Executive': 'sales@marketmind.dev',
    };
    const defaultEmail = emailMap[selectedRole] ?? 'admin@marketmind.dev';
    setForm({
      email:        defaultEmail,
      password:     'Password1!',
      role:         selectedRole,
      captchaInput: captcha,
    });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.email || !form.password || !form.role) {
      setError('Please provide an email, password, and role.');
      return;
    }

    // ── CAPTCHA validation (unchanged) ────────────────────────────────────────
    if (form.captchaInput !== captcha) {
      setError('Invalid CAPTCHA code. Please try again.');
      setForm((prev) => ({ ...prev, captchaInput: '' }));
      generateCaptcha();
      return;
    }

    // ── Backend authentication ────────────────────────────────────────────────
    setIsLoading(true);
    try {
      const data = await loginUser(form.email, form.password);

      // Store the JWT so api.js interceptor picks it up for all future requests
      localStorage.setItem('authToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Update AppContext with id, name, email and the role the user selected on the form
      login({
        id:    data.user?.id,
        name:  data.user?.name,
        email: form.email,
        role:  form.role,
      });

      navigate('/dashboard');
    } catch (err) {
      // Offline fallback: if the backend is unreachable, use mock token and proceed
      if (err.message.includes('Unable to reach') || err.message.includes('Backend is offline') || err.message.includes('offline or unreachable')) {
        localStorage.setItem('authToken', 'offline-mock-token');
        login({ email: form.email, role: form.role, id: null, name: null });
        navigate('/dashboard');
        return;
      }

      setError(err.message);
      setForm((prev) => ({ ...prev, captchaInput: '' }));
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              MarketMind AI
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-350 sm:text-lg">
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
            {/* Password field with show/hide toggle */}
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-4 top-[2.35rem] text-slate-400 hover:text-slate-200 transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            </div>
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

            {/* Captcha Verification — unchanged */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Security Verification
              </label>
              <div className="flex gap-3 items-center">
                <div
                  role="img"
                  aria-label={`CAPTCHA verification code: ${captcha}`}
                  className="flex-1 flex items-center justify-center select-none rounded-2xl border border-white/10 py-3 text-lg font-bold tracking-widest text-cyan-300 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-dashed"
                  style={{
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.6), -1px -1px 0 rgba(255, 255, 255, 0.1)',
                    letterSpacing: '0.4em',
                    fontFamily: 'monospace',
                  }}
                >
                  <span className="inline-block transform -skew-x-12 rotate-2">{captcha}</span>
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-3.5 rounded-2xl border border-white/10 bg-white/5 text-slate-350 hover:text-white hover:bg-white/10 transition"
                  title="Refresh CAPTCHA"
                  aria-label="Refresh CAPTCHA"
                >
                  <FiRefreshCw className="animate-spin-once" />
                </button>
              </div>
              <Input
                name="captchaInput"
                type="text"
                value={form.captchaInput}
                onChange={handleChange}
                placeholder="Enter the code shown above"
                autoComplete="off"
                aria-label="CAPTCHA Input Code"
              />
            </div>

            {error ? <p className="text-sm text-rose-455">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Continue to dashboard'}
            </Button>

            {/* Quick Demo Autofill Credentials */}
            <div className="pt-4 mt-4 border-t border-white/5 space-y-2">
              <p className="text-xs text-slate-400 text-center font-medium">Quick Demo Autofill Credentials:</p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleAutoFill('Admin')}
                  className="px-2.5 py-1 text-[11px] rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-300 transition"
                >
                  Admin Role
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoFill('Store Manager')}
                  className="px-2.5 py-1 text-[11px] rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-300 transition"
                >
                  Store Manager
                </button>
              </div>
            </div>

            <div className="text-center text-sm text-slate-400 mt-4">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">
                Sign Up
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
