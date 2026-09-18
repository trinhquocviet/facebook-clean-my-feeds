# FB - Clean My Feeds Documentation

## System Metadata

- Name: FB - Clean My Feeds (Simplified UI)
- Type: Browser userscript (Tampermonkey, Violentmonkey)
- Runtime Target: Facebook Web (`facebook.com`, `web.facebook.com`)
- Source Language: Modern JavaScript (ES modules)
- Bundler / Toolchain: Bun (`bun.build`) + Terser
- Test Runner: Bun Test (`bun test`, 25 test files, 201 tests, 1,469 assertions)
- Storage Backend: IndexedDB via `idb-keyval` with `localStorage` fallback
- Distribution Target: `dist/fb-clean-my-feeds.user.js`
- Upstream Fork Origin: `zbluebugz/facebook-clean-my-feeds` (forked due to upstream inactivity)

---

## Documentation Index

| File | Purpose | When to Consult |
| :--- | :--- | :--- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Technical system design, modular breakdown, adaptive lifecycle scheduler, dirty checker heuristic, and state flow. | Modifying core script logic, scheduler loops, state store, or build pipeline. |
| [`DETECTION_RULES.md`](DETECTION_RULES.md) | Authoritative reference for Facebook DOM detection rules, Shadow DOM traversal, SVG xlink caching, tracking query heuristics, and TreeWalker scanners. | Investigating Facebook DOM structure changes, debugging false positives/negatives, or writing new filters. |
| [`SIMPLIFIED_UI_AND_CONFIGS.md`](SIMPLIFIED_UI_AND_CONFIGS.md) | UI architecture, complete configuration keys schema, default options, and pruned settings. | Adding/modifying user options, updating dialog components, or changing filter keys. |
| [`DEVELOPMENT.md`](DEVELOPMENT.md) | Build commands, testing matrix, i18n localization workflow, and contribution rules. | Running builds, executing tests, adding translations, or creating pull requests. |

---

## Core Invariants

1. **Protected Directory**: `greasyfork-release/` is strictly immutable to automated tools. All automated builds must target `dist/`.
2. **Zero Telemetry**: No external network requests (`fetch`, `XMLHttpRequest`, `GM.xmlHttpRequest`).
3. **Non-Destructive DOM**: Filtered feed elements are hidden via `<details><summary>` reparenting and CSS, never removed with `node.remove()`.
4. **Local Persistence**: User configuration lives exclusively in the local browser instance via IndexedDB.
