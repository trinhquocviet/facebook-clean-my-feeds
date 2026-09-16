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
      styles: `position: fixed; bottom: 1rem; left: 1rem; z-index: 999;
        background: var(--secondary-button-background-floating);
        padding: 0.5rem; width: 3rem; height: 3rem; border: 0; border-radius: 1.5rem;
        box-shadow: 0 2px 4px var(--shadow-1), 0 12px 28px var(--shadow-2);`,
    },

    // --- Toggle button: position variant "1" = top-right ---
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="top-right"]',
      styles: `position: fixed; top: 0.5rem; right: 0.5rem; bottom: auto; left: auto;
        background: transparent; padding: 0; width: auto; height: auto; border: 0; border-radius: 0; box-shadow: none;`,
    },

    // --- Toggle button: position variant "2" = disabled ---
    {
      selector: '.fb-cmf-toggle[data-cmf-pos="disabled"]',
      styles: 'display: none !important;',
    },

    // --- Dialog: common transition + closed state (lower specificity wins when shown) ---
    {
      selector: '.fb-cmf',
      styles: 'transform: translateY(6px) scale(.98); transition: transform .16s cubic-bezier(.2,0,.2,1), opacity .16s linear, visibility .16s linear;',
    },
    {
      selector: `.fb-cmf[${vars.showAtt}]`,
      styles: 'transform: none;',
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
      selector: '#fbcmf .cmf-btn, div#fbcmf footer > button',
      styles: `display: inline-flex; align-items: center; justify-content: center;
        padding: 6px var(--cmf-s-3, 12px); border: none; border-radius: var(--cmf-r-md, 6px);
        font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
        transition: background-color .1s linear, color .1s linear, filter .1s linear;
        background-color: var(--cmf-btn-2-bg, var(--secondary-button-background)); color: var(--cmf-btn-2-tx, var(--secondary-button-text));`,
    },
    { selector: '#fbcmf .cmf-btn--primary', styles: 'padding-inline: var(--cmf-s-4, 16px); background-color: var(--cmf-accent, #0866ff); color: var(--cmf-on-accent, #ffffff);' },
    { selector: '#fbcmf .cmf-btn--primary:hover', styles: 'filter: brightness(.92);' },
    { selector: '#fbcmf .cmf-btn--secondary', styles: 'background-color: var(--cmf-btn-2-bg, var(--secondary-button-background)); color: var(--cmf-btn-2-tx, var(--secondary-button-text));' },
    { selector: '#fbcmf .cmf-btn--secondary:hover', styles: 'filter: brightness(.94);' },
    { selector: '#fbcmf .cmf-btn--ghost', styles: 'padding-inline: 0; background-color: transparent; color: var(--cmf-text-2, var(--secondary-text)); font-weight: 500;' },
    { selector: '#fbcmf .cmf-btn--ghost:hover', styles: 'color: var(--cmf-danger, #e41e3f); background-color: transparent;' },
  ];
}
