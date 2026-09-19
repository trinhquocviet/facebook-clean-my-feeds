/**
 * Mobile Post Obscuring & Touch Styles
 * Part of FB - Clean My Feeds
 *
 * Provides responsive CSS rules for in-cell collapsed mobile posts,
 * >=48px touch targets, active pressed states, and inline height overrides.
 *
 * @module styles/mobile-post-rules
 */

import {
  postAtt,
  mobileContentAtt,
  mobileSummaryAtt,
  mobileCollapsedAtt,
  mobileDividerCollapsedAtt
} from '@/constants/index.js';
import { compileRules } from '@/utils/index.js';

/**
 * Compiles and returns CSS rules for mobile in-cell post obscuring.
 *
 * @param {Object} VARS - Application state containing showAtt / hideAtt
 * @returns {Array<{ selector: string, styles: string }>} List of mobile CSS rule declarations
 */
export function getMobilePostRules(VARS) {
  const showAtt = VARS?.showAtt || 'data-cmf-show';
  const hideAtt = VARS?.hideAtt || 'data-cmf-hide';

  return compileRules([
    // Override Facebook's inline pixel heights (e.g. style="height:934px;")
    {
      selector: `[${mobileCollapsedAtt}]`,
      styles: {
        height: 'auto !important',
        maxHeight: 'none !important',
        minHeight: '0 !important',
        overflow: 'visible !important',
      },
    },

    // Collapse paired 1px/2px spacer dividers
    {
      selector: `[${mobileDividerCollapsedAtt}], [${hideAtt}][data-actual-height="1"], [${hideAtt}][data-actual-height="2"]`,
      styles: {
        display: 'none !important',
        height: '0 !important',
        minHeight: '0 !important',
      },
    },

    // Mobile details container
    {
      selector: `.cmf-mobile-details, details[${postAtt}].cmf-mobile-details`,
      styles: {
        display: 'block !important',
        width: '100%',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box',
        background: 'transparent',
      },
    },

    // Touch-optimized summary bar (>=48px touch target, full cell width)
    {
      selector: `.cmf-mobile-summary, [${mobileSummaryAtt}], details[${postAtt}].cmf-mobile-details > summary`,
      styles: {
        minHeight: '48px',
        width: '100%',
        padding: '0 16px',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        lineHeight: '1.3',
        fontWeight: '600',
        color: 'var(--secondary-text, #65676b)',
        backgroundColor: 'var(--comment-background, #f0f2f5)',
        borderBottom: '1px solid var(--divider, rgba(0, 0, 0, 0.08))',
        cursor: 'pointer',
        userSelect: 'none',
        listStyle: 'none',
        webkitTapHighlightColor: 'transparent',
      },
    },

    // Remove native webkit marker triangle
    {
      selector: `.cmf-mobile-summary::-webkit-details-marker, [${mobileSummaryAtt}]::-webkit-details-marker, details[${postAtt}].cmf-mobile-details > summary::-webkit-details-marker`,
      styles: {
        display: 'none !important',
      },
    },
    {
      selector: `.cmf-mobile-summary::marker, [${mobileSummaryAtt}]::marker, details[${postAtt}].cmf-mobile-details > summary::marker`,
      styles: {
        display: 'none !important',
        content: '"" !important',
      },
    },

    // Haptic visual feedback on touch/tap
    {
      selector: `.cmf-mobile-summary:active, [${mobileSummaryAtt}]:active`,
      styles: {
        backgroundColor: 'var(--hover-overlay, rgba(0, 0, 0, 0.08))',
      },
    },

    // Custom toggle expansion indicator (+ / −)
    {
      selector: `.cmf-mobile-summary::after, [${mobileSummaryAtt}]::after, details[${postAtt}].cmf-mobile-details > summary::after`,
      styles: {
        content: '"\\002B"',
        fontSize: '18px',
        fontWeight: '700',
        marginLeft: '8px',
        color: 'var(--secondary-text, #8a8d91)',
      },
    },
    {
      selector: `.cmf-mobile-details[open] > .cmf-mobile-summary::after, .cmf-mobile-details[open] > [${mobileSummaryAtt}]::after, details[${postAtt}].cmf-mobile-details[open] > summary::after`,
      styles: {
        content: '"\\2212"',
      },
    },

    // Hidden post content wrapper
    {
      selector: `[${mobileContentAtt}]`,
      styles: {
        width: '100%',
        boxSizing: 'border-box',
      },
    },
    {
      selector: `.cmf-mobile-details:not([open]) > [${mobileContentAtt}], details[${postAtt}].cmf-mobile-details:not([open]) > [${mobileContentAtt}]`,
      styles: {
        display: 'none !important',
      },
    },
    {
      selector: `.cmf-mobile-details[open] > [${mobileContentAtt}], details[${postAtt}].cmf-mobile-details[open] > [${mobileContentAtt}]`,
      styles: {
        display: 'block !important',
        height: 'auto !important',
        maxHeight: 'none !important',
        overflow: 'visible !important',
      },
    },

    // Debug mode styling: outline and reveal
    {
      selector: `[${mobileCollapsedAtt}][${showAtt}]`,
      styles: {
        outline: '2px dashed #f35369 !important',
      },
    },

    // Dark mode accommodations
    {
      selector: '@media (prefers-color-scheme: dark)',
      styles: `
        .cmf-mobile-summary, [${mobileSummaryAtt}], details[${postAtt}].cmf-mobile-details > summary {
          color: var(--secondary-text, #b0b3b8);
          background-color: var(--card-background, #242526);
          border-bottom-color: var(--divider, rgba(255, 255, 255, 0.08));
        }
        .cmf-mobile-summary:active, [${mobileSummaryAtt}]:active {
          background-color: var(--hover-overlay, rgba(255, 255, 255, 0.08));
        }
        .cmf-mobile-summary::after, [${mobileSummaryAtt}]::after, details[${postAtt}].cmf-mobile-details > summary::after {
          color: var(--secondary-text, #b0b3b8);
        }
      `,
    },
    {
      selector: '.__fb-dark-mode .cmf-mobile-summary, [data-theme="dark"] .cmf-mobile-summary, .dark-mode .cmf-mobile-summary',
      styles: {
        color: 'var(--secondary-text, #b0b3b8)',
        backgroundColor: 'var(--card-background, #242526)',
        borderBottomColor: 'var(--divider, rgba(255, 255, 255, 0.08))',
      },
    },
  ]);
}
