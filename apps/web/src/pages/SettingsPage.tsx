import { useEffect, useState, type FormEvent } from 'react';
import { Bot, KeyRound, Monitor, Moon, Save, Sparkles, Sun, User } from 'lucide-react';
import type { AIStatus, AuthUser } from '@eduflow/shared';
import * as facultyApi from '../api/faculty.ts';
import * as aiApi from '../api/ai.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import { useTheme, type ThemePreference } from '../theme/ThemeContext.tsx';
import { PageWrapper } from '../components/PageWrapper.tsx';
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
  const { preference, setTheme } = useTheme();

  const themeOptions: { id: ThemePreference; label: string; description: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', description: 'Clean and professional', icon: Sun },
    { id: 'dark', label: 'Dark', description: 'Comfortable for low-light environments', icon: Moon },
    { id: 'lucid', label: 'Lucid', description: 'Premium immersive experience', icon: Sparkles },
    { id: 'system', label: 'System', description: 'Follow device preference', icon: Monitor },
  ];

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
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      <PageHeader title="Settings" subtitle="Manage your account, security, and integrations" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-card-shadow)]">
          <div className="mb-5 flex items-center gap-2">
            <User size={18} className="text-[var(--theme-primary)]" />
            <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Profile
            </h2>
          </div>

          {profileError && <ErrorBanner message={profileError} />}
          {profileSaved && <SuccessBanner message="Profile updated successfully" />}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="s-name" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
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
              <label htmlFor="s-email" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
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
              <label className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">Role</label>
              <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5 text-sm capitalize text-[var(--theme-muted)]">
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
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-card-shadow)]">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound size={18} className="text-[var(--theme-primary)]" />
              <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Change Password
              </h2>
            </div>

            {passwordError && <ErrorBanner message={passwordError} />}
            {passwordSaved && <SuccessBanner message="Password changed successfully" />}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="s-current" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
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
                <label htmlFor="s-new" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
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
                <label htmlFor="s-confirm" className="mb-1.5 block text-sm font-medium text-[var(--theme-fg)]">
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

          {/* Appearance */}
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-card-shadow)]">
            <div className="mb-4 flex items-center gap-2">
              <Sun size={18} className="text-[var(--theme-primary)]" />
              <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Appearance
              </h2>
            </div>
            <div className="mb-4 text-sm text-[var(--theme-muted)]">
              Customize how EduFlow looks across the entire workspace.
            </div>
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const active = preference === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(option.id)}
                    className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all ${
                      active
                        ? 'border-[var(--theme-primary)]/40 bg-[var(--theme-primary)]/10'
                        : 'border-[var(--theme-border)] bg-[var(--theme-surface-raised)] hover:border-[var(--theme-primary)]/30'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-[var(--theme-primary)]' : 'text-[var(--theme-muted)]'} />
                    <span className="text-sm font-medium text-[var(--theme-fg)]">{option.label}</span>
                    <span className="text-[11px] text-[var(--theme-muted)]">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Integration */}
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-[var(--theme-card-shadow)]">
            <div className="mb-4 flex items-center gap-2">
              <Bot size={18} className="text-[var(--theme-primary)]" />
              <h2 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                AI Integration
              </h2>
            </div>
            {aiStatus ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--theme-muted)]">Status</span>
                  <StatusBadge label={aiStatus.configured ? 'Configured' : 'Not Configured'} tone={aiStatus.configured ? 'green' : 'amber'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--theme-muted)]">Provider</span>
                  <span className="font-medium text-[var(--theme-fg)]">{aiStatus.provider ?? 'None'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--theme-muted)]">Capabilities</span>
                  <span className="text-[var(--theme-fg)]">{aiStatus.capabilities.join(', ') || '—'}</span>
                </div>
                {!aiStatus.configured && (
                  <p className="text-xs text-[var(--theme-muted)]">
                    Configure AI_PROVIDER, AI_BASE_URL, AI_API_KEY and AI_MODEL in the API environment to enable
                    automated features.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--theme-muted)]">Unable to load AI status.</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
