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
 * Mops up and purges unwanted content from the Watch Videos Feed.
 *
 * @param {Object} context - Standard runtime context
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
        if (countDescendants(post) < 3) {
          continue;
        }

        let hideReason = '';

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
          vf_scrubSponsoredBlock(post, KeyWords, hideBlock);
        }

        vf_hideSponsoredBlock(post, query, queryBlocks, VARS, log);
      }
    } else {
      // Search videos
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

  if (elDialog) {
    if (VARS.Options?.NF_ANIMATED_GIFS_PAUSE) {
      swatTheMosquitos(elDialog, windowObj);
    }
  }
}
