/**
 * Feed Router Module
 * Part of FB - Clean My Feeds
 *
 * ## Route Classification Architecture
 * Facebook is a dynamic Single Page Application (SPA) that does not reload the page
 * when navigating between sections (e.g. from News Feed to Watch or Groups).
 * The Feed Router classifies `location.pathname` and `location.search` into boolean flags
 * (`isNF`, `isGF`, `isVF`, `isMF`, `isSF`, `isRF`, `isPP`) and detailed sub-types.
 *
 * ## Context Mapping:
 * - **News Feed (`isNF`)**: `/` or `/home.php` (excluding `?filter=groups`).
 * - **Groups Feed (`isGF`)**:
 *   - `/groups/feed`: `groups` (aggregated stream)
 *   - `/groups/search`: `search`
 *   - `?filter=groups&sk=h_chr`: `groups-recent`
 *   - `/<group-name>`: `group` (single group wall)
 * - **Watch Videos (`isVF`)**:
 *   - `/watch`: `videos`
 *   - `/watch/search`: `search`
 *   - `?v=` or `?ref=seach`: `item` (single video viewing layout)
 * - **Marketplace (`isMF`)**:
 *   - `/marketplace`: `marketplace` (main landing)
 *   - `/item/` or `/commerce/listing/`: `item`
 *   - `/category/` or deep paths: `category`
 *   - `/search`: `search`
 * - **Search (`isSF`)**: `/search/top`, `/search/posts`, `/search/pages`
 * - **Reels (`isRF`)**: `/reel/*` (active when reels enhancement options enabled)
 * - **Profile (`isPP`)**: `/profile.php` or single-segment username handles (`/<handle>`)
 *
 * @module modules/feed-router/feed-router
 */

import { resetFeedFlags, resetEchoState } from '@/state/index.js';

/**
 * Removes tracking parameters from links across the document (e.g. `/?ref=`).
 *
 * Decontaminates anchor hrefs in bulk when entering a new route or feed section.
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
 * Checks if the current URL has changed since the last inspection tick. If so:
 * 1. Resets previous feed flags.
 * 2. Classifies the route into appropriate feed domains and sub-types.
 * 3. Shows or hides the floating settings toggle button (`btnToggleEl`).
 * 4. Resets consecutive post grouping counter (`echoCount`) and `noChangeCounter`.
 *
 * @param {Object} options - Router options
 * @param {Object} options.VARS - Shared application state
 * @param {Window} [options.windowObj=window] - Browser window object
 * @param {Document} [options.doc=document] - DOM document
 * @param {boolean} [options.forceUpdate=false] - Force update even if URL appears unchanged
 * @param {Function} [options.onMarketplaceEnter] - Callback triggered upon entering Marketplace
 * @returns {boolean} True if feed route changed or forced; false if URL is unchanged
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
      // News feed root
      // Note: "Feeds (most recent)" combines feeds; apply NF rules to all except Groups
      if (VARS.prevQuery.indexOf('?filter=groups') < 0) {
        VARS.isNF = true;
      } else {
        VARS.isGF = true;
        VARS.gfType = 'groups-recent';
      }
    } else if (VARS.prevPathname.indexOf('/groups/') >= 0) {
      // Groups section
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
      // Watch video feed
      VARS.isVF = true;
      if (VARS.prevPathname.indexOf('/watch/search') >= 0) {
        VARS.vfType = 'search';
      } else if (VARS.prevQuery.indexOf('?ref=seach') >= 0 || VARS.prevQuery.indexOf('?v=') >= 0) {
        VARS.vfType = 'item';
      } else {
        VARS.vfType = 'videos';
      }
    } else if (VARS.prevPathname.indexOf('/marketplace') >= 0) {
      // Marketplace feed
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
      // User profile vanity handle: /username (single path segment without extra slashes)
      VARS.isPP = true;
    }

    // isAF (Is Any Feed): True if currently viewing any supported Facebook stream
    VARS.isAF = (VARS.isNF || VARS.isGF || VARS.isVF || VARS.isMF || VARS.isSF || VARS.isRF || VARS.isPP);

    // Display or hide floating Clean My Feeds settings toggle button
    if (VARS.isAF) {
      if (VARS.btnToggleEl) {
        VARS.btnToggleEl.setAttribute(VARS.showAtt, '');
      }
    } else {
      if (VARS.btnToggleEl) {
        VARS.btnToggleEl.removeAttribute(VARS.showAtt);
      }
    }

    // Reset consecutive count of hidden posts
    resetEchoState(VARS);

    // Reset no-change-counter to trigger fast initial polling in the new view
    VARS.noChangeCounter = 0;

    return true;
  }

  return false;
}
