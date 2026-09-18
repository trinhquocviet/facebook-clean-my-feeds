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
 * Mops up and purges unwanted content from the News Feed.
 *
 * @param {Object} context - Standard runtime context
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
    // Tablist - Stories / Reels / Rooms
    if (VARS.Options?.NF_TABLIST_STORIES_REELS_ROOMS) {
      nf_scrubTheTabbies(VARS, KeyWords, hideFeature, doc);
    }
    if (VARS.Options?.NF_SURVEY) {
      nf_scrubTheSurvey(KeyWords, hideFeature, doc);
    }

    // Sidebar Sponsored
    if (VARS.Options?.NF_SPONSORED) {
      nf_cleanTheConsoleTable('Sponsored', KeyWords, nf_hidePost, doc);
    }

    // Sidebar Suggestions
    if (VARS.Options?.NF_SUGGESTIONS) {
      nf_cleanTheConsoleTable('Suggestions', KeyWords, nf_hidePost, doc);
    }

    // News Feed Stream
    const posts = nf_getCollectionOfPosts(doc);

    for (const post of posts) {
      if (post.innerHTML.length === 0) {
        // Facebook clearing out DOM during scroll
        continue;
      }

      let hideReason = '';
      let isSponsoredPost = false;

      if (nf_isPostAlreadyHidden(post)) {
        hideReason = 'hidden';
      } else {
        doLightDusting(post, VARS);

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
        if (hideReason === '' && VARS.Options?.NF_SPONSORED && isSponsored(post, VARS, doc)) {
          isSponsoredPost = true;
          hideReason = KeyWords.SPONSORED;
        }
        if (hideReason === '' && (VARS.Options?.NF_BLOCKED_ENABLED || VARS.Options?.GLOBAL_BLOCKED_ENABLED)) {
          hideReason = nf_isBlockedText(post, VARS, doc);
        }
        if (hideReason === '' && VARS.Options?.NF_LIKES_MAXIMUM && VARS.Options.NF_LIKES_MAXIMUM !== '') {
          hideReason = nf_postExceedsLikeCount(post, KeyWords, VARS);
        }
      }

      if (hideReason.length > 0) {
        if (hideReason !== 'hidden') {
          nf_hidePost(post, hideReason, isSponsoredPost);
        }
      } else {
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

    mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }

  if (elDialog) {
    if (VARS.Options?.NF_ANIMATED_GIFS_PAUSE) {
      swatTheMosquitos(elDialog, windowObj);
    }
    elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
    VARS.noChangeCounter = 0;
  }
}
