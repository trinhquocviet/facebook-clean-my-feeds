# FB - Clean My Feeds Documentation

## System Metadata

- Name: FB - Clean My Feeds (Simplified UI)
- Type: Browser userscript (Tampermonkey, Violentmonkey)
- Runtime Target: Facebook Web (`facebook.com`, `web.facebook.com`)
- Source Language: Modern JavaScript (ES modules)
- Bundler / Toolchain: Bun (`bun.build`) + Terser
- Test Runner: Bun Test (`bun test`)
- Storage Backend: IndexedDB via `idb-keyval` with `localStorage` fallback
- Distribution Target: `dist/fb-clean-my-feeds.user.js`
- Upstream Fork Origin: `zbluebugz/facebook-clean-my-feeds` (forked due to upstream inactivity)

---

## Documentation Index

| File | Purpose | When to Consult |
| :--- | :--- | :--- |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Technical system design, module boundaries, DOM observer lifecycle, state management, and memory safety. | Modifying core script logic, DOM observer hooks, state store, or build pipeline. |
| [`SIMPLIFIED_UI_AND_CONFIGS.md`](SIMPLIFIED_UI_AND_CONFIGS.md) | UI architecture, complete configuration keys schema, default options, and pruned settings. | Adding/modifying user options, updating dialog components, or changing filter keys. |
| [`DEVELOPMENT.md`](DEVELOPMENT.md) | Build commands, testing instructions, i18n localization workflow, and contribution rules. | Running builds, executing tests, adding translations, or creating pull requests. |

---

## Core Invariants

1. Protected Directory: `greasyfork-release/` is strictly immutable to automated tools. All automated builds must target `dist/`.
2. Zero Telemetry: No external network requests (`fetch`, `XMLHttpRequest`, `GM.xmlHttpRequest`).
3. Non-Destructive DOM: Filtered feed elements are hidden via CSS (`display: none`), never removed with `node.remove()`.
4. Local Persistence: User configuration lives exclusively in the local browser instance.
