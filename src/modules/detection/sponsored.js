/**
 * Sponsored Detection Engine
 * Part of FB - Clean My Feeds
 *
 * Implements multi-tier Sponsored post detection heuristics:
 * 1. Indirect SVG use xlink caching (2026 update)
 * 2. Plain text span inspection
 * 3. Shadow DOM canvas + aria-labelledby ID lookup
 * 4. Shadow DOM SVG use[href] element resolution
 * 5. Structural __cft__ payload length heuristic
 *
 * @module modules/detection/sponsored
 */

let cachedSponsoredXlinkId = null;

/**
 * Resets the cached xlink SVG text ID (useful for tests).
 */
export function resetSponsoredXlinkCache() {
  cachedSponsoredXlinkId = null;
}

/**
 * Detects sponsored indicator via Canvas element and aria-labelledby attribute.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean}
 */
export function nf_isSponsored_ShadowRoot1(post, VARS, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc || typeof doc.querySelector !== 'function') return false;
  let hasSponsoredText = false;
  const elCanvas = post.querySelector('a > span > span[aria-labelledby] > canvas');
  if (elCanvas && elCanvas.parentElement) {
    const elementId = elCanvas.parentElement.getAttribute('aria-labelledby');
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
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean}
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
 * Detects sponsored indicator via indirect SVG xlink chaining and caches the ID.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean}
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

      while (currentId && depth < 4) {
        const el = doc.getElementById(currentId);
        if (!el) break;

        if (
          el.tagName.toLowerCase() === 'text' &&
          VARS?.dictionarySponsored?.includes(el.textContent.trim().toLowerCase())
        ) {
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
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing dictionarySponsored
 * @returns {boolean}
 */
export function nf_isSponsored_Plain(post, VARS) {
  let hasSponsoredText = false;
  const queryElement = 'div[id] > span > a[role="link"] > span';
  const elSpans = post.querySelectorAll(queryElement);

  for (const elSpan of elSpans) {
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
 * Orchestrator determining if a post is sponsored across all feeds.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if post is sponsored
 */
export function isSponsored(post, VARS, doc = (typeof document !== 'undefined' ? document : null)) {
  let isSponsoredPost = false;

  if (VARS.isNF) {
    // 1. 2026 xlink resolution
    isSponsoredPost = nf_isSponsored_xlink(post, VARS, doc);

    // 2. Plain text
    if (!isSponsoredPost) {
      isSponsoredPost = nf_isSponsored_Plain(post, VARS);
    }

    // 3. Shadow Root Canvas
    if (!isSponsoredPost) {
      isSponsoredPost = nf_isSponsored_ShadowRoot1(post, VARS, doc);
      // 4. Shadow Root SVG Use
      if (!isSponsoredPost) {
        isSponsoredPost = nf_isSponsored_ShadowRoot2(post, VARS, doc);
      }
    }
  }

  // 5. Structure heuristic via __cft__ query param length
  if (!isSponsoredPost) {
    const PARAM_FIND = '__cft__[0]=';
    const PARAM_MIN_SIZE = VARS.isSF ? 250 : VARS.isVF ? 299 : 311;

    let elLinks = [];
    if (VARS.isNF || VARS.isGF) {
      elLinks = Array.from(
        post.querySelectorAll(
          `div[aria-posinset] span > a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`
        )
      );
      if (elLinks.length === 0) {
        elLinks = Array.from(
          post.querySelectorAll(
            `div[aria-describedby] span > a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`
          )
        );
      }
    } else if (VARS.isVF) {
      elLinks = Array.from(
        post.querySelectorAll(`div > div > div > div > span > span > div > a[href*="${PARAM_FIND}"]`)
      );
    } else if (VARS.isSF) {
      elLinks = Array.from(post.querySelectorAll(`div[role="article"] span > a[href*="${PARAM_FIND}"]`));
    }

    if (elLinks.length > 0 && elLinks.length < 10) {
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
