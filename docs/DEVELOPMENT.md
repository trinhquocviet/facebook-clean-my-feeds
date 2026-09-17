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
| `bun test` | Executes the complete test suite across 16 test files. | Console output (146+ tests) |
| `bun run clean` | Deletes the `dist/` build directory. | `dist/` removed |

---

## 3. Critical Invariants

1. Protected Release Directory:
   - `greasyfork-release/` is strictly immutable to automated tools.
   - All automated builds, compilation targets, and test scripts must output to `dist/fb-clean-my-feeds.user.js`.
   - Modifying `greasyfork-release/` is strictly reserved for manual maintainer releases.
2. Zero Telemetry & Privacy:
   - No external network requests (`fetch()`, `XMLHttpRequest`, `GM.xmlHttpRequest`).
   - No dynamic code execution (`eval()`, `new Function()`).
   - All dependencies must be bundled locally.
3. DOM Non-Destruction:
   - Never use `element.remove()` or `parentNode.removeChild()` on Facebook feed posts. Elements must be hidden using CSS (`display: none !important`).

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

Automated tests are located in `tests/` and run natively with `bun test`.

| Directory | Target Component | Coverage |
| :--- | :--- | :--- |
| `tests/constants/` | `src/constants/` | Verifies DOM selectors, DB namespace keys, and runtime constants. |
| `tests/dialog/` | `src/modules/dialog/` | Validates modal construction, component factories, and search filters. |
| `tests/i18n/` | `src/i18n/` | Validates key completeness (86 keys) and fallback resolution across 23 locales. |
| `tests/post-obscurer/` | `src/modules/post-obscurer/` | Tests post hiding styles, badge builder, and consecutive grouping. |
| `tests/state/` | `src/state/` | Tests reactive state store listeners, mutation handlers, and getters. |
| `tests/styles/` | `src/styles/` | Tests CSS rule generators and theme variable fallbacks. |
| `tests/user/` | `src/modules/user/` | Tests defaults normalization, regex compiler, and storage handlers. |
| `tests/utils/` | `src/utils/` | Tests DOM, CSS, number, text, theme, and URL parsing utilities. |

---

## 6. Pull Request Guidelines

1. Ensure all tests pass: `bun test`.
2. Ensure bundle builds cleanly: `bun run build`.
3. Verify git status has no unintended changes in `greasyfork-release/`.
4. Follow Conventional Commits format (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
