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

export function getMosquitosQuery() {
  return `div[role="button"][aria-label*="GIF"]:not([${postAtt}]) > i:not([data-visualcompletion])`;
}

export function swatTheMosquitos(post, win = typeof window !== 'undefined' ? window : null) {
  const query = getMosquitosQuery();
  const animatedGIFs = post.querySelectorAll(query);

  for (const gif of animatedGIFs) {
    let parent = climbUpTheTree(gif, 2);
    let sibling = parent ? parent.querySelector(':scope > a') : null;
    if (!sibling && parent) {
      parent = climbUpTheTree(gif, 3);
      sibling = parent ? parent.querySelector(':scope > a') : null;
    }

    if (sibling && win) {
      const siblingCS = win.getComputedStyle(sibling);
      if (siblingCS.opacity === '0') {
        gif.parentElement.click();
      }
      gif.parentElement.setAttribute(postAtt, '1');
    }
  }
}

export function nf_hasAnimatedGifContent(post, KeyWords) {
  const postBlocks = post.querySelectorAll(nf_getBlocksQuery(post));
  if (postBlocks.length >= 2) {
    const contentBlock = postBlocks[1];
    const animatedGIFs = contentBlock.querySelectorAll(getMosquitosQuery());
    return animatedGIFs.length > 0 ? KeyWords.GF_ANIMATED_GIFS_POSTS : '';
  }
  return '';
}

export function gf_hasAnimatedGifContent(post, KeyWords) {
  const postBlocks = post.querySelectorAll(gf_getBlocksQuery(post));
  if (postBlocks.length >= 2) {
    const contentBlock = postBlocks[1];
    const animatedGIFs = contentBlock.querySelectorAll(getMosquitosQuery());
    return animatedGIFs.length > 0 ? KeyWords.GF_ANIMATED_GIFS_POSTS : '';
  }
  return '';
}

export function getStoriesParent(element) {
  const elAFewBranchesUp = climbUpTheTree(element, 4);
  if (!elAFewBranchesUp) return null;

  const moreStories = elAFewBranchesUp.querySelectorAll('a[href*="/stories/"]');
  if (moreStories.length > 1) {
    const region = element.closest ? element.closest('div[aria-label][role="region"]') : null;
    return climbUpTheTree(region, 4);
  }
  return climbUpTheTree(element, 7);
}

export function nf_scrubTheTabbies(VARS, KeyWords, hideFeature, doc = document) {
  const queryTabList = 'div[role="main"] > div > div > div > div > div > div > div > div[role="tablist"]';
  const elTabList = doc.querySelector(queryTabList);
  if (elTabList) {
    if (elTabList.hasAttribute(postAttChildFlag)) {
      return;
    }
    const elParent = climbUpTheTree(elTabList, 4);
    if (elParent) {
      const rawReason = KeyWords?.NF_TABLIST_STORIES_REELS_ROOMS?.[VARS.language] ?? 'Stories';
      hideFeature(elParent, rawReason.replaceAll('"', ''), false);
      elTabList.setAttribute(postAttChildFlag, 'tablist');
    }
  } else {
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

export function scrubInfoBoxes(post, VARS, KeyWords, masterKeyWords, hideBlock) {
  let hiding = false;

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

export function gf_hideNumberOfShares(post, VARS) {
  nf_hideNumberOfShares(post, VARS);
}

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

export function nf_cleanTheConsoleTable(findItem, KeyWords, nf_hidePost, doc = document) {
  const query = 'div[role="complementary"] > div > div > div > div > div:not([data-visualcompletion])';
  const asideBoxes = doc.querySelectorAll(query);
  if (asideBoxes.length === 0) return;

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
      const birthdays = elItem.querySelectorAll('a[href="/events/birthdays/"]').length > 0;
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

export function gf_cleanTheConsoleTable(findItem, KeyWords, hideFeature, doc = document) {
  if (findItem !== 'Suggestions') return;

  const query = `a[href*="/groups/discover"]:not([${postAtt}]) > span > span`;
  const asideBoxes = querySelectorAllNoChildren(doc, query, 1);
  if (asideBoxes.length === 0) return;

  for (const asideBox of asideBoxes) {
    const elParent = climbUpTheTree(asideBox, 21);
    const anchor = asideBox.closest ? asideBox.closest('a') : null;
    if (anchor) anchor.setAttribute(postAtt, KeyWords.GF_SUGGESTIONS);
    if (elParent) hideFeature(elParent, KeyWords.GF_SUGGESTIONS, true);
  }
}

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

      const spanSpacer = doc.createElement('span');
      spanSpacer.innerHTML =
        '<span><span style="position:absolute;width:1px;height:1px;">&nbsp;</span><span aria-hidden="true"> · </span></span>';
      blockOfIcons.appendChild(spanSpacer);

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
    // Non-critical UI enhancement
  }
}

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

      const spanSpacer = doc.createElement('span');
      spanSpacer.innerHTML =
        '<span><span style="position:absolute;width:1px;height:1px;">&nbsp;</span><span aria-hidden="true"> · </span></span>';
      blockOfIcons.appendChild(spanSpacer);

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
