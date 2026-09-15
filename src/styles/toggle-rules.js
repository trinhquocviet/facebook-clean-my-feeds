/**
 * Returns CSS rules for toggle button positions, dialog positions,
 * and footer button styling.
 * All position variants are pre-defined — JS only sets data-cmf-pos / data-cmf-dlg attributes.
 * @param {{ showAtt: string }} vars
 * @returns {{ selector: string, styles: string }[]}
 */
export function getToggleRules(vars) {
  return [
    // --- Toggle button: common styles (always applied) ---
    {
      selector: '.fb-cmf-toggle',
      styles: 'display: none;', // hidden by default, revealed by showAtt
    },
    {
      selector: '.fb-cmf-toggle svg',
      styles: 'height: 95%; aspect-ratio: 1 / 1;',
    },
    {
      selector: '.fb-cmf-toggle:hover',
      styles: 'cursor: pointer;',
    },
    {
      selector: `.fb-cmf-toggle[${vars.showAtt}]`,
      styles: 'display: block;',
    },

    // --- Toggle button: position variant "0" = bottom-left (DEFAULT) ---
    {
      selector: '.fb-cmf-toggle, .fb-cmf-toggle[data-cmf-pos="bottom-left"]',
      styles: 'position: fixed; bottom: 1rem; left: 1rem; z-index: 999; ' +
              'background: var(--secondary-button-background-floating); ' +
              'padding: 0.5rem; width: 3rem; height: 3rem; border: 0; border-radius: 1.5rem; ' +
              'box-shadow: 0 2px 4px var(--shadow-1), 0 12px 28px var(--shadow-2);',
    },

    // --- Toggle button: position variant "1" = top-right ---
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="top-right"]',
      styles: 'position: fixed; top: 0.5rem; right: 0.5rem; bottom: auto; left: auto; ' +
              'background: transparent; padding: 0; width: auto; height: auto; border: 0; border-radius: 0; box-shadow: none;',
    },

    // --- Toggle button: position variant "2" = disabled ---
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="disabled"]',
      styles: 'display: none !important;',
    },

    // --- Dialog: common transition + closed state (lower specificity wins when shown) ---
    {
      selector: '.fb-cmf',
      styles: 'transform: scale(0); transition: transform .45s ease, opacity .25s ease, visibility 1s ease;',
    },

    // --- Dialog: position variant "left" (DEFAULT) — positioning only, no transform ---
    {
      selector: '.fb-cmf[data-cmf-dlg="left"]',
      styles: 'left: 4.25rem; right: auto; margin-right: 1rem; margin-left: 0; transform-origin: center center;',
    },

    // --- Dialog: position variant "right" — positioning only, no transform ---
    {
      selector: '.fb-cmf[data-cmf-dlg="right"]',
      styles: 'right: 0.35rem; left: auto; margin-left: 1rem; margin-right: 0; transform-origin: top right;',
    },

    // --- Footer buttons ---
    {
      selector: 'div#fbcmf footer > button',
      styles: 'font-family: inherit; cursor: pointer; ' +
              'height: var(--button-height-medium); padding: 0 var(--button-padding-horizontal-medium); ' +
              'border: none; border-radius: var(--button-corner-radius); ' +
              'background-color: var(--secondary-button-background); ' +
              '-webkit-transition: background-color 0.2s linear; transition: background-color 0.2s linear; ' +
              'font-size: .9375rem; font-weight: 600; color: var(--secondary-button-text);',
    },
    {
      selector: '#fbcmf footer > button:hover',
      styles: 'font-family: inherit; background-color: var(--primary-button-background); color: var(--primary-button-text);',
    },
  ];
}
