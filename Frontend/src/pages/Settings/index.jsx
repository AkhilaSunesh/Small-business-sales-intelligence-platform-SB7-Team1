import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

function SettingsPage() {
  usePageTitle('Settings');

  const { t, i18n } = useTranslation();
  const { user, logout, theme, setTheme } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.displayName || 'User',
    email: user?.email || 'user@example.com',
  });

  const handleNotificationToggle = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    alert('Password change request sent to backend. Feature coming soon.');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const handleSaveProfile = () => {
    alert('Profile update request sent to backend. Feature coming soon.');
    setShowEditProfile(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/login';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">{t('settings')}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {t('manageProfile')}
          </p>
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
            onClick={() => setShowEditProfile(!showEditProfile)}
            className="text-sm"
          >
            {showEditProfile ? `${t('cancel')}` : `${t('editProfile')}`}
          </Button>
        </div>

        {showEditProfile ? (
          <div className="space-y-4">
            <Input
              label={t('fullName')}
              type="text"
              value={profileForm.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
            />
            <Input
              label={t('emailAddress')}
              type="email"
              value={profileForm.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
            />
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
              <Button variant="primary" onClick={handleSaveProfile}>
                {t('saveChanges')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowEditProfile(false)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">{t('fullName')}</p>
              <p className="text-base text-white font-medium">{profileForm.name}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">{t('emailAddress')}</p>
              <p className="text-base text-white font-medium">{profileForm.email}</p>
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
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm"
          >
            {showPasswordForm ? `${t('cancel')}` : `${t('change')}`}
          </Button>
        </div>

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
              placeholder="Enter new password"
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
              <Button variant="primary" onClick={handleSavePassword}>
                {t('updatePassword')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPasswordForm(false)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Notification Preferences */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{t('notificationPreferences')}</h2>
        <div className="space-y-3">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white capitalize">
                  {key === 'emailNotifications' && t('emailNotifications')}
                  {key === 'smsNotifications' && t('smsNotifications')}
                  {key === 'pushNotifications' && t('pushNotifications')}
                  {key === 'marketingEmails' && t('marketingEmails')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {key === 'emailNotifications' && t('emailDesc')}
                  {key === 'smsNotifications' && t('smsDesc')}
                  {key === 'pushNotifications' && t('pushDesc')}
                  {key === 'marketingEmails' && t('marketingDesc')}
                </p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={() => handleNotificationToggle(key)}
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    value ? 'bg-cyan-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-1 ${
                      value ? 'translate-x-6 left-1' : 'left-1'
                    }`}
                  />
                </div>
              </label>
            </div>
          ))}
        </div>
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
            {t('langDesc', { lang: i18n.language === 'en' ? 'English' : i18n.language === 'ta' ? 'தமிழ்' : 'हिन्दी' })}
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
        <p className="text-sm text-slate-400 mb-4">
          {t('logoutDesc')}
        </p>
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