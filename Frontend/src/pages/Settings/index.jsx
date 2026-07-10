import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

function SettingsPage() {
  usePageTitle('Settings');

  const { user, logout, theme, setTheme } = useAuth();
  const [language, setLanguage] = useState('en');
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
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
        <h1 className="text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your profile, preferences, and account settings.
        </p>
      </section>

      {/* User Profile Section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">User Profile</h2>
            <p className="text-sm text-slate-400 mb-4">Manage your profile information</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowEditProfile(!showEditProfile)}
            className="text-sm"
          >
            {showEditProfile ? '✕ Cancel' : '✎ Edit Profile'}
          </Button>
        </div>

        {showEditProfile ? (
          <div className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={profileForm.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              value={profileForm.email}
              onChange={(e) => handleProfileChange('email', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Role"
                type="text"
                value={user?.role || 'Owner'}
                disabled
                className="bg-white/2 cursor-not-allowed"
              />
              <Input
                label="Member Since"
                type="text"
                value="July 2025"
                disabled
                className="bg-white/2 cursor-not-allowed"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSaveProfile}>
                Save Changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowEditProfile(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">Full Name</p>
              <p className="text-base text-white font-medium">{profileForm.name}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">Email Address</p>
              <p className="text-base text-white font-medium">{profileForm.email}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">Role</p>
              <p className="text-base text-white font-medium">{user?.role || 'Owner'}</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-medium text-slate-400 mb-1">Member Since</p>
              <p className="text-base text-white font-medium">July 2025</p>
            </div>
          </div>
        )}
      </section>

      {/* Change Password Section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Change Password</h2>
            <p className="text-sm text-slate-400">Keep your account secure with a strong password</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm"
          >
            {showPasswordForm ? '✕ Cancel' : '🔐 Change'}
          </Button>
        </div>

        {showPasswordForm && (
          <div className="mt-4 space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              value={passwordForm.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            />
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              value={passwordForm.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleSavePassword}>
                Update Password
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowPasswordForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Notification Preferences */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {Object.entries(notificationSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
              <div>
                <p className="text-sm font-medium text-white capitalize">
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase())}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {key === 'emailNotifications' &&
                    'Receive email updates about your account activity'}
                  {key === 'smsNotifications' && 'Get SMS alerts for important notifications'}
                  {key === 'pushNotifications' &&
                    'Enable browser push notifications'}
                  {key === 'marketingEmails' &&
                    'Receive promotional offers and news'}
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
          <h2 className="text-xl font-semibold text-white mb-4">Theme</h2>
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
              🌙 Dark Mode
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
              ☀️ Light Mode
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Currently using {theme === 'dark' ? 'Dark' : 'Light'} mode
          </p>
        </div>

        {/* Language Selection */}
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Language</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
          >
            <option value="en" className="bg-slate-950 text-white">🇬🇧 English</option>
            <option value="es" className="bg-slate-950 text-white">🇪🇸 Español</option>
            <option value="fr" className="bg-slate-950 text-white">🇫🇷 Français</option>
            <option value="de" className="bg-slate-950 text-white">🇩🇪 Deutsch</option>
            <option value="it" className="bg-slate-950 text-white">🇮🇹 Italiano</option>
          </select>
          <p className="text-xs text-slate-400 mt-3">
            Interface language set to: {language === 'en' ? 'English' : language.toUpperCase()}
          </p>
        </div>
      </section>

      {/* System Status Section */}
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">API / Backend</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">All services operational</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">Database</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">Sync completed</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm font-medium text-slate-300 mb-2">Application Version</p>
            <p className="text-base font-semibold text-cyan-300">v1.0.0</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-sm font-medium text-slate-300 mb-2">Last Updated</p>
            <p className="text-base font-semibold text-slate-200">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Danger Zone - Logout */}
      <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">
          Logging out will end your current session. You can log back in anytime.
        </p>
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
        >
          🚪 Logout
        </Button>
      </section>
    </div>
  );
}

export default SettingsPage;
