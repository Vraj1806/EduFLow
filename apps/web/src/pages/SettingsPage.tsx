import { useEffect, useState, type FormEvent } from 'react';
import { Bot, KeyRound, Save, User } from 'lucide-react';
import type { AIStatus, AuthUser } from '@eduflow/shared';
import * as facultyApi from '../api/faculty.ts';
import * as aiApi from '../api/ai.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import {
  ErrorBanner,
  PageHeader,
  SuccessBanner,
  StatusBadge,
  buttonPrimary,
  inputClass,
} from '../components/ui.tsx';

export function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Profile
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // AI status
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    aiApi.getAIStatus().then(setAiStatus).catch(() => setAiStatus(null));
  }, []);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      await facultyApi.updateProfile({ name, email });
      await refreshUser();
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await facultyApi.changePassword({ currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      <PageHeader title="Settings" subtitle="Manage your account, security, and integrations" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center gap-2">
            <User size={18} className="text-[#FF7A3D]" />
            <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Profile
            </h2>
          </div>

          {profileError && <ErrorBanner message={profileError} />}
          {profileSaved && <SuccessBanner message="Profile updated successfully" />}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="s-name" className="mb-1.5 block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                id="s-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="s-email" className="mb-1.5 block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="s-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Role</label>
              <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm capitalize text-gray-400">
                {(user as AuthUser | null)?.role ?? 'faculty'}
              </div>
            </div>
            <button type="submit" disabled={profileSaving} className={buttonPrimary} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <Save size={16} />
              {profileSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {/* Password */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound size={18} className="text-[#FF7A3D]" />
              <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Change Password
              </h2>
            </div>

            {passwordError && <ErrorBanner message={passwordError} />}
            {passwordSaved && <SuccessBanner message="Password changed successfully" />}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="s-current" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Current Password
                </label>
                <input
                  id="s-current"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="s-new" className="mb-1.5 block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <input
                  id="s-new"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="s-confirm" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <input
                  id="s-confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className={buttonPrimary}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* AI Integration */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bot size={18} className="text-[#FF7A3D]" />
              <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                AI Integration
              </h2>
            </div>
            {aiStatus ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status</span>
                  <StatusBadge label={aiStatus.configured ? 'Configured' : 'Not Configured'} tone={aiStatus.configured ? 'green' : 'amber'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Provider</span>
                  <span className="font-medium text-white">{aiStatus.provider ?? 'None'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Capabilities</span>
                  <span className="text-gray-300">{aiStatus.capabilities.join(', ') || '—'}</span>
                </div>
                {!aiStatus.configured && (
                  <p className="text-xs text-gray-500">
                    Configure AI_PROVIDER, AI_BASE_URL, AI_API_KEY and AI_MODEL in the API environment to enable
                    automated features.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unable to load AI status.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
