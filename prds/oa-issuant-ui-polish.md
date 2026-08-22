# OA and Issuant UI polish

Date: 2026-08-22

## Problem

The dashboard and public UI already have a working system: four themes, `0.25rem` radius, existing fonts, hairline cards, no lift. Open Analytics and Issuant still have a few interaction rules this app is missing, and copying their look wholesale would fight that system.

## What we are not doing

- No dashboard rebuild
- No radius change
- No font change
- No squircles, Inter Tight, Geist, Georgia, or OA blue
- No new grey palette

## What we take

From OA: chrome and data stay put, one accent used for focus and primary actions, buttons press instead of lifting, standing states use `role="status"`, events (toasts) retire themselves, loading keeps the button label, reduced motion is honored.

From Issuant: grayscale antialiasing (already on), 16px inputs on phones so iOS does not zoom, 3px accent ring at low opacity, 1px press, hairline hover on cards, `overflow-x: clip`, tap highlight off.

## Files to change

- `src/styles/global.css`
- `src/styles/dashboard.css`
- `src/pages/Dashboard.tsx`
- `src/components/AIChatView.tsx`
- `src/components/dashboard/HomepageSection.tsx`
- `src/components/AgentReadySection.tsx`

## Edge cases

- Phone inputs stay visually 16px only under 768px. Desktop dashboard body stays 14px.
- Card hover darkens the border only. No shadow, no scale.
- `prefers-reduced-motion` kills toast and press motion.
- Chat attachment errors use an inline notice, not `alert()`.
