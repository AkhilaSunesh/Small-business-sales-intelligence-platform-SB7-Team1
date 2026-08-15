import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';

function SettingsPage() {
  usePageTitle('Settings');

  const { t, i18n } = useTranslation();
  const { user, login, logout, theme, setTheme } = useAuth();

  // ── Profile form ─────────────────────────────────────────────────────────────
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.displayName || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]       = useState(null); // { type: 'success'|'error', text }

  // ── Password form ─────────────────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg]       = useState(null); // { type: 'success'|'error', text }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    if (profileMsg) setProfileMsg(null);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (passwordMsg) setPasswordMsg(null);
  };

  // ── Save profile (name only) ──────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || profileForm.name.trim().length < 2) {
      setProfileMsg({ type: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }

    if (!user?.id) {
      setProfileMsg({ type: 'error', text: 'Session expired. Please log in again.' });
      return;
    }

    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await api.patch(`/api/users/${user.id}/profile`, {
        name: profileForm.name.trim(),
      });

      if (res.data?.success) {
        // Refresh AppContext so the sidebar/header also reflects the new name
        login({
          id:    user.id,
          email: user.email,
          role:  user.role,
          name:  res.data.data?.name || profileForm.name.trim(),
        });
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
        setShowEditProfile(false);
      } else {
        setProfileMsg({ type: 'error', text: res.data?.message || 'Failed to update profile.' });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401 ? 'Session expired. Please log in again.' :
         err?.response?.status === 403 ? 'You do not have permission to update this profile.' :
         'Failed to update profile. Please try again.');
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    setPasswordMsg(null);

    if (!passwordForm.currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Current password is required.' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.patch('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword:     passwordForm.newPassword,
      });

      if (res.data?.success) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
      } else {
        setPasswordMsg({ type: 'error', text: res.data?.message || 'Failed to update password.' });
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401 ? 'Current password is incorrect.' :
         err?.response?.status === 403 ? 'You do not have permission to change this password.' :
         'Failed to update password. Please try again.');
      setPasswordMsg({ type: 'error', text: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/login';
    }
  };

  // ── Inline message component ──────────────────────────────────────────────────
  const InlineMsg = ({ msg }) => {
    if (!msg) return null;
    const base = 'rounded-2xl px-4 py-3 text-sm font-medium';
    const colour =
      msg.type === 'success'
        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
    return <p className={`${base} ${colour}`}>{msg.text}</p>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">{t('settings')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('manageProfile')}</p>
        </div>
      </section>

      {/* User Profile Section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">{t('userProfile')}</h2>
            <p className="text-sm text-slate-400 mb-4">{t('manageProfileInfo')}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setShowEditProfile(!showEditProfile);
              setProfileMsg(null);
              setProfileForm({ name: user?.displayName || '' });
            }}
            className="text-sm"
          >
            {showEditProfile ? t('cancel') : t('editProfile')}
          </Button>
        </div>

        <InlineMsg msg={profileMsg} />

        {showEditProfile ? (
          <div className="space-y-4 mt-4">
            {/* Name — editable */}
            <Input
              label={t('fullName')}
              type="text"
              value={profileForm.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
            />
            {/* Email — read-only: cannot be changed via this form */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-400">
                {t('emailAddress')}
                <span className="ml-2 text-xs text-slate-500">(read-only)</span>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full rounded-2xl border border-white/5 bg-white/2 px-4 py-3 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('role')}
                type="text"
                value={user?.role || 'Owner'}
                disabled
                className="bg-white/2 cursor-not-allowed"
              />
              <Input
                label={t('memberSince')}
                type="text"
                value="July 2025"
                disabled
                className="bg-white/2 cursor-not-allowed"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? 'Saving…' : t('saveChanges')}
              </Button>
              <Button variant="secondary" onClick={() => { setShowEditProfile(false); setProfileMsg(null); }}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">{t('fullName')}</p>
              <p className="text-base text-white font-medium">{user?.displayName || '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">{t('emailAddress')}</p>
              <p className="text-base text-white font-medium">{user?.email || '—'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">{t('role')}</p>
              <p className="text-base text-white font-medium">{user?.role || 'Owner'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">{t('memberSince')}</p>
              <p className="text-base text-white font-medium">July 2025</p>
            </div>
          </div>
        )}
      </section>

      {/* Change Password Section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">{t('changePassword')}</h2>
            <p className="text-sm text-slate-400">{t('keepSecure')}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordMsg(null);
              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
            className="text-sm"
          >
            {showPasswordForm ? t('cancel') : t('change')}
          </Button>
        </div>

        <InlineMsg msg={passwordMsg} />

        {showPasswordForm && (
          <div className="mt-4 space-y-4">
            <Input
              label={t('currentPassword')}
              type="password"
              placeholder="Enter your current password"
              value={passwordForm.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            />
            <Input
              label={t('newPassword')}
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={passwordForm.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            />
            <Input
              label={t('confirmPassword')}
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSavePassword} disabled={passwordSaving}>
                {passwordSaving ? 'Updating…' : t('updatePassword')}
              </Button>
              <Button variant="secondary" onClick={() => { setShowPasswordForm(false); setPasswordMsg(null); }}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Preferences Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Theme Toggle */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t('theme')}</h2>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 rounded-2xl p-4 text-center transition ${
                theme === 'dark'
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {t('darkMode')}
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 rounded-2xl p-4 text-center transition ${
                theme === 'light'
                  ? 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {t('lightMode')}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {t('themeDesc', { theme: theme === 'dark' ? 'Dark' : 'Light' })}
          </p>
        </div>

        {/* Language Selection */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t('language')}</h2>
          <select
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              localStorage.setItem('marketmindLang', e.target.value);
            }}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="en" className="bg-slate-950 text-slate-200">🇬🇧 English</option>
            <option value="hi" className="bg-slate-950 text-slate-200">🇮🇳 हिन्दी</option>
            <option value="ta" className="bg-slate-950 text-slate-200">🇮🇳 தமிழ்</option>
          </select>
          <p className="text-xs text-slate-400 mt-3">
            {t('langDesc', {
              lang:
                i18n.language === 'en' ? 'English'
                : i18n.language === 'ta' ? 'தமிழ்'
                : 'हिन्दी',
            })}
          </p>
        </div>
      </section>

      {/* System Status Section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{t('systemStatus')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">{t('apiBackend')}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {t('connected')}
              </span>
            </div>
            <p className="text-xs text-slate-400">{t('allOperational')}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">{t('database')}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {t('connected')}
              </span>
            </div>
            <p className="text-xs text-slate-400">{t('syncCompleted')}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm font-medium text-slate-300 mb-2">{t('appVersion')}</p>
            <p className="text-base font-semibold text-cyan-300">v1.0.0</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm font-medium text-slate-300 mb-2">{t('lastUpdated')}</p>
            <p className="text-base font-semibold text-slate-200">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Danger Zone - Logout */}
      <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-xl font-semibold text-red-400 mb-2">{t('dangerZone')}</h2>
        <p className="text-sm text-slate-400 mb-4">{t('logoutDesc')}</p>
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
        >
          {t('logout')}
        </Button>
      </section>
    </div>
  );
}

export default SettingsPage;
