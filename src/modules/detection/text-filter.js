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
 * Checks if text matches any globally blocked words or regex.
 *
 * @param {string} postTexts - Normalized lowercase post text
 * @param {Object} VARS - Application state
 * @returns {string} Matched keyword or empty string
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
 * Returns the query selector string for News Feed blocks.
 *
 * @param {HTMLElement} post - Post element
 * @returns {string} Selector
 */
export function nf_getBlocksQuery(post) {
  let blocksQuery =
    'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
  const blocks = post.querySelectorAll(blocksQuery);
  if (blocks.length <= 1) {
    blocksQuery =
      'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
  }
  return blocksQuery;
}

/**
 * Returns the query selector string for Groups Feed blocks.
 *
 * @param {HTMLElement} post - Post element
 * @returns {string} Selector
 */
export function gf_getBlocksQuery(post) {
  let blocksQuery =
    'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
  const blocks = post.querySelectorAll(blocksQuery);
  if (blocks.length <= 1) {
    blocksQuery =
      'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
  }
  return blocksQuery;
}

/**
 * Checks News Feed post content for blocked text.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state
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
 * Checks Groups Feed post content for blocked text.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state
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
 * Checks Watch Videos Feed post content for blocked text.
 *
 * @param {HTMLElement} post - Post element
 * @param {string} queryBlocks - Query for video blocks
 * @param {Object} VARS - Application state
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
 * Checks Profile Page post content for blocked text.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state
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
 * Scans item price in Marketplace item card for exact matches.
 *
 * @param {HTMLElement} elBlockOfText - Block element containing price
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched price or empty string
 */
export function mp_getBlockedPrices(elBlockOfText, VARS, doc = document) {
  if (VARS?.Filters?.MP_BLOCKED_TEXT?.length > 0) {
    const itemPrices = mp_scanTreeForText(elBlockOfText, doc);
    return findFirstMatch(itemPrices, VARS.Filters.MP_BLOCKED_TEXT_LC);
  }
  return '';
}

/**
 * Scans item description in Marketplace item card for partial matches.
 *
 * @param {NodeList|Array<HTMLElement>} collectionBlocksOfText - Text blocks
 * @param {Object} VARS - Application state
 * @param {boolean} [skipFirstBlock=true] - Whether to skip first block (price)
 * @param {Document} [doc=document] - DOM document
 * @returns {string} Matched text or empty string
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
 * Scans Marketplace items and hides items with matching blocked prices or descriptions.
 *
 * @param {Object} VARS - Application state
 * @param {Function} mp_hideBox - Callback to hide a marketplace item container
 * @param {Document} [doc=document] - DOM document
 */
export function mp_doBlockingByBlockedText(VARS, mp_hideBox, doc = document) {
  const queries = [
    `div[style]:not([${postAtt}]) > div > div > span > div > div > div > div > a[href*="/marketplace/item/"]`,
    `div[style]:not([${postAtt}]) > div > div > span > div > div > div > div > a[href*="/marketplace/np/item/"]`,
    `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/item/"]`,
    `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/np/item/"]`,
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

    if (box.hasAttribute(postAttMPSkip)) {
      if (box.innerHTML.length === parseInt(box.getAttribute(postAttMPSkip), 10)) {
        continue;
      }
    }

    const queryTextBlock = ':scope > div > div:nth-of-type(2) > div';
    const blocksOfText = item.querySelectorAll(queryTextBlock);

    if (blocksOfText.length > 0) {
      const blockedTextPrices = mp_getBlockedPrices(blocksOfText[0], VARS, doc);
      let blockedTextDescription = mp_getBlockedTextDescription(blocksOfText, VARS, true, doc);

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
        box.setAttribute(postAtt, '');
      }
    }
  }
}
