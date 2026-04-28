# UI/UX & Accessibility Audit: Implementation Tasks

This document outlines the specific tasks required to resolve the visual bugs, contrast issues, and component overlaps identified during the deep-dive audit.

---

## 🛠️ Phase 1: Theme & Contrast (Prerequisite)

Before fixing individual components, we must establish a theme-aware token system.

- [x] **Define CSS Variable Tokens**
    - **Path:** `src/app/globals.css`
    - **Action:** Create HSL-based variables for both `:root` and `.dark`.
    - **Tokens Needed:** `--background-card`, `--foreground-primary`, `--foreground-secondary`, `--border-dim`, `--accent-amber-text`.

- [x] **Update Tailwind Config**
    - **Path:** `tailwind.config.ts`
    - **Action:** Extend the theme to use these CSS variables so we can use `text-primary` or `bg-card` instead of hardcoded colors.

---

## 📐 Phase 2: Component Overlap & Z-Index

Fixing the "Z-Index War" and spatial contention.

- [x] **Establish Z-Index Scale**
    - **Path:** `src/app/globals.css`
    - **Action:** Define a centralized scale (e.g., `--z-navbar: 50`, `--z-modal: 100`, `--z-admin-switch: 40`).

- [x] **Fix Prompt Card Hover Collision**
    - **Path:** `src/components/dashboard/PromptCard.tsx`
    - **Action:** 
        - Wrap the Toolbar in a container with a background fade to ensure separation.
        - Alternatively, move the Toolbar to a "Quick Action" row below the title.
        - Ensure Tags have a `z-0` and Toolbar has a `z-10`.

- [x] **Admin Console Button Offsetting**
    - **Path:** `src/components/ui/AdminSwitch.tsx`
    - **Action:** 
        - Add a `bottom-24` or `end-12` shift when on the Dashboard to avoid covering Workbench CTAs.
        - Decrease `z-index` to be below modals but above standard content.

---

## 🎨 Phase 3: Theme-Specific Fixes (Light Mode)

Resolving the "invisibility" and contrast bugs.

- [x] **Fix Quota Counter Legibility**
    - **Path:** `src/components/dashboard/UsageGauge.tsx`
    - **Action:** Replace hardcoded `text-white` with a theme-aware class like `text-slate-900 dark:text-white`.

- [x] **Fix Locale Switcher Visibility**
    - **Path:** `src/components/ui/LocaleSwitcher.tsx`
    - **Action:** Change `bg-white/5` to `bg-slate-100 dark:bg-white/5` and update border colors.

- [x] **Amber Logic Contrast Boost**
    - **Path:** `src/components/dashboard/PromptReasoning.tsx`
    - **Action:** For the `amber` variant, increase text weight and use `text-amber-800` (Light) vs `text-amber-400` (Dark).

- [x] **Glass Component Depth**
    - **Path:** `src/app/globals.css`
    - **Action:** Increase border opacity and add a subtle shadow for `.glass` in Light Mode to provide better separation.

---

## 📱 Phase 4: Smoothness & Responsiveness

Refining interactions and mobile experience.

- [x] **Optimize Transitions**
    - **Path:** Multiple Files (`PromptCard`, `Workbench`)
    - **Action:** Replace `transition-all` with specific properties (e.g., `transition-[transform,opacity]`) to reduce CPU usage.

- [x] **Mobile Touch Targets**
    - **Path:** `src/components/Navbar.tsx`
    - **Action:** Increase the hit-box for the `LocaleSwitcher` and `ThemeToggle` on mobile devices.

---

## 🚦 Implementation Order (Recommended)

1. **Phase 1** (The Foundation)
2. **Phase 3** (Immediate visual wins for Light Mode users)
3. **Phase 2** (Fixing layout breakages)
4. **Phase 4** (Final Polish)
