/**
 * News Feed Detection Rules
 * Part of FB - Clean My Feeds
 *
 * Classifies posts in News Feed: suggestions, people you may know,
 * reels, follow buttons, paid partnerships, like count limits, etc.
 *
 * @module modules/detection/rules/news-feed
 */

import { cleanText, getFullNumber, querySelectorAllNoChildren } from '@/utils/index.js';

/**
 * Detects "Groups you might like" discovery cards inserted into the feed.
 * Facebook periodically injects carousel cards linking to group discovery.
 *
 * @param {HTMLElement} post - Feed post element
 * @returns {boolean} True if group discovery links are found
 */
export function nf_isGroupsYouMightLike(post) {
  const query = 'a[href*="/groups/discover"]';
  const results = post.querySelectorAll(query);
  return results.length > 0;
}

/**
 * Detects ordinary-looking News Feed posts originating from groups the user has NOT joined.
 * Facebook slots these into the main feed disguised as normal posts.
 *
 * Structural signature (language- and class-name independent):
 * 1. The post header (`h4`) contains a link to a `/groups/` URL.
 * 2. Next to the group link is a `[role="button"]` element (the "Join" button).
 * 3. When the user is already a member of the group, that "Join" button is completely absent.
 *
 * @param {HTMLElement} post - Feed post element
 * @returns {boolean} True if post is from an unjoined group
 */
export function nf_isUnjoinedGroupPost(post) {
  const groupLink = post.querySelector('h4 a[href*="/groups/"][role="link"]');
  if (!groupLink) {
    return false;
  }
  const header = groupLink.closest('h4');
  return !!(header && header.querySelector('span[dir] [role="button"]'));
}

/**
 * Detects Reels and short video aggregations (carousels / trays) in the News Feed.
 * Uses a three-tier detection strategy:
 * - Tier 1: Explicit "see more" link (`a[href="/reel/?s=ifu_see_more"]`).
 * - Tier 2: Density check — multiple reel links (`a[href*="/reel/"]`) exceeding 4 items.
 * - Tier 3: Dictionary-based text match on button text within the reel tray header.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Object} VARS - Application state containing dictionaryReelsAndShortVideos
 * @returns {string} Trigger reason (NF_REELS_SHORT_VIDEOS) or empty string
 */
export function nf_isReelsAndShortVideos(post, KeyWords, VARS) {
  // Method 1: Explicit "see more" link
  const queryReelsAndShortVideos = 'a[href="/reel/?s=ifu_see_more"]';
  const elReelsAndShortVideos = post.querySelector(queryReelsAndShortVideos);
  if (elReelsAndShortVideos !== null) {
    return KeyWords.NF_REELS_SHORT_VIDEOS;
  }

  // Method 2: Multi-reel carousel / tray (>4 reel links)
  const queryManyReels = 'a[href*="/reel/"]';
  const manyReels = post.querySelectorAll(queryManyReels);
  if (manyReels.length > 4) {
    return KeyWords.NF_REELS_SHORT_VIDEOS;
  }

  // Method 3: Dictionary-based header button text lookup
  const buttonDiv = post.querySelector('div[role="button"] > i ~ div');
  if (buttonDiv && buttonDiv.textContent) {
    const buttonText = buttonDiv.textContent.trim().toLowerCase();
    if (VARS?.dictionaryReelsAndShortVideos?.find((item) => item === buttonText)) {
      return KeyWords.NF_REELS_SHORT_VIDEOS;
    }
  }

  return '';
}

/**
 * Detects suggestion and recommendation posts ("Suggested for you", "Popular across Facebook").
 *
 * Disambiguation Note:
 * Posts like "<name> commented on this", "<name> replied to a comment", or
 * "X people recently commented" have structural similarities to suggestions.
 * However, legitimate comment notification posts typically begin with a number
 * (e.g. "5 people commented"). Suggested posts do NOT begin with a number.
 *
 * To handle international users, the first character is checked against
 * Unicode number ranges across 8 script systems:
 * - Basic Latin: 0-9 (\u0030-\u0039)
 * - Arabic-Indic: \u0660-\u0669
 * - Eastern Arabic-Indic: \u06F0-\u06F9
 * - Devanagari: \u0966-\u096F
 * - Bengali: \u09E6-\u09EF
 * - Myanmar: \u1040-\u1049
 * - Thai: \u0E50-\u0E59
 * - Tibetan: \u0F20-\u0F29
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Object} VARS - Application state
 * @returns {string} Trigger reason (NF_SUGGESTIONS) or empty string
 */
export function nf_isSuggested(post, KeyWords, VARS) {
  const queries = [
    'div[aria-posinset] > div > div > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > span > div > span:nth-of-type(1)',
    'div[aria-describedby] > div > div > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > span > div > span:nth-of-type(1)'
  ];

  const elSuggestion = querySelectorAllNoChildren(post, queries, 1);
  if (elSuggestion.length > 0) {
    // Prevent false-positive overlap with Reels tray
    if (nf_isReelsAndShortVideos(post, KeyWords, VARS).length > 0) {
      return '';
    }

    // Check if the extracted text begins with a numeric character (indicating comment count)
    const pattern =
      /([0-9]|[\u0660-\u0669]|[\u06F0-\u06F9]|[\u0966-\u096F]|[\u09E6-\u09EF]|[\u1040-\u1049]|[\u0E50-\u0E59]|[\u0F20-\u0F29])/;
    const firstCharacter = cleanText(elSuggestion[0].textContent).trim().slice(0, 1);
    return pattern.test(firstCharacter) ? '' : KeyWords.NF_SUGGESTIONS;
  } else if (nf_isGroupsYouMightLike(post)) {
    return KeyWords.NF_SUGGESTIONS;
  } else if (nf_isUnjoinedGroupPost(post)) {
    return KeyWords.NF_SUGGESTIONS;
  }

  return '';
}

/**
 * Detects "People You May Know" friend recommendation carousels.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_PEOPLE_YOU_MAY_KNOW) or empty string
 */
export function nf_isPeopleYouMayKnow(post, KeyWords) {
  const queryPYMK = 'a[href*="/friends/"][role="link"]';
  const linksPYMK = post.querySelectorAll(queryPYMK);
  return linksPYMK.length === 0 ? '' : KeyWords.NF_PEOPLE_YOU_MAY_KNOW;
}

/**
 * Detects "Paid Partnership" branded content disclaimers.
 * Facebook links these disclaimers to `/business/help/`.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_PAID_PARTNERSHIP) or empty string
 */
export function nf_isPaidPartnership(post, KeyWords) {
  const queryPP = 'span[dir] > span[id] a[href^="/business/help/"]';
  const elPaidPartnership = post.querySelector(queryPP);
  return elPaidPartnership === null ? '' : KeyWords.NF_PAID_PARTNERSHIP;
}

/**
 * Detects "Sponsored · Paid for by..." disclaimer headers.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_SPONSORED_PAID) or empty string
 */
export function nf_isSponsoredPaidBy(post, KeyWords) {
  const querySPB = 'div:nth-child(2) > div > div:nth-child(2) > span[class] > span[id] > div:nth-child(2)';
  const sponsoredPaidBy = querySelectorAllNoChildren(post, querySPB, 1);
  return sponsoredPaidBy.length === 0 ? '' : KeyWords.NF_SPONSORED_PAID;
}

/**
 * Detects a standalone/single Reel video embedded in the News Feed.
 * Exactly one reel link must exist in the post (distinguishing from multi-reel trays).
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_SHORT_REEL_VIDEO) or empty string
 */
export function nf_isShortReelVideo(post, KeyWords) {
  const querySRV = 'a[href*="/reel/"]';
  const elementsSRV = Array.from(post.querySelectorAll(querySRV));
  return elementsSRV.length !== 1 ? '' : KeyWords.NF_SHORT_REEL_VIDEO;
}

/**
 * Detects "Events you may like" recommendation cards in the News Feed.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_EVENTS_YOU_MAY_LIKE) or empty string
 */
export function nf_isEventsYouMayLike(post, KeyWords) {
  const query = ':scope div > div:nth-of-type(2) > div > div >  h3 > span';
  const events = querySelectorAllNoChildren(post, query, 0);
  return events.length === 0 ? '' : KeyWords.NF_EVENTS_YOU_MAY_LIKE;
}

/**
 * Fallback detector: Checks if the post header has an unfollowed person's "Follow" button.
 *
 * Facebook frequently alters byline layouts (e.g. "<name> is at <place>"), which bypasses
 * static depth queries. If the post's `h4` header contains a `[role="button"]`, that button
 * is the "Follow" button rendered only when the current user does not follow that page/person.
 * Group posts are explicitly excluded because their "Join" button is handled by `nf_isUnjoinedGroupPost`.
 *
 * @param {HTMLElement} post - Feed post element
 * @returns {boolean} True if unfollowed button is present
 */
export function nf_hasUnfollowedButtonInHeader(post) {
  const header = post.querySelector('h4');
  if (!header) {
    return false;
  }
  if (header.querySelector('a[href*="/groups/"]')) {
    return false;
  }
  return !!header.querySelector('[role="button"]');
}

/**
 * Detects "Follow" recommendation posts encouraging the user to follow an entity.
 * Uses a multi-query selector ladder followed by the header button fallback.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_FOLLOW) or empty string
 */
export function nf_isFollow(post, KeyWords) {
  const queryFollow = [
    ':scope h4[id] > span > div > span',
    ':scope h4[id] > span > span > div > span',
    ':scope h4[id] > div > span > span[class] > div[class] > span[class]',
    ':scope h4[id] > span > span > span > span',
    ':scope h4 > span > span > span > span > span',
    ':scope h4 > span > span > span > div > span'
  ];
  const elementsFollow = querySelectorAllNoChildren(post, queryFollow, 0, false);
  if (elementsFollow.length === 1) {
    return KeyWords.NF_FOLLOW;
  }

  if (nf_hasUnfollowedButtonInHeader(post)) {
    return KeyWords.NF_FOLLOW;
  }

  return '';
}

/**
 * Detects "Participate" call-to-action posts.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_PARTICIPATE) or empty string
 */
export function nf_isParticipate(post, KeyWords) {
  const queryParticipate = ':scope h4[id] > div[class] > span[dir] > span[class] > div[class] > span[class]';
  const elementsParticipate = querySelectorAllNoChildren(post, queryParticipate, 0);
  return elementsParticipate.length !== 1 ? '' : KeyWords.NF_PARTICIPATE;
}

/**
 * Detects Stories cards embedded directly into the feed stream.
 * Distinguishes feed stories from header navigation.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (NF_STORIES) or empty string
 */
export function nf_isStoriesPost(post, KeyWords) {
  const queryForStory = '[href^="/stories/"][href*="source=from_feed"]';
  const elStory = post.querySelector(queryForStory);
  return elStory ? KeyWords.NF_STORIES : '';
}

/**
 * Checks if a post's like/reaction count exceeds the user-defined maximum threshold.
 * Shortened numbers (e.g. "1.2K", "3.4M") are parsed into full numbers before comparison.
 *
 * @param {HTMLElement} post - Feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Object} VARS - Application state containing user Options
 * @returns {string} Trigger reason (NF_LIKES_MAXIMUM) or empty string
 */
export function nf_postExceedsLikeCount(post, KeyWords, VARS) {
  const queryLikes = 'span[role="toolbar"] ~ div div[role="button"] > span[class][aria-hidden] > span:not([class]) > span[class]';
  const elLikes = post.querySelectorAll(queryLikes);
  if (elLikes.length > 0) {
    const maxLikes = parseInt(VARS.Options.NF_LIKES_MAXIMUM_COUNT, 10);
    const postLikesCount = getFullNumber(elLikes[0].textContent.trim());
    return postLikesCount >= maxLikes ? KeyWords.NF_LIKES_MAXIMUM : '';
  }
  return '';
}

