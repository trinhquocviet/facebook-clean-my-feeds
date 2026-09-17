/**
 * Caption & Tag DOM Builders for Post Obscurer
 * Part of FB - Clean My Feeds
 *
 * Handles creation of <details><summary> wrappers, <h6> debug tags,
 * and double-obscuring detection.
 */

import {
  postAtt,
  postAttTab
} from '@/constants/index.js';

/**
 * Resolves the verbosity caption prefix from the active locale dictionary.
 * @param {Object} ctx - Obscurer context { getKeyWords, KeyWords }
 * @returns {string} Verbosity prefix string
 */
export function getVerbosityPrefix(ctx) {
  const KeyWords = (typeof ctx?.getKeyWords === 'function' ? ctx.getKeyWords() : ctx?.KeyWords) || {};
  return (KeyWords.VERBOSITY_MESSAGE && KeyWords.VERBOSITY_MESSAGE[1]) || '';
}

/**
 * Creates a <details><summary> caption wrapper and moves the post inside it
 * @param {HTMLElement} post - Element to wrap
 * @param {string} reason - Obscuring reason text
 * @param {string|boolean} [marker=''] - Post marker attribute value
 * @param {Object} ctx - Obscurer context { VARS, getKeyWords }
 * @returns {HTMLElement} The created <details> element
 */
export function buildDetailsCaption(post, reason, marker = '', ctx) {
  const { VARS } = ctx;
  const elDetails = document.createElement('details');
  const elSummary = document.createElement('summary');
  const verbosityPrefix = getVerbosityPrefix(ctx);
  const elText = document.createTextNode(verbosityPrefix + reason);

  elSummary.appendChild(elText);
  elDetails.appendChild(elSummary);
  elDetails.setAttribute(postAtt, (marker === false ? '' : (marker ?? '')));

  // Duplicate post classes to prevent Facebook layout breaks
  if (post.classList && post.classList.length > 0) {
    elDetails.classList.add(...post.classList);
  }

  // Insert wrapper before reparenting post
  if (post.parentNode) {
    post.parentNode.appendChild(elDetails);
  }
  elDetails.appendChild(post);

  // In debug mode, expand details and reveal content
  if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
    post.setAttribute(VARS.showAtt, '');
    elDetails.setAttribute('open', '');
  }

  return elDetails;
}

/**
 * Prepends a small debug caption tag to indicate why the post was obscured
 * @param {HTMLElement} post - Element to tag
 * @param {string} reason - Tag label text
 * @param {Object} ctx - Obscurer context { VARS }
 */
export function buildMiniCaption(post, reason, ctx) {
  const { VARS } = ctx;
  post.setAttribute(VARS.hideAtt, '');

  const elTab = document.createElement('h6');
  elTab.setAttribute(postAttTab, '0');
  elTab.textContent = reason;

  post.insertBefore(elTab, post.firstElementChild);
}

/**
 * Checks if a post element is already hidden or wrapped in an ancestor details element
 * @param {HTMLElement} post - Post element to check
 * @returns {boolean} True if already obscured
 */
export function isPostAlreadyObscured(post) {
  if (!post) return false;
  return post.hasAttribute(postAtt)
    || post.closest(`details[${postAtt}]`) !== null
    || post.querySelector(`details[${postAtt}]`) !== null;
}
