/**
 * Consecutive Post Grouping Submodule
 * Part of FB - Clean My Feeds
 *
 * ## Architecture: Grouping Consecutive Obscured Posts
 * In busy feeds (particularly high-volume Facebook Groups), 5 or 10 unwanted posts may
 * appear consecutively (e.g. waves of suggested groups or reels).
 * Displaying 10 separate collapsed `<details>` summary bars clutters the interface.
 *
 * ### CPID (Consecutive Post Identifier) Protocol:
 * 1. **Initiation (`startConsecutiveGroup`)**:
 *    When the first hidden post of a cluster is encountered (`VARS.echoCount === 1`),
 *    a random token (`VARS.echoCPID`) is generated and stamped as `[postAttCPID]` on the post.
 * 2. **Continuation (`continueConsecutiveGroup`)**:
 *    Subsequent hidden posts (`VARS.echoCount >= 2`) receive the same `postAttCPID`.
 *    A mini tag (`<h6>`) is inserted into each post, and the root summary text is dynamically
 *    updated to reflect the running count (e.g. "3 [Clean My Feeds] Hidden Posts").
 * 3. **Batch Expansion (`toggleConsecutiveElements`)**:
 *    A click on the root summary queries all elements sharing that `[postAttCPID]` and
 *    toggles their `showAtt` attribute simultaneously.
 *
 * @module modules/post-obscurer/consecutive-group
 */

import { postAttCPID } from '@/constants/index.js';
import { generateRandomString } from '@/utils/index.js';
import {
  buildDetailsCaption,
  buildMiniCaption,
  getVerbosityPrefix,
} from './caption-builder.js';

/**
 * Event listener for toggling the visibility of all posts belonging to a consecutive group.
 *
 * When the user clicks the summary element of a grouped cluster, this finds the associated
 * CPID and applies or removes `showAtt` across all posts in the group.
 *
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
 *
 * Creates the primary `<details>` container and generates a unique `echoCPID` token.
 *
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
 *
 * Updates root `<summary>` label to reflect the total number of collapsed posts in this cluster.
 *
 * @param {HTMLElement} elPostContent - Subsequent post element in cluster
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
 * Handles group feed post hiding with single-caption or grouped-caption routing.
 *
 * - If `VERBOSITY_LEVEL === '1'`, creates standalone `<details>` wrappers for each post.
 * - If `VERBOSITY_LEVEL === '2'`, clusters adjacent hidden posts under a single cumulative `<details>`.
 *
 * @param {HTMLElement} post - Group post container element
 * @param {string} reason - Obscuring reason text
 * @param {string|boolean} marker - Post marker value
 * @param {Object} ctx - Obscurer context { VARS, getKeyWords }
 */
export function handleConsecutiveGroup(post, reason, marker, ctx) {
  const { VARS } = ctx;
  const elPostContent = post.querySelector('div');
  if (!elPostContent) return;

  // Single caption mode (VERBOSITY_LEVEL === '1'): individual details per post
  if (VARS.Options?.VERBOSITY_LEVEL === '1') {
    buildDetailsCaption(elPostContent, reason, marker, ctx);
    return;
  }

  // Consecutive caption mode (VERBOSITY_LEVEL === '2'): group adjacent posts
  if (VARS.echoCount === 1) {
    startConsecutiveGroup(elPostContent, reason, marker, ctx);
  } else {
    continueConsecutiveGroup(elPostContent, reason, ctx);
  }
}
