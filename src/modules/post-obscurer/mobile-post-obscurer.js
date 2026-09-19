/**
 * Mobile Post Obscurer Orchestrator
 * Part of FB - Clean My Feeds
 *
 * ## Architecture & In-Cell Collapsing
 * On m.facebook.com (WebLite), posts are direct children of `[data-type="vscroller"]`.
 * Facebook's virtualization CSS (.ssr ... > .m:not(.displayed)) relies on the direct-child
 * hierarchy, and cells carry inline pixel heights (e.g. style="height:934px;").
 *
 * To avoid crashing virtualization or leaving massive blank gaps:
 * 1. The outer cell NEVER moves: its identity as a direct child of vscroller is preserved.
 * 2. Children are moved into an internal wrapper `<div data-cmf-mobile-content>`.
 * 3. A touch-optimized `<details><summary>` element (>=48px hit area) is appended inside the cell.
 * 4. `data-cmf-mobile-collapsed` enforces `height: auto !important;` via stylesheet.
 * 5. Adjacent 1px/2px spacer dividers are collapsed in tandem.
 *
 * @module modules/post-obscurer/mobile-post-obscurer
 */

import {
  postAtt,
  mobileContentAtt,
  mobileSummaryAtt,
  mobileCollapsedAtt,
  mobileDividerCollapsedAtt
} from '@/constants/index.js';
import { sanitizeReason } from '@/utils/index.js';
import { getVerbosityPrefix, buildMiniCaption } from './caption-builder.js';
import { toggleHiddenElements as toggleVisibilityBatch } from './visibility-toggle.js';
import { normalizeObscurerContext } from './post-obscurer.js';
import { m_getAdjacentDivider } from '../detection/mobile/cell-classifier.js';

/**
 * Creates the mobile-specific post obscuring engine.
 *
 * @param {Object} optionsOrVars - Application state / VARS object
 * @param {Object|Function} [maybeKeyWords] - Translations dictionary or getter
 * @returns {Object} Mobile post obscurer API matching post-obscurer contract
 */
export function createMobilePostObscurer(optionsOrVars, maybeKeyWords) {
  const ctx = normalizeObscurerContext(optionsOrVars, maybeKeyWords);
  const { VARS } = ctx;

  /**
   * Collapses the paired 1px/2px spacer divider if present.
   *
   * @param {HTMLElement} cell - Mobile feed cell element
   */
  function m_collapseAdjacentDivider(cell) {
    const divider = m_getAdjacentDivider(cell);
    if (divider && typeof divider.setAttribute === 'function') {
      divider.setAttribute(mobileDividerCollapsedAtt, '');
      if (VARS.hideAtt) {
        divider.setAttribute(VARS.hideAtt, '');
      }
    }
  }

  /**
   * Checks if a mobile cell has already been obscured.
   *
   * @param {HTMLElement} cell - Candidate DOM element
   * @returns {boolean} True if already obscured
   */
  function m_isPostAlreadyHidden(cell) {
    if (!cell || typeof cell.hasAttribute !== 'function') return false;
    return cell.hasAttribute(postAtt) || cell.hasAttribute(mobileCollapsedAtt);
  }

  /**
   * In-cell non-destructive collapse of a mobile feed cell.
   *
   * @param {HTMLElement} cell - Mobile feed cell element
   * @param {string} reason - Rejection reason (e.g. 'Sponsored', 'Suggested: Follow')
   * @param {string|boolean} [marker=''] - Marker value
   * @param {boolean} [revealInDebug=true] - Whether to reveal with showAtt in debug mode
   */
  function m_hidePost(cell, reason, marker = '', revealInDebug = true) {
    if (!cell || m_isPostAlreadyHidden(cell)) return;

    const sanitizedReason = sanitizeReason(reason);
    cell.setAttribute(postAtt, sanitizedReason);
    cell.setAttribute('cmfr', sanitizedReason);
    m_collapseAdjacentDivider(cell);

    // Explicitly reset inline height styles on cell to eliminate blank gaps
    if (cell.style) {
      if (cell.style.height && cell.style.height !== 'auto') {
        if (cell.dataset) cell.dataset.cmfOrigHeight = cell.style.height;
      }
      if (typeof cell.style.setProperty === 'function') {
        cell.style.setProperty('height', 'auto', 'important');
        cell.style.setProperty('min-height', '0px', 'important');
        cell.style.setProperty('max-height', 'none', 'important');
      } else {
        cell.style.height = 'auto';
        cell.style.minHeight = '0px';
        cell.style.maxHeight = 'none';
      }
    }
    if (typeof cell.hasAttribute === 'function' && cell.hasAttribute('data-actual-height')) {
      if (cell.dataset) cell.dataset.cmfOrigActualHeight = cell.getAttribute('data-actual-height');
      cell.removeAttribute('data-actual-height');
    }

    // Silent Purge mode: VERBOSITY_LEVEL === '0'
    if (VARS.Options && VARS.Options.VERBOSITY_LEVEL === '0') {
      cell.setAttribute(VARS.hideAtt, '');
      cell.setAttribute(mobileCollapsedAtt, '');
      if (cell.style) {
        if (typeof cell.style.setProperty === 'function') {
          cell.style.setProperty('display', 'none', 'important');
          cell.style.setProperty('height', '0px', 'important');
        } else {
          cell.style.display = 'none';
          cell.style.height = '0px';
        }
      }
      if (VARS.Options.VERBOSITY_DEBUG) {
        buildMiniCaption(cell, reason, ctx);
        if (revealInDebug) {
          cell.setAttribute(VARS.showAtt, '');
        }
      }
      return;
    }

    // In-cell wrapping: preserve the outer cell as a direct child of vscroller
    const doc = cell.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!doc) return;

    const contentWrap = doc.createElement('div');
    contentWrap.setAttribute(mobileContentAtt, '');

    // Transfer existing children into contentWrap
    while (cell.firstChild) {
      contentWrap.appendChild(cell.firstChild);
    }

    const details = doc.createElement('details');
    details.className = 'cmf-mobile-details';
    details.classList?.add?.('cmf-mobile-details');
    // Stamped with postAtt (cmfr) to support details[cmfr] query and styling
    details.setAttribute(postAtt, sanitizedReason);
    details.setAttribute('cmfr', sanitizedReason);
    if (marker && marker !== true) {
      details.setAttribute('data-cmf-marker', String(marker));
    }

    const summary = doc.createElement('summary');
    summary.className = 'cmf-mobile-summary';
    summary.classList?.add?.('cmf-mobile-summary');
    summary.setAttribute(mobileSummaryAtt, '');
    summary.setAttribute('role', 'button');
    summary.setAttribute('tabindex', '0');
    summary.setAttribute('data-focusable', 'true');

    const prefix = getVerbosityPrefix(ctx);
    const captionText = (prefix ? prefix : '') + reason;
    summary.appendChild(doc.createTextNode(captionText));

    // Reliable click and keyboard toggle bypassing Facebook event interception
    const toggleDetails = (e) => {
      if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      }

      const willBeOpen = !details.hasAttribute('open');
      if (willBeOpen) {
        details.setAttribute('open', '');
        details.open = true;
        contentWrap.style.display = 'block';
      } else {
        details.removeAttribute('open');
        details.open = false;
        contentWrap.style.display = 'none';
      }

      if (cell.style) {
        if (typeof cell.style.setProperty === 'function') {
          cell.style.setProperty('height', 'auto', 'important');
          cell.style.setProperty('min-height', '0px', 'important');
          cell.style.setProperty('max-height', 'none', 'important');
        } else {
          cell.style.height = 'auto';
        }
      }

      try {
        if (typeof details.dispatchEvent === 'function' && typeof Event !== 'undefined') {
          details.dispatchEvent(new Event('toggle'));
        }
      } catch (err) {
        // ignore
      }
    };

    if (typeof summary.addEventListener === 'function') {
      summary.addEventListener('click', toggleDetails, true);
      summary.addEventListener('keydown', (e) => {
        if (e && (e.key === 'Enter' || e.key === ' ')) {
          toggleDetails(e);
        }
      }, true);
    }

    details.appendChild(summary);
    details.appendChild(contentWrap);

    cell.appendChild(details);
    cell.setAttribute(mobileCollapsedAtt, '');

    if (VARS.Options && VARS.Options.VERBOSITY_DEBUG) {
      details.setAttribute('open', '');
      details.open = true;
      contentWrap.style.display = 'block';
      if (revealInDebug) {
        cell.setAttribute(VARS.showAtt, '');
      }
    }
  }

  function hideSingleElement(post, reason, marker = '', revealInDebug = true) {
    m_hidePost(post, reason, marker, revealInDebug);
  }

  function hideFeature(post, reason, marker = '') {
    m_hidePost(post, reason, marker, false);
  }

  function vf_hidePost(post, reason, marker = '') {
    m_hidePost(post, reason, marker, true);
  }

  function nf_hidePost(post, reason, marker = '~') {
    m_hidePost(post, reason, marker, true);
  }

  /**
   * Mobile group post collapse.
   * Strictly individual: consecutive grouping is disabled on mobile to prevent layout corruption.
   */
  function gf_hidePost(post, reason, marker = '') {
    m_hidePost(post, reason, marker, true);
  }

  function hideBlock(block, link, reason) {
    if (block && typeof block.setAttribute === 'function') {
      block.setAttribute(VARS.cssHideEl, '');
      block.setAttribute(mobileCollapsedAtt, '');
    }
    if (link && typeof link.setAttribute === 'function') {
      link.setAttribute(postAtt, sanitizeReason(reason));
    }
    if (VARS.Options && VARS.Options.VERBOSITY_DEBUG && block) {
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
    m_hidePost,
    m_collapseAdjacentDivider,
    nf_isPostAlreadyHidden: m_isPostAlreadyHidden,
    isPostAlreadyObscured: m_isPostAlreadyHidden,
    addCaptionForHiddenPost: (post, reason, marker) => m_hidePost(post, reason, marker, true),
    addMiniCaption: (post, reason) => buildMiniCaption(post, reason, ctx),
    toggleHiddenElements: () => toggleVisibilityBatch(ctx),
    toggleConsecutivesElements: () => {} // No-op on mobile
  };
}
