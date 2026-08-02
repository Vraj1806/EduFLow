# Extractable Components

## AppShell
- Source: `src/components/AppShell.tsx`
- Category: layout
- Description: Protected app shell with desktop sidebar, mobile menu, EduFlow brand, navigation, account summary, logout, and notification trigger.
- Extractable props: `activeItem` (string), `userName` (string), `userRole` (string), `notificationCount` (number).
- Hardcoded: Orange Sparkles brand mark, desktop routes, icon choices, dark surface styling.

## AuthSplitLayout
- Source: `src/pages/LoginPage.tsx` and `src/pages/RegisterPage.tsx`
- Category: layout
- Description: Public authentication composition with background video, dimming overlay, branded marketing content, mobile brand mark, and glass form surface.
- Extractable props: `mode` (login/register), `headline`, `description`, `formContent`, `switchHref`, `switchText`.
- Hardcoded: EduFlow name, orange Sparkles mark, visual hierarchy, background video treatment.

## EduFlowBrandMark
- Source: `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, `src/components/AppShell.tsx`
- Category: basic
- Description: Orange rounded-square Sparkles mark paired with the EduFlow wordmark.
- Extractable props: `size` (compact/default), `inverted` (boolean).
- Hardcoded: Sparkles icon, `#FF7A3D` background, `#140A08` icon color, EduFlow name.

## PasswordField
- Source: `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`
- Category: basic
- Description: Accessible password field with show/hide control and EduFlow focus style.
- Extractable props: `id`, `label`, `autoComplete`, `placeholder`, `value`, `error`, `showForgotLink`.
- Hardcoded: Eye and EyeOff icons, dark glass input treatment.

## FormField
- Source: `src/components/ui.tsx` and repeated page-local form markup
- Category: basic
- Description: Label, input/textarea, helper/error copy, and focus state composition.
- Extractable props: `label`, `id`, `type`, `placeholder`, `error`, `hint`, `required`.
- Hardcoded: Dark translucent surface and orange focus treatment.

## SurfaceCard
- Source: `src/components/ui.tsx` and repeated dashboard page markup
- Category: basic
- Description: Dark translucent panel with subtle white border and controlled radius.
- Extractable props: `padding`, `interactive`, `title`.
- Hardcoded: `bg-white/5`, `border-white/10`, `rounded-lg`.

## AsyncPageState
- Source: `src/components/ui.tsx`
- Category: basic
- Description: Spinner, error banner, success banner, and empty state for async content.
- Extractable props: `state`, `message`, `action`.
- Hardcoded: Orange loading indicator and semantic green/red tones.

## MetricCard
- Source: `src/components/ui.tsx`
- Category: basic
- Description: Summary metric card used by dashboard analytics surfaces.
- Extractable props: `label`, `value`, `icon`, `hint`, `tone`.
- Hardcoded: Card elevation and default type hierarchy.
