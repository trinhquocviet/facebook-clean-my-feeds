/**
 * Search Feed Cleaner Module
 * Part of FB - Clean My Feeds
 *
 * Implements the mopping pipeline for Facebook search results feed:
 * leverages News Feed blocked text rules, sponsored detection,
 * animated GIF pausing, and info box scrubbing.
 *
 * @module modules/feed-cleaners/search-cleaner
 */

import { mainColumnAtt } from '@/constants/index.js';
import {
  isSponsored,
  nf_isBlockedText,
  swatTheMosquitos,
  scrubInfoBoxes
} from '@/modules/detection/index.js';

/**
 * Mops up and purges unwanted content from Facebook Search Feed.
 *
 * @param {Object} context - Standard runtime context
 * @param {Document} [overrideDoc] - Optional document override
 */
export function mopUpTheSearchFeed({
  VARS,
  KeyWords,
  postObscurer,
  isTheHouseDirty,
  sf_isTheHouseDirty,
  masterKeyWords,
  doc = typeof document !== 'undefined' ? document : null,
  windowObj = typeof window !== 'undefined' ? window : null
}, overrideDoc) {
  const actualDoc = overrideDoc || doc;
  const checkDirty = isTheHouseDirty || sf_isTheHouseDirty;
  const mainColumn = checkDirty ? checkDirty() : null;
  if (mainColumn === null) {
    return;
  }

  const {
    nf_isPostAlreadyHidden,
    nf_hidePost,
    hideBlock
  } = postObscurer || {};

  if (VARS.Options?.NF_BLOCKED_ENABLED) {
    const query = 'div[role="feed"] > div > div';
    const posts = actualDoc ? Array.from(actualDoc.querySelectorAll(query)) : [];

    for (const post of posts) {
      if (post.innerHTML.length === 0) {
        continue;
      }

      let hideReason = '';
      let isSponsoredPost = false;

      if (nf_isPostAlreadyHidden && nf_isPostAlreadyHidden(post)) {
        hideReason = 'hidden';
      } else {
        if (VARS.Options?.NF_SPONSORED && isSponsored(post, VARS, actualDoc)) {
          hideReason = KeyWords.SPONSORED;
          isSponsoredPost = true;
        }
        if (hideReason === '' && (VARS.Options?.NF_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED)) {
          hideReason = nf_isBlockedText(post, VARS, actualDoc);
        }
      }

      if (hideReason.length > 0) {
        VARS.echoCount++;
        if (hideReason !== 'hidden' && nf_hidePost) {
          nf_hidePost(post, hideReason, isSponsoredPost);
        }
      } else {
        VARS.echoCount = 0;
        if (VARS.Options?.NF_ANIMATED_GIFS_PAUSE) {
          swatTheMosquitos(post, windowObj);
        }
        if (VARS.hideAnInfoBox) {
          scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock);
        }
      }
    }
  }

  if (mainColumn.setAttribute) {
    mainColumn.setAttribute(mainColumnAtt, (mainColumn.innerHTML?.length ?? 0).toString());
  }
  VARS.noChangeCounter = 0;
}
