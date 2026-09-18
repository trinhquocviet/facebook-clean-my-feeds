/**
 * Watch / Videos Feed Cleaner Module
 * Part of FB - Clean My Feeds
 *
 * Implements the mopping pipeline for Facebook Watch & Videos feeds:
 * handles video queries, search videos, Live video detection,
 * Instagram video detection, duplicate video detection,
 * sponsored block hiding, GIF pausing, and open in new tab links.
 *
 * @module modules/feed-cleaners/watch-cleaner
 */

import { countDescendants } from '@/utils/index.js';
import { mainColumnAtt, postPropDS } from '@/constants/index.js';
import {
  doLightDusting,
  isSponsored,
  vf_isVideoLive,
  vf_isInstagram,
  vf_hideDuplicateVideos,
  vf_isBlockedText,
  vf_hideSponsoredBlock,
  vf_scrubSponsoredBlock,
  vf_setPostLinkToOpenInNewTab,
  swatTheMosquitos,
  scrubInfoBoxes
} from '@/modules/detection/index.js';

/**
 * Mops up and purges unwanted content from Facebook Watch / Videos Feeds.
 *
 * ## Video Feed Variations (`VARS.vfType`)
 * 1. **`videos`**: Main Facebook Watch stream (`:scope > div > div:not([class]) > div`).
 * 2. **`search`**: Video search results feed (`div[role="feed"] > div[role="article"]`).
 * 3. **`item`**: Dedicated single video page watch feed (`div[id="watch_feed"] > ...`).
 *
 * ## Processing Details
 * - **Placeholder Skip**: Posts with fewer than 3 descendants (`countDescendants(post) < 3`)
 *   are skipped as incomplete or skeleton loader elements.
 * - **Link Rewriting**: Calls `vf_setPostLinkToOpenInNewTab` so clicking video posts opens in a new tab.
 * - **Deduplication**: `vf_hideDuplicateVideos` detects when Facebook displays identical videos
 *   multiple times in the same session, hiding duplicates and keeping the first instance.
 * - **Live & Instagram Filters**: Hides live video streams and cross-posted Instagram videos.
 * - **Sponsored Block Scrubbing**: Removes secondary sponsored suggestions ("Watch more videos by...")
 *   tethered beneath video player containers.
 *
 * @param {Object} context - Standard runtime context
 * @param {Object} context.VARS - Application state
 * @param {Object} context.KeyWords - Localized keywords
 * @param {Object} context.postObscurer - Obscurer methods (vf_hidePost, hideBlock, etc.)
 * @param {Function} [context.isTheHouseDirty] - Dirty check function
 * @param {Function} [context.vf_isTheHouseDirty] - Videos feed dirty check function
 * @param {Object} context.masterKeyWords - Keyword master dictionary
 * @param {string} [context.log=''] - Log prefix
 * @param {Document} [context.doc=document] - DOM document
 * @param {Window} [context.windowObj=window] - Browser window
 */
export function mopUpTheWatchVideosFeed({
  VARS,
  KeyWords,
  postObscurer = {},
  isTheHouseDirty,
  vf_isTheHouseDirty,
  masterKeyWords,
  log = '',
  doc = typeof document !== 'undefined' ? document : null,
  windowObj = typeof window !== 'undefined' ? window : null
}) {
  const dirtyFn = isTheHouseDirty || vf_isTheHouseDirty;
  const [mainColumn, elDialog] = dirtyFn ? dirtyFn() : [null, null];
  if (mainColumn === null && elDialog === null) {
    return;
  }

  const {
    nf_isPostAlreadyHidden,
    vf_hidePost,
    hideBlock
  } = postObscurer;

  const container = elDialog ? elDialog : mainColumn;
  if (container) {
    let query;
    let queryBlocks;

    // Route selectors by feed layout type
    if (VARS.vfType === 'videos') {
      query = ':scope > div > div:not([class]) > div';
      queryBlocks = ':scope > div > div > div > div > div:nth-of-type(2) > div';
    } else if (VARS.vfType === 'search') {
      query = 'div[role="feed"] > div[role="article"]';
      queryBlocks = ':scope > div > div > div > div > div > div > div:nth-of-type(2)';
    } else if (VARS.vfType === 'item') {
      query = 'div[id="watch_feed"] > div > div:nth-of-type(2) > div > div > div > div:nth-of-type(2) > div > div > div > div';
      queryBlocks = ':scope > div > div > div > div > div:nth-of-type(2) > div';
    } else {
      return;
    }

    if (VARS.vfType !== 'search') {
      const posts = container.querySelectorAll(query);
      for (const post of posts) {
        // Skip skeleton placeholder cards
        if (countDescendants(post) < 3) {
          continue;
        }

        let hideReason = '';

        // Rewrite permalink anchor to open in new tab
        if (VARS.vfType === 'videos' && post[postPropDS] === undefined) {
          vf_setPostLinkToOpenInNewTab(post, doc);
        }

        if (nf_isPostAlreadyHidden(post)) {
          hideReason = 'hidden';
        } else {
          doLightDusting(post, VARS);

          if (hideReason === '' && VARS.Options?.VF_SPONSORED && isSponsored(post, VARS, doc)) {
            hideReason = KeyWords.SPONSORED;
          }
          if (hideReason === '' && VARS.Options?.VF_LIVE) {
            hideReason = vf_isVideoLive(post, KeyWords);
          }
          if (hideReason === '' && VARS.Options?.VF_INSTAGRAM) {
            hideReason = vf_isInstagram(post, KeyWords);
          }
          if (hideReason === '' && VARS.Options?.VF_DUPLICATE_VIDEOS) {
            vf_hideDuplicateVideos(post, query, vf_hidePost, KeyWords, log, doc);
            if (nf_isPostAlreadyHidden(post)) {
              hideReason = 'hidden';
            }
          }
          if (hideReason === '' && (VARS.Options?.VF_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED)) {
            hideReason = vf_isBlockedText(post, queryBlocks, VARS, doc);
          }
        }

        if (hideReason.length > 0) {
          if (hideReason !== 'hidden') {
            vf_hidePost(post, hideReason);
          }
        } else {
          if (VARS.Options?.VF_ANIMATED_GIFS_PAUSE) {
            swatTheMosquitos(post, windowObj);
          }
          if (VARS.hideAnInfoBox) {
            scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock);
          }
          // Remove sponsored ad box attached underneath the video player
          vf_scrubSponsoredBlock(post, KeyWords, hideBlock);
        }

        vf_hideSponsoredBlock(post, query, queryBlocks, VARS, log);
      }
    } else {
      // Search videos results feed
      const posts = doc.querySelectorAll(query);
      for (const post of posts) {
        let hideReason = '';

        if (nf_isPostAlreadyHidden(post)) {
          hideReason = 'hidden';
        } else {
          if (VARS.Options?.VF_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED) {
            hideReason = vf_isBlockedText(post, queryBlocks, VARS, doc);
          }
        }

        if (hideReason.length > 0) {
          if (hideReason !== 'hidden') {
            vf_hidePost(post, hideReason);
          }
        }
      }
    }

    container.setAttribute(mainColumnAtt, container.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }

  // Handle active media modal dialog
  if (elDialog) {
    if (VARS.Options?.NF_ANIMATED_GIFS_PAUSE) {
      swatTheMosquitos(elDialog, windowObj);
    }
  }
}
