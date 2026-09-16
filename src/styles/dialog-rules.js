/**
 * Dialog CSS rules — Facebook-aligned settings panel.
 * Translated from revamp_sample.html; no Tailwind at runtime.
 * @module styles/dialog-rules
 */

export function getDialogRules(vars) {
  return [
    // ---------------------------------------------------------------- tokens & shell
    {
      selector: '.fb-cmf',
      styles: `--cmf-bg: var(--card-background, #ffffff);
--cmf-surface: var(--comment-background, #f7f8fa);
--cmf-text: var(--primary-text, #050505);
--cmf-text-2: var(--secondary-text, #65676b);
--cmf-text-off: var(--disabled-text, #bcc0c4);
--cmf-border: var(--divider, #ced0d4);
--cmf-border-soft: var(--divider, #e4e6eb);
--cmf-hover: var(--hover-overlay, rgba(0,0,0,.05));
--cmf-accent: var(--accent, #0866ff);
--cmf-on-accent: var(--always-white, #ffffff);
--cmf-btn-2-bg: var(--secondary-button-background, #e4e6eb);
--cmf-btn-2-tx: var(--secondary-button-text, #050505);
--cmf-danger: #e41e3f;
--cmf-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
--cmf-r-lg: 8px; --cmf-r-md: 6px; --cmf-r-sm: 4px;
--cmf-s-1: 4px; --cmf-s-2: 8px; --cmf-s-3: 12px; --cmf-s-4: 16px;
position:fixed; top: .5rem; bottom: .5rem; z-index: 1000;
display: flex; flex-direction: column; overflow: hidden;
width: min(440px, calc(100vw - 1rem)); padding: 0;
border: 1px solid var(--cmf-border); border-radius: var(--cmf-r-lg);
background-color: var(--card-background); color: var(--cmf-text);
font-family: inherit; font-size: 13px; line-height: 1.35;
box-shadow: 0 12px 28px 0 var(--shadow-2, rgba(0,0,0,.2)), 0 2px 4px 0 var(--shadow-1, rgba(0,0,0,.1));
opacity: 0; visibility: hidden;`,
    },
    { selector: `.fb-cmf[${vars.showAtt}]`, styles: 'opacity: 1; visibility: visible;' },
    { selector: '.fb-cmf *, .fb-cmf *::before, .fb-cmf *::after', styles: 'box-sizing: border-box;' },
    {
      selector: '.fb-cmf :focus-visible',
      styles: 'outline: 2px solid var(--cmf-accent); outline-offset: 2px; border-radius: var(--cmf-r-md);',
    },

    // ---------------------------------------------------------------- header
    {
      selector: '.fb-cmf header',
      styles: `flex: 0 0 auto; display: flex; align-items: center; gap: var(--cmf-s-4);
padding: var(--cmf-s-3) var(--cmf-s-4); border-bottom: 1px solid var(--cmf-border);`,
    },
    {
      selector: '.fb-cmf header .fb-cmf-icon',
      styles: 'flex: 0 0 auto; display: inline-flex; align-items: center; color: var(--cmf-text);',
    },
    { selector: '.fb-cmf header .fb-cmf-icon svg', styles: 'width: 32px; height: 32px; margin: 0;' },
    {
      selector: '.fb-cmf header .fb-cmf-title',
      styles: 'flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; text-align: start;',
    },
    {
      selector: '.fb-cmf .cmf-header__title',
      styles: `font-size: 16px; font-weight: 700; line-height: 1.375; letter-spacing: -.01em; color: var(--cmf-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`,
    },
    {
      selector: '.fb-cmf .script-version',
      styles: `display: inline-block; padding: 1px 6px; border-radius: var(--cmf-r-sm); background-color: var(--cmf-surface); color: var(--cmf-text-2); font-size: 11px; font-weight: 500; line-height: 1.45;`,
    },
    {
      selector: '.fb-cmf .cmf-header__subtitle',
      styles: 'font-size: 11px; color: var(--cmf-text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
    },
    { selector: '.fb-cmf header .fb-cmf-close', styles: 'flex: 0 0 auto; padding: 0;' },
    {
      selector: '.fb-cmf .cmf-iconbtn, .fb-cmf header .fb-cmf-close button',
      styles: `display: inline-flex; align-items: center; justify-content: center;
width: 32px; height: 32px; padding: 0; border: none; border-radius: 50%;
background-color: transparent; color: var(--cmf-text-2); cursor: pointer;
transition: background-color .1s linear;`,
    },
    { selector: '.fb-cmf .cmf-iconbtn:hover, .fb-cmf header .fb-cmf-close button:hover', styles: 'background-color: var(--cmf-hover);' },

    // --------------------------------------------------------------- content
    {
      selector: '.fb-cmf div.content',
      styles: `flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
padding: 0; border: none; color: var(--cmf-text);
scrollbar-width: thin; scrollbar-color: var(--cmf-border) transparent;`,
    },
    { selector: '.fb-cmf div.content::-webkit-scrollbar', styles: 'width: 8px;' },
    {
      selector: '.fb-cmf div.content::-webkit-scrollbar-thumb',
      styles: 'background-color: var(--cmf-border); border-radius: 4px;',
    },

    // --------------------------------------------------------------- section
    { selector: '.fb-cmf .cmf-section + .cmf-section', styles: 'border-top: 1px solid var(--cmf-border-soft);' },
    {
      selector: '.fb-cmf .cmf-section__summary',
      styles: `display: flex; align-items: center; justify-content: space-between; gap: var(--cmf-s-2);
padding: var(--cmf-s-3) var(--cmf-s-4); list-style: none;
font-size: 15px; font-weight: 600; color: var(--cmf-text);
text-align: start; cursor: pointer; user-select: none;
transition: background-color .1s linear;`,
    },
    { selector: '.fb-cmf .cmf-section__summary::-webkit-details-marker', styles: 'display: none;' },
    { selector: '.fb-cmf .cmf-section__summary::marker', styles: 'content: "";' },
    { selector: '.fb-cmf .cmf-section__summary:hover', styles: 'background-color: var(--cmf-hover);' },
    { selector: '.fb-cmf .cmf-section__title', styles: 'flex: 1 1 auto; min-width: 0;' },
    {
      selector: '.fb-cmf .cmf-section__chevron',
      styles: `flex: 0 0 auto; display: inline-flex; color: var(--cmf-text-off);
transform: rotate(-90deg); transform-origin: center;
transition: transform .2s cubic-bezier(.2,0,.2,1);`,
    },
    { selector: '.fb-cmf[dir="rtl"] .cmf-section__chevron', styles: 'transform: rotate(90deg);' },
    { selector: '.fb-cmf .cmf-section[open] > .cmf-section__summary .cmf-section__chevron', styles: 'transform: rotate(0deg);' },
    {
      selector: '.fb-cmf .cmf-section__rows',
      styles: 'padding: var(--cmf-s-2) var(--cmf-s-4); border-top: 1px solid var(--cmf-border-soft);',
    },
    {
      selector: '.fb-cmf .cmf-section__note',
      styles: `padding: var(--cmf-s-3) var(--cmf-s-4); border-top: 1px solid var(--cmf-border-soft);
background-color: var(--cmf-surface); font-size: 12px; color: var(--cmf-text-2);`,
    },

    // ------------------------------------------------------------------ rows
    {
      selector: '.fb-cmf .cmf-row',
      styles: `display: flex; align-items: center; justify-content: space-between; gap: var(--cmf-s-3);
width: 100%; margin: 0 0 2px; padding: 6px var(--cmf-s-2);
border-radius: var(--cmf-r-md); color: var(--cmf-text);
font-size: 13px; font-weight: 400; cursor: pointer;
transition: background-color .1s linear;`,
    },
    { selector: '.fb-cmf .cmf-row:hover', styles: 'background-color: var(--cmf-hover);' },
    { selector: '.fb-cmf .cmf-row__text', styles: 'flex: 1 1 auto; min-width: 0;' },
    { selector: '.fb-cmf .cmf-row--locked', styles: 'cursor: default; color: var(--cmf-text-off);' },
    { selector: '.fb-cmf .cmf-row--locked:hover', styles: 'background-color: transparent;' },
    { selector: '.fb-cmf .cmf-row--split', styles: 'display: flex; align-items: center; justify-content: space-between; padding: var(--cmf-s-2); cursor: default;' },
    {
      selector: '.fb-cmf .cmf-row__lead',
      styles: 'display: inline-flex; align-items: center; gap: var(--cmf-s-2); min-width: 0; margin: 0; cursor: pointer;',
    },

    // -------------------------------------------------------- native controls
    {
      selector: '.fb-cmf .cmf-check, .fb-cmf .cmf-radio',
      styles: `flex: 0 0 auto; width: 16px; height: 16px; margin: 0; accent-color: var(--cmf-accent); cursor: pointer;`,
    },
    { selector: '.fb-cmf .cmf-check--sm', styles: 'width: 13px; height: 13px;' },
    {
      selector: '.fb-cmf .cmf-check:disabled, .fb-cmf .cmf-radio:disabled',
      styles: 'cursor: default; opacity: .55;',
    },
    {
      selector: '.fb-cmf .cmf-num, .fb-cmf .cmf-textarea, .fb-cmf select',
      styles: `font-family: inherit; color: var(--cmf-text); background-color: var(--cmf-bg);
border: 1px solid var(--cmf-border); border-radius: var(--cmf-r-md);
transition: border-color .1s linear, box-shadow .1s linear;`,
    },
    {
      selector: '.fb-cmf .cmf-num:focus, .fb-cmf .cmf-textarea:focus, .fb-cmf select:focus',
      styles: 'outline: none; border-color: var(--cmf-accent); box-shadow: 0 0 0 1px var(--cmf-accent);',
    },
    {
      selector: '.fb-cmf .cmf-num',
      styles: 'width: 80px; padding: 4px var(--cmf-s-2); font-family: var(--cmf-mono); font-size: 12px; text-align: end;',
    },
    {
      selector: '.fb-cmf .cmf-textarea',
      styles: `display: block; width: 100%; padding: 10px; resize: vertical;
font-family: var(--cmf-mono); font-size: 12px; line-height: 1.5;`,
    },
    { selector: '.fb-cmf select', styles: 'height: 32px; max-width: 100%; padding: 0 var(--cmf-s-2); font-size: 13px;' },

    // ----------------------------------------------------------- text filter
    {
      selector: '.fb-cmf .cmf-filter',
      styles: `display: flex; flex-direction: column; gap: var(--cmf-s-3);
padding: var(--cmf-s-4); border-top: 1px solid var(--cmf-border-soft);
background-color: var(--cmf-surface);`,
    },
    {
      selector: '.fb-cmf .cmf-filter__head',
      styles: 'display: flex; align-items: center; justify-content: space-between; gap: var(--cmf-s-3);',
    },
    {
      selector: '.fb-cmf .cmf-filter__label',
      styles: 'font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--cmf-text-2);',
    },
    { selector: '.fb-cmf .cmf-filter__flags', styles: 'display: flex; align-items: center; gap: var(--cmf-s-3);' },
    {
      selector: '.fb-cmf .cmf-flag',
      styles: 'display: inline-flex; align-items: center; gap: 6px; margin: 0; font-size: 12px; color: var(--cmf-text-2); cursor: pointer;',
    },
    { selector: '.fb-cmf .cmf-field', styles: 'display: flex; flex-direction: column; gap: var(--cmf-s-1);' },
    {
      selector: '.fb-cmf .cmf-field__label',
      styles: 'font-size: 12px; font-weight: 600; color: var(--cmf-text-2);',
    },
    // gated state: Enabled unchecked
    { selector: '.fb-cmf .cmf-filter.is-off .cmf-textarea', styles: 'opacity: .5; cursor: not-allowed;' },
    { selector: '.fb-cmf .cmf-filter.is-off .cmf-field__label', styles: 'opacity: .5;' },
    { selector: '.fb-cmf .cmf-filter.is-off .cmf-flag:last-child', styles: 'opacity: .5;' },

    // ------------------------------------------------------------------ tips
    {
      selector: '.fb-cmf .cmf-tips',
      styles: `padding: var(--cmf-s-4); border-top: 1px solid var(--cmf-border-soft);
font-size: 12px; line-height: 1.5; color: var(--cmf-text-2); white-space: pre-line;`,
    },

    // ---------------------------------------------------------------- footer
    {
      selector: '.fb-cmf footer',
      styles: `flex: 0 0 auto; display: block; padding: var(--cmf-s-3) var(--cmf-s-4);
border-top: 1px solid var(--cmf-border); background-color: var(--cmf-bg); text-align: start;`,
    },
    { selector: '.fb-cmf .cmf-footer__actions', styles: 'display: flex; align-items: center; gap: var(--cmf-s-2);' },
    { selector: '.fb-cmf .cmf-footer__spacer', styles: 'flex: 1 1 auto;' },
    {
      selector: '.fb-cmf .cmf-status, .fb-cmf .fileResults',
      styles: 'min-height: 14px; padding-top: var(--cmf-s-2); font-size: 11px; color: var(--cmf-text-2);',
    },
    { selector: '.fb-cmf .fileInput', styles: 'display: none;' },

    // -------------------------------------------------------------- dark mode
    { selector: '.__fb-dark-mode .fb-cmf', styles: 'color-scheme: dark;' },
    {
      selector: '.__fb-dark-mode .fb-cmf .cmf-textarea, .__fb-dark-mode .fb-cmf .cmf-num, .__fb-dark-mode .fb-cmf select',
      styles: 'background-color: var(--card-background, #242526); color: var(--primary-text, #e4e6eb);',
    },

    // --------------------------------------------------------- reduced motion
    {
      selector: '@media (prefers-reduced-motion: reduce)',
      styles: '.fb-cmf, .fb-cmf * { transition: none !important; animation: none !important; }',
    },

    // ------------------------------------------- external-link icon (unchanged)
    { selector: `.${vars.iconNewWindowClass}`, styles: 'width: 1rem; height: 1rem;' },
    { selector: `.${vars.iconNewWindowClass} a`, styles: 'width: 1rem; position: relative; display: inline-block;' },
    { selector: `.${vars.iconNewWindowClass} svg`, styles: 'position: absolute; top: -13.5px; stroke: rgb(101,103,107);' },

    // ------------------------------------------- legacy fieldset fallback (for P1)
    { selector: '.fb-cmf fieldset', styles: 'margin:0.5rem; padding:0.5rem; border-style: solid; border-color: var(--cmf-border-soft);' },
    { selector: '.fb-cmf fieldset *', styles: 'font-size: 0.8125rem;' },
    { selector: '.fb-cmf fieldset legend', styles: 'font-size: 0.95rem; width: 95%; padding: 0 0.5rem 0.125rem 0.5rem; line-height: 2.5; border-width: 1px; border-style: solid; border-radius: 0.5rem 0.5rem 0 0;' },
    { selector: '.fb-cmf fieldset legend:hover, .fb-cmf fieldset label:hover', styles: 'background-color: var(--cmf-hover); cursor: pointer;' },
    { selector: '.fb-cmf fieldset.visible, .fb-cmf fieldset.visible legend', styles: 'border-color: var(--cmf-border);' },
    { selector: '.fb-cmf fieldset.hidden, .fb-cmf fieldset.hidden legend', styles: 'border-color: var(--cmf-border-soft);' },
    { selector: '.fb-cmf fieldset.hidden *:not(legend)', styles: 'display: none;' },
    { selector: '.fb-cmf fieldset.visible legend::after', styles: 'content: "\\2212"; float:right;' },
    { selector: '.fb-cmf fieldset.hidden legend::after', styles: 'content: "\\002B"; float:right;' },
    { selector: '.fb-cmf fieldset label', styles: 'display:inline-block; padding:0.125rem 0; color: var(--cmf-text); font-weight: normal; width:100%;' },
    { selector: '.fb-cmf fieldset label input', styles: 'margin: 0 0.5rem 0 0.5rem; vertical-align:baseline;' },
    { selector: '.fb-cmf fieldset label[disabled]', styles: 'color:darkgrey;' },
    { selector: '.fb-cmf fieldset textarea', styles: 'width:100%; height:12rem;' },
    { selector: '.fb-cmf fieldset select', styles: 'border: 1px solid var(--cmf-border); margin: 0 0.5rem 0 0.5rem; vertical-align:baseline;' },
  ];
}
