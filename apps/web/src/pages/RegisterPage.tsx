import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.tsx';

const VIDEO_URL =
  'https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/cinematic.mp4';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Full-screen background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="fixed inset-0 h-screen w-screen object-cover"
        style={{ width: '100vw', height: '100vh' }}
        src={VIDEO_URL}
      />

      {/* Subtle dark overlay for readability */}
      <div className="fixed inset-0 bg-black/25" />

      {/* Content layer - positioned over video */}
      <div className="relative z-10 flex min-h-screen w-full">
        {/* Left side content - over the video */}
        <div className="hidden w-full flex-col justify-center p-12 lg:flex lg:w-1/2 lg:p-16">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF7A3D]">
              <Sparkles size={22} className="text-[#140A08]" strokeWidth={2.5} />
            </div>
            <span
              className="text-2xl font-bold tracking-tight text-white drop-shadow-lg"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              EduFlow
            </span>
          </div>

          {/* Headline */}
          <h2
            className="mb-5 max-w-xl text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-lg lg:text-5xl"
            style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: '1.05' }}
          >
            Transform your faculty{' '}
            <span className="text-[#FF7A3D]">with intelligent automation</span>
          </h2>

          <p className="max-w-lg text-base leading-relaxed text-[#FBEFE6] drop-shadow-md lg:text-lg">
            Join 500+ institutions streamlining academic workflows. Save hours every week on
            attendance, grading, and administrative tasks.
          </p>
        </div>

        {/* Right side - Glassmorphic register panel over the video */}
        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:items-center lg:justify-end lg:pr-[7vw]">
          <div className="w-full max-w-[410px]">
            {/* Mobile logo (shown only on mobile) */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF7A3D]">
                <Sparkles size={20} className="text-[#140A08]" strokeWidth={2.5} />
              </div>
              <span
                className="text-2xl font-bold tracking-tight text-white drop-shadow-lg"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                EduFlow
              </span>
            </div>

            {/* Glassmorphic register panel */}
            <div
              className="animate-blur-fade-up rounded-2xl px-8 py-8 shadow-2xl"
              style={{
                background: 'rgba(20, 10, 8, 0.32)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 122, 61, 0.30)',
                boxShadow: '0 8px 40px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Heading */}
              <div className="mb-7 space-y-1.5">
                <h1
                  className="text-3xl font-bold tracking-tight text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: '1.05' }}
                >
                  Create your account.
                </h1>
                <p className="text-sm leading-relaxed text-[#FBEFE6]/70">
                  Join EduFlow to automate your academic workflows.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name field */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-sm font-medium text-[#FBEFE6]/90">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm text-[#FBEFE6] placeholder-[#FBEFE6]/45 transition-all focus:border-[#FF7A3D] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,122,61,0.1)] focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-[#FBEFE6]/90">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm text-[#FBEFE6] placeholder-[#FBEFE6]/45 transition-all focus:border-[#FF7A3D] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,122,61,0.1)] focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-[#FBEFE6]/90">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 pr-11 text-sm text-[#FBEFE6] placeholder-[#FBEFE6]/45 transition-all focus:border-[#FF7A3D] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,122,61,0.1)] focus:outline-none"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FBEFE6]/60 transition-colors hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password field */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="block text-sm font-medium text-[#FBEFE6]/90">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      minLength={8}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 pr-11 text-sm text-[#FBEFE6] placeholder-[#FBEFE6]/45 transition-all focus:border-[#FF7A3D] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,122,61,0.1)] focus:outline-none"
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FBEFE6]/60 transition-colors hover:text-white"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FF7A3D] text-sm font-bold uppercase tracking-wide text-[#140A08] transition-all hover:bg-[#ff8f5a] hover:shadow-[0_0_20px_rgba(255,122,61,0.4)] disabled:opacity-60 disabled:hover:bg-[#FF7A3D] disabled:hover:shadow-none"
                  style={{ fontFamily: 'Chakra Petch, sans-serif' }}
                >
                  {submitting ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              {/* Login link */}
              <p className="mt-5 text-center text-sm text-[#FBEFE6]/70">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-[#FF7A3D] transition-colors hover:text-[#ff8f5a]"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
