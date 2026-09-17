/**
 * Consecutive Post Grouping Submodule
 * Part of FB - Clean My Feeds
 *
 * Handles grouping consecutive obscured posts, updating count labels,
 * and managing group expansion/collapse event listeners.
 */

import { postAttCPID } from '@/constants/index.js';
import { generateRandomString } from '@/utils/index.js';
import {
  buildDetailsCaption,
  buildMiniCaption,
  getVerbosityPrefix,
} from './caption-builder.js';

/**
 * Event listener for toggling the visibility of all posts within a consecutive group
 * @param {Event} ev - Click event on summary element
 * @param {Object} ctx - Obscurer context { VARS }
 */
export function toggleConsecutiveElements(ev, ctx) {
  ev.stopPropagation();
  const { VARS } = ctx;
  const target = ev.target;
  const elDetails = target?.closest ? target.closest('details') : target?.parentElement;
  if (!elDetails) return;

  const elPostContent = elDetails.querySelector('div');
  if (!elPostContent) return;

  const cpidValue = elPostContent.getAttribute(postAttCPID);
  if (!cpidValue) return;

  const collection = document.querySelectorAll(`div[${postAttCPID}="${cpidValue}"]`);
  const isOpening = !elDetails.hasAttribute('open');

  for (const item of collection) {
    if (isOpening) {
      item.setAttribute(VARS.showAtt, '');
    } else {
      item.removeAttribute(VARS.showAtt);
    }
  }
}

/**
 * Initializes a new consecutive group when the first consecutive post is encountered.
 * @param {HTMLElement} elPostContent - Post content element
 * @param {string} reason - Obscuring reason text
 * @param {string|boolean} marker - Post marker value
 * @param {Object} ctx - Obscurer context
 */
function startConsecutiveGroup(elPostContent, reason, marker, ctx) {
  const { VARS } = ctx;
  buildDetailsCaption(elPostContent, reason, marker, ctx);
  VARS.echoCPID = generateRandomString();
  VARS.echoEl = elPostContent;
  VARS.echoEl.setAttribute(postAttCPID, VARS.echoCPID);
}

/**
 * Appends subsequent consecutive posts to the active group and updates the summary counter.
 * @param {HTMLElement} elPostContent - Post content element
 * @param {string} reason - Obscuring reason text
 * @param {Object} ctx - Obscurer context
 */
function continueConsecutiveGroup(elPostContent, reason, ctx) {
  const { VARS } = ctx;
  const elDetails = VARS.echoEl ? VARS.echoEl.closest('details') : null;

  if (elDetails) {
    if (VARS.echoCount === 2) {
      buildMiniCaption(VARS.echoEl, reason, ctx);
      elDetails.addEventListener('click', (ev) => toggleConsecutiveElements(ev, ctx));
    }

    const verbosityPrefix = getVerbosityPrefix(ctx);
    const summary = elDetails.querySelector('summary');
    if (summary && summary.lastChild) {
      summary.lastChild.textContent = VARS.echoCount + verbosityPrefix;
    }
  }

  buildMiniCaption(elPostContent, reason, ctx);
  elPostContent.setAttribute(postAttCPID, VARS.echoCPID);
}

/**
 * Handles group feed consecutive post hiding and summary count accumulation
 * @param {HTMLElement} post - Group post container element
 * @param {string} reason - Obscuring reason text
 * @param {string|boolean} marker - Post marker value
 * @param {Object} ctx - Obscurer context { VARS, getKeyWords }
 */
export function handleConsecutiveGroup(post, reason, marker, ctx) {
  const { VARS } = ctx;
  const elPostContent = post.querySelector('div');
  if (!elPostContent) return;

  // Single caption mode (VERBOSITY_LEVEL === '1')
  if (VARS.Options?.VERBOSITY_LEVEL === '1') {
    buildDetailsCaption(elPostContent, reason, marker, ctx);
    return;
  }

  // Consecutive caption mode (VERBOSITY_LEVEL === '2')
  if (VARS.echoCount === 1) {
    startConsecutiveGroup(elPostContent, reason, marker, ctx);
  } else {
    continueConsecutiveGroup(elPostContent, reason, ctx);
  }
}
