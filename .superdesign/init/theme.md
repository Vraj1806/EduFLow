# Theme

## Compact Token Summary

- Framework: Tailwind CSS v4 via `@tailwindcss/vite`; no Tailwind configuration file and no shadcn/ui configuration.
- UI font: Inter, system sans fallback. Display font: Space Grotesk. `Chakra Petch` is referenced by the legacy auth button but is not loaded in `index.html`.
- Product background: `#0b0f14` (`--color-ink`); page UI also uses `#140A08` for the auth video panel text/CTA contrast.
- Primary product accent: `#FF7A3D`; hover: `#ff8f5a`; dark accent text: `#140A08`.
- Existing secondary CSS token set: aqua `#2dd4bf`, aqua light `#5eead4`, magenta `#e879f9`. It powers an unused Aurora component and should not override active orange identity in a new public-auth design.
- Main text: white or `#FBEFE6`; secondary text: `text-gray-400`, `text-gray-500`, or `#FBEFE6/70` on video auth.
- Semantic: error red (`red-500/10`, `red-300`), success green, warning amber. Do not create decorative extra accents.
- Spacing rhythm in active UI: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px. Auth panels use `px-8 py-8` and outer mobile padding `px-6 py-12`.
- Radius: controls `rounded-lg` (8 px); inputs in current auth use `rounded-xl` (12 px); primary glass panel uses `rounded-2xl` (16 px); avatars/badges use full round.
- Borders: `white/10` across product cards; current auth panel `rgba(255,122,61,0.30)`; inputs `white/15` at rest and orange on focus.
- Surfaces: product cards `bg-white/5`; current auth card `rgba(20,10,8,0.32)` plus 18 px backdrop blur and a black `0 8px 40px` shadow.
- Motion: 150-200 ms controls; auth reveal uses 1 s ease-out. Respect `prefers-reduced-motion` and keep new motion controlled.
- Responsive: public auth becomes a single panel under `lg`; hide the marketing panel and show brand above form. Dashboard shell changes at `lg` from sidebar to top mobile header.
- Icons: Lucide React linear icons. Brand mark is `Sparkles` in an orange rounded square.
- Background asset: `https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/cinematic.mp4` is the current public authentication video.

## Raw `src/styles.css`

```css
@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: "Space Grotesk", var(--font-sans);
  --color-ink: #0b0f14;
  --color-aqua: #2dd4bf;
  --color-aqua-light: #5eead4;
  --color-magenta: #e879f9;
}

@layer base {
  html { background-color: var(--color-ink); color-scheme: dark; scroll-behavior: smooth; }
  body { margin: 0; background-color: var(--color-ink); color: rgb(226 232 240); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
}

@layer components {
  .aurora-background { position: fixed; inset: 0; z-index: -10; overflow: hidden; background: var(--color-ink); }
  .aurora-blob { position: absolute; border-radius: 9999px; filter: blur(64px); pointer-events: none; }
  .aurora-blob-aqua { background: radial-gradient(circle, #ccfbf1 0%, #5eead4 25%, #2dd4bf 50%, #0f766e 100%); }
  .aurora-blob-magenta { background: radial-gradient(circle, #fbe9ff 0%, #f0abfc 25%, #e879f9 50%, #a21caf 100%); }
  .aurora-blob-deep { background: radial-gradient(circle, #38bdf8 0%, #6366f1 50%, #312e81 100%); }
  .grid-veil { position: absolute; inset: 0; background-image: repeating-linear-gradient(0deg, transparent, transparent 63px, rgba(45, 212, 191, 0.05) 63px, rgba(45, 212, 191, 0.05) 64px), repeating-linear-gradient(90deg, transparent, transparent 63px, rgba(232, 121, 249, 0.05) 63px, rgba(232, 121, 249, 0.05) 64px); mask-image: radial-gradient(ellipse at center, transparent 0%, black 60%); -webkit-mask-image: radial-gradient(ellipse at center, transparent 0%, black 60%); pointer-events: none; }
  .film-grain { position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px); background-size: 3px 3px; opacity: 0.5; pointer-events: none; }
  .aurora-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 0%, var(--color-ink) 100%); pointer-events: none; }
  .glass-card { background: linear-gradient(155deg, rgba(255, 255, 255, 0.085) 0%, rgba(255, 255, 255, 0.025) 100%); backdrop-filter: blur(34px) saturate(140%); -webkit-backdrop-filter: blur(34px) saturate(140%); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.18), 0 30px 80px -20px rgba(0, 0, 0, 0.75); position: relative; }
  .glass-nav { background: rgba(11, 15, 20, 0.62); backdrop-filter: blur(18px) saturate(140%); -webkit-backdrop-filter: blur(18px) saturate(140%); border-bottom: 1px solid rgba(255, 255, 255, 0.07); }
  .gradient-text { background: linear-gradient(100deg, #2dd4bf 0%, #5eead4 38%, #e879f9 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .cta-gradient { background: linear-gradient(100deg, #2dd4bf 0%, #5eead4 38%, #e879f9 100%); color: var(--color-ink); font-family: var(--font-display); font-weight: 700; box-shadow: 0 8px 16px -4px rgba(45, 212, 191, 0.4), 0 4px 8px -2px rgba(232, 121, 249, 0.3); transition: all 0.2s ease; }
  .cta-gradient:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 12px 24px -6px rgba(45, 212, 191, 0.5), 0 6px 12px -3px rgba(232, 121, 249, 0.4); }
  .field-input { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); color: white; transition: all 0.18s ease; }
  .field-input:focus { outline: none; background: rgba(45, 212, 191, 0.06); border-color: rgba(45, 212, 191, 0.7); box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.14), 0 0 26px -4px rgba(45, 212, 191, 0.55); }
  .field-input::placeholder { color: rgb(100, 116, 139); }
  .liquid-glass { background: rgba(255, 255, 255, 0.01); background-blend-mode: luminosity; -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); border: none; box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1); position: relative; overflow: hidden; }
  .liquid-glass::before { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.4px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.15) 20%, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0) 60%, rgba(255, 255, 255, 0.15) 80%, rgba(255, 255, 255, 0.45) 100%); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
}

@layer utilities {
  .animate-blur-fade-up { animation: blurFadeUp 1s ease-out forwards; opacity: 0; }
  .animate-slide-in-right { animation: slideInRight 0.6s ease-out forwards; opacity: 0; }
  .animate-float { animation: float 20s ease-in-out infinite; }
}

@keyframes blurFadeUp { from { opacity: 0; filter: blur(20px); transform: translateY(40px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }
@keyframes slideInRight { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -30px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }

@media (prefers-reduced-motion: reduce) {
  .animate-blur-fade-up, .animate-slide-in-right, .animate-float { animation: none; opacity: 1; }
}
```

## Raw `apps/web/index.html` font loading

```html
<link
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>
```
