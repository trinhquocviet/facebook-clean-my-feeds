/**
 * Feed Router Module
 * Part of FB - Clean My Feeds
 *
 * Inspects page URL, sets feed type flags on application state (VARS),
 * updates toggle button visibility, and strips tracking parameters.
 *
 * @module modules/feed-router/feed-router
 */

import { resetFeedFlags, resetEchoState } from '@/state/index.js';

/**
 * Removes tracking parameters from links on page (e.g. `/?ref=`).
 *
 * @param {Document} [doc=document] - DOM document
 */
export function stopTrackingDirtIntoMyHouse(doc = typeof document !== 'undefined' ? document : null) {
  if (!doc) return;
  const collectionOfLinks = doc.querySelectorAll('a[href*="/?ref="]');
  for (const trackingLink of collectionOfLinks) {
    trackingLink.href = trackingLink.href.split('/?ref')[0];
  }
}

/**
 * Inspects window location and updates feed context flags on VARS.
 *
 * @param {Object} options
 * @param {Object} options.VARS - Application state
 * @param {Window} [options.windowObj=window] - Window object
 * @param {Document} [options.doc=document] - Document object
 * @param {boolean} [options.forceUpdate=false] - Force update even if URL hasn't changed
 * @param {Function} [options.onMarketplaceEnter] - Callback triggered when entering Marketplace
 * @returns {boolean} True if feed settings changed/updated, false otherwise
 */
export function setFeedSettings(options) {
  const {
    VARS,
    windowObj = typeof window !== 'undefined' ? window : null,
    doc = typeof document !== 'undefined' ? document : null,
    forceUpdate = false,
    onMarketplaceEnter = null
  } = options || {};

  if (!windowObj || !VARS) return false;

  const currentHref = windowObj.location.href;
  const currentPathname = windowObj.location.pathname;
  const currentSearch = windowObj.location.search;

  if (VARS.prevURL !== currentHref || forceUpdate) {
    VARS.prevURL = currentHref;
    VARS.prevPathname = currentPathname;
    VARS.prevQuery = currentSearch;

    resetFeedFlags(VARS);

    if (VARS.prevPathname === '/' || VARS.prevPathname === '/home.php') {
      // -- news feed
      // -- nb: "Feeds (most recent)" combines a few feeds into one ... apply NF rules to all, except Groups.
      if (VARS.prevQuery.indexOf('?filter=groups') < 0) {
        VARS.isNF = true;
      } else {
        VARS.isGF = true;
        VARS.gfType = 'groups-recent';
      }
    } else if (VARS.prevPathname.indexOf('/groups/') >= 0) {
      // -- groups feed
      VARS.isGF = true;
      if (VARS.prevPathname.indexOf('/groups/feed') >= 0) {
        VARS.gfType = 'groups';
      } else if (VARS.prevPathname.indexOf('/groups/search') >= 0) {
        VARS.gfType = 'search';
      } else if (VARS.prevPathname.indexOf('?filter=groups&sk=h_chr') >= 0) {
        VARS.gfType = 'groups-recent';
      } else {
        VARS.gfType = 'group';
      }
    } else if (VARS.prevPathname.indexOf('/watch') >= 0) {
      // -- watch videos feed
      VARS.isVF = true;
      if (VARS.prevPathname.indexOf('/watch/search') >= 0) {
        VARS.vfType = 'search';
      } else if (VARS.prevQuery.indexOf('?ref=seach') >= 0 || VARS.prevQuery.indexOf('?v=') >= 0) {
        VARS.vfType = 'item';
      } else {
        VARS.vfType = 'videos';
      }
    } else if (VARS.prevPathname.indexOf('/marketplace') >= 0) {
      // -- marketplace
      VARS.isMF = true;
      if (typeof onMarketplaceEnter === 'function') {
        onMarketplaceEnter();
      } else if (doc) {
        stopTrackingDirtIntoMyHouse(doc);
      }

      if (VARS.isMF && VARS.prevPathname.indexOf('/item/') >= 0) {
        VARS.mpType = 'item';
      } else if (VARS.prevPathname.indexOf('/search') >= 0) {
        VARS.mpType = 'search';
      } else if (VARS.prevPathname.indexOf('/category/') >= 0) {
        VARS.mpType = 'category';
      } else {
        const urlBits = VARS.prevPathname.split('/');
        if (urlBits.length > 3) {
          VARS.mpType = 'category';
        } else {
          VARS.mpType = 'marketplace';
        }
      }
    } else if (VARS.prevPathname.indexOf('/commerce/listing/') >= 0) {
      VARS.isMF = true;
      VARS.mpType = 'item';
    } else if (['/search/top/', '/search/top', '/search/posts/', '/search/posts', '/search/pages/'].indexOf(VARS.prevPathname) >= 0) {
      VARS.isSF = true;
    } else if (VARS.prevPathname.indexOf('/reel/') >= 0) {
      VARS.isRF = (VARS.Options?.REELS_CONTROLS === true) || (VARS.Options?.REELS_DISABLE_LOOPING === true);
    } else if (VARS.prevPathname.indexOf('/profile.php') >= 0) {
      VARS.isPP = true;
    } else if (VARS.prevPathname.substring(1).length > 1 && VARS.prevPathname.substring(1).indexOf('/') < 0) {
      VARS.isPP = true;
    }

    VARS.isAF = (VARS.isNF || VARS.isGF || VARS.isVF || VARS.isMF || VARS.isSF || VARS.isRF || VARS.isPP);

    // when to display the cmf button
    if (VARS.isAF) {
      if (VARS.btnToggleEl) {
        VARS.btnToggleEl.setAttribute(VARS.showAtt, '');
      }
    } else {
      if (VARS.btnToggleEl) {
        VARS.btnToggleEl.removeAttribute(VARS.showAtt);
      }
    }

    // - reset consecutive count of hidden posts
    resetEchoState(VARS);

    // -- reset the no-change-counter
    VARS.noChangeCounter = 0;

    return true;
  }

  return false;
}
