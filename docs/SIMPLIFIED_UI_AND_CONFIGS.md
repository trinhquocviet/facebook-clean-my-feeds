# Simplified UI & Configuration Guide

## 1. Overview

The Simplified UI edition overhauls the legacy settings dialog into a structured, semantic accordion modal. It maintains all feed detection rules while eliminating deprecated and rarely used configuration options to focus on core feed cleaning functions.

---

## 2. Configuration Schema

User settings are stored as key-value pairs in IndexedDB (`fb_clean_my_feeds` store) and mapped to `AppState.Options`.

### 2.1 Feed Filtering Keys

| Key | Type | Default | Scope | Description |
| :--- | :---: | :---: | :--- | :--- |
| `NF_SPONSORED` | boolean | `true` | News Feed | Hides sponsored ads in News Feed. |
| `NF_SUGGESTIONS` | boolean | `false` | News Feed | Hides suggested/recommended posts. |
| `NF_PEOPLE_YOU_MAY_KNOW` | boolean | `false` | News Feed | Hides friend suggestion cards/carousels. |
| `NF_PAID_PARTNERSHIP` | boolean | `true` | News Feed | Hides influencer paid partnership posts. |
| `NF_REELS_SHORT_VIDEOS` | boolean | `false` | News Feed | Hides short reels and video sections. |
| `NF_STORIES` | boolean | `false` | News Feed | Hides stories sections. |
| `NF_SURVEY` | boolean | `false` | News Feed | Hides survey prompt cards. |
| `NF_FOLLOW` | boolean | `false` | News Feed | Hides suggested profile follow cards. |
| `NF_AUTO_REDIR_TO_MOST_RECENT` | boolean | `false` | News Feed | Redirects root home navigation to chronological feed. |
| `NF_LIKES_MAXIMUM` | boolean | `false` | News Feed | Enables threshold filtering by number of Likes. |
| `NF_LIKES_MAXIMUM_COUNT` | string | `""` | News Feed | Maximum Likes count threshold value. |
| `GF_SPONSORED` | boolean | `true` | Groups Feed | Hides sponsored posts in Groups. |
| `GF_SUGGESTIONS` | boolean | `false` | Groups Feed | Hides suggested posts and topic recommendations in Groups. |
| `GF_PAID_PARTNERSHIP` | boolean | `true` | Groups Feed | Hides paid partnership posts in Groups. |
| `VF_SPONSORED` | boolean | `true` | Videos Feed | Hides sponsored video listings. |
| `VF_DUPLICATE_VIDEOS` | boolean | `false` | Videos Feed | Suppresses duplicate video entries during scroll. |
| `VF_LIVE` | boolean | `false` | Videos Feed | Hides live broadcasts. |
| `REELS_CONTROLS` | boolean | `true` | Reels | Forces standard video playback controls. |
| `REELS_DISABLE_LOOPING` | boolean | `true` | Reels | Stops automatic looping on Reels. |
| `MP_SPONSORED` | boolean | `true` | Marketplace | Hides sponsored merchant cards in Marketplace. |

### 2.2 Text and Regular Expression Filter Keys

| Key | Type | Default | Scope | Description |
| :--- | :---: | :---: | :--- | :--- |
| `GLOBAL_BLOCKED_ENABLED` | boolean | `false` | Global | Activates keyword filtering across all feeds. |
| `GLOBAL_BLOCKED_RE` | boolean | `false` | Global | Treats global filter lines as JavaScript Regular Expressions. |
| `GLOBAL_BLOCKED_TEXT` | string | `""` | Global | Newline-separated keywords or regex patterns. |
| `NF_BLOCKED_ENABLED` | boolean | `false` | News Feed | Activates keyword filtering for News Feed. |
| `NF_BLOCKED_RE` | boolean | `false` | News Feed | Treats News Feed filter lines as Regular Expressions. |
| `NF_BLOCKED_TEXT` | string | `""` | News Feed | Newline-separated keywords or regex patterns. |
| `GF_BLOCKED_ENABLED` | boolean | `false` | Groups Feed | Activates keyword filtering for Groups Feed. |
| `GF_BLOCKED_RE` | boolean | `false` | Groups Feed | Treats Groups Feed filter lines as Regular Expressions. |
| `GF_BLOCKED_TEXT` | string | `""` | Groups Feed | Newline-separated keywords or regex patterns. |
| `VF_BLOCKED_ENABLED` | boolean | `false` | Videos Feed | Activates keyword filtering for Videos Feed. |
| `VF_BLOCKED_RE` | boolean | `false` | Videos Feed | Treats Videos Feed filter lines as Regular Expressions. |
| `VF_BLOCKED_TEXT` | string | `""` | Videos Feed | Newline-separated keywords or regex patterns. |
| `MP_BLOCKED_ENABLED` | boolean | `false` | Marketplace | Activates price and description filtering in Marketplace. |
| `MP_BLOCKED_RE` | boolean | `false` | Marketplace | Treats Marketplace filter lines as Regular Expressions. |
| `MP_BLOCKED_TEXT` | string | `""` | Marketplace | Price keywords or regex patterns. |
| `MP_BLOCKED_TEXT_DESCRIPTION` | string | `""` | Marketplace | Description keywords or regex patterns. |
| `PP_BLOCKED_ENABLED` | boolean | `false` | Profile/Pages | Activates keyword filtering for Profile pages. |
| `PP_BLOCKED_RE` | boolean | `false` | Profile/Pages | Treats Profile filter lines as Regular Expressions. |
| `PP_BLOCKED_TEXT` | string | `""` | Profile/Pages | Newline-separated keywords or regex patterns. |

### 2.3 UI and Display Keys

| Key | Type | Default | Values / Description |
| :--- | :---: | :---: | :--- |
| `DLG_VERBOSITY` | string | `"1"` | Hidden post display mode: `"0"` = No label (display: none); `"1"` = Post hidden badge; `"2"` = Aggregated count bar. |
| `VERBOSITY_DEBUG` | boolean | `false` | When true, outlines matching posts instead of hiding them. |
| `CMF_BTN_OPTION` | string | `"0"` | Floating button screen position: `"0"` = Top Right, `"1"` = Bottom Right, `"2"` = Bottom Left, `"3"` = Top Left. |

---

## 3. Configuration Streamlining: Legacy vs. Simplified UI

### 3.1 Retained & Prioritized
- Primary feed filters: News Feed, Groups, Watch/Videos, Marketplace, Profile/Pages.
- Text & Regular Expression filtering engines.
- Hidden post display options (label, aggregate counter, debug highlight).
- Backup & restore tools (Export/Import JSON).

### 3.2 Pruned & Removed
- Custom Hex Color Pickers: Removed manual color code inputs that conflicted with Facebook's dynamic light and dark theme classes. Replaced with automatic CSS custom properties.
- Obsolete Room Controls: Removed "Create room" detection rules deprecated by Facebook.
- Redundant Layout Hacks: Removed legacy style overrides that targeted outdated Facebook markup.

---

## 4. UI Architecture & Components

- Modal Container: `#fbcmf` injected into `document.body`.
- Accordion Structure: Standard HTML5 `<details>` and `<summary>` wrappers for collapsible sections.
- Input Controls:
  - Checkboxes: `input[type="checkbox"]` with custom toggle styling.
  - Number Inputs: `input[type="text"][inputmode="numeric"]` for Likes count.
  - Textarea: `textarea[name]` for keyword/regex line entry.
  - Search Bar: `input[type="search"]` (without `name` attribute to prevent persisting into user options).
- Theming Tokens: Uses `--fb-cmf-*` CSS variables mapping to Facebook's native variables (`--primary-text`, `--surface-background`, `--card-background`).
- Layout Flow: CSS Logical Properties (`margin-inline-start`, `padding-block`, etc.) to support both LTR and RTL locales natively.

---

## 5. Settings Export/Import Format

Exported files are formatted as standard JSON:

```json
{
  "version": "5.03.00",
  "exportedAt": "2026-09-17T00:00:00.000Z",
  "options": {
    "NF_SPONSORED": true,
    "NF_SUGGESTIONS": false,
    "GLOBAL_BLOCKED_ENABLED": false,
    "GLOBAL_BLOCKED_TEXT": "",
    "DLG_VERBOSITY": "1"
  }
}
```

Validation rules on import:
1. Validates that the input is a valid JSON object.
2. Checks for the `options` property.
3. Merges parsed keys with default options from `src/modules/user/defaults.js`.
4. Persists the merged object to IndexedDB and triggers a reactive state update.
