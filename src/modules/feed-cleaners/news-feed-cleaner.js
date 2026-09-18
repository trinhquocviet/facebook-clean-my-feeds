/**
 * News Feed Cleaner Module
 * Part of FB - Clean My Feeds
 *
 * Implements the mopping pipeline for the Facebook News Feed:
 * handles story tabbies, surveys, sidebar console tables,
 * post classification loop, post obscuring, GIF swatting,
 * info boxes, and shares counter suppression.
 *
 * @module modules/feed-cleaners/news-feed-cleaner
 */

import {
  doLightDusting,
  nf_getCollectionOfPosts,
  isSponsored,
  nf_isSuggested,
  nf_isPeopleYouMayKnow,
  nf_isPaidPartnership,
  nf_isSponsoredPaidBy,
  nf_isReelsAndShortVideos,
  nf_isShortReelVideo,
  nf_isEventsYouMayLike,
  nf_isFollow,
  nf_isParticipate,
  nf_isStoriesPost,
  nf_postExceedsLikeCount,
  nf_hasAnimatedGifContent,
  nf_isBlockedText,
  swatTheMosquitos,
  scrubInfoBoxes,
  nf_hideNumberOfShares,
  nf_scrubTheTabbies,
  nf_scrubTheSurvey,
  nf_cleanTheConsoleTable
} from '@/modules/detection/index.js';
import { mainColumnAtt } from '@/constants/index.js';

/**
 * Mops up and purges unwanted content from the Facebook News Feed.
 *
 * ## Pipeline Execution Waterfall
 * 1. **Dirty Check Guard**: Calls `isTheHouseDirty()` to verify if the main feed column
 *    or an active photo/media modal dialog has changed in length. Returns immediately if clean.
 * 2. **Header & Sidebar Mopping**:
 *    - Scrubs the top tablist (Stories, Reels, Rooms) if `NF_TABLIST_STORIES_REELS_ROOMS` is set.
 *    - Scrubs feedback surveys if `NF_SURVEY` is enabled.
 *    - Purges right sidebar console tables (Sponsored ads & suggested pages/people).
 * 3. **News Feed Post Stream**:
 *    - Queries candidate post elements via `nf_getCollectionOfPosts()`.
 *    - Detects empty innerHTML (Facebook virtualization clearing posts during fast scrolling).
 *    - Fast-paths already-hidden posts (`nf_isPostAlreadyHidden`).
 *    - Executes `doLightDusting` to strip telemetry parameters (`__cft__`, `__tn__`) from links.
 *    - Evaluates detection rules in order of computational efficiency and structural specificity:
 *      Reels/Short Videos -> Single short reel -> Paid partnerships -> People you may know ->
 *      Suggestions -> Follow/Participate -> Sponsored Paid By -> Events -> Stories ->
 *      Animated GIFs -> Sponsored (shadow root / canvas / xlink / length heuristic) ->
 *      Blocked keywords/regex -> Like count ceiling.
 *    - **Priority Note**: Sponsored detection runs before text blocking because sponsored ads
 *      often contain promotional keywords; categorizing as "Sponsored" provides better audit clarity.
 * 4. **Post Obscuring & Secondary Actions**:
 *    - Hides flagged posts using `nf_hidePost`.
 *    - For surviving posts: pauses mosquito GIFs, scrubs regulatory info boxes, and suppresses share counts.
 * 5. **State Stamping**:
 *    - Updates `mainColumnAtt` with current length and resets `noChangeCounter`.
 *
 * @param {Object} context - Standard runtime context
 * @param {Object} context.VARS - Application global state
 * @param {Object} context.KeyWords - Localized dictionary of hide reasons
 * @param {Object} context.postObscurer - Obscurer utilities (nf_hidePost, hideFeature, etc.)
 * @param {Function} context.isTheHouseDirty - Dirty checker for news feed
 * @param {Object} context.masterKeyWords - Keyword master dictionary for info boxes
 * @param {Document} [context.doc=document] - DOM document
 * @param {Window} [context.windowObj=window] - Browser window
 */
export function mopUpTheNewsFeed({
  VARS,
  KeyWords,
  postObscurer = {},
  isTheHouseDirty,
  masterKeyWords,
  doc = typeof document !== 'undefined' ? document : null,
  windowObj = typeof window !== 'undefined' ? window : null
}) {
  const [mainColumn, elDialog] = isTheHouseDirty ? isTheHouseDirty() : [null, null];
  if (mainColumn === null && elDialog === null) {
    return;
  }

  const {
    nf_isPostAlreadyHidden,
    nf_hidePost,
    hideFeature,
    hideBlock
  } = postObscurer;

  if (mainColumn) {
    // Stage 1: Scrub top-of-feed tabs (Stories / Reels / Rooms) & surveys
    if (VARS.Options?.NF_TABLIST_STORIES_REELS_ROOMS) {
      nf_scrubTheTabbies(VARS, KeyWords, hideFeature, doc);
    }
    if (VARS.Options?.NF_SURVEY) {
      nf_scrubTheSurvey(KeyWords, hideFeature, doc);
    }

    // Stage 2: Scrub right-hand sidebar "console table" sections
    if (VARS.Options?.NF_SPONSORED) {
      nf_cleanTheConsoleTable('Sponsored', KeyWords, nf_hidePost, doc);
    }
    if (VARS.Options?.NF_SUGGESTIONS) {
      nf_cleanTheConsoleTable('Suggestions', KeyWords, nf_hidePost, doc);
    }

    // Stage 3: Scan news feed stream posts
    const posts = nf_getCollectionOfPosts(doc);

    for (const post of posts) {
      // Skip posts empty of HTML (Facebook DOM virtualization prunes content during scrolling)
      if (post.innerHTML.length === 0) {
        continue;
      }

      let hideReason = '';
      let isSponsoredPost = false;

      // Fast check: skip posts already wrapped in an obscurer <details> element
      if (nf_isPostAlreadyHidden(post)) {
        hideReason = 'hidden';
      } else {
        // Strip tracking telemetry parameters from anchor hrefs
        doLightDusting(post, VARS);

        // Classification Rule Waterfall:
        if (hideReason === '' && VARS.Options?.NF_REELS_SHORT_VIDEOS) {
          hideReason = nf_isReelsAndShortVideos(post, KeyWords, VARS);
        }
        if (hideReason === '' && VARS.Options?.NF_SHORT_REEL_VIDEO) {
          hideReason = nf_isShortReelVideo(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_PAID_PARTNERSHIP) {
          hideReason = nf_isPaidPartnership(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_PEOPLE_YOU_MAY_KNOW) {
          hideReason = nf_isPeopleYouMayKnow(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_SUGGESTIONS) {
          hideReason = nf_isSuggested(post, KeyWords, VARS);
        }
        if (hideReason === '' && VARS.Options?.NF_FOLLOW) {
          hideReason = nf_isFollow(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_PARTICIPATE) {
          hideReason = nf_isParticipate(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_SPONSORED_PAID) {
          hideReason = nf_isSponsoredPaidBy(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_EVENTS_YOU_MAY_LIKE) {
          hideReason = nf_isEventsYouMayLike(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_STORIES) {
          hideReason = nf_isStoriesPost(post, KeyWords);
        }
        if (hideReason === '' && VARS.Options?.NF_ANIMATED_GIFS_POSTS) {
          hideReason = nf_hasAnimatedGifContent(post, KeyWords);
        }
        // Placed here due to overlap between sponsored indicators and other content rules
        if (hideReason === '' && VARS.Options?.NF_SPONSORED && isSponsored(post, VARS, doc)) {
          isSponsoredPost = true;
          hideReason = KeyWords.SPONSORED;
        }
        // Sponsored takes priority over blocked text when both keywords match
        if (hideReason === '' && (VARS.Options?.NF_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED)) {
          hideReason = nf_isBlockedText(post, VARS, doc);
        }
        // Likes maximum threshold check executes last
        if (hideReason === '' && VARS.Options?.NF_LIKES_MAXIMUM && VARS.Options.NF_LIKES_MAXIMUM !== '') {
          hideReason = nf_postExceedsLikeCount(post, KeyWords, VARS);
        }
      }

      if (hideReason.length > 0) {
        if (hideReason !== 'hidden') {
          nf_hidePost(post, hideReason, isSponsoredPost);
        }
      } else {
        // Post is kept visible: execute in-post scrubbers
        if (VARS.Options?.NF_ANIMATED_GIFS_PAUSE) {
          swatTheMosquitos(post, windowObj);
        }
        if (VARS.hideAnInfoBox) {
          scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock);
        }
        if (VARS.Options?.NF_SHARES) {
          nf_hideNumberOfShares(post, VARS);
        }
      }
    }

    // Stamp main column with current HTML length to throttle redundant passes
    mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }

  // Handle media/photo modal dialog if currently active in the DOM
  if (elDialog) {
    if (VARS.Options?.NF_ANIMATED_GIFS_PAUSE) {
      swatTheMosquitos(elDialog, windowObj);
    }
    elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }
}
