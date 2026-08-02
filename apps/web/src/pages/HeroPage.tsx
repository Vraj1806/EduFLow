import { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Menu,
  Play,
  Search,
  Star,
  User,
  X,
} from 'lucide-react';

const NAV_LINKS = ['Home', 'Series', 'Movies', 'New & Popular', 'My List'];

const VIDEO_URL =
  'https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/cinematic.mp4';

/**
 * Cinematic streaming hero — a single full-viewport section.
 *
 * Stack (bottom → top):
 *   0   fixed background video (object-cover)
 *   1   fixed bottom blur overlay, CSS-masked (no gradient darkening)
 *   10  hero content, bottom-aligned
 *   40  mobile menu dropdown
 *   50  navbar
 *
 * Every element enters with a blurFadeUp stagger: 0ms (logo) → 900ms (next).
 */
export function HeroPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-black text-white">
      {/* Background video — full-bleed, looped, muted, behind everything. */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="fixed inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_URL}
      />

      {/* Bottom blur overlay — CSS mask blurs only the bottom ~45%. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] backdrop-blur-xl"
        style={{
          maskImage: 'linear-gradient(to top, black 0%, transparent 45%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 45%)',
        }}
      />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 md:py-6">
        {/* Logo */}
        <a href="/" className="flex items-center animate-blur-fade-up">
          <span className="text-xl font-bold tracking-tight md:text-2xl">EduFlow</span>
        </a>

        {/* Desktop nav links (lg+) */}
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((label, i) => (
            <a
              key={label}
              href="#"
              className="animate-blur-fade-up text-sm text-gray-300 transition-colors hover:text-white"
              style={{ animationDelay: `${100 + i * 50}ms` }}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="animate-blur-fade-up hidden items-center gap-2 rounded-full liquid-glass px-4 py-2 text-gray-300 transition-colors hover:text-white sm:flex md:px-6"
            style={{ animationDelay: '350ms' }}
          >
            <Search size={18} />
            <span className="text-sm">Search</span>
          </button>

          <button
            type="button"
            aria-label="Profile"
            className="animate-blur-fade-up hidden h-10 w-10 items-center justify-center rounded-full liquid-glass text-gray-300 transition-colors hover:text-white sm:flex"
            style={{ animationDelay: '400ms' }}
          >
            <User size={18} />
          </button>

          {/* Hamburger (below lg) — animated Menu ↔ X toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="animate-blur-fade-up relative flex h-10 w-10 items-center justify-center rounded-full liquid-glass text-white lg:hidden"
            style={{ animationDelay: '350ms' }}
          >
            <Menu
              size={18}
              className={`absolute transition-all duration-500 ease-out ${
                mobileMenuOpen ? 'scale-50 rotate-180 opacity-0' : 'scale-100 rotate-0 opacity-100'
              }`}
            />
            <X
              size={18}
              className={`absolute transition-all duration-500 ease-out ${
                mobileMenuOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-180 opacity-0'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu (below lg) — slides in under the navbar */}
      <div
        className={`absolute left-0 right-0 top-[72px] z-40 border-y border-gray-800 bg-gray-900/95 shadow-2xl backdrop-blur-lg transition-all duration-500 ease-out ${
          mobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-4 opacity-0'
        }`}
      >
        {mobileMenuOpen && (
          <div className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((label, i) => (
              <a
                key={label}
                href="#"
                className="animate-slide-in-right rounded-lg px-3 py-3 text-gray-200 transition-colors hover:bg-gray-800/50 hover:text-white"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {label}
              </a>
            ))}

            {/* Search + profile surface on small phones */}
            <div className="mt-3 flex items-center gap-3 border-t border-gray-800 pt-4 sm:hidden">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full liquid-glass py-2 text-sm text-gray-300"
              >
                <Search size={18} />
                Search
              </button>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full liquid-glass text-gray-300"
              >
                <User size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hero content — fills the space below the navbar, aligned to the bottom */}
      <div className="relative z-10 flex flex-1 flex-col justify-end px-4 pb-8 sm:px-6 md:px-12 md:pb-16">
        <div className="flex flex-col items-end gap-8 md:flex-row">
          {/* Left column */}
          <div className="flex-1 space-y-4 md:space-y-5">
            {/* Metadata row */}
            <div
              className="animate-blur-fade-up flex flex-wrap items-center gap-3 md:gap-4"
              style={{ animationDelay: '300ms' }}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium text-white md:text-base">
                <Star size={16} className="fill-white text-white" />
                9.4
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300 md:text-sm">
                <Clock size={15} />
                120 min
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-300 md:text-sm">
                <Calendar size={15} />
                2024
              </span>
            </div>

            {/* Title */}
            <h1
              className="animate-blur-fade-up text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ animationDelay: '400ms' }}
            >
              Step Through.
              <br />
              Work Smarter.
            </h1>

            {/* Description */}
            <p
              className="animate-blur-fade-up max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base md:text-lg"
              style={{ animationDelay: '500ms' }}
            >
              A voyage through forgotten realms — where every step reveals a new world. Traverse
              shifting landscapes, decode ancient puzzles, and uncover a story written in the stars.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 md:gap-4">
              <button
                type="button"
                className="animate-blur-fade-up flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-105"
                style={{ animationDelay: '600ms' }}
              >
                <Play size={18} className="fill-black" />
                Watch Now
              </button>
              <button
                type="button"
                className="animate-blur-fade-up flex items-center gap-2 rounded-full liquid-glass px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                style={{ animationDelay: '700ms' }}
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right column — prev/next navigation */}
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              aria-label="Previous"
              className="animate-blur-fade-up flex h-10 w-10 items-center justify-center rounded-full liquid-glass text-white transition-colors hover:bg-white/10 md:h-12 md:w-12"
              style={{ animationDelay: '800ms' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next"
              className="animate-blur-fade-up flex h-10 w-10 items-center justify-center rounded-full liquid-glass text-white transition-colors hover:bg-white/10 md:h-12 md:w-12"
              style={{ animationDelay: '900ms' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
