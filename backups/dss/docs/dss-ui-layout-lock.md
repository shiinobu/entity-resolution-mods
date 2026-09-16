# DSS UI Layout Lock

## Status

LOCKED — September 13, 2026.

## Decision

The DSS desktop application uses a fixed internal workspace canvas with a supported minimum native window size of 1200×780 and a default HackHub window size of 1220×800.

The native DSS window declares `MinSize = { width: 1200, height: 780 }` so the host window cannot be resized down to the smaller 1180×740 boundary that causes the DSS layout to become visually unstable. This keeps the minimum usable window close to the validated reference layout.

The internal CSS canvas remains non-responsive: it does not collapse the sidebar, tool workspace, or two-column investigation panels. The initial navigator remains a 250px sidebar, while the main content keeps its desktop-oriented grid structure.

Typography, navigator controls, form controls, source rows, statistics, and terminal output are intentionally scaled above the first foundation iteration for desktop readability.

## HackHub Boundary

`DefaultSize` controls the initial native window size. `MinSize` is used for the native minimum window boundary. The public SDK documentation does not currently list `MinSize`, so the property is locked based on validated HackHub app behavior and a working community app implementation using the same SDK.

The internal HTML canvas keeps a 1180×740 CSS floor, which is below the native 1200×780 floor and therefore remains protected from the previously observed broken state. No responsive breakpoint is allowed to collapse the DSS workspace.

## Non-negotiables

- App identity remains `dss` / `DSS`.
- Replay changes the Q01 quest instance only; DSS identity and UI remain stable.
- Native DSS `MinSize` remains 1200×780 unless the supported workspace contract is intentionally revised.
- No responsive `@media` breakpoint is allowed to collapse the initial DSS workspace.
- Future tool views must respect the minimum desktop canvas instead of adding mobile breakpoints.
