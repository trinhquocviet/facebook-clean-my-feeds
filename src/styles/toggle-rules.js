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

    // --- Toggle button: mobile header variant (docked after Facebook Menu) ---
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="mobile-menu"], [aria-label="Facebook Menu"] + .fb-cmf-toggle, [aria-label="Facebook Menu"] + #fbcmfToggle',
      styles: {
        position: 'absolute !important',
        top: 'auto !important',
        bottom: 'auto !important',
        left: 'auto !important',
        right: 'calc(calc(45px * 2) + 5px) !important',
        width: '45px !important',
        height: '43px !important',
        margin: '0 !important',
        padding: '0 !important',
        display: 'inline-flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        border: '0 !important',
        borderRadius: '0 !important',
        background: 'transparent !important',
        boxShadow: 'none !important',
        cursor: 'pointer !important',
        zIndex: 1,
        verticalAlign: 'middle !important',
      },
    },
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="mobile-menu"]::before, [aria-label="Facebook Menu"] + .fb-cmf-toggle::before, [aria-label="Facebook Menu"] + #fbcmfToggle::before',
      styles: {
        content: '""',
        position: 'absolute',
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        backgroundColor: 'var(--secondary-button-background, rgba(228, 230, 235, 1.0))',
        zIndex: -1,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },
    },
    {
      selector: '.__fb-dark-mode .fb-cmf-toggle[data-cmf-pos="mobile-menu"]::before, [data-theme="dark"] .fb-cmf-toggle[data-cmf-pos="mobile-menu"]::before, .dark-mode .fb-cmf-toggle[data-cmf-pos="mobile-menu"]::before, .dark-mode [aria-label="Facebook Menu"] + #fbcmfToggle::before',
      styles: {
        backgroundColor: 'var(--secondary-button-background, #3a3b3c)',
      },
    },
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="mobile-menu"] svg, [aria-label="Facebook Menu"] + .fb-cmf-toggle svg, [aria-label="Facebook Menu"] + #fbcmfToggle svg',
      styles: {
        width: '20px !important',
        height: '20px !important',
        color: 'var(--primary-text, #080809) !important',
      },
    },
    {
      selector: '.__fb-dark-mode .fb-cmf-toggle[data-cmf-pos="mobile-menu"] svg, [data-theme="dark"] .fb-cmf-toggle[data-cmf-pos="mobile-menu"] svg, .dark-mode .fb-cmf-toggle[data-cmf-pos="mobile-menu"] svg, .dark-mode [aria-label="Facebook Menu"] + #fbcmfToggle svg',
      styles: {
        color: 'var(--primary-text, #e4e6eb) !important',
      },
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

    // --- Dialog: position variant "center" (MOBILE / SCREEN CENTERED) ---
    {
      selector: '.fb-cmf[data-cmf-dlg="center"]',
      styles: {
        top: '0 !important',
        bottom: '0 !important',
        left: '0.5rem !important',
        right: '0.5rem !important',
        margin: 'auto !important',
        width: 'calc(100vw - 1rem) !important',
        maxWidth: 'calc(100vw - 1rem) !important',
        maxHeight: '80% !important',
        height: 'auto !important',
        transformOrigin: 'center center !important',
      },
    },

    // --- Responsive viewport fallback (<= 768px) ---
    {
      selector: '@media (max-width: 768px)',
      styles: '.fb-cmf, .fb-cmf[data-cmf-dlg="left"], .fb-cmf[data-cmf-dlg="right"], .fb-cmf[data-cmf-dlg="center"] { top: 0 !important; bottom: 0 !important; left: 0.5rem !important; right: 0.5rem !important; margin: auto !important; width: calc(100vw - 1rem) !important; max-width: calc(100vw - 1rem) !important; max-height: 80% !important; height: auto !important; transform-origin: center center !important; }',
    },
  ]);
}
