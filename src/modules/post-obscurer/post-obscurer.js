/**
 * Post Obscurer Orchestrator
 * Part of FB - Clean My Feeds
 *
 * ## Hiding Strategy & Architecture
 * When an unwanted post is detected, FB - Clean My Feeds supports two distinct modes:
 * 1. **Collapsible Obscuring (`VERBOSITY_LEVEL = '1' | '2'`)**:
 *    Wraps the post element in a `<details><summary>` container displaying the rejection reason
 *    (e.g. "[Clean My Feeds] Sponsored"). Users can click the summary to inspect the original post.
 * 2. **Silent Purge (`VERBOSITY_LEVEL = '0'`)**:
 *    Directly applies `hideAtt` (`display: none !important`), completely collapsing the post without
 *    any visual placeholder.
 *
 * In Debug mode (`VERBOSITY_DEBUG`), a mini `<h6>` tag is injected and `showAtt` is stamped to
 * highlight filtered items with diagnostic styles.
 *
 * @module modules/post-obscurer/post-obscurer
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
import { createMobilePostObscurer } from './mobile-post-obscurer.js';

/**
 * Normalizes input parameters into an obscurer context containing { VARS, getKeyWords }.
 *
 * @param {Object} optionsOrVars - Application state / VARS object or context container
 * @param {Object|Function} [maybeKeyWords] - Translations dictionary or getter function
 * @returns {{ VARS: Object, getKeyWords: Function }}
 */
export function normalizeObscurerContext(optionsOrVars, maybeKeyWords) {
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
  return { VARS, getKeyWords };
}

/**
 * Factory creating post obscuring and feed filtering operations.
 *
 * @param {Object} optionsOrVars - Application state / VARS object
 * @param {Object|Function} [maybeKeyWords] - Translations dictionary or getter function
 * @returns {Object} Post obscurer API methods
 */
export function createPostObscurer(optionsOrVars, maybeKeyWords) {
  const ctx = normalizeObscurerContext(optionsOrVars, maybeKeyWords);
  const { VARS } = ctx;

  if (VARS?.isMobile) {
    return createMobilePostObscurer(optionsOrVars, maybeKeyWords);
  }

  /**
   * Core logic for hiding an individual post or feature without consecutive grouping.
   *
   * @param {HTMLElement} post - Element to hide
   * @param {string} reason - Reason for hiding
   * @param {string|boolean} [marker=''] - Post marker attribute value (used for style queries)
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
   * Hides a non-feed feature (e.g. stories tray, survey box).
   *
   * @param {HTMLElement} post - Element to hide
   * @param {string} reason - Rejection reason
   * @param {string|boolean} [marker=''] - Marker value
   */
  function hideFeature(post, reason, marker = '') {
    hideSingleElement(post, reason, marker, false);
  }

  /**
   * Hides a video post in watch videos feed.
   *
   * @param {HTMLElement} post - Video post container
   * @param {string} reason - Rejection reason
   * @param {string|boolean} [marker=''] - Marker value
   */
  function vf_hidePost(post, reason, marker = '') {
    hideSingleElement(post, reason, marker, true);
  }

  /**
   * Hides a regular post in news feed or search feed.
   *
   * @param {HTMLElement} post - Feed post element
   * @param {string} reason - Rejection reason
   * @param {string|boolean} [marker='~'] - Marker value ('~' indicates standard news feed post)
   */
  function nf_hidePost(post, reason, marker = '~') {
    hideSingleElement(post, reason, marker, true);
  }

  /**
   * Hides a group feed post with consecutive count grouping support.
   *
   * In group feeds, when `VERBOSITY_LEVEL === '2'`, adjacent hidden posts
   * are collapsed into a single summary bar ("X hidden posts").
   *
   * @param {HTMLElement} post - Group post element
   * @param {string} reason - Rejection reason
   * @param {string|boolean} marker - Marker value
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
   * Hides a generic block and flags its anchor element.
   *
   * @param {HTMLElement} block - Container element to hide
   * @param {HTMLElement} link - Anchor element to tag with reason
   * @param {string} reason - Rejection reason
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
