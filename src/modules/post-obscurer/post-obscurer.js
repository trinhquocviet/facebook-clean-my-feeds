/**
 * Post Obscurer & <details> Caption Module
 * Part of FB - Clean My Feeds
 *
 * Provides functions for obscuring/hiding posts, adding <details><summary> captions,
 * handling consecutive post counts, and debugging labels.
 */

import {
  postAtt,
  postAttCPID,
  postAttTab
} from '@/constants/index.js';
import {
  sanitizeReason,
  generateRandomString
} from '@/utils/index.js';

/**
 * Factory function creating post obscuring/hiding and <details> caption methods
 * @param {Object} optionsOrVars - Application context / VARS state object
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

  function addCaptionForHiddenPost(post, reason, marker = '') {
    // :: caption for a post/feature that has been hidden ...
    // -- using <details><summary>...</summary> ~~ post ~~ </details> structure.
    // :: return : nothing

    // -- create the details/summary component
    const elDetails = document.createElement('details');
    const elSummary = document.createElement('summary');
    const KeyWords = getKeyWords() || {};
    const verbosityPrefix = (KeyWords.VERBOSITY_MESSAGE && KeyWords.VERBOSITY_MESSAGE[1]) || '';
    const elText = document.createTextNode(verbosityPrefix + reason);

    elSummary.appendChild(elText);
    elDetails.appendChild(elSummary);
    // -- nb: marker is sometimes "false" when not used by caller ...
    elDetails.setAttribute(postAtt, (marker === false ? '' : marker));

    // -- duplicate the post's class(es) - prevents fb from removing the post (Feb 2024).
    if (post.classList && post.classList.length > 0) {
      elDetails.classList.add(...post.classList);
    }
    // -- add the caption component above the post
    if (post.parentNode) {
      post.parentNode.appendChild(elDetails);
    }
    // -- move the post inside the caption's component.
    elDetails.appendChild(post);

    // - in debugging mode?
    if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
      post.setAttribute(VARS.showAtt, '');
      elDetails.setAttribute('open', '');
    }
  }

  function addMiniCaption(post, reason) {
    // :: add a small caption to indicate why the post is hidden/flagged
    // -- in debugging mode ***
    // :: return : nothing

    post.setAttribute(VARS.hideAtt, '');

    const elTab = document.createElement('h6');
    elTab.setAttribute(postAttTab, '0');
    elTab.textContent = reason;

    post.insertBefore(elTab, post.firstElementChild);
  }

  function nf_isPostAlreadyHidden(post) {
    // -- checks both directions: the candidate might now be a descendant of
    // -- an earlier wrap, or (the common real-world case, per your captures)
    // -- a broader ancestor that already CONTAINS an earlier wrap.
    return post.hasAttribute(postAtt)
      || post.closest(`details[${postAtt}]`) !== null
      || post.querySelector(`details[${postAtt}]`) !== null;
  }

  /**
   * Shared core logic for obscuring/hiding an individual post or feature without consecutive grouping
   * @param {HTMLElement} post - DOM element to hide
   * @param {string} reason - Filter/block reason
   * @param {string|boolean} [marker=''] - Post marker attribute value
   * @param {boolean} [revealInDebug=true] - Whether to apply showAtt in debug mode
   */
  function hideSingleElement(post, reason, marker = '', revealInDebug = true) {
    // -- mark the post with the reason for post being hidden/flagged
    post.setAttribute(postAtt, sanitizeReason(reason));

    // -- add a caption or not?
    if (VARS.Options && (VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      // -- insert a caption for a hidden post
      addCaptionForHiddenPost(post, reason, marker);
    }
    else {
      // -- verbosity_level = 0
      // -- no caption required ...
      // -- use an attribute to hide the post
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
        // -- insert a small label to indicate why post was flagged
        addMiniCaption(post, reason);
        if (revealInDebug) {
          post.setAttribute(VARS.showAtt, '');
        }
      }
    }
  }

  function hideFeature(post, reason, marker = '') {
    // -- hide something (not part of a regular feed)
    // -- no consecutive counts (VARS.echoCount is ignored)
    // -- Verbosity_Level: 0 = hide; 1|2 treated as 1 (no consecutive mode)
    hideSingleElement(post, reason, marker, false);
  }

  function toggleHiddenElements() {
    const containers = Array.from(document.querySelectorAll(`[${VARS.hideAtt}]`));
    const blocks = Array.from(document.querySelectorAll(`[${VARS.cssHideEl}]`));
    const shares = Array.from(document.querySelectorAll(`[${VARS.cssHideNumberOfShares}]`));

    const elements = [...containers, ...blocks, ...shares];

    if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
      for (const element of elements) {
        element.setAttribute(VARS.showAtt, '');
      }
    }
    else {
      for (const element of elements) {
        element.removeAttribute(VARS.showAtt);
      }
    }
  }

  function toggleConsecutivesElements(ev) {
    ev.stopPropagation();
    const elSummary = ev.target;
    const elDetails = elSummary.parentElement;
    if (!elDetails) return;
    const elPostContent = elDetails.querySelector('div');
    if (!elPostContent) return;
    const cpidValue = elPostContent.getAttribute(postAttCPID);

    const collection = document.querySelectorAll(`div[${postAttCPID}="${cpidValue}"]`);

    if (elDetails.hasAttribute('open')) {
      // -- moving into closed state
      collection.forEach(post => {
        post.removeAttribute(VARS.showAtt);
      });
    }
    else {
      // -- moving into open state
      collection.forEach(post => {
        post.setAttribute(VARS.showAtt, '');
      });
    }
  }

  function gf_hidePost(post, reason, marker) {
    // :: hide a group feed post ...
    // -- has consecutive counts
    // -- Verbosity_Level: 0 = hide; 1 = single info note; 2 = consecutive info notes
    // -- return : nothing

    post.setAttribute(postAtt, sanitizeReason(reason));

    if (VARS.Options && (VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      // -- insert either single caption for a hidden post or accumulate a caption for 2+ consecutive hidden posts
      // -- nb: calling function will either zap or increment VARS.echoCount
      // --     they don't look at VARS.Options.VERBOSITY_LEVEL's value

      // -- the group post's element is the container ...
      // -- so, need to go down a level to insert the caption ...
      const elPostContent = post.querySelector('div');
      if (!elPostContent) return;

      if (VARS.Options.VERBOSITY_LEVEL === '1') {
        // -- single caption only mode
        // -- insert a caption for a hidden post
        addCaptionForHiddenPost(elPostContent, reason, marker);
      }
      else {
        // -- consecutive caption mode (VARS.Options.VERBOSITY_LEVEL === '2')

        if (VARS.echoCount === 1) {
          // - first post in a possible consecutive collection.
          // - CPID = consecutive post id
          addCaptionForHiddenPost(elPostContent, reason, marker);
          VARS.echoCPID = generateRandomString();
          VARS.echoEl = elPostContent;
          VARS.echoEl.setAttribute(postAttCPID, VARS.echoCPID);
        }
        else {
          // - 2+ consecutive posts being hidden

          // -- get the primary details element
          const elDetails = VARS.echoEl ? VARS.echoEl.closest('details') : null;

          if (elDetails) {
            if (VARS.echoCount === 2) {
              // -- second post in same consecutive group, go back to first one and amend it ...
              addMiniCaption(VARS.echoEl, reason);
              // -- listen to open/close event - trigger a call to open/close the consecutive posts
              elDetails.addEventListener('click', toggleConsecutivesElements);
            }

            // -- update the main caption hidden post element
            const KeyWords = getKeyWords() || {};
            const verbosityPrefix = (KeyWords.VERBOSITY_MESSAGE && KeyWords.VERBOSITY_MESSAGE[1]) || '';
            const summary = elDetails.querySelector('summary');
            if (summary && summary.lastChild) {
              summary.lastChild.textContent = VARS.echoCount + verbosityPrefix;
            }
          }

          // second+ posts need a mini-caption
          const elMiniCaptionSpot = elPostContent;
          // -- second+ post in same consecutive group
          addMiniCaption(elMiniCaptionSpot, reason);

          // - consecutive posts level - flag it as part of a consecutive group
          elPostContent.setAttribute(postAttCPID, VARS.echoCPID);
        }
      }
    }
    else {
      // -- verbosity_level = 0
      // -- no caption required
      // -- use an attribute to hide the post
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
        // -- insert a small label to indicate why post was flagged
        addMiniCaption(post, reason);
        post.setAttribute(VARS.showAtt, '');
      }
    }
  }

  function vf_hidePost(post, reason, marker = '') {
    // :: hide a video post ...
    // -- applies to watch videos feed
    // -- parameter 'marker' - for setting details' postTab value (optional)
    // -- no consecutive counts
    // -- Verbosity_Level: 0 = hide; 1|2 treated as 1 (no consecutive mode)
    // -- return :: nothing
    hideSingleElement(post, reason, marker, true);
  }

  function nf_hidePost(post, reason, marker = '~') {
    // :: hide a post ...
    // -- applies to news feed + search feed
    // -- parameter 'marker' - for setting details' postTab value (optional)
    // -- no consecutive counts
    // -- Verbosity_Level: 0 = hide; 1|2 treated as 1 (no consecutive mode)
    // -- return :: nothing
    hideSingleElement(post, reason, marker, true);
  }

  function hideBlock(block, link, reason) {
    block.setAttribute(VARS.cssHideEl, '');
    link.setAttribute(postAtt, sanitizeReason(reason));
    // - in debugging mode?
    if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
      block.setAttribute(VARS.showAtt, '');
    }
  }

  return {
    addCaptionForHiddenPost,
    addMiniCaption,
    nf_isPostAlreadyHidden,
    hideSingleElement,
    hideFeature,
    toggleHiddenElements,
    toggleConsecutivesElements,
    gf_hidePost,
    vf_hidePost,
    nf_hidePost,
    hideBlock
  };
}
