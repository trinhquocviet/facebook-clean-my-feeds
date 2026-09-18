/**
 * Groups Feed Cleaner Module
 * Part of FB - Clean My Feeds
 *
 * Implements the mopping pipeline for Facebook Groups Feeds:
 * handles both multiple groups feed stream and single group page stream,
 * sidebars, open in new tab buttons, suggestions, reels, blocked text,
 * animated GIFs, and shares suppression.
 *
 * @module modules/feed-cleaners/groups-cleaner
 */

import {
  doLightDusting,
  isSponsored,
  gf_isSuggested,
  gf_isShortReelVideo,
  gf_isBlockedText,
  gf_hasAnimatedGifContent,
  swatTheMosquitos,
  scrubInfoBoxes,
  gf_hideNumberOfShares,
  gf_cleanTheConsoleTable,
  gf_setPostLinkToOpenInNewTab
} from '@/modules/detection/index.js';
import { mainColumnAtt, postPropDS } from '@/constants/index.js';

/**
 * Mops up and purges unwanted content from Facebook Groups Feeds.
 *
 * ## Feed Architecture & Sub-Types
 * Facebook provides distinct layouts for group activity:
 * 1. **Multiple Groups Feed (`VARS.gfType = 'groups' | 'groups-recent' | 'search'`)**:
 *    Aggregated stream of posts across all joined groups. Includes sponsored group posts,
 *    unjoined group suggestions, reels, and sidebar suggestions.
 * 2. **Single Group Page (`VARS.gfType = 'group'`)**:
 *    The dedicated wall of a specific Facebook group. Does not contain unjoined group suggestions
 *    or cross-group discovery units, but can contain reels, blocked keywords, and animated GIFs.
 *
 * ## Performance Heuristic (Tail-Scanning)
 * In the multi-group feed, as the user scrolls, hundreds of DOM nodes accumulate. Rather than
 * repeatedly iterating all posts from index 0 on every dirty tick, the cleaner scans only the
 * **last 25 posts** (`count < 25 ? 0 : count - 25`), dramatically reducing CPU reflow overhead.
 *
 * ## Link Rewriting
 * Calls `gf_setPostLinkToOpenInNewTab` on unmodified posts so clicking a post title or timestamp
 * opens in a new browser tab without losing current feed scroll depth.
 *
 * ## Consecutive Post Grouping
 * Maintains `VARS.echoCount` across adjacent hidden posts to allow grouping them together under
 * a unified obscurer counter (e.g. "3 hidden posts"). When a clean post is encountered,
 * `VARS.echoCount` resets to 0.
 *
 * @param {Object} context - Standard runtime context
 * @param {Object} context.VARS - Application state
 * @param {Object} context.KeyWords - Localized keywords
 * @param {Object} context.postObscurer - Post obscuring methods
 * @param {Function} [context.isTheHouseDirty] - Dirty check function
 * @param {Function} [context.gf_isTheHouseDirty] - Groups feed dirty check function
 * @param {Object} context.masterKeyWords - Keyword master dictionary
 * @param {string} [context.log=''] - Log prefix
 * @param {Document} [context.doc=document] - DOM document
 * @param {Window} [context.windowObj=window] - Browser window
 */
export function mopUpTheGroupsFeed({
  VARS,
  KeyWords,
  postObscurer = {},
  isTheHouseDirty,
  gf_isTheHouseDirty,
  masterKeyWords,
  log = '',
  doc = typeof document !== 'undefined' ? document : null,
  windowObj = typeof window !== 'undefined' ? window : null
}) {
  const dirtyFn = isTheHouseDirty || gf_isTheHouseDirty;
  const [mainColumn, elDialog] = dirtyFn ? dirtyFn() : [null, null];
  if (mainColumn === null && elDialog === null) {
    return;
  }

  const {
    nf_isPostAlreadyHidden,
    gf_hidePost,
    hideFeature,
    hideBlock
  } = postObscurer;

  if (mainColumn) {
    if (VARS.gfType === 'groups' || VARS.gfType === 'groups-recent' || VARS.gfType === 'search') {
      // Stream Type 1: Multi-group aggregated feed stream
      if (VARS.Options?.GF_SUGGESTIONS) {
        // Scrub sidebar suggestion blocks
        gf_cleanTheConsoleTable('Suggestions', KeyWords, hideFeature, doc);
      }

      const query = VARS.gfType === 'groups-recent' ? 'h2[dir="auto"] + div > div' : 'div[role="feed"] > div';
      const posts = Array.from(doc.querySelectorAll(query));

      if (posts.length > 0) {
        const count = posts.length;
        // Tail-scanning optimization: scan only the newest 25 posts during infinite scrolling
        const start = count < 25 ? 0 : count - 25;

        for (let i = start; i < count; i++) {
          const post = posts[i];
          if (post.innerHTML.length === 0) continue;

          let hideReason = '';

          // Rewrite permalink anchor to open in new tab if not already processed
          if (VARS.gfType === 'groups' && post[postPropDS] === undefined) {
            gf_setPostLinkToOpenInNewTab(post, log, doc);
          }

          if (nf_isPostAlreadyHidden(post)) {
            hideReason = 'hidden';
          } else {
            doLightDusting(post, VARS);

            if (hideReason === '' && VARS.Options?.GF_SPONSORED && isSponsored(post, VARS, doc)) {
              hideReason = KeyWords.SPONSORED;
            }
            if (hideReason === '' && VARS.Options?.GF_SUGGESTIONS) {
              hideReason = gf_isSuggested(post, KeyWords);
            }
            if (hideReason === '' && VARS.Options?.GF_SHORT_REEL_VIDEO) {
              hideReason = gf_isShortReelVideo(post, KeyWords);
            }
            if (hideReason === '' && (VARS.Options?.GF_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED)) {
              hideReason = gf_isBlockedText(post, VARS, doc);
            }
            if (hideReason === '' && VARS.Options?.GF_ANIMATED_GIFS_POSTS) {
              hideReason = gf_hasAnimatedGifContent(post, KeyWords);
            }
          }

          if (hideReason.length > 0) {
            // Increment consecutive hidden post counter
            VARS.echoCount++;
            if (hideReason !== 'hidden') {
              gf_hidePost(post, hideReason);
            }
          } else {
            // Reset consecutive counter when encountering a visible post
            VARS.echoCount = 0;
            if (VARS.Options?.GF_ANIMATED_GIFS_PAUSE) {
              swatTheMosquitos(post, windowObj);
            }
            if (VARS.hideAnInfoBox) {
              scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock);
            }
            if (VARS.Options?.GF_SHARES) {
              gf_hideNumberOfShares(post, VARS);
            }
          }
        }
      }
    } else {
      // Stream Type 2: Single dedicated group page
      const query = 'div[role="feed"] > div';
      const posts = Array.from(doc.querySelectorAll(query));

      if (posts.length > 0) {
        for (const post of posts) {
          if (post.innerHTML.length === 0) continue;

          let hideReason = '';

          if (nf_isPostAlreadyHidden(post)) {
            hideReason = 'hidden';
          } else {
            doLightDusting(post, VARS);

            if (hideReason === '' && VARS.Options?.GF_SHORT_REEL_VIDEO) {
              hideReason = gf_isShortReelVideo(post, KeyWords);
            }
            if (hideReason === '' && (VARS.Options?.GF_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED)) {
              hideReason = gf_isBlockedText(post, VARS, doc);
            }
            if (hideReason === '' && VARS.Options?.GF_ANIMATED_GIFS_POSTS) {
              hideReason = gf_hasAnimatedGifContent(post, KeyWords);
            }
          }

          if (hideReason.length > 0) {
            VARS.echoCount++;
            if (hideReason !== 'hidden') {
              gf_hidePost(post, hideReason);
            }
          } else {
            VARS.echoCount = 0;
            if (VARS.Options?.GF_ANIMATED_GIFS_PAUSE) {
              swatTheMosquitos(post, windowObj);
            }
            if (VARS.hideAnInfoBox) {
              scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock);
            }
            if (VARS.Options?.GF_SHARES) {
              gf_hideNumberOfShares(post, VARS);
            }
          }
        }
      }
    }

    mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }

  // Handle active media modal dialog
  if (elDialog) {
    if (VARS.Options?.GF_ANIMATED_GIFS_PAUSE) {
      swatTheMosquitos(elDialog, windowObj);
    }
    elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }
}
