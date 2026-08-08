# EduFlow — Master Design System

## THE GOLDEN RULE

EDUFLOW MUST FEEL LIKE:

ONE PRODUCT
ONE BRAND
ONE DESIGN SYSTEM
THREE VISUAL EXPERIENCES

The three visual experiences are:

1. **DARK**
2. **LIGHT**
3. **GLASS**

They are NOT three different websites. They are three visual expressions of the SAME EduFlow product. Every page, component, interaction, modal, form, table, chart, navigation element, notification, and future feature must belong to the same design system.

---

## DESIGN REFERENCES

Before implementing or modifying UI:

1. Inspect the existing project.
2. Inspect the existing EduFlow design system.
3. Inspect all available reference images.
4. Understand the visual hierarchy, spacing, typography, component proportions, colors and contrast, and interaction patterns.
5. Reproduce the design language as closely as practical.

Reference images are visual specifications, not vague inspiration. When a reference exists, FOLLOW THE REFERENCE. Do not unnecessarily redesign it. If a reference cannot be reproduced literally because the application requires real functionality, preserve the visual appearance while adapting the implementation to work correctly.

---

## EXISTING EDUFLOW IDENTITY

- **Primary accent:** `#FF7A3D`
- **Dark colors:** `#0B0F14`, `#140A08`
- **Typography:** Space Grotesk (display), Inter (body/UI)
- **Icons:** Lucide React (linear style)
- **Brand mark:** `Sparkles` icon in `#FF7A3D` rounded square, EduFlow wordmark in Space Grotesk

The Login and Registration pages are APPROVED. They establish the quality bar for the rest of the application. Every future page should feel like it belongs to the same product.

---

## THE THREE THEMES

### Theme 1 — DARK

The primary premium EduFlow experience.

- Deep dark backgrounds (`#0B0F14`)
- Charcoal surfaces (`#140A08`)
- EduFlow orange accent (`#FF7A3D`)
- Strong typography
- High contrast
- Subtle borders (`white/10`)
- Controlled shadows
- Sophisticated depth
- Premium SaaS appearance

Should feel: Professional, Powerful, Modern, Focused, Premium.

Do NOT make it look like a generic developer dashboard.

### Theme 2 — LIGHT

The clean professional version of EduFlow.

- Bright neutral background
- White/soft-gray surfaces
- Orange accent (`#FF7A3D`)
- Dark readable typography
- Subtle borders
- Soft elevation
- Spacious layout
- Excellent readability

Must feel like the SAME EduFlow product as Dark. Do not simply invert colors. The visual hierarchy must remain consistent.

### Theme 3 — GLASS

The futuristic premium version.

- Atmospheric dark background
- Translucent surfaces
- Controlled backdrop blur (18px)
- Subtle transparency
- Thin borders
- Layered depth
- Orange highlights
- Refined gradients

Glass must remain professional. Do NOT turn every element into glass, overuse blur, use excessive neon, make text difficult to read, or add unnecessary glowing effects. Glass should feel sophisticated, not gimmicky.

---

## CENTRAL THEME SYSTEM

Implement ONE centralized theme system. Do NOT create three separate UI implementations. Components consume semantic design tokens.

**Required tokens:**

```
--background
--foreground
--surface
--surface-secondary
--border
--primary
--primary-foreground
--muted
--success
--warning
--danger
```

Themes override these tokens. The same component automatically adapts to the selected theme.

### Theme Token Values

| Token | DARK | LIGHT | GLASS |
|---|---|---|---|
| `--background` | `#0B0F14` | `#F8F9FA` | `#0B0F14` |
| `--foreground` | `#F8FAFC` | `#0F172A` | `#FBEFE6` |
| `--surface` | `#140A08` | `#FFFFFF` | `rgba(20,10,8,0.32)` |
| `--surface-secondary` | `rgba(255,255,255,0.05)` | `#F1F5F9` | `rgba(255,255,255,0.04)` |
| `--border` | `rgba(255,255,255,0.10)` | `#E2E8F0` | `rgba(255,122,61,0.30)` |
| `--primary` | `#FF7A3D` | `#FF7A3D` | `#FF7A3D` |
| `--primary-foreground` | `#140A08` | `#FFFFFF` | `#140A08` |
| `--muted` | `rgba(255,255,255,0.50)` | `#64748B` | `rgba(251,239,230,0.65)` |
| `--success` | `#22C55E` | `#16A34A` | `#22C55E` |
| `--warning` | `#F59E0B` | `#D97706` | `#F59E0B` |
| `--danger` | `#EF4444` | `#DC2626` | `#EF4444` |

---

## THEME SELECTION

Users select: Dark, Light, or Glass.

Provide an Appearance/Theme setting under Settings. If appropriate, also provide a small theme switcher in the application header.

The user's selection persists across:
- navigation
- page changes
- browser refresh
- application restart
- future sessions

Use `localStorage` or the existing preference architecture. Do not create conflicting theme systems.

---

## TYPOGRAPHY

### Font System

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display headings | Space Grotesk | 700 | Tight tracking, authoritative |
| Strong titles | Space Grotesk | 600 | Section-level |
| Interface/body | Inter | 400 | Labels, descriptions, forms, metadata |
| UI emphasis | Inter | 500–600 | Inline emphasis, secondary titles |
| Button text | Space Grotesk or Inter | 600–700 | Context-dependent |

### Type Scale

| Level | Size | Line Height | Usage |
|---|---|---|---|
| Page title | 28–32 px | 1.2 | Top of page |
| Section title | 20–24 px | 1.3 | Card headers, section breaks |
| Card title | 16–18 px | 1.4 | Card headings |
| Body | 14–16 px | 1.5 | Main content |
| Supporting | 13–14 px | 1.5 | Secondary text, descriptions |
| Metadata | 11–12 px | 1.4 | Timestamps, badges, status labels |

Never randomly choose font sizes. Maintain clear hierarchy.

---

## SPACING

8px grid rhythm.

**Preferred values:** 4, 8, 12, 16, 24, 32, 40, 48, 64.

Maintain consistent padding, margins, gaps, section spacing, card spacing, and navigation spacing. Avoid arbitrary spacing. Whitespace should feel intentional.

---

## COMPONENT SHAPE

Restrained corner radii.

| Element | Radius |
|---|---|
| Controls (inputs, buttons) | 8–10 px |
| Cards | 12–16 px |
| Large containers | 16–24 px |
| Avatars, status indicators | 9999 px (full round) |

Do not make everything excessively rounded. Avoid the generic AI aesthetic where every element becomes a pill.

---

## BORDERS

Borders establish hierarchy without becoming visually heavy.

| Theme | Treatment |
|---|---|
| Dark | Subtle low-contrast (`rgba(255,255,255,0.10)`) |
| Light | Soft neutral (`#E2E8F0`) |
| Glass | Thin translucent (`rgba(255,122,61,0.30)`) |

Do not outline every element unnecessarily.

---

## SHADOWS

Use shadows intentionally.

| Theme | Treatment |
|---|---|
| Dark | Contrast and subtle depth |
| Light | Soft elevation |
| Glass | Layered transparency combined with subtle shadows |

Avoid giant generic shadows.

---

## COLOR TOKENS

### Brand Colors

| Role | Value | Usage |
|---|---|---|
| Orange primary | `#FF7A3D` | CTA, accent, active states |
| Orange hover | `#ff8f5a` | Hover state |
| Orange dark text | `#140A08` | Text on orange surfaces |
| Ink base | `#0B0F14` | Dark theme background |
| Dark brown | `#140A08` | Dark theme surfaces |
| Primary light text | `#FBEFE6` | Text on dark/orange surfaces |

### Semantic Colors

| Role | Dark | Light | Glass |
|---|---|---|---|
| Success | `#22C55E` | `#16A34A` | `#22C55E` |
| Warning | `#F59E0B` | `#D97706` | `#F59E0B` |
| Danger | `#EF4444` | `#DC2626` | `#EF4444` |
| Info | `#3B82F6` | `#2563EB` | `#3B82F6` |

### Glass-Specific Tokens

| Role | Value |
|---|---|
| Glass surface | `rgba(20,10,8,0.32)` |
| Glass border | `rgba(255,122,61,0.30)` |
| Glass blur | `18px` |
| Input border | `rgba(255,255,255,0.15)` |
| Input surface | `rgba(255,255,255,0.04)` |
| Input focus ring | `rgba(255,122,61,0.15)` |

---

## SURFACE AND INTERACTION SYSTEM

### Surfaces

- **Dark:** Charcoal `#140A08` with `white/10` borders
- **Light:** White `#FFFFFF` with soft neutral borders
- **Glass:** Translucent brown-black `rgba(20,10,8,0.32)` with 18px blur and orange hairline

### Inputs

- Clear dark/light glass fields
- Highly visible orange outline/ring on focus
- Labels always visible; placeholders support but never replace labels
- Minimum 44px touch targets

### Primary CTA

- Solid orange `#FF7A3D`
- `#140A08` text (dark) or `#FFFFFF` text (light)
- 48px minimum height
- Small lift (translateY -1px) and orange halo on hover
- 1-2px press feedback (scale 0.985)
- Disabled state reduces opacity without changing meaning

### Secondary Links

- Orange text with clear hover/keyboard focus treatment

### Error Surface

- Accessible alert semantics (`role="alert"`, `aria-live="assertive"`)
- Red transparent surface
- Concise message
- No disruptive layout shift

---

## COMPONENT CONSISTENCY

Every component must belong to the same design system:

- Buttons
- Inputs
- Cards
- Tables
- Charts
- Tabs
- Dropdowns
- Dialogs/Modals
- Tooltips
- Badges/Status
- Notifications
- Navigation (Sidebar + Header)
- Forms
- Empty states
- Loading states
- Error states

A component should look like the SAME component regardless of the page. Only its context and theme treatment should change.

---

## AUTH LAYOUT (APPROVED)

### Desktop (`lg` and wider)

Video fills viewport. Left half provides EduFlow brand and compact faculty automation narrative. Right half holds a 410-440px auth surface with substantial right inset. A compact secure-workspace status element communicates workflow.

### Tablet

Keep the content centered; marketing copy reduces to a short statement before the form.

### Mobile

Hide the large marketing column. Put the full brand at the top of the content flow. Preserve roomy 44-48px input/button touch targets. Avoid card overflow when browser chrome is visible.

### Auth Components

- `ExperimentalAuthLayout` — two-column video-backed layout
- `ExperimentalAuthCard` — glass card with orange gradient hairline border
- `ExperimentalAuthForm` — form wrapper with email field, animated error alert, animated submit
- `ExperimentalPasswordField` — accessible password field with left icon and show/hide toggle

Login and registration have matching layout/transition behavior. Switch routes with crossfade/slide motion but keep actual React Router navigation and URL semantics.

---

## DASHBOARD

The Faculty Dashboard is the central workspace. It provides a clear overview of Students, Attendance, Assignments, Notices, Analytics, Reports, AI insights, and Quick actions.

Do not create a generic admin dashboard. Use available reference designs as the visual authority. The dashboard should feel like the natural continuation of the approved authentication experience.

---

## ATTENDANCE

Attendance is one of EduFlow's most important features. The UI must be prepared for this workflow:

1. Faculty opens Attendance
2. Creates/selects classroom session
3. Takes classroom photo
4. Face detection → recognition → students matched
5. Attendance generated
6. Faculty reviews and corrects if necessary
7. Attendance confirmed → data saved → analytics updated

Do not use fake AI results and present them as real.

---

## AI IDENTITY

EduFlow is AI-powered. AI should be visible in the product identity but remain professional.

Possible AI functionality: attendance anomaly detection, student attention insights, assignment analysis, automated reports, smart recommendations, faculty workflow automation.

AI visual treatment should be subtle. Do NOT use excessive neon, glow, futuristic decoration, animated particles, or unnecessary 3D. The goal is AI that feels intelligent and trustworthy.

---

## ANIMATION

Use Framer Motion where appropriate. Animation improves UX rather than existing for decoration.

### Use

- Entrance animations (350-500ms, opacity + translateY 12-16px)
- Staggered reveals (45-70ms per field)
- Hover transitions (150-200ms)
- Button press feedback (scale 0.985)
- Modal/drawer transitions
- Navigation transitions
- Subtle chart animations
- Error slide-in (150-200ms)

### Do NOT

- Animate everything
- Use excessive bouncing
- Constantly move elements
- Create distracting backgrounds
- Add animation simply because it is possible

Respect `prefers-reduced-motion`.

---

## INTERACTION STATES

Every interactive element must have:

- **Default** — resting appearance
- **Hover** — subtle lift/glow/color shift
- **Focus** — visible focus ring (orange)
- **Active** — press feedback (scale down)
- **Disabled** — reduced opacity, no pointer events
- **Loading** — spinner or skeleton
- **Success** — green confirmation
- **Error** — red surface + accessible message

---

## RESPONSIVE DESIGN

Every page must work correctly at:

| Breakpoint | Width |
|---|---|
| Desktop XL | 1440px+ |
| Desktop | 1280px |
| Laptop | 1024px |
| Tablet | 768px |
| Mobile | 390px |

Do not simply shrink desktop layouts. Adapt intelligently. Mobile must have accessible navigation, readable typography, usable controls, no horizontal overflow, properly stacked content, appropriate card layouts, usable charts, and accessible forms.

---

## ACCESSIBILITY

Maintain:

- Semantic HTML
- Keyboard navigation
- Visible focus states (orange rings)
- Accessible labels (`htmlFor`, `aria-label`)
- Accessible form errors (`role="alert"`, `aria-live="assertive"`)
- Sufficient color contrast (WCAG AA minimum)
- Screen reader compatibility
- Reduced motion support (`useReducedMotion`)

Never sacrifice accessibility for visual matching.

---

## PERFORMANCE

Maintain good frontend performance:

- Avoid unnecessary dependencies
- Lazy-load heavy content when appropriate
- Optimize images
- Keep animations performant (GPU-accelerated transforms)
- Do not sacrifice performance for decorative effects

---

## EXPERIMENTAL DESIGN RULE

When exploring a new design:

1. Create an experimental route/version
2. Implement the new design
3. Run it
4. Test it
5. Let the user review it
6. Wait for explicit approval
7. Only then promote it to production

NEVER assume visual approval. NEVER delete the previous working design before approval.

---

## VISUAL QA SYSTEM

For every major UI change:

1. PLAN → IMPLEMENT → RUN APPLICATION → OPEN IN BROWSER
2. INSPECT DESKTOP → TABLET → MOBILE
3. COMPARE AGAINST REFERENCE
4. IDENTIFY DIFFERENCES → FIX → RECHECK
5. RUN TESTS → FINAL REVIEW

Check: alignment, spacing, typography, contrast, component proportions, responsive behavior, animation, hover states, focus states, loading states, empty states, error states, console errors, broken routes, overflow.

---

## REFERENCE ACCURACY

When implementing a provided reference design, prioritize:

1. Layout
2. Component positioning
3. Visual hierarchy
4. Spacing
5. Typography
6. Color
7. Borders
8. Radius
9. Shadows
10. Animation

The target is: REFERENCE DESIGN + REAL EDUFLOW FUNCTIONALITY + RESPONSIVE IMPLEMENTATION.

---

## CREATIVE FREEDOM

When no reference exists, use best product-design judgment. Create interfaces that are elegant, modern, intuitive, premium, distinctive, and consistent with EduFlow. Do not default to generic AI-generated UI.

---

## DESIGN QUALITY BAR

Every major screen should feel like it belongs to a professionally designed SaaS product. Ask:

- Does this look intentional?
- Does this feel premium?
- Does this feel like EduFlow?
- Does it match the approved authentication experience?
- Does it work?
- Does it remain usable?
- Does it work on mobile?
- Does it respect the selected theme?
- Does it maintain consistency with the rest of the product?

If not: FIX IT.

---

## EXISTING FUNCTIONALITY

This is a REAL application. Visual design must NEVER replace working functionality. Before modifying any page: understand routing, authentication, `AuthContext`/`useAuth`, API client, state management, existing components, data models, and existing tests. Reuse existing infrastructure. Do not invent APIs if an existing API already exists. Do not replace real functionality with fake functionality. Do not delete working components without a clear reason.

---

## TECHNICAL REFERENCE

### Fonts (loaded in `index.html`)

```html
<link
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### CSS Variables (`src/styles.css`)

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: "Space Grotesk", var(--font-sans);
  --color-ink: #0b0f14;
  --color-aqua: #2dd4bf;
  --color-aqua-light: #5eead4;
  --color-magenta: #e879f9;
}
```

Note: The aqua/magenta tokens power an unused Aurora component and should NOT override the active orange identity.

### Background Asset

```
https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/cinematic.mp4
```

### Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion
- Lucide React
- React Router DOM v7
- TanStack React Query v5

### Routes

| Path | Component | Access |
|---|---|---|
| `/`, `/login` | `AuthExperimentLoginPage` | Public |
| `/register` | `AuthExperimentRegisterPage` | Public |
| `/hero` | `HeroPage` | Public |
| `/dashboard` | `DashboardPage` | Protected |
| `/dashboard/students` | `StudentsPage` | Protected |
| `/dashboard/attendance` | `AttendancePage` | Protected |
| `/dashboard/assignments` | `AssignmentsPage` | Protected |
| `/dashboard/notices` | `NoticesPage` | Protected |
| `/dashboard/analytics` | `AnalyticsPage` | Protected |
| `/dashboard/reports` | `ReportsPage` | Protected |
| `/dashboard/settings` | `SettingsPage` | Protected |
| `*` | Redirect to `/` | Public |
