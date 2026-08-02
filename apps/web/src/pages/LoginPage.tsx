import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.tsx';

const VIDEO_URL =
  'https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/cinematic.mp4';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const glassPanelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    const glassPanel = glassPanelRef.current;
    const button = buttonRef.current;

    if (!container) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Check if touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentVideoX = 0;
    let currentVideoY = 0;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

      // Update CSS variables for cursor position (for ambient light and glass reflection)
      container.style.setProperty('--cursor-x', `${e.clientX}px`);
      container.style.setProperty('--cursor-y', `${e.clientY}px`);

      // Glass panel reflection
      if (glassPanel) {
        const panelRect = glassPanel.getBoundingClientRect();
        const isOverPanel =
          e.clientX >= panelRect.left &&
          e.clientX <= panelRect.right &&
          e.clientY >= panelRect.top &&
          e.clientY <= panelRect.bottom;

        if (isOverPanel) {
          const localX = ((e.clientX - panelRect.left) / panelRect.width) * 100;
          const localY = ((e.clientY - panelRect.top) / panelRect.height) * 100;
          glassPanel.style.setProperty('--mouse-x', `${localX}%`);
          glassPanel.style.setProperty('--mouse-y', `${localY}%`);
          glassPanel.style.setProperty('--reflection-opacity', '1');
        } else {
          glassPanel.style.setProperty('--reflection-opacity', '0');
        }
      }

      // Magnetic button effect
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const buttonCenterX = buttonRect.left + buttonRect.width / 2;
        const buttonCenterY = buttonRect.top + buttonRect.height / 2;
        const distanceX = e.clientX - buttonCenterX;
        const distanceY = e.clientY - buttonCenterY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        const magneticRadius = 120;

        if (distance < magneticRadius) {
          const strength = 1 - distance / magneticRadius;
          button.style.setProperty('--magnetic-x', `${distanceX * strength * 0.15}px`);
          button.style.setProperty('--magnetic-y', `${distanceY * strength * 0.15}px`);
        } else {
          button.style.setProperty('--magnetic-x', '0px');
          button.style.setProperty('--magnetic-y', '0px');
        }
      }
    };

    const animate = () => {
      // Smooth parallax for video (lerp)
      const targetVideoX = mouseX * -8;
      const targetVideoY = mouseY * -6;
      currentVideoX += (targetVideoX - currentVideoX) * 0.1;
      currentVideoY += (targetVideoY - currentVideoY) * 0.1;

      if (video) {
        video.style.transform = `translate(${currentVideoX}px, ${currentVideoY}px) scale(1.04)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen overflow-hidden"
      style={
        {
          '--cursor-x': '50%',
          '--cursor-y': '50%',
        } as React.CSSProperties
      }
    >
      {/* Cursor-aware ambient lighting */}
      <div
        className="pointer-events-none fixed inset-0 z-[3]"
        style={{
          background:
            'radial-gradient(circle 250px at var(--cursor-x) var(--cursor-y), rgba(255, 122, 61, 0.06), transparent 70%)',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Full-screen background video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="fixed inset-0 h-screen w-screen object-cover transition-transform duration-100 ease-out"
        style={{ width: '100vw', height: '100vh', willChange: 'transform' }}
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
            Faculty automation{' '}
            <span className="text-[#FF7A3D]">powered by AI</span>
          </h2>

          <p className="max-w-lg text-base leading-relaxed text-[#FBEFE6] drop-shadow-md lg:text-lg">
            Simplify attendance, assignments, grading, notices, and analytics. Let AI handle the
            workflow while you focus on teaching.
          </p>
        </div>

        {/* Right side - Glassmorphic login panel over the video */}
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

            {/* Glassmorphic login panel */}
            <div
              ref={glassPanelRef}
              className="glass-panel-interactive animate-blur-fade-up rounded-2xl px-8 py-8 shadow-2xl"
              style={
                {
                  background: 'rgba(20, 10, 8, 0.32)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                  border: '1px solid rgba(255, 122, 61, 0.30)',
                  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.25)',
                  '--mouse-x': '50%',
                  '--mouse-y': '50%',
                  '--reflection-opacity': '0',
                  position: 'relative',
                } as React.CSSProperties
              }
            >
              {/* Glass reflection overlay */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
                style={{
                  background:
                    'radial-gradient(circle 120px at var(--mouse-x) var(--mouse-y), rgba(255, 122, 61, 0.08), transparent 40%)',
                  opacity: 'var(--reflection-opacity)',
                }}
              />

              {/* Heading */}
              <div className="relative z-10 mb-7 space-y-1.5">
                <h1
                  className="text-3xl font-bold tracking-tight text-white"
                  style={{ fontFamily: 'Space Grotesk, sans-serif', lineHeight: '1.05' }}
                >
                  Welcome back.
                </h1>
                <p className="text-sm leading-relaxed text-[#FBEFE6]/70">
                  Sign in to continue to your EduFlow workspace.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
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
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-[#FBEFE6]/90">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#FF7A3D] transition-colors hover:text-[#ff8f5a]"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 pr-11 text-sm text-[#FBEFE6] placeholder-[#FBEFE6]/45 transition-all focus:border-[#FF7A3D] focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(255,122,61,0.1)] focus:outline-none"
                      placeholder="Enter your password"
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

                {/* Remember me checkbox */}
                <label className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-[18px] w-[18px] rounded border border-white/20 bg-white/5 text-[#FF7A3D] transition-colors focus:ring-2 focus:ring-[#FF7A3D]/20 focus:ring-offset-0"
                  />
                  <span className="text-sm text-[#FBEFE6]/80">Remember me</span>
                </label>

                {/* Error message */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                {/* Submit button with magnetic effect */}
                <button
                  ref={buttonRef}
                  type="submit"
                  disabled={submitting}
                  className="magnetic-button flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#FF7A3D] text-sm font-bold uppercase tracking-wide text-[#140A08] transition-all hover:shadow-[0_0_20px_rgba(255,122,61,0.4)] disabled:opacity-60 disabled:hover:bg-[#FF7A3D] disabled:hover:shadow-none"
                  style={
                    {
                      fontFamily: 'Chakra Petch, sans-serif',
                      '--magnetic-x': '0px',
                      '--magnetic-y': '0px',
                      transform: 'translate(var(--magnetic-x), var(--magnetic-y))',
                      willChange: 'transform',
                    } as React.CSSProperties
                  }
                >
                  {submitting ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              {/* Register link */}
              <p className="relative z-10 mt-5 text-center text-sm text-[#FBEFE6]/70">
                New to EduFlow?{' '}
                <Link
                  to="/register"
                  className="font-medium text-[#FF7A3D] transition-colors hover:text-[#ff8f5a]"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
