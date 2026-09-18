/**
 * Profile Page Cleaner Module
 * Part of FB - Clean My Feeds
 *
 * Implements the mopping pipeline for user Profile Pages:
 * processes profile feed stream, filters blocked keywords,
 * suppresses animated GIFs, pauses GIF comments, and removes info boxes.
 *
 * @module modules/feed-cleaners/profile-cleaner
 */

import { mainColumnAtt } from '@/constants/index.js';
import {
  nf_hasAnimatedGifContent,
  pp_isBlockedText,
  swatTheMosquitos,
  scrubInfoBoxes
} from '@/modules/detection/index.js';

/**
 * Mops up and purges unwanted content from Facebook Profile pages.
 *
 * ## Strategy
 * User timeline wall posts render inside `div[role="main"]` with a specific column hierarchy:
 * `div[role="main"] > div > div > div > div:nth-of-type(2) > div:not([class]) > div > div[class]`.
 * This cleaner applies blocked keyword filters, suppresses animated GIF posts,
 * pauses animated GIF comments, and removes regulatory info overlays.
 *
 * ## Fast Exit Gate
 * If no profile-related options (`PP_BLOCKED_ENABLED`, `GLOBAL_BLOCKED_ENABLED`,
 * `PP_ANIMATED_GIFS_POSTS`, `PP_ANIMATED_GIFS_PAUSE`) are active, exits immediately without
 * running expensive DOM queries or dirty checks.
 *
 * @param {Object} context - Standard runtime context
 * @param {Object} context.VARS - Application state
 * @param {Object} context.KeyWords - Localized keywords
 * @param {Object} context.postObscurer - Obscurer utilities (nf_hidePost, hideBlock, etc.)
 * @param {Function} [context.isTheHouseDirty] - Dirty check function
 * @param {Function} [context.pp_isTheHouseDirty] - Profile page dirty check function
 * @param {Object} context.masterKeyWords - Keyword master dictionary
 * @param {Document} [context.doc=document] - DOM document
 * @param {Window} [context.windowObj=window] - Browser window
 * @param {Document} [overrideDoc] - Optional document override
 */
export function mopUpTheProfilePage({
  VARS,
  KeyWords,
  postObscurer,
  isTheHouseDirty,
  pp_isTheHouseDirty,
  masterKeyWords,
  doc = typeof document !== 'undefined' ? document : null,
  windowObj = typeof window !== 'undefined' ? window : null
}, overrideDoc) {
  const proceed =
    VARS.Options?.PP_BLOCKED_ENABLED ||
    VARS.Options?.GLOBAL_BLOCKED_ENABLED ||
    VARS.Options?.PP_ANIMATED_GIFS_POSTS ||
    VARS.Options?.PP_ANIMATED_GIFS_PAUSE;

  // Fast exit if no profile page features are toggled on
  if (!proceed) {
    return;
  }

  const actualDoc = overrideDoc || doc;
  const checkDirty = isTheHouseDirty || pp_isTheHouseDirty;
  const [mainColumn, elDialog] = checkDirty ? checkDirty() : [null, null];
  if (mainColumn === null && elDialog === null) {
    return;
  }

  const {
    nf_isPostAlreadyHidden,
    nf_hidePost,
    hideBlock
  } = postObscurer || {};

  if (mainColumn) {
    // Query individual user timeline wall posts
    const query = 'div[role="main"] > div > div > div > div:nth-of-type(2) > div:not([class]) > div > div[class]';
    const posts = actualDoc ? Array.from(actualDoc.querySelectorAll(query)) : [];

    for (const post of posts) {
      if (post.innerHTML.length === 0) {
        continue;
      }

      let hideReason = '';
      const isSponsoredPost = false;

      if (nf_isPostAlreadyHidden && nf_isPostAlreadyHidden(post)) {
        hideReason = 'hidden';
      } else {
        if (hideReason === '' && VARS.Options?.PP_ANIMATED_GIFS_POSTS) {
          hideReason = nf_hasAnimatedGifContent(post, KeyWords);
        }
        if (hideReason === '' && (VARS.Options?.PP_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED)) {
          hideReason = pp_isBlockedText(post, VARS, actualDoc);
        }
      }

      if (hideReason.length > 0) {
        if (hideReason !== 'hidden' && nf_hidePost) {
          nf_hidePost(post, hideReason, isSponsoredPost);
        }
      } else {
        if (VARS.Options?.PP_ANIMATED_GIFS_PAUSE) {
          swatTheMosquitos(post, windowObj);
        }
        if (VARS.hideAnInfoBox) {
          scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock);
        }
      }
    }

    if (mainColumn.setAttribute) {
      mainColumn.setAttribute(mainColumnAtt, (mainColumn.innerHTML?.length ?? 0).toString());
    }
    VARS.noChangeCounter = 0;
  }

  // Handle media/photo modal dialog if currently active
  if (elDialog) {
    if (VARS.Options?.PP_ANIMATED_GIFS_PAUSE) {
      swatTheMosquitos(elDialog, windowObj);
    }
    if (elDialog.setAttribute) {
      elDialog.setAttribute(mainColumnAtt, (elDialog.innerHTML?.length ?? 0).toString());
    }
    VARS.noChangeCounter = 0;
  }
}
