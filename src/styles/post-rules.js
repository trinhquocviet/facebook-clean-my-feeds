import { postAtt, postAttTab } from '@/constants/index.js';
import { compileRules } from '@/utils/index.js';

/**
 * Returns CSS rules for post hide/reveal, summary toggle, mini-caption, and share count.
 * Defined as declarative CSS-in-JS style objects.
 * @module styles/post-rules
 * @param {{ hideAtt: string, hideWithNoCaptionAtt: string, showAtt: string, cssHideNumberOfShares: string }} vars
 * @returns {{ selector: string, styles: string }[]}
 */
export function getPostHideRules(vars) {
  return compileRules([
    // 1. Fix FB's bug in not "hiding" certain absolute elements properly when scrolling
    {
      selector: 'body > div[style*="position: absolute"], body > div[style*="position:absolute"]',
      styles: {
        top: '-1000000px !important',
      },
    },
    // 2. Hide the post
    {
      selector: `div[${vars.hideAtt}]`,
      styles: {
        maxHeight: '0',
        overflow: 'hidden',
        marginBottom: '0 !important',
      },
    },
    // 3. Reveal the post (inside open details, or with showAtt attribute)
    {
      selector: `details[${postAtt}][open] > div, details[${postAtt}][open] > span > div, div[${vars.showAtt}]:not([id="fbcmf"])`,
      styles: {
        maxHeight: '10000px',
        overflow: 'auto',
        marginBottom: '1rem !important',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        backgroundColor: 'var(--card-background)',
      },
    },
    // 4. Summary element styling
    {
      selector: `details[${postAtt}] > summary`,
      styles: {
        cursor: 'pointer',
        listStyle: 'none',
        position: 'relative',
        margin: 'auto',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        fontStyle: 'italic',
        width: 'inherit',
        color: 'var(--primary-text)',
        backgroundColor: 'var(--card-background)',
      },
    },
    // 5. Summary element margin variant
    {
      selector: `details[${postAtt}="~"] > summary`,
      styles: {
        margin: '0 1rem',
      },
    },
    // 6. Summary hover
    {
      selector: `details[${postAtt}] > summary:hover`,
      styles: {
        textDecoration: 'underline',
      },
    },
    // 7. Summary +/- formatting and + icon
    {
      selector: `details[${postAtt}] > summary::after`,
      styles: {
        color: 'var(--color)',
        borderRadius: '50%',
        fontStyle: 'normal',
        width: '24px',
        height: '24px',
        lineHeight: '20px',
        fontSize: '1rem',
        fontWeight: 'bold',
        transform: 'translateY(-50%)',
        textAlign: 'center',
        position: 'absolute',
        top: '50%',
        right: '0.25rem',
        content: '"\\002B"',
      },
    },
    // 9. Summary - icon when open
    {
      selector: `details[${postAtt}][open] > summary::after`,
      styles: {
        content: '"\\2212"',
      },
    },
    // 10. Summary hover overlay
    {
      selector: `details[${postAtt}] > summary:hover::after`,
      styles: {
        backgroundColor: 'var(--hover-overlay)',
      },
    },
    // 11. Reveal a hidden post container margin
    {
      selector: `details[${postAtt}]`,
      styles: {
        marginBottom: '1rem',
      },
    },
    // 12. Open summary border radius adjustment
    {
      selector: `details[${postAtt}][open] > summary`,
      styles: {
        borderBottomLeftRadius: '0',
        borderBottomRightRadius: '0',
      },
    },
    // 13. Hide component with no caption
    {
      selector: `div[${vars.hideWithNoCaptionAtt}], span[${vars.hideWithNoCaptionAtt}]`,
      styles: {
        display: 'none',
      },
    },
    // 14. Show component with no caption
    {
      selector: `div[${vars.hideWithNoCaptionAtt}][${vars.showAtt}], span[${vars.hideWithNoCaptionAtt}][${vars.showAtt}]`,
      styles: {
        display: 'block',
      },
    },
    // 15. Mini-caption (for gf + vf consecutive mode)
    {
      selector: `h6[${postAttTab}]`,
      styles: {
        borderRadius: '0.55rem 0.55rem 0 0',
        width: '75%',
        margin: '0 auto',
        padding: '0.45rem 0.25rem',
        fontStyle: 'italic',
        textAlign: 'center',
        fontWeight: 'normal',
        backgroundColor: 'var(--card-background)',
      },
    },
    // 16. Number of shares
    {
      selector: `[${vars.cssHideNumberOfShares}]`,
      styles: {
        display: 'none !important',
      },
    },
  ]);
}
