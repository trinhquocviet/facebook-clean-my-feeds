import { postAtt, postAttTab } from '../constants/index.js';

/**
 * Returns CSS rules for post hide/reveal, summary toggle, mini-caption, and share count.
 * @param {{ hideAtt: string, hideWithNoCaptionAtt: string, showAtt: string, cssHideNumberOfShares: string }} vars
 * @returns {{ selector: string, styles: string }[]}
 */
export function getPostHideRules(vars) {
  return [
    // 1. Fix FB's bug in not "hiding" certain absolute elements properly when scrolling
    {
      selector: 'body > div[style*="position: absolute"], body > div[style*="position:absolute"]',
      styles: 'top: -1000000px !important;',
    },
    // 2. Hide the post
    {
      selector: `div[${vars.hideAtt}]`,
      styles: 'max-height: 0; overflow: hidden; margin-bottom:0 !important;',
    },
    // 3. Reveal the post (inside open details, or with showAtt attribute)
    {
      selector: `details[${postAtt}][open] > div, details[${postAtt}][open] > span > div, div[${vars.showAtt}]:not([id="fbcmf"])`,
      styles: 'max-height: 10000px; overflow: auto; margin-bottom:1rem !important; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; background-color: var(--card-background)',
    },
    // 4. Summary element styling
    {
      selector: `details[${postAtt}] > summary`,
      styles: 'cursor: pointer; list-style: none; position: relative; margin: auto; padding: 0.75rem; border-radius: 0.5rem; font-style: italic; width: inherit; color: var(--primary-text); background-color: var(--card-background);',
    },
    // 5. Summary element margin variant
    {
      selector: `details[${postAtt}="~"] > summary`,
      styles: 'margin: 0 1rem;',
    },
    // 6. Summary hover
    {
      selector: `details[${postAtt}] > summary:hover`,
      styles: 'text-decoration: underline;',
    },
    // 7. Summary +/- formatting and + icon
    {
      selector: `details[${postAtt}] > summary::after`,
      styles: 'color: var(--color); border-radius: 50%; font-style: normal; width: 24px; height: 24px; line-height: 20px; font-size: 1rem; font-weight: bold; transform: translateY(-50%); text-align: center; position: absolute; top: 50%; right: 0.25rem; content: "\\002B";',
    },
    // 9. Summary - icon when open
    {
      selector: `details[${postAtt}][open] > summary::after`,
      styles: 'content: "\\2212";',
    },
    // 10. Summary hover overlay
    {
      selector: `details[${postAtt}] > summary:hover::after`,
      styles: 'background-color: var(--hover-overlay);',
    },
    // 11. Reveal a hidden post container margin
    {
      selector: `details[${postAtt}]`,
      styles: 'margin-bottom: 1rem;',
    },
    // 12. Open summary border radius adjustment
    {
      selector: `details[${postAtt}][open] > summary`,
      styles: 'border-bottom-left-radius: 0; border-bottom-right-radius: 0;',
    },
    // 13. Hide component with no caption
    {
      selector: `div[${vars.hideWithNoCaptionAtt}], span[${vars.hideWithNoCaptionAtt}]`,
      styles: 'display: none;',
    },
    // 14. Show component with no caption
    {
      selector: `div[${vars.hideWithNoCaptionAtt}][${vars.showAtt}], span[${vars.hideWithNoCaptionAtt}][${vars.showAtt}]`,
      styles: 'display: block;',
    },
    // 15. Mini-caption (for gf + vf consecutive mode)
    {
      selector: `h6[${postAttTab}]`,
      styles: 'border-radius: 0.55rem 0.55rem 0 0; width:75%; margin:0 auto; padding: 0.45rem 0.25rem; font-style:italic; text-align:center; font-weight:normal; background-color: var(--card-background);',
    },
    // 16. Number of shares
    {
      selector: `[${vars.cssHideNumberOfShares}]`,
      styles: 'display:none !important;',
    },
  ];
}
