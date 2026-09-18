/**
 * Feature Scrubbers & Cleaners Module
 * Part of FB - Clean My Feeds
 *
 * Implements granular scrubbers for animated GIFs, topic info boxes,
 * shares count, survey boxes, sidebars/console tables, and new tab link injection.
 *
 * @module modules/detection/scrubbers
 */

import {
  climbUpTheTree,
  getVideoPublisherPathFromURL,
  querySelectorAllNoChildren
} from '@/utils/index.js';
import {
  postAtt,
  postAttChildFlag,
  ICON_NEW_WINDOW,
  ICON_NEW_WINDOW_CLASS
} from '@/constants/index.js';
import { nf_getBlocksQuery, gf_getBlocksQuery } from './text-filter.js';

/**
 * Returns the CSS selector query for identifying animated GIF play/pause overlay controls.
 * Facebook wraps animated MP4 / GIPHY elements with a round dashed "GIF" label button.
 *
 * @returns {string} Selector string
 */
export function getMosquitosQuery() {
  return `div[role="button"][aria-label*="GIF"]:not([${postAtt}]) > i:not([data-visualcompletion])`;
}

/**
 * "Swats" animated GIFs by pausing them once.
 *
 * Behavioral Rationale:
 * This function does NOT hide the post. Instead, it pauses looping animated GIFs
 * (frequently used in comments and memes) to eliminate distracting motion.
 * It simulates a user click on the overlay button: Facebook uses an overlay anchor (`<a>`)
 * whose computed opacity is '0' while animating and '1' when paused. If opacity is '0',
 * clicking the element triggers Facebook's native pause event.
 *
 * @param {HTMLElement} post - Post element to inspect
 * @param {Window} [win=window] - Browser window object
 */
export function swatTheMosquitos(post, win = typeof window !== 'undefined' ? window : null) {
  const query = getMosquitosQuery();
  const animatedGIFs = post.querySelectorAll(query);

  for (const gif of animatedGIFs) {
    let parent = climbUpTheTree(gif, 2);
    let sibling = parent ? parent.querySelector(':scope > a') : null;
    if (!sibling && parent) {
      // Fallback for pre-2023 DOM layout (3 levels up)
      parent = climbUpTheTree(gif, 3);
      sibling = parent ? parent.querySelector(':scope > a') : null;
    }

    if (sibling && win) {
      const siblingCS = win.getComputedStyle(sibling);
      // Opacity: 0 = currently animating, 1 = paused
      if (siblingCS.opacity === '0') {
        gif.parentElement.click();
      }
      // Flag element so it is not processed repeatedly
      gif.parentElement.setAttribute(postAtt, '1');
    }
  }
}

/**
 * Checks if a News Feed post contains animated GIF content in its primary content block.
 * Scans block 1 (content body) only, deliberately ignoring comments blocks.
 *
 * @param {HTMLElement} post - News feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (GF_ANIMATED_GIFS_POSTS) or empty string
 */
export function nf_hasAnimatedGifContent(post, KeyWords) {
  const postBlocks = post.querySelectorAll(nf_getBlocksQuery(post));
  if (postBlocks.length >= 2) {
    const contentBlock = postBlocks[1];
    const animatedGIFs = contentBlock.querySelectorAll(getMosquitosQuery());
    return animatedGIFs.length > 0 ? KeyWords.GF_ANIMATED_GIFS_POSTS : '';
  }
  return '';
}

/**
 * Checks if a Groups Feed post contains animated GIF content in its content block.
 *
 * @param {HTMLElement} post - Groups feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (GF_ANIMATED_GIFS_POSTS) or empty string
 */
export function gf_hasAnimatedGifContent(post, KeyWords) {
  const postBlocks = post.querySelectorAll(gf_getBlocksQuery(post));
  if (postBlocks.length >= 2) {
    const contentBlock = postBlocks[1];
    const animatedGIFs = contentBlock.querySelectorAll(getMosquitosQuery());
    return animatedGIFs.length > 0 ? KeyWords.GF_ANIMATED_GIFS_POSTS : '';
  }
  return '';
}

/**
 * Resolves the top-level container element for the Stories tray.
 *
 * Traversal logic:
 * - If multiple `/stories/` links exist (carousel mode with user stories):
 *   Locates the parent `[role="region"]` and climbs 4 levels up.
 * - If only a single link exists (standalone "Create Story" button):
 *   Climbs 7 levels up from the create button.
 *
 * @param {HTMLElement} element - Create story anchor element
 * @returns {HTMLElement|null} Parent Stories container element
 */
export function getStoriesParent(element) {
  const elAFewBranchesUp = climbUpTheTree(element, 4);
  if (!elAFewBranchesUp) return null;

  const moreStories = elAFewBranchesUp.querySelectorAll('a[href*="/stories/"]');
  if (moreStories.length > 1) {
    // Carousel with "Create story" and one or more active stories
    const region = element.closest ? element.closest('div[aria-label][role="region"]') : null;
    return climbUpTheTree(region, 4);
  }
  // Standalone "Create story" box without carousel
  return climbUpTheTree(element, 7);
}

/**
 * Scrubs the Stories, Reels, and Rooms tablist section located at the top of the News Feed.
 *
 * @param {Object} VARS - Application state
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Function} hideFeature - Obscurer callback to hide feature container
 * @param {Document} [doc=document] - DOM document
 */
export function nf_scrubTheTabbies(VARS, KeyWords, hideFeature, doc = document) {
  const queryTabList = 'div[role="main"] > div > div > div > div > div > div > div > div[role="tablist"]';
  const elTabList = doc.querySelector(queryTabList);
  if (elTabList) {
    if (elTabList.hasAttribute(postAttChildFlag)) {
      return;
    }
    // Tablist container is 4 levels up
    const elParent = climbUpTheTree(elTabList, 4);
    if (elParent) {
      const rawReason = KeyWords?.NF_TABLIST_STORIES_REELS_ROOMS?.[VARS.language] ?? 'Stories';
      hideFeature(elParent, rawReason.replaceAll('"', ''), false);
      elTabList.setAttribute(postAttChildFlag, 'tablist');
    }
  } else {
    // Standalone Stories section without tablist
    const queryForCreateStory =
      'div[role="main"] > div > div > div > div > div > div > div > div a[href*="/stories/create"]';
    const elCreateStory = doc.querySelector(queryForCreateStory);
    if (elCreateStory && !elCreateStory.hasAttribute(postAttChildFlag)) {
      const elParent = getStoriesParent(elCreateStory);
      if (elParent !== null) {
        hideFeature(elParent, KeyWords.NF_TABLIST_STORIES_REELS_ROOMS, false);
        elCreateStory.setAttribute(postAttChildFlag, '1');
      }
    }
  }
}

/**
 * Detects and hides Facebook user experience feedback surveys on the home page.
 *
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Function} hideFeature - Obscurer callback to hide feature container
 * @param {Document} [doc=document] - DOM document
 */
export function nf_scrubTheSurvey(KeyWords, hideFeature, doc = document) {
  const btnSurvey = doc.querySelector(`a[href*="/survey/?session="] > div[role="none"]:not([${postAtt}])`);
  if (btnSurvey) {
    const container = btnSurvey.closest ? btnSurvey.closest('[style*="border-radius"]') : null;
    const elContainer = climbUpTheTree(container, 3);
    if (elContainer) {
      hideFeature(elContainer, 'Survey', false);
      btnSurvey.setAttribute(postAttChildFlag, KeyWords.NF_SURVEY);
    }
  }
}

/**
 * Hides informational/disclaimer callout boxes inserted under posts having certain topics:
 * - Climate Science information center
 * - Coronavirus information center
 * - Subscribe to news notifications
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing user Options
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Object} masterKeyWords - Dictionary containing URL pathMatch definitions
 * @param {Function} hideBlock - Obscurer callback to hide generic block
 */
export function scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock) {
  let hiding = false;

  // Climate Science Info Box
  if (VARS?.Options?.OTHER_INFO_BOX_CLIMATE_SCIENCE && masterKeyWords?.pathInfo?.OTHER_INFO_BOX_CLIMATE_SCIENCE) {
    const elLink = post.querySelector(
      `a[href*="${masterKeyWords.pathInfo.OTHER_INFO_BOX_CLIMATE_SCIENCE.pathMatch}"]:not([${postAtt}])`
    );
    if (elLink !== null) {
      const block = climbUpTheTree(elLink, 5);
      hideBlock(block, elLink, KeyWords.OTHER_INFO_BOX_CLIMATE_SCIENCE);
      hiding = true;
    }
  }

  // Coronavirus Info Box
  if (!hiding && VARS?.Options?.OTHER_INFO_BOX_CORONAVIRUS && masterKeyWords?.pathInfo?.OTHER_INFO_BOX_CORONAVIRUS) {
    const elLink = post.querySelector(
      `a[href*="${masterKeyWords.pathInfo.OTHER_INFO_BOX_CORONAVIRUS.pathMatch}"]:not([${postAtt}])`
    );
    if (elLink !== null) {
      const block = climbUpTheTree(elLink, 5);
      hideBlock(block, elLink, KeyWords.OTHER_INFO_BOX_CORONAVIRUS);
      hiding = true;
    }
  }

  // Subscribe Info Box
  if (!hiding && VARS?.Options?.OTHER_INFO_BOX_SUBSCRIBE && masterKeyWords?.pathInfo?.OTHER_INFO_BOX_SUBSCRIBE) {
    const elLink = post.querySelector(
      `a[href*="${masterKeyWords.pathInfo.OTHER_INFO_BOX_SUBSCRIBE.pathMatch}"]:not([${postAtt}])`
    );
    if (elLink !== null) {
      const block = climbUpTheTree(elLink, 5);
      hideBlock(block, elLink, KeyWords.OTHER_INFO_BOX_SUBSCRIBE);
    }
  }
}

/**
 * Hides the "# shares" count element on News Feed posts via CSS attribute stamping.
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state containing cssHideNumberOfShares and showAtt
 */
export function nf_hideNumberOfShares(post, VARS) {
  const query = `div[data-visualcompletion="ignore-dynamic"] > div:not([class]) > div:not([class]) > div:not([class]) > div[class] > div:nth-of-type(1) > div > div > span > div:not([id]) > span[dir]:not(${postAtt})`;
  const shares = post.querySelectorAll(query);
  for (const share of shares) {
    share.setAttribute(VARS.cssHideNumberOfShares, '');
    if (VARS.Options?.VERBOSITY_DEBUG) {
      share.setAttribute(VARS.showAtt, '');
    }
    share.setAttribute(postAtt, 'Shares');
  }
}

/**
 * Hides the "# shares" count on Groups Feed posts (shares identical HTML structure with News Feed).
 *
 * @param {HTMLElement} post - Post element
 * @param {Object} VARS - Application state
 */
export function gf_hideNumberOfShares(post, VARS) {
  nf_hideNumberOfShares(post, VARS);
}

/**
 * Hides the 3rd block of a video post if it contains sponsored promotion text.
 *
 * @param {HTMLElement} post - Video post element
 * @param {string} query - Unused selector (maintained for signature parity)
 * @param {string} queryBlocks - Query selector matching video blocks
 * @param {Object} VARS - Application state containing hideAtt
 * @param {string} [log=''] - Logging prefix
 */
export function vf_hideSponsoredBlock(post, query, queryBlocks, VARS, log = '') {
  const videoBlocks = post.querySelectorAll(queryBlocks);
  if (videoBlocks.length < 3) {
    return;
  }
  const thirdBlock = videoBlocks[2];
  if (thirdBlock.hasAttribute('class') || thirdBlock.hasAttribute(VARS.hideAtt)) {
    return;
  }
  thirdBlock.setAttribute(VARS.hideAtt, 'Sponsored Content');
  if (log) {
    console.info(`${log}vf_hideSponsoredBlock(); third block hidden:`, thirdBlock);
  }
}

/**
 * Scrubs standalone sponsored anchor blocks inside video content wrappers.
 *
 * @param {HTMLElement} post - Video post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Function} hideBlock - Obscurer callback to hide block
 */
export function vf_scrubSponsoredBlock(post, KeyWords, hideBlock) {
  const queryForContainer = ':scope > div > div > div > div > div > div:nth-of-type(2)';
  const blocksContainer = post.querySelector(queryForContainer);
  if (blocksContainer && blocksContainer.childElementCount > 0) {
    const adBlock = blocksContainer.querySelector(':scope > a');
    if (adBlock && !adBlock.hasAttribute(postAtt)) {
      hideBlock(adBlock, adBlock, KeyWords.SPONSORED);
    }
  }
}

/**
 * Cleans the right-hand complementary sidebar in the News Feed.
 *
 * Handles two categories:
 * - 'Sponsored': Hides third-party ad blocks in the sidebar.
 * - 'Suggestions': Hides suggested pages and groups while deliberately PRESERVING
 *   legitimate birthday reminders (`/events/birthdays/`) and user-managed pages.
 *
 * @param {'Sponsored'|'Suggestions'} findItem - Item category to target
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Function} nf_hidePost - Post hiding callback
 * @param {Document} [doc=document] - DOM document
 */
export function nf_cleanTheConsoleTable(findItem, KeyWords, nf_hidePost, doc = document) {
  const query = 'div[role="complementary"] > div > div > div > div > div:not([data-visualcompletion])';
  const asideBoxes = doc.querySelectorAll(query);
  if (asideBoxes.length === 0) return;

  // Target the first complementary sidebar container
  const asideContainer = asideBoxes[0];
  if (asideContainer.childElementCount === 0) return;

  let elItem = null;
  let reason = '';

  if (findItem === 'Sponsored') {
    elItem = asideContainer.querySelector(`:scope > span:not([${postAtt}])`);
    if (elItem && elItem.innerHTML.length > 0) {
      reason = KeyWords.SPONSORED;
    }
  } else if (findItem === 'Suggestions') {
    elItem = asideContainer.querySelector(`:scope > div:not([${postAtt}])`);
    if (elItem && elItem.innerHTML.length > 0) {
      // Preserve birthdays section
      const birthdays = elItem.querySelectorAll('a[href="/events/birthdays/"]').length > 0;
      // Preserve "Your pages and profiles" (suggested groups only have 1 css-img icon)
      const pagesAndProfiles = elItem.querySelectorAll('div > i[data-visualcompletion="css-img"]').length > 1;
      if (!birthdays && !pagesAndProfiles) {
        reason = KeyWords.NF_SUGGESTIONS;
      }
    }
  }

  if (reason.length > 0 && elItem) {
    nf_hidePost(elItem, reason);
  }
}

/**
 * Cleans the complementary sidebar in the Groups Feed ("Suggested Groups").
 * Climbs 21 levels up the DOM hierarchy from the discover link to hide the entire card.
 *
 * @param {'Suggestions'} findItem - Item category to target
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {Function} hideFeature - Obscurer callback to hide feature container
 * @param {Document} [doc=document] - DOM document
 */
export function gf_cleanTheConsoleTable(findItem, KeyWords, hideFeature, doc = document) {
  if (findItem !== 'Suggestions') return;

  const query = `a[href*="/groups/discover"]:not([${postAtt}]) > span > span`;
  const asideBoxes = querySelectorAllNoChildren(doc, query, 1);
  if (asideBoxes.length === 0) return;

  for (const asideBox of asideBoxes) {
    // The discover card wrapper resides 21 levels above the discover link text
    const elParent = climbUpTheTree(asideBox, 21);
    const anchor = asideBox.closest ? asideBox.closest('a') : null;
    if (anchor) anchor.setAttribute(postAtt, KeyWords.GF_SUGGESTIONS);
    if (elParent) hideFeature(elParent, KeyWords.GF_SUGGESTIONS, true);
  }
}

/**
 * Injects an "Open in new window" icon button into Watch Video feed post headers.
 *
 * URL Reconstruction:
 * Extracts `v` video ID from `/watch/?v=<id>` and publisher link from `/watch/<publisher>/`,
 * reconstructing the standalone canonical URL: `https://www.facebook.com/<publisher>/videos/<videoId>/`.
 *
 * @param {HTMLElement} post - Video post element
 * @param {Document} [doc=document] - DOM document
 */
export function vf_setPostLinkToOpenInNewTab(post, doc = document) {
  try {
    if (post.querySelector(`.${ICON_NEW_WINDOW_CLASS}`)) {
      return;
    }

    const postLinks = post.querySelectorAll('div > span > a[href*="/watch/?v="][role="link"]');
    if (postLinks.length > 0) {
      const postLink = postLinks[0];
      const elHeader = climbUpTheTree(postLink, 3);
      if (!elHeader) return;

      const blockOfIcons = elHeader.querySelector(':scope > div:nth-of-type(2) > span');
      if (!blockOfIcons) return;

      const videoId = new URL(postLink.href).searchParams.get('v');
      if (!videoId) return;

      const watchLink = post.querySelector('a[href*="/watch/"]');
      if (!watchLink || !watchLink.href) return;

      const publisherLink = getVideoPublisherPathFromURL(watchLink.href);
      if (!publisherLink) return;

      const newLink = `${publisherLink}videos/${videoId}/`;

      // Insert Facebook standard separator bullet ( · )
      const spanSpacer = doc.createElement('span');
      spanSpacer.innerHTML =
        '<span><span style="position:absolute;width:1px;height:1px;">&nbsp;</span><span aria-hidden="true"> · </span></span>';
      blockOfIcons.appendChild(spanSpacer);

      // Create new tab button container
      const container = doc.createElement('span');
      container.className = ICON_NEW_WINDOW_CLASS;
      const span2 = doc.createElement('span');
      const linkNew = doc.createElement('a');
      linkNew.setAttribute('href', newLink);
      linkNew.innerHTML = ICON_NEW_WINDOW;
      linkNew.setAttribute('target', '_blank');
      span2.appendChild(linkNew);
      container.appendChild(span2);

      blockOfIcons.appendChild(container);
    }
  } catch {
    // Non-critical UI enhancement; fail silently
  }
}

/**
 * Injects an "Open in new window" icon button into Groups Feed post headers.
 *
 * URL Reconstruction:
 * Extracts `multi_permalinks` query parameter from group post anchor:
 * e.g. `https://www.facebook.com/groups/123/?multi_permalinks=456&...`
 * is converted to `https://www.facebook.com/groups/123/posts/456/`.
 *
 * @param {HTMLElement} post - Group post element
 * @param {string} [log=''] - Logging prefix
 * @param {Document} [doc=document] - DOM document
 */
export function gf_setPostLinkToOpenInNewTab(post, log = '', doc = document) {
  try {
    if (post.hasAttribute('class') && post.classList && post.classList.length > 0) {
      return;
    }
    if (post.querySelector(`.${ICON_NEW_WINDOW_CLASS}`)) {
      return;
    }

    const postLinks = post.querySelectorAll('div > div > a[href*="/groups/"][role="link"]');
    if (postLinks.length > 0) {
      const postLink = postLinks[0];
      const elHeader = climbUpTheTree(postLink, 4);
      if (!elHeader) return;

      const blockOfIcons = elHeader.querySelector(
        ':scope > div:nth-of-type(2) > div > div:nth-of-type(2) > span > span'
      );
      if (!blockOfIcons) return;

      const postId = new URLSearchParams(postLink.href).get('multi_permalinks');
      if (!postId) return;

      const newLink = `${postLink.href.split('?')[0]}posts/${postId}/`;

      // Insert Facebook standard separator bullet ( · )
      const spanSpacer = doc.createElement('span');
      spanSpacer.innerHTML =
        '<span><span style="position:absolute;width:1px;height:1px;">&nbsp;</span><span aria-hidden="true"> · </span></span>';
      blockOfIcons.appendChild(spanSpacer);

      // Create new tab button container
      const container = doc.createElement('span');
      container.className = ICON_NEW_WINDOW_CLASS;
      const span2 = doc.createElement('span');
      const linkNew = doc.createElement('a');
      linkNew.setAttribute('href', newLink);
      linkNew.innerHTML = ICON_NEW_WINDOW;
      linkNew.setAttribute('target', '_blank');
      span2.appendChild(linkNew);
      container.appendChild(span2);

      blockOfIcons.appendChild(container);
    }
  } catch (error) {
    if (log) {
      console.error(`${log}gf_setPostLinkToOpenInNewTab(); Error:`, post, error);
    }
  }
}

