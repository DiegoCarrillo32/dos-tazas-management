---
name: dos-tazas-styling
description: Dos Tazas Management visual style guide — brand colors, fonts, Tailwind v4 tokens, and component conventions. ALWAYS consult this skill before writing or editing any UI code in this project: pages, components, modals, forms, cards, buttons, badges, or any JSX with className styling. Also use it when choosing colors, fonts, spacing, shadows, or border radii, even for small tweaks — this project has a strict coffee-brand palette and custom fonts that must not be replaced with generic Tailwind defaults.
---

# Dos Tazas Styling Guide

This is a coffee-business management app (POS / orders) with a deliberate warm, coffee-themed brand identity. Every visual decision below already exists in the codebase — match it instead of inventing new styles. The single source of truth for tokens is `src/app/globals.css` (Tailwind v4, CSS-first config — there is **no** `tailwind.config.*` file; tokens are defined in `@theme` blocks).

## Brand palette

Five brand colors, defined as CSS variables and exposed as Tailwind utilities (`text-expresso`, `bg-warm-roast`, `border-coffee-fruit`, etc.):

| Token | Light | Dark | Role |
|---|---|---|---|
| `expresso` | `#410505` | `#fff5e1` | Primary text, headings |
| `warm-roast` | `#7a1318` | `#c2b5a3` | Secondary text, borders, CTAs |
| `coffee-fruit` | `#b92323` | `#b92323` | Primary/accent, rings, hover states |
| `white-pergamino` | `#fff5e1` | `#140d0d` | Page background |
| `fruit-light` | `#d64545` | `#d64545` | Light accent |

Key habit in this codebase: brand colors are almost always used **with opacity modifiers** rather than introducing new shades. The dominant combinations (by actual usage count):

- Text: `text-expresso`, then `text-expresso/70`, `/60`, `/50`, `/40` for de-emphasis
- Borders: `border-warm-roast/10` (the default subtle border), `/20`, `/30` for stronger
- Tinted backgrounds: `bg-warm-roast/5`, `bg-warm-roast/10`, `bg-expresso/5`, `bg-coffee-fruit/10`
- Focus/rings: `ring-coffee-fruit`, `ring-coffee-fruit/20`

Because the brand variables flip in `.dark`, brand utilities are dark-mode-aware automatically — do **not** add `dark:` overrides for brand colors. Reserve `dark:` for the few cases where semantic or status colors need adjusting (existing code does this for green/red status tints, e.g. `bg-green-100 dark:bg-green-900/30`).

The shadcn semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `bg-primary`, `border-border`, etc.) are mapped onto this palette (`primary` = coffee-fruit, `secondary` = warm-roast, `background` = white-pergamino). Both vocabularies are fine; use semantic tokens inside `src/components/ui/` primitives and either one in feature components — but never raw hex values or arbitrary `[#...]` colors in JSX.

Status colors (success/warning/error on badges and indicators) use standard Tailwind soft tints: `bg-green-100`, `bg-red-50/100`, `bg-yellow-100`, `bg-orange-100` with matching dark variants like `dark:bg-green-900/30`.

## Typography

Two local custom fonts, loaded via `@font-face` from `public/assets/fonts/` (never add Google Fonts or `next/font`):

- **Gotham** — body font, applied globally via `font-sans` / `body`. Book (normal) and Bold weights only.
- **Titan One** — display font for headings, exposed as `font-heading`. All `h1`–`h6` get it automatically via a global rule.

Standard page heading pattern (use the `PageHeader` component in `src/components/PageHeader.tsx` when possible instead of hand-rolling it):

```tsx
<h1 className="text-3xl font-heading text-expresso">{title}</h1>
<p className="text-expresso/70 font-medium text-sm mt-1">{subtitle}</p>
```

Section/card titles: `text-xl font-heading text-expresso` (or `text-lg` inline). Body and UI text is `text-sm`; emphasis uses `font-medium` or `font-bold` (Gotham has no other weights, so don't use `font-semibold` expecting a distinct weight).

## Shape, elevation, surfaces

- Radius scale derives from `--radius: 0.625rem`. Common picks: `rounded-lg` (default for buttons/inputs), `rounded-xl`, `rounded-2xl` (cards/containers), `rounded-full` (pills, CTAs, avatars). Avoid sharp corners.
- Shadows are soft and warm-tinted. The canonical card/container recipe, used throughout:

```tsx
<div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-6">
```

- Hover elevation: `hover:shadow-md transition-shadow`. Optional glassy variant: `bg-card/90 backdrop-blur-sm`.
- Prominent CTA button pattern (pill shape over brand colors):

```tsx
<Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6">
  <Plus className="h-5 w-5" />
  <span className="hidden sm:inline font-bold">{t('orders_new')}</span>
</Button>
```

- Page content wrapper: `w-full max-w-7xl mx-auto`; header rows use `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6`. Mobile-first: actions often collapse labels behind `hidden sm:inline`.

## Component conventions

- **Stack**: shadcn (style `base-nova`, built on `@base-ui/react` — *not* Radix), Tailwind v4, `lucide-react` icons, `class-variance-authority` for variants, `sonner` for toasts, `recharts` for charts.
- UI primitives live in `src/components/ui/` (lowercase filenames, e.g. `button.tsx`); feature components in `src/components/` (PascalCase, e.g. `OrderCard.tsx`). Check `src/components/ui/` for an existing primitive before adding one; add new primitives via the shadcn CLI rather than hand-writing Radix-style code.
- Always merge classes with `cn()` from `@/lib/utils` — never string-concatenate `className`.
- Dialogs/modals: use `GenericModal` (`src/components/ui/GenericModal.tsx`), not raw `Dialog` composition. Forms inside cards use `FormCard` (`src/components/ui/form-card.tsx`).
- Loading states: skeleton components from `src/components/Skeletons.tsx` (e.g. `PageSkeleton`), not spinners.
- **All user-facing strings go through i18n**: `const { t } = useTranslation()` from `@/i18n/LanguageProvider`, or `<TranslateText tKey="..." />`. Never hardcode visible English text in new UI.
- Dark mode is class-based (`.dark` on `<html>`, managed by `next-themes` + an inline head script). New tokens must be defined in **both** `:root` and `.dark` in `globals.css`.

## Adding new tokens

If a genuinely new color/size is needed (rare — prefer opacity modifiers on the existing palette):

1. Add the CSS variable to `:root` **and** `.dark` in `src/app/globals.css`.
2. Expose it in the `@theme` block (`--color-my-token: var(--my-token);`) so Tailwind generates utilities.
3. Never inline the hex in a component.

## Quick self-check before finishing UI work

- No raw hex/arbitrary colors in JSX; brand or semantic tokens only.
- Headings use `font-heading`; no new font imports.
- Cards follow the `rounded-2xl shadow-sm shadow-warm-roast/5 border-warm-roast/10` recipe.
- Strings wrapped in `t()` / `TranslateText`.
- Works in dark mode without extra `dark:` brand overrides.
- Classes merged with `cn()`; variants via `cva` if the component has them.
