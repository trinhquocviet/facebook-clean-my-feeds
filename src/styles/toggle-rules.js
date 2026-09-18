/**
 * Returns CSS rules for toggle button appearance, position variants,
 * and dialog placement offsets (data-cmf-pos / data-cmf-dlg).
 * All position variants are pre-defined — JS only sets data-cmf-pos / data-cmf-dlg attributes.
 * Defined as declarative CSS-in-JS style objects.
 * @module styles/toggle-rules
 * @param {{ showAtt: string }} vars
 * @returns {{ selector: string, styles: string }[]}
 */

import { compileRules } from '@/utils/index.js';

export function getToggleRules(vars) {
  return compileRules([
    // --- Toggle button: common styles (always applied) ---
    {
      selector: '.fb-cmf-toggle',
      styles: { display: 'none' }, // hidden by default, revealed by showAtt
    },
    {
      selector: '.fb-cmf-toggle svg',
      styles: { height: '95%', aspectRatio: '1 / 1' },
    },
    {
      selector: '.fb-cmf-toggle:hover',
      styles: { cursor: 'pointer' },
    },
    {
      selector: `.fb-cmf-toggle[${vars.showAtt}]`,
      styles: { display: 'block' },
    },

    // --- Toggle button: position variant "0" = bottom-left (DEFAULT) ---
    {
      selector: '.fb-cmf-toggle, .fb-cmf-toggle[data-cmf-pos="bottom-left"]',
      styles: {
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        zIndex: 999,
        background: 'var(--secondary-button-background-floating)',
        padding: '0.5rem',
        width: '3rem',
        height: '3rem',
        border: '0',
        borderRadius: '1.5rem',
        boxShadow: '0 2px 4px var(--shadow-1), 0 12px 28px var(--shadow-2)',
      },
    },

    // --- Toggle button: position variant "1" = top-right ---
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="top-right"]',
      styles: {
        position: 'fixed',
        top: '0.5rem',
        right: '0.5rem',
        bottom: 'auto',
        left: 'auto',
        background: 'transparent',
        padding: '0',
        width: 'auto',
        height: 'auto',
        border: '0',
        borderRadius: '0',
        boxShadow: 'none',
      },
    },

    // --- Toggle button: position variant "2" = disabled ---
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="disabled"]',
      styles: { display: 'none !important' },
    },

    // --- Dialog: position variant "left" (DEFAULT) ---
    {
      selector: '.fb-cmf[data-cmf-dlg="left"]',
      styles: {
        left: '4.25rem',
        right: 'auto',
        marginRight: '1rem',
        marginLeft: '0',
        transformOrigin: 'center center',
      },
    },

    // --- Dialog: position variant "right" ---
    {
      selector: '.fb-cmf[data-cmf-dlg="right"]',
      styles: {
        right: '0.35rem',
        left: 'auto',
        marginLeft: '1rem',
        marginRight: '0',
        transformOrigin: 'top right',
      },
    },
  ]);
}
