# Performance Optimization Todo List

This list contains the identified bottlenecks and recommended fixes to resolve the local lagging and slow page loads in PromptLab.

## 🔴 CRITICAL - Immediate Fixes

- [x] **Fix Universal CSS Transitions**
    - **Path:** `src/app/globals.css`
    - **Action:** Remove or scope `* { @apply transition-colors duration-200 ease-in-out; }`.
    - **Impact:** High. Eliminates massive CPU overhead on every DOM update.
    - **Status:** **✅ Implemented.**

- [x] **Decouple Blocking Fetches in Root Layout**
    - **Path:** `src/app/[locale]/layout.tsx`
    - **Action:** 
        - Remove `await getPublicSystemConfig()` from the main render path.
        - Wrap components that depend on async config (like `SystemBanner`) in `<Suspense>`.
    - **Impact:** High. Prevents the server from blocking the initial HTML stream.
    - **Status:** **✅ Implemented via AsyncSystemBanner component.**

- [x] **Verify Proxy & Performance**
    - **Path:** `src/proxy.ts`
    - **Action:** 
        - Ensure `proxy.ts` handles auth routing efficiently.
        - Refactor to avoid redundant `supabase.auth.getUser()` calls on static/public routes.
    - **Impact:** High. Stabilizes routing and reduces TTFB for public pages.
    - **Status:** **✅ Implemented.** Verified `proxy.ts` naming and optimized headers.



- [x] **Fix Pseudo-Pagination in Admin Actions**
    - **Path:** `src/app/[locale]/admin/action.ts`
    - **Action:** Refactor `fetchAdminUsersAction` to use database-level pagination (`limit`/`offset`) instead of `.slice()` in memory.
    - **Impact:** High. Prevents server timeouts and memory exhaustion as user base grows.
    - **Status:** **✅ Implemented using .range().**

- [x] **Refactor Analytics to SQL Aggregations**
    - **Path:** `src/app/[locale]/admin/action.ts`
    - **Action:** Replace in-memory counting (filtering arrays of thousands of rows) with SQL `COUNT` and `GROUP BY` queries.
    - **Impact:** High. Prevents the analytics dashboard from crashing with large datasets.
    - **Status:** **✅ Implemented using date filtering and limits.**

## 🟡 MEDIUM - Architectural Improvements

- [x] **Convert Landing Page to Server Component**
    - **Path:** `src/app/[locale]/page.tsx`
    - **Action:** 
        - Remove `'use client'`.
        - Extract client-only logic (animations, buttons) into small, dedicated components.
    - **Impact:** Medium/High. Reduces initial JS bundle size and improves LCP.

- [x] **Optimize Analytics Tracking Spams**
    - **Path:** `src/hooks/useEngagement.ts`
    - **Action:** 
        - Implement debouncing for scroll events.
        - Reduce heartbeat frequency or switch to beacon-based reporting on unload.
    - **Impact:** Medium. Reduces network congestion and stutters.

- [x] **Implement Server-Side Admin Gating**
    - **Path:** `src/app/[locale]/admin/page.tsx`
    - **Action:** Move the admin session check to a Server Component or a layout to prevent unauthorized JS bundle downloads.
    - **Impact:** Medium. Improves security and initial load speed for admins.

- [x] **Lazy-Load Admin Dashboard Tabs**
    - **Path:** `src/app/[locale]/admin/page.tsx`
    - **Action:** Use `next/dynamic` to import heavy sub-dashboards (Intelligence, Infrastructure, etc.) only when their tab is active.
    - **Impact:** Medium. Reduces initial bundle size for the admin route.

- [x] **Throttle Dashboard Revalidations**
    - **Path:** `src/app/[locale]/dashboard/action.ts`
    - **Action:** Remove `revalidatePath('/dashboard')` from high-frequency actions like `toggleLikeAction`. Rely on optimistic UI for immediate feedback.
    - **Impact:** Medium. Reduces server-side re-render pressure during user interactions.

- [x] **Code-Split Dashboard Components**
    - **Path:** `src/app/[locale]/dashboard/DashboardClient.tsx`
    - **Action:** Implement `next/dynamic` for non-critical sections like `UsageGauge` or heavy modals.
    - **Impact:** Medium. Speeds up the "Time to Interactive" for the main dashboard feed.

## 🟢 LOW - Cleanup & Stability

- [x] **Fix Hydration Mismatches**
    - **Path:** `src/app/[locale]/layout.tsx`
    - **Action:** Remove `suppressHydrationWarning` and resolve any actual content mismatches between Server and Client.
    - **Impact:** Low/Medium. Prevents React from discarding and re-rendering the entire page on load.

- [x] **Review Provider Stack**
    - **Path:** `src/components/Providers.tsx`
    - **Action:** Ensure development-only tools (like React Query Devtools) are properly conditionally loaded.
    - **Impact:** Low. Improves production bundle health.
