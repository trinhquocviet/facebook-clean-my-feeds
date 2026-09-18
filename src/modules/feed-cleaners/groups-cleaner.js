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
 * Mops up and purges unwanted content from the Groups Feed.
 *
 * @param {Object} context - Standard runtime context
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
      // Main groups feed
      if (VARS.Options?.GF_SUGGESTIONS) {
        gf_cleanTheConsoleTable('Suggestions', KeyWords, hideFeature, doc);
      }

      const query = VARS.gfType === 'groups-recent' ? 'h2[dir="auto"] + div > div' : 'div[role="feed"] > div';
      const posts = Array.from(doc.querySelectorAll(query));

      if (posts.length > 0) {
        const count = posts.length;
        const start = count < 25 ? 0 : count - 25;

        for (let i = start; i < count; i++) {
          const post = posts[i];
          if (post.innerHTML.length === 0) continue;

          let hideReason = '';

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
    } else {
      // Single group page
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

  if (elDialog) {
    if (VARS.Options?.GF_ANIMATED_GIFS_PAUSE) {
      swatTheMosquitos(elDialog, windowObj);
    }
    elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }
}
