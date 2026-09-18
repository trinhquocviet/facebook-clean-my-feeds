# Facebook Feed Post Detection Rules & Reverse-Engineering Guide

This document serves as the authoritative reference manual for maintainers explaining how **FB - Clean My Feeds** detects, classifies, and neutralizes unwanted content across Facebook feeds.

Because Facebook continuously mutates DOM class names, splits words across shadow boundaries, embeds canvas elements, and obfuscates sponsored indicators, the userscript relies on structural DOM topology, URL parameter analysis, and heuristic ladders rather than static CSS classes.

---

## 1. News Feed Detection Rules (`src/modules/detection/rules/news-feed.js`)

The News Feed cleaner evaluates candidate posts against a sequence of 14 specialized detection functions:

| Function | Targeted Content | Detection Technique & Signature |
| :--- | :--- | :--- |
| `nf_isSponsored` | Sponsored / Ad posts | Multi-layered detection: Shadow DOM canvas, indirect SVG `xlink:href`, colon-prefixed `:r*:` aria labels, and `__cft__[0]=` tracking parameter length (>35 chars). |
| `nf_isShortReelVideo` | Reels and Short Videos | Scans for anchor links containing `/reel/` or `/reels_together/`. Uses a 3-tier selector ladder to climb from link to post ancestor. |
| `nf_isPeopleYouMayKnow` | "People You May Know" (PYMK) | Queries links containing `/friends/` or `/profile.php?id=` alongside add-friend or profile-card buttons inside carousel containers. |
| `nf_isPaidPartnership` | Paid Partnerships | Matches anchor links pointing to `facebook.com/help/` topics regarding branded content or paid partnership disclosures. |
| `nf_postExceedsLikeCount` | Posts exceeding like count threshold | Parses like counts formatted in standard ASCII or Eastern Arabic / Devanagari / Bengali / Gurmukhi numerals using regex and converts `K`/`M` notation via `getFullNumber()`. |
| `nf_isUnjoinedGroupPost` | Suggested unjoined group posts | Scans post headers for links containing `/groups/` where a child `role="button"` contains "Join" / "Tham gia" text, indicating the user is not a member. |
| `nf_isFollowPost` | Follow suggestion posts | Searches for header action buttons explicitly prompting "Follow" / "Theo dõi" next to page titles. |
| `nf_isSuggested` | General suggested feed units | Detects "Suggested for you" / "Gợi ý cho bạn" header text using dictionary lookups and ancestor hierarchy climbing. |
| `nf_isShareCount` | Share counter display | Identifies share counter metadata nodes and hides them without collapsing the parent post. |
| `nf_isNotifyMe` | "Notify Me" event reminders | Detects notification reminder cards for upcoming live events or product launches. |
| `nf_isQnA` | Question & Answer cards | Detects interactive Q&A discussion modules injected into feeds. |
| `nf_isEvents` | Suggested events | Matches `/events/` links and RSVP invitation cards. |
| `nf_isGames` | Facebook Gaming / Instant Games | Matches `/gaming/` links and Instant Game promotional blocks. |
| `nf_isStories` | Stories carousel container | Detects stories rail containers and climbs 4 or 7 ancestor levels to hide the entire horizontal tray. |

### Unicode Numeral Extraction Regex
Facebook renders like counts in localized scripts depending on user locale. The script uses a comprehensive Unicode numeral pattern:
```javascript
const UNICODE_DIGITS_RE = /[\d\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0E50-\u0E59]/;
```
Supported numeral scripts:
- `\d`: Standard ASCII (0–9)
- `\u0660-\u0669`: Arabic-Indic digits
- `\u06F0-\u06F9`: Eastern Arabic-Indic / Persian digits
- `\u0966-\u096F`: Devanagari digits (Hindi, Marathi, Nepali)
- `\u09E6-\u09EF`: Bengali digits
- `\u0A66-\u0A6F`: Gurmukhi digits (Punjabi)
- `\u0E50-\u0E59`: Thai digits

---

## 2. Sponsored Post Obfuscation Countermeasures (`src/modules/detection/sponsored.js`)

Facebook uses sophisticated anti-ad-block evasion tactics to conceal the "Sponsored" label. The script deploys four independent detection layers:

### Layer 1: Shadow Root 1 (Canvas & Colon-Prefixed Aria Tokens)
- **The Facebook Tactic**: Facebook renders the word "Sponsored" onto an HTML5 `<canvas>` element inside a closed/open shadow root, or scatters letters across separate `<span>` tags referenced by colon-prefixed aria IDs (e.g. `aria-labelledby=":r1a: :r1b:"`).
- **Our Countermeasure** (`nf_isSponsored_ShadowRoot1`):
  - Traverses `span[dir="auto"]` elements with attached shadow roots.
  - Detects `<canvas>` elements within the shadow root and tests computed letter widths.
  - Resolves space-separated `aria-labelledby` IDs to reconstruct the hidden label.

### Layer 2: Shadow Root 2 (`<use>` & `<image>` Elements)
- **The Facebook Tactic**: Injects an `<svg>` element containing a `<use href="#...">` or `<image href="...">` pointing to internal SVG glyph definitions representing the letters S-p-o-n-s-o-r-e-d.
- **Our Countermeasure** (`nf_isSponsored_ShadowRoot2`):
  - Queries shadow roots for `use[*|href]`, `image[*|href]`, and SVG paths.
  - Evaluates href target IDs against known sponsored vector glyph signatures.

### Layer 3: Indirect SVG `xlink:href` Resolution & Caching
- **The Facebook Tactic**: Renders an inline SVG that references an `<svg id="...">` defined elsewhere in the document via `xlink:href="#svg_id"`.
- **Our Countermeasure** (`nf_isSponsored_xlink`):
  - Resolves the target SVG symbol by ID.
  - Inspects text content or path complexity of the resolved target.
  - Caches matched IDs in memory (`xlinkSponsoredCache = new Set()`) so subsequent posts resolve in **O(1)** time without repeating DOM lookups.

### Layer 4: Tracking Parameter Length Heuristic (`__cft__[0]=`)
- **The Facebook Tactic**: Sponsored posts always route outbound click interactions through Facebook's server-side ad attribution tracker (`__cft__[0]=...`).
- **Our Countermeasure** (`isSponsored`):
  - Inspects feed anchor tags for `__cft__[0]=`.
  - Organic posts have short or omitted parameters. When the extracted value exceeds **35 characters** and the post matches secondary candidate heuristics, the item is classified as Sponsored with high confidence.

---

## 3. Groups Feed Detection (`src/modules/detection/rules/groups.js`)

In `/groups` stream feeds and individual group pages (`/groups/<id>`):
- **Suggested Content** (`gf_isSuggested`):
  - Matches 3-tiered CSS class patterns for suggested group posts.
  - Inspects header badge icons marked with Facebook's visual completion indicators (`data-visualcompletion="css-img"`).
- **Embedded Group Reels** (`gf_isShortReelVideo`):
  - Detects short-form video cards injected between organic group discussions.
- **Performance Heuristic**:
  - Stream group feeds can be infinitely long. `mopUpTheGroupsFeed` optimizes execution by limiting scanning to the **last 25 posts** in the DOM during continuous scrolling.

---

## 4. Videos & Watch Feed Detection (`src/modules/detection/rules/videos.js`)

In `/watch` and video feeds:
- **Live Broadcast Badges** (`vf_isVideoLive`):
  - Identifies red "LIVE" badge indicators, active live stream chat overlays, and audio broadcast icons.
- **Instagram Cross-Posts** (`vf_isInstagram`):
  - Matches cross-posted video units displaying the official Instagram SVG camera badge.
- **Duplicate Video Deduplication** (`vf_hideDuplicateVideos`):
  - Facebook's Watch feed frequently re-injects identical video cards during infinite scroll.
  - Normalizes URLs across two Facebook video formats:
    - Pattern 1: `/watch?v=<id>`
    - Pattern 2: `/<user>/videos/<id>/`
  - Maintains a session Map of seen video IDs; preserves the **first occurrence** (index 0) and hides duplicate instances.
- **Skeleton Cards**: Skips unrendered placeholder cards where `countDescendants(card) < 3` to prevent premature classification.

---

## 5. Marketplace Feed Detection (`src/modules/detection/text-filter.js` & `marketplace-cleaner.js`)

In `/marketplace`:
- **Price Range Blocking** (`mp_getBlockedPrices`):
  - Extracts price tokens formatted in currency symbols (`$`, `₫`, `€`, `£`, etc.).
  - Filters out listings priced below minimum or above maximum user-configured thresholds.
- **URL Decontamination**:
  - Facebook appends extensive `?ref=` and click tracking queries to Marketplace item links. `mp_stopTrackingDirtIntoMyHouse()` strips these queries, cleaning URLs to canonical form (`/marketplace/item/<id>/`).
- **Item Cards vs Landing Pages**:
  - Differentiates between personalized feed listings (`/item/`) and non-personalized category exploration (`/np/item/`).
  - Employs `cmfsmp` attribute caching to store `innerHTML.length`, skipping unchanged marketplace cards.

---

## 6. Scanner & Scrubber Utilities (`src/modules/detection/scanner.js` & `scrubbers.js`)

- **`doLightDusting(post)`**:
  - Scans outbound hyperlinks within clean posts.
  - Strips Facebook tracking parameters: `__cft__`, `__tn__`, `notif_t`, `notif_id`, `ref`, `epa`.
- **`mp_scanTreeForText(node)`**:
  - High-speed `TreeWalker` scanner using `NodeFilter.SHOW_TEXT`.
  - Excludes Facebook branding tokens ("Facebook"), empty lines, and non-content tags.
- **`scanImagesForAltText(node)`**:
  - Extracts image `alt` attributes to detect keyword matches in photo descriptions.
  - **Dimension Filter**: Rejects images where both width and height are `<= 32px` to prevent inline emoji smileys from triggering false positive keyword matches.
- **`swatTheMosquitos(post)`**:
  - Facebook feed posts often embed auto-playing distracting animated GIFs in comments or headers.
  - Detects GIF elements and pauses animation rendering via opacity adjustments without hiding the actual post.
- **Right Sidebar Console Cleaning** (`nf_cleanTheConsoleTable`):
  - Scans right-hand auxiliary column for ad slots while explicitly preserving birthdays, contacts, and upcoming event widgets.
