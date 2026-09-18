/**
 * Text and Keyword Filter Module
 * Part of FB - Clean My Feeds
 *
 * Implements plain text and regular expression keyword matching
 * across News Feed, Groups Feed, Video Feed, Marketplace, and Profile pages.
 *
 * @module modules/detection/text-filter
 */

import { findFirstMatch, findFirstMatchRegExp } from '@/utils/index.js';
import { postAtt, postAttMPSkip } from '@/constants/index.js';
import { extractTextContent, mp_scanTreeForText } from './scanner.js';

/**
 * Checks if text matches any globally blocked words or regular expressions.
 *
 * When `GLOBAL_BLOCKED_ENABLED` is active in user options, this evaluates lowercase
 * post content against `GLOBAL_BLOCKED_TEXT_LC` using either regex or plain substring matching.
 *
 * @param {string} postTexts - Normalized lowercase post text
 * @param {Object} VARS - Shared application state containing Options and Filters
 * @returns {string} Matched keyword/pattern string, or empty string if no match
 */
export function isGloballyBlockedText(postTexts, VARS) {
  if (!VARS?.Options?.GLOBAL_BLOCKED_ENABLED) {
    return '';
  }
  if (VARS.Options.GLOBAL_BLOCKED_RE) {
    return findFirstMatchRegExp(postTexts, VARS.Filters.GLOBAL_BLOCKED_TEXT_LC);
  }
  return findFirstMatch(postTexts, VARS.Filters.GLOBAL_BLOCKED_TEXT_LC);
}

/**
 * Returns the query selector string to segment a News Feed post into functional blocks.
 *
 * ## Block Topology
 * - Block 0: Suggested header / Pill tags
 * - Block 1: Author / group title / heading metadata
 * - Block 2: Post body / text / media content
 * - Block 3: Action bar / info box / comment preview
 * - Block 4: Nested comment thread
 *
 * ## Selector Strategy
 * Some user accounts lack the `[aria-posinset]` attribute on feed elements,
 * presenting `[aria-describedby]` instead. We query 8-level container hierarchies
 * first; if fewer than 2 blocks are found (e.g. following Facebook's Dec 2022 layout change),
 * we cascade to a 9-level container hierarchy.
 *
 * @param {HTMLElement} post - Post root DOM element
 * @returns {string} CSS selector for querying post sub-blocks
 */
export function nf_getBlocksQuery(post) {
  let blocksQuery =
    'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
  const blocks = post.querySelectorAll(blocksQuery);
  if (blocks.length <= 1) {
    // Cascade to 9 levels deep if 8 levels fails to segment the post (FB Dec 2022 change)
    blocksQuery =
      'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
  }
  return blocksQuery;
}

/**
 * Returns the query selector string to segment a Groups Feed post into functional blocks.
 *
 * ## Block Topology
 * Matches the News Feed topology: Block 0 = Suggested headings, Block 1 = title/heading,
 * Block 2 = content, Block 3 = info box/comments, Block 4 = comments.
 *
 * @param {HTMLElement} post - Group post element
 * @returns {string} CSS selector for querying group post sub-blocks
 */
export function gf_getBlocksQuery(post) {
  let blocksQuery =
    'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
  const blocks = post.querySelectorAll(blocksQuery);
  if (blocks.length <= 1) {
    // Dec 2022 layout change: 9 levels deep fallback
    blocksQuery =
      'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
  }
  return blocksQuery;
}

/**
 * Scans News Feed post content blocks for blocked keywords or regex expressions.
 *
 * Evaluates the first 3 functional blocks (excluding nested comments) against
 * `NF_BLOCKED_TEXT_LC`. If no feed-specific rule matches, cascades to global blocked keywords.
 *
 * @param {HTMLElement} post - News feed post element
 * @param {Object} VARS - Application state containing user Options and Filters
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched keyword or empty string
 */
export function nf_isBlockedText(post, VARS, doc = document) {
  const postTexts = extractTextContent(post, nf_getBlocksQuery(post), 3, doc).join(' ').toLowerCase();

  if (VARS.Options.NF_BLOCKED_ENABLED) {
    if (VARS.Options.NF_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.NF_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    } else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.NF_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    }
  }

  return isGloballyBlockedText(postTexts, VARS);
}

/**
 * Scans Groups Feed post content blocks for blocked keywords or regex expressions.
 *
 * Evaluates the first 3 functional blocks against `GF_BLOCKED_TEXT_LC`. If no
 * feed-specific rule matches, cascades to global blocked keywords.
 *
 * @param {HTMLElement} post - Group post element
 * @param {Object} VARS - Application state containing user Options and Filters
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched keyword or empty string
 */
export function gf_isBlockedText(post, VARS, doc = document) {
  const postTexts = extractTextContent(post, gf_getBlocksQuery(post), 3, doc).join(' ').toLowerCase();

  if (VARS.Options.GF_BLOCKED_ENABLED) {
    if (VARS.Options.GF_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.GF_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    } else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.GF_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    }
  }

  return isGloballyBlockedText(postTexts, VARS);
}

/**
 * Scans Watch Videos Feed post content for blocked keywords or regex expressions.
 *
 * Checks the primary video metadata block (block index 1) against `VF_BLOCKED_TEXT_LC`,
 * cascading to global blocked keywords if unmatched.
 *
 * @param {HTMLElement} post - Watch video post container
 * @param {string} queryBlocks - Query selector targeting video blocks
 * @param {Object} VARS - Application state containing user Options and Filters
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched keyword or empty string
 */
export function vf_isBlockedText(post, queryBlocks, VARS, doc = document) {
  const postTexts = extractTextContent(post, queryBlocks, 1, doc).join(' ').toLowerCase();

  if (VARS.Options.VF_BLOCKED_ENABLED) {
    if (VARS.Options.VF_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.VF_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    } else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.VF_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    }
  }

  return isGloballyBlockedText(postTexts, VARS);
}

/**
 * Scans Profile Page post content for blocked keywords or regex expressions.
 *
 * Inspects user profile wall posts using News Feed block segmentation against `PP_BLOCKED_TEXT_LC`,
 * cascading to global blocked keywords if unmatched.
 *
 * @param {HTMLElement} post - Profile post element
 * @param {Object} VARS - Application state containing user Options and Filters
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched keyword or empty string
 */
export function pp_isBlockedText(post, VARS, doc = document) {
  const postTexts = extractTextContent(post, nf_getBlocksQuery(post), 3, doc).join(' ').toLowerCase();

  if (VARS.Options.PP_BLOCKED_ENABLED) {
    if (VARS.Options.PP_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.PP_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    } else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.PP_BLOCKED_TEXT_LC);
      if (blockedText.length > 0) return blockedText;
    }
  }

  return isGloballyBlockedText(postTexts, VARS);
}

/**
 * Scans item price in Marketplace card for exact matches against blocked price filters.
 *
 * In Marketplace cards, the price is located within the first text block (`blocksOfText[0]`).
 * Performs an exact token scan via `mp_scanTreeForText` to match entries in `MP_BLOCKED_TEXT_LC`
 * (such as "free", "0", or unwanted price figures).
 *
 * @param {HTMLElement} elBlockOfText - First block element containing price text
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched price string or empty string
 */
export function mp_getBlockedPrices(elBlockOfText, VARS, doc = document) {
  if (VARS?.Filters?.MP_BLOCKED_TEXT?.length > 0) {
    const itemPrices = mp_scanTreeForText(elBlockOfText, doc);
    return findFirstMatch(itemPrices, VARS.Filters.MP_BLOCKED_TEXT_LC);
  }
  return '';
}

/**
 * Scans item description in Marketplace cards for partial keyword or regex matches.
 *
 * In Marketplace cards, descriptions and seller locations reside in subsequent blocks
 * (index >= 1). Evaluates description strings against `MP_BLOCKED_TEXT_DESCRIPTION_LC`.
 *
 * @param {NodeList|Array<HTMLElement>} collectionBlocksOfText - Array of text block elements in card
 * @param {Object} VARS - Application state
 * @param {boolean} [skipFirstBlock=true] - Whether to skip block 0 (which contains the price)
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched description keyword or empty string
 */
export function mp_getBlockedTextDescription(collectionBlocksOfText, VARS, skipFirstBlock = true, doc = document) {
  if (VARS?.Filters?.MP_BLOCKED_TEXT_DESCRIPTION?.length > 0) {
    const startIndex = skipFirstBlock ? 1 : 0;
    for (let i = startIndex; i < collectionBlocksOfText.length; i++) {
      const descriptionTextList = mp_scanTreeForText(collectionBlocksOfText[i], doc);
      const descriptionText = descriptionTextList.join(' ').toLowerCase();
      const blockedText = VARS.Options.MP_BLOCKED_RE
        ? findFirstMatchRegExp(descriptionText, VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION_LC)
        : findFirstMatch(descriptionText, VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION_LC);

      if (blockedText.length > 0) {
        return blockedText;
      }
    }
  }
  return '';
}

/**
 * Scans Marketplace feed items and hides any listing with blocked prices or descriptions.
 *
 * ## Multi-Tier Query Strategy
 * Handles landing page item listings, category view listings, and both personalized (`/item/`)
 * and non-personalized (`/np/item/`) URL structures introduced in 2024 updates.
 *
 * ## Skip Check Optimization
 * Uses `postAttMPSkip` caching the element's `innerHTML.length`. If the length hasn't changed,
 * redundant tree scanning is avoided for fast scroll performance.
 *
 * @param {Object} VARS - Application state
 * @param {Function} mp_hideBox - Callback to hide a matching marketplace item box
 * @param {Document} [doc=document] - DOM document
 */
export function mp_doBlockingByBlockedText(VARS, mp_hideBox, doc = document) {
  const queries = [
    // October 2024 changes: landing page personalized & non-personalized
    `div[style]:not([${postAtt}]) > div > div > span > div > div > div > div > a[href*="/marketplace/item/"]`,
    `div[style]:not([${postAtt}]) > div > div > span > div > div > div > div > a[href*="/marketplace/np/item/"]`,
    // Category page listings
    `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/item/"]`,
    `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/np/item/"]`,
    // March 2024 variants
    `div[style]:not([${postAtt}]) > div > div > span > div > div > a[href*="/marketplace/item/"]`,
    `div[style]:not([${postAtt}]) > div > div > span > div > div > a[href*="/marketplace/np/item/"]`,
    `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/item/"]`,
    `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/np/item/"]`
  ];

  let items = [];
  for (const query of queries) {
    items = doc.querySelectorAll(query);
    if (items.length > 0) {
      break;
    }
  }

  for (const item of items) {
    const box = item.closest ? item.closest('div[style]') : null;
    if (!box) continue;

    // Fast-path: skip box if previously scanned and content length is identical
    if (box.hasAttribute(postAttMPSkip)) {
      if (box.innerHTML.length === parseInt(box.getAttribute(postAttMPSkip), 10)) {
        continue;
      }
    }

    // Text container is the 2nd child column within the item card
    const queryTextBlock = ':scope > div > div:nth-of-type(2) > div';
    const blocksOfText = item.querySelectorAll(queryTextBlock);

    if (blocksOfText.length > 0) {
      // Price is located in block index 0
      const blockedTextPrices = mp_getBlockedPrices(blocksOfText[0], VARS, doc);
      // Description is located in subsequent blocks
      let blockedTextDescription = mp_getBlockedTextDescription(blocksOfText, VARS, true, doc);

      // Fallback: check all blocks against global blocked keywords if enabled
      if (!blockedTextPrices && !blockedTextDescription && VARS.Options.GLOBAL_BLOCKED_ENABLED) {
        for (let i = 0; i < blocksOfText.length; i++) {
          const desc = mp_scanTreeForText(blocksOfText[i], doc).join(' ').toLowerCase();
          const match = isGloballyBlockedText(desc, VARS);
          if (match.length > 0) {
            blockedTextDescription = match;
            break;
          }
        }
      }

      if (blockedTextPrices.length > 0) {
        mp_hideBox(box, blockedTextPrices);
      } else if (blockedTextDescription.length > 0) {
        mp_hideBox(box, blockedTextDescription);
      } else {
        // Tag box as scanned to avoid redundant query matching
        box.setAttribute(postAtt, '');
      }
    }
  }
}
