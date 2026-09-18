/**
 * Caption & Tag DOM Builders for Post Obscurer
 * Part of FB - Clean My Feeds
 *
 * ## DOM Structure & Layout Preservation
 * Wrapping Facebook posts inside standard HTML `<details><summary>` elements requires
 * careful DOM surgery:
 * 1. **Class Duplication**: Facebook applies strict flexbox, CSS Grid, and margin rules
 *    directly to feed post containers. If `<details>` replaces the post in the parent hierarchy
 *    without those class names, the feed layout breaks. Therefore, `buildDetailsCaption` clones
 *    all classes from `post.classList` onto `<details>`.
 * 2. **Reparenting Flow**: The `<details>` element is appended to `post.parentNode`, and `post`
 *    is subsequently moved into `<details>` beneath `<summary>`.
 * 3. **Debug Attributes**: When `VERBOSITY_DEBUG` is active, the `<details>` wrapper is set to
 *    `open=""` and stamped with `showAtt`.
 *
 * @module modules/post-obscurer/caption-builder
 */

import {
  postAtt,
  postAttTab
} from '@/constants/index.js';

/**
 * Resolves the verbosity caption prefix from the active locale dictionary.
 *
 * Typically resolves to localized "[Clean My Feeds] " or similar prefix.
 *
 * @param {Object} ctx - Obscurer context { getKeyWords, KeyWords }
 * @returns {string} Verbosity prefix string
 */
export function getVerbosityPrefix(ctx) {
  const KeyWords = (typeof ctx?.getKeyWords === 'function' ? ctx.getKeyWords() : ctx?.KeyWords) || {};
  return (KeyWords.VERBOSITY_MESSAGE && KeyWords.VERBOSITY_MESSAGE[1]) || '';
}

/**
 * Creates a `<details><summary>` caption wrapper and reparents the post inside it.
 *
 * Clones all CSS class names from `post` onto `<details>` to prevent flexbox or grid layout breaks.
 *
 * @param {HTMLElement} post - Feed post element to wrap
 * @param {string} reason - Obscuring rejection reason text
 * @param {string|boolean} [marker=''] - Post marker attribute value
 * @param {Object} ctx - Obscurer context { VARS, getKeyWords }
 * @returns {HTMLElement} The created `<details>` DOM wrapper
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

  // Insert wrapper into parent before reparenting post inside it
  if (post.parentNode) {
    post.parentNode.appendChild(elDetails);
  }
  elDetails.appendChild(post);

  // In debug mode, automatically expand details and reveal content with debug styling
  if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
    post.setAttribute(VARS.showAtt, '');
    elDetails.setAttribute('open', '');
  }

  return elDetails;
}

/**
 * Prepends a small debug caption tag (`<h6>`) to indicate why the post was obscured.
 *
 * Used in consecutive group mode and debug views to display inline rejection tags.
 *
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
 * Checks if a post element is already hidden or wrapped in an ancestor details element.
 *
 * Performs a 3-way check:
 * 1. Has `postAtt` directly on the element
 * 2. Has an ancestor `details[${postAtt}]` (already wrapped)
 * 3. Contains a child `details[${postAtt}]` (already partitioned)
 *
 * @param {HTMLElement} post - Post element to check
 * @returns {boolean} True if already obscured
 */
export function isPostAlreadyObscured(post) {
  if (!post) return false;
  return post.hasAttribute(postAtt)
    || post.closest(`details[${postAtt}]`) !== null
    || post.querySelector(`details[${postAtt}]`) !== null;
}
