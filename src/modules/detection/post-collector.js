/**
 * Post Collector Module
 * Part of FB - Clean My Feeds
 *
 * Discovers and queries post container elements in the News Feed stream,
 * handling custom tags (e.g. `[a-zA-Z0-9]+-[a-zA-Z0-9]+`) and multi-tier
 * query selector fallbacks across different Facebook layouts.
 *
 * @module modules/detection/post-collector
 */

/**
 * Queries the document to collect active news feed post elements.
 *
 * ## Architectural Background
 * Facebook's News Feed stream serves a dynamic mixture of HTML structures across
 * different regions, AB-test buckets, and user locales. Furthermore, Facebook
 * continuously modifies container nesting depth and periodically injects custom
 * Web Component tag names (e.g. `<ybrgmpsb-unlrhoua>`) to disrupt static CSS selector engines.
 *
 * ## Strategy & Query Ladder
 * 1. **Root Anchor**: Anchors on the News Feed header landmark `[dir=auto]:is(h2, h3) ~ div:not([class])`.
 * 2. **Custom Tag Detection**: Queries siblings of `.x1lliihq` to detect randomized autonomous custom tags
 *    matching the pattern `[a-zA-Z0-9]+-[a-zA-Z0-9]+`.
 * 3. **Deep Selector Ladder**:
 *    - If a custom tag is found: navigates 10 levels deep through `*:is(span, div)` children.
 *    - If standard layout: executes a cascading query ladder (4 levels deep from `.x1lliihq`,
 *      5 levels deep from root, or wildcard-descendant traversal).
 * 4. **International / Non-English Fallbacks**:
 *    - Taps into `data-pagelet*="FeedUnit_"` descendants beneath `div[role="feed"]`.
 * 5. **Post Isolation**:
 *    - Note that when a post is hidden, a `<details>` wrapper is injected around it. The direct child
 *      combinator (`>`) in our queries naturally excludes already-wrapped posts from future collections.
 *
 * @param {Document} [doc=document] - DOM document or shadow root context to search
 * @returns {Array<HTMLElement>} Collection of matching post DOM elements
 */
export function nf_getCollectionOfPosts(doc = document) {
  let posts = [];
  const rootSelector = '[dir=auto]:is(h2, h3) ~ div:not([class])';

  // Detect randomized customTag format (e.g. ybrgmpsb-unlrhoua)
  // When Facebook tests Web Component obfuscation, non-div/span custom elements appear next to .x1lliihq
  const customTagSelector = `${rootSelector} [class="x1lliihq"]:is(div, span)~*:not(div, span)`;
  const detectedElement = doc.querySelector(customTagSelector);
  const detectedTagName = detectedElement?.tagName || '';
  const customTag = /[a-zA-Z0-9]+-[a-zA-Z0-9]+/.test(detectedTagName) ? detectedTagName.toLowerCase() : '';

  const queries = [
    // Ladder Tier 1: Modern layouts with either custom Web Component tags or standard .x1lliihq containers
    ...(customTag.length > 0
      ? [
          // If custom tag detected, navigate 10 levels down through span/div containers
          Array.from({ length: 10 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            `${rootSelector} ${customTag}`
          )
        ]
      : [
          // Standard English layouts: 4-5 levels deep through span/div combinations
          Array.from({ length: 4 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            `${rootSelector} [class="x1lliihq"]:is(div, span)`
          ),
          Array.from({ length: 5 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            rootSelector
          ),
          Array.from({ length: 5 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            `${rootSelector} > * * * * *`
          )
        ]),

    // Ladder Tier 2: Non-English locales and legacy feed layouts utilizing FeedUnit pagelets
    'div[role="feed"] > h3[dir="auto"] ~ div:not([class]) > div[data-pagelet*="FeedUnit_"] > div > div > div > div',
    'div[role="feed"] > h2[dir="auto"] ~ div:not([class]) > div[data-pagelet*="FeedUnit_"] > div > div > div > div'
  ];

  for (const query of queries) {
    const nodeList = doc.querySelectorAll(query);
    if (nodeList.length > 0) {
      posts = Array.from(nodeList);
      break;
    }
  }

  return posts;
}
