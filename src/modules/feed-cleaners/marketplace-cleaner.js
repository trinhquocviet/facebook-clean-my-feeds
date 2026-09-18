/**
 * Marketplace Cleaner Module
 * Part of FB - Clean My Feeds
 *
 * Implements the mopping pipeline for Facebook Marketplace:
 * removes tracking parameters (?ref=), hides sponsored cards & categories,
 * processes item view dialogs, and executes price/description text blocking.
 *
 * @module modules/feed-cleaners/marketplace-cleaner
 */

import { climbUpTheTree, sanitizeReason } from '@/utils/index.js';
import { mainColumnAtt, postAtt, postAttMPSkip } from '@/constants/index.js';
import { mp_doBlockingByBlockedText } from '@/modules/detection/index.js';

/**
 * Hides a marketplace item box and stamps it with debug attributes.
 *
 * @param {HTMLElement} box - Item container box
 * @param {string} reason - Rejection reason
 * @param {Object} VARS - Application state
 */
export function mp_hideBox(box, reason, VARS) {
  box.setAttribute(VARS.hideWithNoCaptionAtt, '');
  box.setAttribute(postAtt, sanitizeReason(reason));
  if (VARS.Options?.VERBOSITY_DEBUG) {
    box.setAttribute(VARS.showAtt, '');
  }
}

/**
 * Removes tracking parameters from Marketplace URLs (?ref=).
 *
 * @param {Document} [doc=document] - DOM document
 */
export function mp_stopTrackingDirtIntoMyHouse(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return;
  const collectionOfLinks = doc.querySelectorAll('a[href*="/?ref="]');
  for (const trackingLink of collectionOfLinks) {
    trackingLink.href = trackingLink.href.split('/?ref')[0];
  }
}

/**
 * Hides sponsored item cards above category listings in Marketplace.
 *
 * @param {Object} VARS - Application state
 * @param {Object} KeyWords - Translated keywords
 * @param {Document} [doc=document] - DOM document
 */
export function mp_hideSponsoredItems(VARS, KeyWords, doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return;
  const query = `div[${mainColumnAtt}] > div > div > div > div > div > div[style] > span`;
  const items = doc.querySelectorAll(query);
  for (const item of items) {
    const box = item.parentElement;
    if (!box) continue;
    if (box.hasAttribute(postAttMPSkip)) {
      if (box.innerHTML.length === parseInt(box.getAttribute(postAttMPSkip), 10)) {
        continue;
      }
    }
    mp_hideBox(box, KeyWords.SPONSORED, VARS);
  }
}

/**
 * Mops up and purges unwanted content from Facebook Marketplace.
 *
 * @param {Object} context - Standard runtime context
 * @param {Document} [overrideDoc] - Optional document override
 */
export function mopUpTheMarketplaceFeed({
  VARS,
  KeyWords,
  isTheHouseDirty,
  mp_isTheHouseDirty,
  doc = typeof document !== 'undefined' ? document : null
}, overrideDoc) {
  const actualDoc = overrideDoc || doc;
  const checkDirty = isTheHouseDirty || mp_isTheHouseDirty;
  const mainColumn = checkDirty ? checkDirty() : null;
  if (mainColumn === null) {
    return;
  }

  mp_stopTrackingDirtIntoMyHouse(actualDoc);

  const hideBoxFn = (box, reason) => mp_hideBox(box, reason, VARS);

  if (VARS.mpType === 'marketplace' || VARS.mpType === 'item') {
    if (VARS.Options?.MP_SPONSORED) {
      mp_hideSponsoredItems(VARS, KeyWords, actualDoc);

      const queryHeadings = `div:not([${postAtt}]) > a[href="/ads/about/?entry_product=ad_preferences"], div:not([${postAtt}]) > object > a[href="/ads/about/?entry_product=ad_preferences"]`;
      const headings = actualDoc ? actualDoc.querySelectorAll(queryHeadings) : [];

      let queryItems = `div[style]:not([${postAtt}]) > span > div:first-of-type > a:not([href*="marketplace"])`;
      let items = actualDoc ? actualDoc.querySelectorAll(queryItems) : [];
      if (items.length === 0 && actualDoc) {
        queryItems = `div[style]:not([${postAtt}]) > span > div:first-of-type > div > a:not([href*="marketplace"])`;
        items = actualDoc.querySelectorAll(queryItems);
      }

      if (headings.length > 0 && items.length > 0) {
        for (const heading of headings) {
          if (heading.parentElement) {
            mp_hideBox(heading.parentElement, KeyWords.SPONSORED, VARS);
          }
        }
        for (const item of items) {
          const parentItem = climbUpTheTree(item, 4);
          if (parentItem) {
            mp_hideBox(parentItem, KeyWords.SPONSORED, VARS);
          }
        }
      }
    }

    if (VARS.Options?.MP_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED) {
      mp_doBlockingByBlockedText(VARS, hideBoxFn, actualDoc);
    }
  }

  if (VARS.mpType === 'item') {
    if (VARS.Options?.MP_SPONSORED) {
      const elDialog = actualDoc ? actualDoc.querySelector('div[role="dialog"]') : null;
      if (elDialog) {
        const query = `span h2 [href*="/ads/about/"]:not([${postAtt}])`;
        const elLink = elDialog.querySelector(query);
        if (elLink) {
          const box = elLink.closest ? elLink.closest('h2')?.closest('span') : null;
          if (box) mp_hideBox(box, KeyWords.SPONSORED, VARS);
          elLink.setAttribute(postAtt, KeyWords.SPONSORED);
        }
      } else if (actualDoc) {
        const query = `div[${mainColumnAtt}] span h2 [href*="/ads/about/"]:not([${postAtt}])`;
        const elLink = actualDoc.querySelector(query);
        if (elLink) {
          const box = elLink.closest ? elLink.closest('h2')?.closest('span') : null;
          if (box) mp_hideBox(box, KeyWords.SPONSORED, VARS);
          elLink.setAttribute(postAtt, KeyWords.SPONSORED);
        }
      }
    }
  } else if (VARS.mpType === 'category' || VARS.mpType === 'search') {
    if (VARS.Options?.MP_SPONSORED) {
      mp_hideSponsoredItems(VARS, KeyWords, actualDoc);
    }
    if (VARS.Options?.MP_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED) {
      mp_doBlockingByBlockedText(VARS, hideBoxFn, actualDoc);
    }
  }

  if (mainColumn.setAttribute) {
    mainColumn.setAttribute(mainColumnAtt, (mainColumn.innerHTML?.length ?? 0).toString());
  }
  VARS.noChangeCounter = 0;
}
