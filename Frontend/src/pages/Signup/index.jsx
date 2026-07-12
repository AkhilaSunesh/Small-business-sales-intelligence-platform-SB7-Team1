import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';

function SignupPage() {
  usePageTitle('Sign Up');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user changes field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Simple password strength evaluator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: 'None', score: 0, color: 'bg-slate-700', text: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { label: 'Weak', score, color: 'bg-rose-500 w-1/4', text: 'text-rose-400' };
    } else if (score === 3) {
      return { label: 'Medium', score, color: 'bg-amber-500 w-2/4', text: 'text-amber-400' };
    } else if (score === 4) {
      return { label: 'Strong', score, color: 'bg-emerald-500 w-3/4', text: 'text-emerald-400' };
    } else {
      return { label: 'Very Strong', score, color: 'bg-cyan-400 w-full', text: 'text-cyan-400' };
    }
  };

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(form.phone.replace(/[-() ]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number.';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!form.role) {
      newErrors.role = 'Please select a role.';
    }

    if (!form.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms & Conditions.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Simulate successful mock registration
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-center">
        <section className="glass-panel rounded-[2rem] p-8 max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
            <FiCheckCircle size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-white">Success!</h2>
            <p className="text-slate-350 text-sm">
              Your account has been registered successfully. You can now log in with your credentials.
            </p>
          </div>
          <div className="pt-4">
            <Button onClick={() => navigate('/login')} className="w-full">
              Proceed to Login
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              MarketMind AI
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-350 sm:text-lg">
              Join the future of small business sales intelligence. Gain insights, track inventory, and grow your sales.
            </p>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300/80">Register</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create new account</h2>
            <p className="mt-2 text-sm leading-6 text-slate-450">
              Sign up today and optimize your business intelligence.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                label="Full Name"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className={errors.fullName ? 'border-rose-500/50' : ''}
              />
              {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>}
            </div>

            <div className="relative">
              <Input
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={errors.email ? 'border-rose-500/50' : ''}
              />
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
            </div>

            <div className="relative">
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="1234567890"
                className={errors.phone ? 'border-rose-500/50' : ''}
              />
              {errors.phone && <p className="text-xs text-rose-400 mt-1">{errors.phone}</p>}
            </div>

            <div className="relative">
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter a strong password"
                  className={errors.password ? 'border-rose-500/50 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-white"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-450">Password Strength:</span>
                    <span className={`font-medium ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.color}`} />
                  </div>
                </div>
              )}
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password}</p>}
            </div>

            <div className="relative">
              <div className="relative">
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'border-rose-500/50 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[38px] text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-rose-400 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-200">
                Register as
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className={`w-full rounded-2xl border ${
                  errors.role ? 'border-rose-500/50' : 'border-white/10'
                } bg-slate-950/80 px-4 py-3 text-sm text-slate-250 outline-none transition focus:border-cyan-300`}
              >
                <option value="" disabled>
                  Select role
                </option>
                <option value="Business Owner">Business Owner</option>
                <option value="Store Manager">Store Manager</option>
                <option value="Sales Executive">Sales Executive</option>
              </select>
              {errors.role && <p className="text-xs text-rose-400 mt-1">{errors.role}</p>}
            </div>

            <div className="space-y-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={form.agreeTerms}
                  onChange={handleChange}
                  className="mt-1 accent-cyan-400 cursor-pointer h-4 w-4 rounded border-white/10 bg-slate-950 text-cyan-400 focus:ring-cyan-300"
                />
                <span className="text-xs leading-5 text-slate-350 select-none">
                  I agree to the{' '}
                  <a href="#terms" className="text-cyan-400 hover:underline">
                    Terms & Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-cyan-400 hover:underline">
                    Privacy Policy
                  </a>.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-rose-400 mt-1">{errors.agreeTerms}</p>}
            </div>

            <Button type="submit" className="w-full mt-2">
              Sign Up
            </Button>

            <div className="text-center text-sm text-slate-400 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
                Login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default SignupPage;
