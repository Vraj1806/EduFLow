# EduFlow Design System

## Product and Design Intent

EduFlow is an AI-powered faculty automation platform for attendance, assignments, notices, analytics, reports, and student face registration. Its product UI is an efficient dark workspace; its public authentication experience is a cinematic, orange-accented glass entry point. The experimental authentication route must feel like a premium evolution of that existing experience, not a new brand.

## Brand Constraints

- Keep the `Sparkles` mark in a `#FF7A3D` rounded square and the EduFlow wordmark in Space Grotesk.
- Preserve the current full-viewport cinematic video, dark readability overlay, orange light/reflection, and one-column mobile form / two-column desktop composition.
- Use Inter for body and form copy; use Space Grotesk for headings, wordmark, and strong actions. Do not use new fonts. Avoid Chakra Petch because it is referenced in legacy auth markup but not loaded.
- The active identity is orange on ink/brown, not the unused aqua/magenta Aurora palette. Use no new decorative colors.
- Use Lucide's linear icon style only.

## Color Tokens

| Role | Value |
| --- | --- |
| Ink page base | `#0b0f14` |
| Auth dark brown | `#140A08` |
| Orange primary | `#FF7A3D` |
| Orange hover | `#ff8f5a` |
| Primary light text | `#FBEFE6` |
| Product white | `#FFFFFF` |
| Secondary copy | `rgba(251,239,230,0.70)` or `#9CA3AF` |
| Glass surface | `rgba(20,10,8,0.32)` |
| Glass border | `rgba(255,122,61,0.30)` |
| Input border | `rgba(255,255,255,0.15)` |
| Input surface | `rgba(255,255,255,0.04)` |
| Error | red semantic tones only |

## Type, Spacing, Shape

- Headings: Space Grotesk, 700, tight tracking. Desktop auth headline 48-56 px; form title 30 px; mobile headline is contained inside the panel rather than a separate marketing area.
- Body/interface: Inter, 14-16 px, 1.5 line height.
- Labels: 14 px / 500. Action button: 14 px / 700, modest uppercase tracking only if it remains clearly readable.
- 8 px rhythm: use 8, 12, 16, 24, 32, 40, 48, 64 px. Keep a form panel at 32 px internal padding on desktop, 24 px on narrow screens.
- Radius: 8 px buttons; 12 px inputs; 16 px primary auth panel; full round only for small status indicators.

## Surface and Interaction System

- Primary form surface is a restrained brown-black frosted glass card: 18 px blur, orange hairline, one soft black drop shadow. A subtle gradient frame may make it feel more premium, but it must remain restrained.
- Inputs are clear dark glass fields with a highly visible orange outline/ring on focus. Labels always remain visible; placeholders support but never replace labels.
- Primary CTA: solid orange, `#140A08` text, 48 px minimum height, small lift and orange halo on hover, 1-2 px press feedback. Disabled state reduces opacity without changing meaning.
- Secondary links: orange text with a clear hover/keyboard focus treatment.
- Error surface: accessible alert semantics, red transparent surface, concise message, no disruptive layout shift.

## Auth Layout

- Desktop (`lg` and wider): video fills viewport. Left half provides the EduFlow brand and compact faculty automation narrative. Right half holds a 410-440 px auth surface with substantial right inset. A tiny orange status/detail element can communicate secure workflow and AI education, but it must not become a dashboard.
- Tablet: keep the content centered; marketing copy can reduce to a short statement before the form.
- Mobile: hide the large marketing column, put the full brand at the top of the content flow, preserve roomy 44-48 px input/button touch targets, and avoid card overflow when browser chrome is visible.
- Login and registration have matching layout/transition behavior. Switch routes with crossfade/slide motion but keep actual React Router navigation and URL semantics.

## Motion

- Respect `prefers-reduced-motion`.
- Page/card: one 350-500 ms opacity + 12-16 px translate entrance.
- Fields: 45-70 ms stagger. Do not animate while typing.
- Route switch and inline errors: 150-200 ms opacity/height transition.
- Background motion: only an extremely slow orange glow/parallax layer; no new video transformation or bounce-heavy animation.

## Accessibility and Functionality

- Preserve current `AuthContext` calls, cookie-backed session handling, redirect to `/dashboard`, native email/password validation, password reveal buttons, loading state, errors, and registration password-match validation.
- Use correct labels, `autocomplete`, button names, `aria-live`/`role="alert"` for errors, high-contrast focus rings, and 44 px-or-larger interactive touch targets.
- Do not introduce Google/social auth, forgot-password behavior, or other flows that are not implemented in the existing product.

## Non-Goals

- Do not modify `/`, `/login`, or `/register` in the experiment.
- Do not make the experimental design look like the aqua/magenta Aurora demo or the streaming Hero page.
- Do not add shadcn/ui, a component library, color tokens, or image assets solely for this experiment.
