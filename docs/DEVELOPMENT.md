# Developer & Contribution Guide

## 1. Environment & Prerequisites

- Toolchain Runtime: [Bun](https://bun.sh) (v1.4.0+)
- Primary Script Target: Modern browsers running Tampermonkey or Violentmonkey
- Shell: Bash / Zsh compatible

```bash
# Clone repository
git clone https://github.com/trinhquocviet/facebook-clean-my-feeds.git
cd facebook-clean-my-feeds

# Install dependencies
bun install
```

---

## 2. Command Reference

| Command | Action | Output / Target |
| :--- | :--- | :--- |
| `bun run build` | Bundles `src/index.js` using Bun + Terser, prepending userscript metadata banner. | `dist/fb-clean-my-feeds.user.js` |
| `bun run dev` *(or `bun run watch`)* | Watches `src/` for file changes and triggers automatic rebuilds. | `dist/fb-clean-my-feeds.user.js` |
| `bun test` | Executes the complete test suite across all 25 test files (201 tests, 1469 assertions). | Console output |
| `bun run clean` | Deletes the `dist/` build directory. | `dist/` removed |

---

## 3. Critical Invariants

1. **Protected Release Directory**:
   - `greasyfork-release/` is strictly immutable to automated tools.
   - All automated builds, compilation targets, and test scripts must output to `dist/fb-clean-my-feeds.user.js`.
   - Modifying `greasyfork-release/` is strictly reserved for manual maintainer releases.
2. **Zero Telemetry & Privacy**:
   - No external network requests (`fetch()`, `XMLHttpRequest`, `GM.xmlHttpRequest`).
   - No dynamic code execution (`eval()`, `new Function()`).
   - All dependencies must be bundled locally.
3. **DOM Non-Destruction**:
   - Never use `element.remove()` or `parentNode.removeChild()` on Facebook feed posts. Elements must be hidden using `<details><summary>` reparenting and CSS rules.

---

## 4. Localization (i18n) Workflow

The project maintains 23 discrete language translation dictionaries in `src/i18n/locales/`. Each locale file exports an object providing 86 required keys.

### 4.1 Adding a New Locale
1. Create `src/i18n/locales/<lang_code>.js` using `src/i18n/locales/en.js` as the template:
   ```javascript
   export default {
     "LANGUAGE_DIRECTION": "ltr",
     "SPONSORED": "Sponsored",
     "DLG_TITLE": "Clean my feeds - simplified UI",
     // ... all 86 keys
   };
   ```
2. Register the new locale in `src/i18n/locales/index.js`:
   ```javascript
   import newLang from './newLang.js';

   export default {
     // ... existing locales
     newLang,
   };
   ```
3. Update mappings in `src/i18n/defaults.js` if custom alias resolution is required.
4. Verify key completeness via tests:
   ```bash
   bun test tests/i18n/translations.test.js
   ```

---

## 5. Test Suite Structure

Automated tests are located in `tests/` and run natively with `bun test`. The suite encompasses **25 test files**, **201 unit tests**, and **1,469 assertions**:

| Directory | Target Component | Coverage Description |
| :--- | :--- | :--- |
| `tests/constants/` | `src/constants/` | Verifies DOM selectors, DB namespace keys, asset icons, and runtime constants. |
| `tests/detection/` | `src/modules/detection/` | Tests all News Feed, Groups, Video rules, Shadow DOM canvas detection, SVG xlink caching, tracking query heuristics, and TreeWalker scanners. |
| `tests/dialog/` | `src/modules/dialog/` | Validates modal construction, component factories, and search filters. |
| `tests/dirty-checker/` | `src/modules/dirty-checker/` | Tests length delta heuristic (>16 chars) across News Feed, Marketplace, Search, and Profile pages. |
| `tests/feed-cleaners/` | `src/modules/feed-cleaners/` | Tests feed cleaner waterfall, dirty skipping, and post hiding calls. |
| `tests/feed-router/` | `src/modules/feed-router/` | Tests SPA URL pattern routing and chronological feed (`?sk=h_chr`) redirection. |
| `tests/i18n/` | `src/i18n/` | Validates key completeness (86 keys) and fallback resolution across all 23 locales. |
| `tests/lifecycle/` | `src/modules/lifecycle/` | Tests 5-tier adaptive sleep ramping, scroll wake-up, and SPA navigation listener. |
| `tests/post-obscurer/` | `src/modules/post-obscurer/` | Tests `<details><summary>` DOM reparenting, class duplication, and CPID consecutive post aggregation. |
| `tests/state/` | `src/state/` | Tests initial state creation, property stabilization, and option containers. |
| `tests/style-injector/` | `src/modules/style-injector/` | Tests session-randomized attributes and stylesheet injection. |
| `tests/styles/` | `src/styles/` | Tests CSS rule generators, dark mode styling, and variable interpolation. |
| `tests/user/` | `src/modules/user/` | Tests defaults normalization, regex compiler, and storage handlers. |
| `tests/utils/` | `src/utils/` | Tests DOM traversal, CSS builder, numeric parser, string normalizer, and URL parsing utilities. |

---

## 6. Pull Request Guidelines

1. Ensure all tests pass: `bun test` (201 pass, 0 fail).
2. Ensure bundle builds cleanly: `bun run build`.
3. Verify git status has no unintended changes in `greasyfork-release/`.
4. Follow Conventional Commits format (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
