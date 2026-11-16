---
name: clear-workspace-theme
description: >-
  Build or restyle a chat workspace using the ReleaseLens reference theme: white canvas, pale blue context sidebar, narrow navigation rail, restrained blue controls, and a quiet chat composer. Use when this workspace theme is requested, not for unrelated interface work.
---

# Clear workspace theme

Use this visual system for spacious, calm desktop workspaces and their mobile equivalents. It is derived from the user's supplied workspace screenshot. Keep product content specific to the task; the source screenshot's device metrics and browser controls are not required features.

## Visual system

Read [assets/tokens.css](assets/tokens.css) for reusable color, spacing, and typography variables. Load or copy these tokens into the target application's existing styling system. Reference implementation: the project root's `src/style.css`; do not copy application behavior into unrelated products.

- Three desktop regions: white navigation rail (64–84px), pale blue-gray context sidebar (285–380px), and a flexible white conversation canvas. Fine cool-gray dividers separate regions.
- Context cards use white surfaces, 16–20px radii, one-pixel blue-gray borders, and almost invisible shadows. Labels are slate; supporting copy is muted blue-gray. Use compact uppercase tracking only for small section labels.
- Use system sans-serif typography. Desktop page headings are 26–36px with slightly negative tracking and medium weight. Welcome headings may reach 44px. Keep primary text readable; use muted colors for supporting information, never essential status alone.
- Reserve saturated sky blue for the send button, focus indicators, and selected controls. Small status dots are paired with text. Amber denotes review items; green denotes a completed or ready state.
- A welcome illustration may be a small blue glass-like orb with thin orbital rings and a diffuse pale-blue halo. CSS gradients are appropriate here. Keep surrounding surfaces flat; avoid gradients on every card. Use an app-relevant line symbol in its center.
- The composer is anchored beneath a scrollable transcript: pale surface, fine border, generous padding, 16–20px radius, multiline input, compact context label, attachment control, and circular blue send action.
- Messages are document-like, with a small author label and understated avatar. Evidence and results sit inside the conversation as structured tables/cards. Keep prose conversational and precise. Distinguish demo results, live results, and unavailable capabilities.
- Use a consistent family of 1.5–2px outline icons. No emoji, decorative sparkle clutter, heavy shadows, black card backgrounds, or giant marketing badges. Avoid importing any reference brand identity.

## Interaction and responsive behavior

- On narrow screens, retain a small rail and move the context sidebar into a toggled panel. Keep the composer usable above mobile browser chrome and prevent horizontal overflow.
- Preserve keyboard focus, proper labels, sensible tab order, reduced-motion behavior, and status announcements. Reduce or remove orbit animation when requested by the system or user.
- Wire visible actions to real behavior. Empty states explain the next step. Never fabricate device statistics, connection status, analysis results, model activity, or saved history for visual fidelity.
- Inspect welcome, active conversation, error, loading, and mobile layouts after applying the theme. Prefer a real screenshot over an image mockup when showing implemented work.

## Implemented reference

The ReleaseLens workspace screenshot is retained at [assets/workspace-reference.png](assets/workspace-reference.png). It shows an implementation of this visual system, rather than the user’s original source screenshot. Inspect it when reproducing spacing, region proportions, or component hierarchy.

## Scope

This skill changes presentation and interaction conventions. It does not authorize publication, remote storage, installation, or changes outside the user's task. Keep existing application features and accessibility behavior intact unless the user requests otherwise.
