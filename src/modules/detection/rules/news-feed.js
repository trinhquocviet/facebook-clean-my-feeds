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

export function nf_isGroupsYouMightLike(post) {
  const query = 'a[href*="/groups/discover"]';
  const results = post.querySelectorAll(query);
  return results.length > 0;
}

export function nf_isUnjoinedGroupPost(post) {
  const groupLink = post.querySelector('h4 a[href*="/groups/"][role="link"]');
  if (!groupLink) {
    return false;
  }
  const header = groupLink.closest('h4');
  return !!(header && header.querySelector('span[dir] [role="button"]'));
}

export function nf_isReelsAndShortVideos(post, KeyWords, VARS) {
  const queryReelsAndShortVideos = 'a[href="/reel/?s=ifu_see_more"]';
  const elReelsAndShortVideos = post.querySelector(queryReelsAndShortVideos);
  if (elReelsAndShortVideos !== null) {
    return KeyWords.NF_REELS_SHORT_VIDEOS;
  }

  const queryManyReels = 'a[href*="/reel/"]';
  const manyReels = post.querySelectorAll(queryManyReels);
  if (manyReels.length > 4) {
    return KeyWords.NF_REELS_SHORT_VIDEOS;
  }

  const buttonDiv = post.querySelector('div[role="button"] > i ~ div');
  if (buttonDiv && buttonDiv.textContent) {
    const buttonText = buttonDiv.textContent.trim().toLowerCase();
    if (VARS?.dictionaryReelsAndShortVideos?.find((item) => item === buttonText)) {
      return KeyWords.NF_REELS_SHORT_VIDEOS;
    }
  }

  return '';
}

export function nf_isSuggested(post, KeyWords, VARS) {
  const queries = [
    'div[aria-posinset] > div > div > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > span > div > span:nth-of-type(1)',
    'div[aria-describedby] > div > div > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > span > div > span:nth-of-type(1)'
  ];

  const elSuggestion = querySelectorAllNoChildren(post, queries, 1);
  if (elSuggestion.length > 0) {
    if (nf_isReelsAndShortVideos(post, KeyWords, VARS).length > 0) {
      return '';
    }
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

export function nf_isPeopleYouMayKnow(post, KeyWords) {
  const queryPYMK = 'a[href*="/friends/"][role="link"]';
  const linksPYMK = post.querySelectorAll(queryPYMK);
  return linksPYMK.length === 0 ? '' : KeyWords.NF_PEOPLE_YOU_MAY_KNOW;
}

export function nf_isPaidPartnership(post, KeyWords) {
  const queryPP = 'span[dir] > span[id] a[href^="/business/help/"]';
  const elPaidPartnership = post.querySelector(queryPP);
  return elPaidPartnership === null ? '' : KeyWords.NF_PAID_PARTNERSHIP;
}

export function nf_isSponsoredPaidBy(post, KeyWords) {
  const querySPB = 'div:nth-child(2) > div > div:nth-child(2) > span[class] > span[id] > div:nth-child(2)';
  const sponsoredPaidBy = querySelectorAllNoChildren(post, querySPB, 1);
  return sponsoredPaidBy.length === 0 ? '' : KeyWords.NF_SPONSORED_PAID;
}

export function nf_isShortReelVideo(post, KeyWords) {
  const querySRV = 'a[href*="/reel/"]';
  const elementsSRV = Array.from(post.querySelectorAll(querySRV));
  return elementsSRV.length !== 1 ? '' : KeyWords.NF_SHORT_REEL_VIDEO;
}

export function nf_isEventsYouMayLike(post, KeyWords) {
  const query = ':scope div > div:nth-of-type(2) > div > div >  h3 > span';
  const events = querySelectorAllNoChildren(post, query, 0);
  return events.length === 0 ? '' : KeyWords.NF_EVENTS_YOU_MAY_LIKE;
}

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

export function nf_isParticipate(post, KeyWords) {
  const queryParticipate = ':scope h4[id] > div[class] > span[dir] > span[class] > div[class] > span[class]';
  const elementsParticipate = querySelectorAllNoChildren(post, queryParticipate, 0);
  return elementsParticipate.length !== 1 ? '' : KeyWords.NF_PARTICIPATE;
}

export function nf_isStoriesPost(post, KeyWords) {
  const queryForStory = '[href^="/stories/"][href*="source=from_feed"]';
  const elStory = post.querySelector(queryForStory);
  return elStory ? KeyWords.NF_STORIES : '';
}

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
