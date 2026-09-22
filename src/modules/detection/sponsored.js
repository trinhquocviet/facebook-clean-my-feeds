/**
 * Sponsored Detection Engine
 * Part of FB - Clean My Feeds
 *
 * Implements multi-tier Sponsored post detection heuristics:
 * 1. Indirect SVG use xlink caching (fast O(1) matching after first resolution)
 * 2. Plain text span inspection (for regions without SVG obfuscation)
 * 3. Shadow DOM canvas + aria-labelledby colon-prefixed ID lookup
 * 4. Shadow DOM SVG use[href] element resolution
 * 5. Structural __cft__ tracking parameter payload length heuristic
 *
 * @module modules/detection/sponsored
 */

let cachedSponsoredXlinkId = null;

/**
 * Resets the cached xlink SVG text ID (useful for tests or language switches).
 */
export function resetSponsoredXlinkCache() {
  cachedSponsoredXlinkId = null;
}

/**
 * Detects sponsored indicator via Canvas element and aria-labelledby attribute.
 *
 * Mechanism:
 * In certain locales, Facebook hides the "Sponsored" label behind a `<canvas>` element
 * whose parent span carries an `aria-labelledby` attribute pointing to a detached
 * element ID starting with a colon (e.g. `:r1a:`).
 * The target element contains the plain text "Sponsored" in the user's language.
 * Note: During initial page load, Facebook may lag slightly in rendering the detached target,
 * so hit rates improve after DOM hydration.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if post matches sponsored canvas pattern
 */
export function nf_isSponsored_ShadowRoot1(post, VARS, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc || typeof doc.querySelector !== 'function') return false;
  let hasSponsoredText = false;
  const elCanvas = post.querySelector('a > span > span[aria-labelledby] > canvas');
  if (elCanvas && elCanvas.parentElement) {
    const elementId = elCanvas.parentElement.getAttribute('aria-labelledby');
    // Colon-prefixed IDs (e.g. ":r1a:") require escaping in querySelector
    if (elementId && elementId.slice(0, 1) === ':') {
      const escapedId = elementId.replace(/(:)/g, '\\$1');
      const elSpan = doc.querySelector(`[id="${escapedId}"]`);
      if (elSpan) {
        const lcText = elSpan.textContent.trim().toLowerCase();
        hasSponsoredText = VARS?.dictionarySponsored?.includes(lcText) ?? false;
      }
    }
  }
  return hasSponsoredText;
}

/**
 * Detects sponsored indicator via SVG use[href] element reference.
 *
 * Mechanism:
 * Facebook renders an `<svg><use href="#id">` referencing a `<text>` node
 * elsewhere in the document whose text content matches the localized "Sponsored" keyword.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if post matches sponsored SVG use reference
 */
export function nf_isSponsored_ShadowRoot2(post, VARS, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc || typeof doc.querySelector !== 'function') return false;
  let hasSponsoredText = false;
  const elUse = post.querySelector('a > span > span[aria-labelledby] svg > use[*|href]');
  if (elUse) {
    const elementId = elUse.href?.baseVal || elUse.getAttribute('href') || elUse.getAttribute('xlink:href') || '';
    if (elementId !== '' && elementId.slice(0, 1) === '#') {
      const elText = doc.querySelector(`${elementId}`);
      if (elText) {
        const lcText = elText.textContent.trim().toLowerCase();
        hasSponsoredText = VARS?.dictionarySponsored?.includes(lcText) ?? false;
      }
    }
  }
  return hasSponsoredText;
}

/**
 * Detects sponsored indicator via indirect SVG xlink chaining and caches the root ID.
 *
 * Architecture & Obfuscation Countermeasure:
 * Facebook employs an indirect SVG chaining scheme where posts reference an SVG icon via:
 * `<svg><use xlink:href="#<root_svg_id>"></svg>`
 * That root SVG in turn contains another `<use>` linking to a second symbol, which links to
 * a third, eventually terminating at a `<text>` node containing the localized word "Sponsored".
 *
 * Walking this 4-level deep chain on every post during fast scroll causes layout reflows.
 * Instead, this function resolves the chain once across the document, caches the root SVG ID
 * in `cachedSponsoredXlinkId`, and then tests candidate posts using an ultra-fast O(1) query:
 * `post.querySelector('svg use[xlink\\:href="#<cached_id>"]')`.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if post contains the resolved sponsored SVG xlink
 */
export function nf_isSponsored_xlink(post, VARS, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc || typeof doc.querySelectorAll !== 'function') return false;
  if (!cachedSponsoredXlinkId) {
    const svgRoots = doc.querySelectorAll('svg[id]');

    for (const svg of svgRoots) {
      const firstUse = svg.querySelector('use');
      if (!firstUse) continue;

      const href = firstUse.getAttribute('xlink:href') || firstUse.getAttribute('href');
      if (!href) continue;

      let currentId = href.replace(/^#/, '');
      let depth = 0;

      // Traverse indirect xlink reference chain (max depth 4)
      while (currentId && depth < 4) {
        const el = doc.getElementById(currentId);
        if (!el) break;

        // Check if final node is a <text> element containing localized 'Sponsored'
        if (
          el.tagName.toLowerCase() === 'text' &&
          VARS?.dictionarySponsored?.includes(el.textContent.trim().toLowerCase())
        ) {
          // Cache the indirect ID (the root symbol that individual posts reference)
          cachedSponsoredXlinkId = svg.id;
          break;
        }

        const nextUse = el.querySelector?.('use');
        if (!nextUse) break;

        const nextHref = nextUse.getAttribute('xlink:href') || nextUse.getAttribute('href');
        if (!nextHref) break;

        currentId = nextHref.replace(/^#/, '');
        depth++;
      }

      if (cachedSponsoredXlinkId) break;
    }
  }

  if (!cachedSponsoredXlinkId) return false;

  return !!post.querySelector(
    `svg use[xlink\\:href="#${cachedSponsoredXlinkId}"], svg use[href="#${cachedSponsoredXlinkId}"]`
  );
}

/**
 * Detects plain text sponsored labels in spans without SVG children.
 * Works for regions and languages where Facebook presents an unobfuscated text label.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @returns {boolean} True if plain text sponsored label is found
 */
export function nf_isSponsored_Plain(post, VARS) {
  let hasSponsoredText = false;
  const queryElement = 'div[id] > span > a[role="link"] > span';
  const elSpans = post.querySelectorAll(queryElement);

  for (const elSpan of elSpans) {
    // Only inspect spans without SVG children (avoid false positives on mixed icon blocks)
    if (!elSpan.querySelector('svg')) {
      const lcText = elSpan.textContent.trim().toLowerCase();
      if (VARS?.dictionarySponsored?.includes(lcText)) {
        hasSponsoredText = true;
        break;
      }
    }
  }

  return hasSponsoredText;
}

/**
 * Master Sponsored Detection Orchestrator.
 * Evaluates candidate posts across News Feed, Groups Feed, Videos Feed, and Search Feed.
 *
 * Execution Waterfall:
 * 1. Indirect SVG xlink cache resolution (2026 update, fastest & most resilient).
 * 2. Plain text span inspection (simple structure fallback).
 * 3. Shadow DOM Canvas + aria-labelledby ID lookup.
 * 4. Shadow DOM SVG Use element reference.
 * 5. Structural tracking parameter heuristic: Inspects `__cft__[0]=` URL payload size.
 *    - Search Feed (isSF): Threshold >= 250 characters.
 *    - Videos Feed (isVF): Threshold >= 299 characters.
 *    - News/Groups Feed (isNF, isGF): Threshold >= 311 characters.
 *    Link Count Guard: Only posts with 1 to 9 links are checked. Posts with >= 10 links
 *    are complex reshared / embedded items that are extremely unlikely to be direct ads.
 *    Only the first 2 links are inspected to prevent false positives when Facebook dynamically
 *    mutates lower links during video playback.
 *
 * @param {HTMLElement} post - Candidate post element
 * @param {Object} VARS - Application state containing feed flags and dictionary
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if post is classified as sponsored
 */
export function isSponsored(post, VARS, doc = (typeof document !== 'undefined' ? document : null)) {
  let isSponsoredPost = false;

  if (VARS.isNF) {
    // Tier 1: Indirect SVG xlink resolution
    isSponsoredPost = nf_isSponsored_xlink(post, VARS, doc);

    // Tier 2: Plain text span
    if (!isSponsoredPost) {
      isSponsoredPost = nf_isSponsored_Plain(post, VARS);
    }

    // Tier 3 & 4: Shadow root canvas / SVG use lookups
    if (!isSponsoredPost) {
      isSponsoredPost = nf_isSponsored_ShadowRoot1(post, VARS, doc);
      if (!isSponsoredPost) {
        isSponsoredPost = nf_isSponsored_ShadowRoot2(post, VARS, doc);
      }
    }
  }

  // Tier 5: Structural heuristic via __cft__[0]= tracking parameter length
  if (!isSponsoredPost) {
    const PARAM_FIND = '__cft__[0]=';
    const PARAM_MIN_SIZE = VARS.isSF ? 250 : VARS.isVF ? 299 : 311;

    let elLinks = [];
    if (VARS.isNF || VARS.isGF) {
      // News Feed & Groups Feed links
      elLinks = Array.from(
        post.querySelectorAll(
          `div[aria-posinset] span > a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`
        )
      );
      if (elLinks.length === 0) {
        // Fallback for layouts lacking aria-posinset
        elLinks = Array.from(
          post.querySelectorAll(
            `div[aria-describedby] span > a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`
          )
        );
      }
      if (elLinks.length === 0) {
        // Fallback for layouts lacking standard wrappers
        elLinks = Array.from(
          post.querySelectorAll(
            `span > a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`
          )
        );
      }
      if (elLinks.length === 0) {
        // Ultimate fallback
        elLinks = Array.from(
          post.querySelectorAll(
            `a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`
          )
        );
      }
    } else if (VARS.isVF) {
      // Watch Videos feed structure
      elLinks = Array.from(
        post.querySelectorAll(`div > div > div > div > span > span > div > a[href*="${PARAM_FIND}"]`)
      );
      if (elLinks.length === 0) {
        elLinks = Array.from(post.querySelectorAll(`span > a[href*="${PARAM_FIND}"]`));
      }
      if (elLinks.length === 0) {
        elLinks = Array.from(post.querySelectorAll(`a[href*="${PARAM_FIND}"]`));
      }
    } else if (VARS.isSF) {
      // Search Feed article structure
      elLinks = Array.from(post.querySelectorAll(`div[role="article"] span > a[href*="${PARAM_FIND}"]`));
      if (elLinks.length === 0) {
        elLinks = Array.from(post.querySelectorAll(`span > a[href*="${PARAM_FIND}"]`));
      }
      if (elLinks.length === 0) {
        elLinks = Array.from(post.querySelectorAll(`a[href*="${PARAM_FIND}"]`));
      }
    }

    // Guard: > 0 means links found; < 10 excludes embedded / reshared posts
    if (elLinks.length > 0 && elLinks.length < 10) {
      // Inspect first 2 links only (FB alters 4th/5th links after video play)
      const elMax = Math.min(2, elLinks.length);

      for (let i = 0; i < elMax; i++) {
        const el = elLinks[i];
        const pos = el.href ? el.href.indexOf(PARAM_FIND) : -1;
        if (pos >= 0) {
          if (el.href.slice(pos).length >= PARAM_MIN_SIZE) {
            isSponsoredPost = true;
            break;
          }
        }
      }
    }
  }

  return isSponsoredPost;
}

