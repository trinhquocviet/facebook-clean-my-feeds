/**
 * Post Obscurer Orchestrator
 * Part of FB - Clean My Feeds
 *
 * Implements high-level post hiding strategies across news feed, groups feed,
 * watch video feed, and standalone UI features following SOLID principles.
 */

import { postAtt } from '@/constants/index.js';
import { sanitizeReason } from '@/utils/index.js';
import {
  buildDetailsCaption,
  buildMiniCaption,
  isPostAlreadyObscured
} from './caption-builder.js';
import {
  handleConsecutiveGroup,
  toggleConsecutiveElements
} from './consecutive-group.js';
import { toggleHiddenElements as toggleVisibilityBatch } from './visibility-toggle.js';

/**
 * Factory creating post obscuring and feed filtering operations
 * @param {Object} optionsOrVars - Application state / VARS object
 * @param {Object|Function} [maybeKeyWords] - Translations dictionary or getter function
 * @returns {Object} Post obscurer API methods
 */
export function createPostObscurer(optionsOrVars, maybeKeyWords) {
  let VARS, getKeyWords;
  if (optionsOrVars && optionsOrVars.VARS) {
    VARS = optionsOrVars.VARS;
    getKeyWords = typeof optionsOrVars.getKeyWords === 'function'
      ? optionsOrVars.getKeyWords
      : (typeof optionsOrVars.KeyWords === 'function' ? optionsOrVars.KeyWords : () => optionsOrVars.KeyWords);
  } else {
    VARS = optionsOrVars;
    getKeyWords = typeof maybeKeyWords === 'function'
      ? maybeKeyWords
      : () => maybeKeyWords;
  }

  const ctx = { VARS, getKeyWords };

  /**
   * Core logic for hiding an individual post or feature without consecutive grouping
   * @param {HTMLElement} post - Element to hide
   * @param {string} reason - Reason for hiding
   * @param {string|boolean} [marker=''] - Post marker attribute value
   * @param {boolean} [revealInDebug=true] - Whether to apply showAtt in debug mode
   */
  function hideSingleElement(post, reason, marker = '', revealInDebug = true) {
    post.setAttribute(postAtt, sanitizeReason(reason));

    if (VARS.Options && (VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      buildDetailsCaption(post, reason, marker, ctx);
    } else {
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
        buildMiniCaption(post, reason, ctx);
        if (revealInDebug) {
          post.setAttribute(VARS.showAtt, '');
        }
      }
    }
  }

  /**
   * Hides a non-feed feature (e.g. stories tray, survey box)
   */
  function hideFeature(post, reason, marker = '') {
    hideSingleElement(post, reason, marker, false);
  }

  /**
   * Hides a video post in watch videos feed
   */
  function vf_hidePost(post, reason, marker = '') {
    hideSingleElement(post, reason, marker, true);
  }

  /**
   * Hides a regular post in news feed or search feed
   */
  function nf_hidePost(post, reason, marker = '~') {
    hideSingleElement(post, reason, marker, true);
  }

  /**
   * Hides a group feed post with consecutive count grouping
   */
  function gf_hidePost(post, reason, marker) {
    post.setAttribute(postAtt, sanitizeReason(reason));

    if (VARS.Options && (VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      handleConsecutiveGroup(post, reason, marker, ctx);
    } else {
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
        buildMiniCaption(post, reason, ctx);
        post.setAttribute(VARS.showAtt, '');
      }
    }
  }

  /**
   * Hides a generic block and flags its anchor element
   */
  function hideBlock(block, link, reason) {
    block.setAttribute(VARS.cssHideEl, '');
    link.setAttribute(postAtt, sanitizeReason(reason));
    if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
      block.setAttribute(VARS.showAtt, '');
    }
  }

  return {
    hideSingleElement,
    hideFeature,
    vf_hidePost,
    nf_hidePost,
    gf_hidePost,
    hideBlock,
    addCaptionForHiddenPost: (post, reason, marker) => buildDetailsCaption(post, reason, marker, ctx),
    addMiniCaption: (post, reason) => buildMiniCaption(post, reason, ctx),
    nf_isPostAlreadyHidden: isPostAlreadyObscured,
    toggleHiddenElements: () => toggleVisibilityBatch(ctx),
    toggleConsecutivesElements: (ev) => toggleConsecutiveElements(ev, ctx)
  };
}
