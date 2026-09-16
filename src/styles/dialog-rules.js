/**
 * Dialog CSS rules — Facebook-aligned settings panel.
 * Defined as declarative CSS-in-JS style objects.
 * @module styles/dialog-rules
 */

import { ICON_NEW_WINDOW_CLASS } from '@/constants/index.js';
import { compileRules } from '@/utils/index.js';

export function getDialogRules(vars = {}) {
  const iconNewWindowClass = vars?.iconNewWindowClass || ICON_NEW_WINDOW_CLASS;
  return compileRules([
    // ---------------------------------------------------------------- tokens & shell
    {
      selector: '.fb-cmf',
      styles: {
        '--cmf-bg': 'var(--card-background, #ffffff)',
        '--cmf-surface': 'var(--comment-background, #f7f8fa)',
        '--cmf-text': 'var(--primary-text, #050505)',
        '--cmf-text-2': 'var(--secondary-text, #65676b)',
        '--cmf-text-off': 'var(--disabled-text, #bcc0c4)',
        '--cmf-border': 'var(--divider, #ced0d4)',
        '--cmf-border-soft': 'var(--divider, #e4e6eb)',
        '--cmf-hover': 'var(--hover-overlay, rgba(0,0,0,.05))',
        '--cmf-accent': 'var(--accent, #0866ff)',
        '--cmf-on-accent': 'var(--always-white, #ffffff)',
        '--cmf-btn-2-bg': 'var(--secondary-button-background, #e4e6eb)',
        '--cmf-btn-2-tx': 'var(--secondary-button-text, #050505)',
        '--cmf-danger': '#e41e3f',
        '--cmf-mono': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        '--cmf-r-lg': '8px',
        '--cmf-r-md': '6px',
        '--cmf-r-sm': '4px',
        '--cmf-s-1': '4px',
        '--cmf-s-2': '8px',
        '--cmf-s-3': '12px',
        '--cmf-s-4': '16px',
        position: 'fixed',
        top: '.5rem',
        bottom: '.5rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        width: 'min(440px, calc(100vw - 1rem))',
        padding: '0',
        border: '1px solid var(--cmf-border)',
        borderRadius: 'var(--cmf-r-lg)',
        backgroundColor: 'var(--card-background)',
        color: 'var(--cmf-text)',
        fontFamily: 'inherit',
        fontSize: '13px',
        lineHeight: '1.35',
        boxShadow: '0 12px 28px 0 var(--shadow-2, rgba(0,0,0,.2)), 0 2px 4px 0 var(--shadow-1, rgba(0,0,0,.1))',
        opacity: 0,
        visibility: 'hidden',
      },
    },
    { selector: `.fb-cmf[${vars.showAtt}]`, styles: { opacity: 1, visibility: 'visible' } },
    { selector: '.fb-cmf *, .fb-cmf *::before, .fb-cmf *::after', styles: { boxSizing: 'border-box' } },
    {
      selector: '.fb-cmf :focus-visible',
      styles: {
        outline: '2px solid var(--cmf-accent)',
        outlineOffset: '2px',
        borderRadius: 'var(--cmf-r-md)',
      },
    },

    // ---------------------------------------------------------------- header
    {
      selector: '.fb-cmf header',
      styles: {
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cmf-s-4)',
        padding: 'var(--cmf-s-3) var(--cmf-s-4)',
        borderBottom: '1px solid var(--cmf-border)',
      },
    },
    {
      selector: '.fb-cmf header .fb-cmf-icon',
      styles: {
        flex: '0 0 auto',
        display: 'inline-flex',
        alignItems: 'center',
        color: 'var(--cmf-text)',
      },
    },
    { selector: '.fb-cmf header .fb-cmf-icon svg', styles: { width: '32px', height: '32px', margin: '0' } },
    {
      selector: '.fb-cmf header .fb-cmf-title',
      styles: {
        flex: '1 1 auto',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        textAlign: 'start',
      },
    },
    {
      selector: '.fb-cmf .cmf-header__title',
      styles: {
        fontSize: '16px',
        fontWeight: 700,
        lineHeight: 1.375,
        letterSpacing: '-.01em',
        color: 'var(--cmf-text)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
    {
      selector: '.fb-cmf .script-version',
      styles: {
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 'var(--cmf-r-sm)',
        backgroundColor: 'var(--cmf-surface)',
        color: 'var(--cmf-text-2)',
        fontSize: '11px',
        fontWeight: 500,
        lineHeight: 1.45,
      },
    },
    {
      selector: '.fb-cmf .cmf-header__subtitle',
      styles: {
        fontSize: '11px',
        color: 'var(--cmf-text-2)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
    { selector: '.fb-cmf header .fb-cmf-close', styles: { flex: '0 0 auto', padding: 0 } },
    {
      selector: '.fb-cmf .cmf-iconbtn, .fb-cmf header .fb-cmf-close button',
      styles: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        backgroundColor: 'transparent',
        color: 'var(--cmf-text-2)',
        cursor: 'pointer',
        transition: 'background-color .1s linear',
      },
    },
    {
      selector: '.fb-cmf .cmf-iconbtn:hover, .fb-cmf header .fb-cmf-close button:hover',
      styles: { backgroundColor: 'var(--cmf-hover)' },
    },

    // --------------------------------------------------------------- content
    {
      selector: '.fb-cmf div.content',
      styles: {
        flex: '1 1 auto',
        minHeight: 0,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        padding: 0,
        border: 'none',
        color: 'var(--cmf-text)',
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--cmf-border) transparent',
      },
    },
    { selector: '.fb-cmf div.content::-webkit-scrollbar', styles: { width: '8px' } },
    {
      selector: '.fb-cmf div.content::-webkit-scrollbar-thumb',
      styles: {
        backgroundColor: 'var(--cmf-border)',
        borderRadius: '4px',
      },
    },

    // --------------------------------------------------------------- section
    { selector: '.fb-cmf .cmf-section + .cmf-section', styles: { borderTop: '1px solid var(--cmf-border-soft)' } },
    {
      selector: '.fb-cmf .cmf-section__summary',
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--cmf-s-2)',
        padding: 'var(--cmf-s-3) var(--cmf-s-4)',
        listStyle: 'none',
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--cmf-text)',
        textAlign: 'start',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color .1s linear',
      },
    },
    { selector: '.fb-cmf .cmf-section__summary::-webkit-details-marker', styles: { display: 'none' } },
    { selector: '.fb-cmf .cmf-section__summary::marker', styles: { content: '""' } },
    { selector: '.fb-cmf .cmf-section__summary:hover', styles: { backgroundColor: 'var(--cmf-hover)' } },
    { selector: '.fb-cmf .cmf-section__title', styles: { flex: '1 1 auto', minWidth: 0 } },
    {
      selector: '.fb-cmf .cmf-section__chevron',
      styles: {
        flex: '0 0 auto',
        display: 'inline-flex',
        color: 'var(--cmf-text-off)',
        transform: 'rotate(-90deg)',
        transformOrigin: 'center',
        transition: 'transform .2s cubic-bezier(.2,0,.2,1)',
      },
    },
    { selector: '.fb-cmf[dir="rtl"] .cmf-section__chevron', styles: { transform: 'rotate(90deg)' } },
    {
      selector: '.fb-cmf .cmf-section[open] > .cmf-section__summary .cmf-section__chevron',
      styles: { transform: 'rotate(0deg)' },
    },
    {
      selector: '.fb-cmf .cmf-section__rows',
      styles: {
        padding: 'var(--cmf-s-2) var(--cmf-s-4)',
        borderTop: '1px solid var(--cmf-border-soft)',
      },
    },
    {
      selector: '.fb-cmf .cmf-section__note',
      styles: {
        padding: 'var(--cmf-s-3) var(--cmf-s-4)',
        borderTop: '1px solid var(--cmf-border-soft)',
        backgroundColor: 'var(--cmf-surface)',
        fontSize: '12px',
        color: 'var(--cmf-text-2)',
      },
    },

    // ------------------------------------------------------------------ rows
    {
      selector: '.fb-cmf .cmf-row',
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--cmf-s-3)',
        width: '100%',
        margin: '0 0 2px',
        padding: '6px var(--cmf-s-2)',
        borderRadius: 'var(--cmf-r-md)',
        color: 'var(--cmf-text)',
        fontSize: '13px',
        fontWeight: 400,
        cursor: 'pointer',
        transition: 'background-color .1s linear',
      },
    },
    { selector: '.fb-cmf .cmf-row:hover', styles: { backgroundColor: 'var(--cmf-hover)' } },
    { selector: '.fb-cmf .cmf-row__text', styles: { flex: '1 1 auto', minWidth: 0 } },
    { selector: '.fb-cmf .cmf-row--locked', styles: { cursor: 'default', color: 'var(--cmf-text-off)' } },
    { selector: '.fb-cmf .cmf-row--locked:hover', styles: { backgroundColor: 'transparent' } },
    {
      selector: '.fb-cmf .cmf-row--split',
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--cmf-s-2)',
        cursor: 'default',
      },
    },
    {
      selector: '.fb-cmf .cmf-row__lead',
      styles: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--cmf-s-2)',
        minWidth: 0,
        margin: 0,
        cursor: 'pointer',
      },
    },

    // -------------------------------------------------------- native controls
    {
      selector: '.fb-cmf .cmf-check, .fb-cmf .cmf-radio',
      styles: {
        flex: '0 0 auto',
        width: '16px',
        height: '16px',
        margin: 0,
        accentColor: 'var(--cmf-accent)',
        cursor: 'pointer',
      },
    },
    { selector: '.fb-cmf .cmf-check--sm', styles: { width: '13px', height: '13px' } },
    {
      selector: '.fb-cmf .cmf-check:disabled, .fb-cmf .cmf-radio:disabled',
      styles: {
        cursor: 'default',
        opacity: '.55',
      },
    },
    {
      selector: '.fb-cmf .cmf-num, .fb-cmf .cmf-textarea, .fb-cmf select',
      styles: {
        fontFamily: 'inherit',
        color: 'var(--cmf-text)',
        backgroundColor: 'var(--cmf-bg)',
        border: '1px solid var(--cmf-border)',
        borderRadius: 'var(--cmf-r-md)',
        transition: 'border-color .1s linear, box-shadow .1s linear',
      },
    },
    {
      selector: '.fb-cmf .cmf-num:focus, .fb-cmf .cmf-textarea:focus, .fb-cmf select:focus',
      styles: {
        outline: 'none',
        borderColor: 'var(--cmf-accent)',
        boxShadow: '0 0 0 1px var(--cmf-accent)',
      },
    },
    {
      selector: '.fb-cmf .cmf-num',
      styles: {
        width: '80px',
        padding: '4px var(--cmf-s-2)',
        fontFamily: 'var(--cmf-mono)',
        fontSize: '12px',
        textAlign: 'end',
      },
    },
    {
      selector: '.fb-cmf .cmf-textarea',
      styles: {
        display: 'block',
        width: '100%',
        padding: '10px',
        resize: 'vertical',
        fontFamily: 'var(--cmf-mono)',
        fontSize: '12px',
        lineHeight: 1.5,
      },
    },
    {
      selector: '.fb-cmf select',
      styles: {
        height: '32px',
        maxWidth: '100%',
        padding: '0 var(--cmf-s-2)',
        fontSize: '13px',
      },
    },

    // ----------------------------------------------------------- text filter
    {
      selector: '.fb-cmf .cmf-filter',
      styles: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cmf-s-3)',
        padding: 'var(--cmf-s-4)',
        borderTop: '1px solid var(--cmf-border-soft)',
        backgroundColor: 'var(--cmf-surface)',
      },
    },
    {
      selector: '.fb-cmf .cmf-filter__head',
      styles: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--cmf-s-3)',
      },
    },
    {
      selector: '.fb-cmf .cmf-filter__label',
      styles: {
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '.05em',
        textTransform: 'uppercase',
        color: 'var(--cmf-text-2)',
      },
    },
    {
      selector: '.fb-cmf .cmf-filter__flags',
      styles: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cmf-s-3)',
      },
    },
    {
      selector: '.fb-cmf .cmf-flag',
      styles: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        margin: 0,
        fontSize: '12px',
        color: 'var(--cmf-text-2)',
        cursor: 'pointer',
      },
    },
    {
      selector: '.fb-cmf .cmf-field',
      styles: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cmf-s-1)',
      },
    },
    {
      selector: '.fb-cmf .cmf-field__label',
      styles: {
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--cmf-text-2)',
      },
    },
    // gated state: Enabled unchecked
    { selector: '.fb-cmf .cmf-filter.is-off .cmf-textarea', styles: { opacity: '.5', cursor: 'not-allowed' } },
    { selector: '.fb-cmf .cmf-filter.is-off .cmf-field__label', styles: { opacity: '.5' } },
    { selector: '.fb-cmf .cmf-filter.is-off .cmf-flag:last-child', styles: { opacity: '.5' } },

    // ------------------------------------------------------------------ tips
    {
      selector: '.fb-cmf .cmf-tips',
      styles: {
        padding: 'var(--cmf-s-4)',
        borderTop: '1px solid var(--cmf-border-soft)',
        fontSize: '12px',
        lineHeight: 1.5,
        color: 'var(--cmf-text-2)',
        whiteSpace: 'pre-line',
      },
    },

    // ---------------------------------------------------------------- footer
    {
      selector: '.fb-cmf footer',
      styles: {
        flex: '0 0 auto',
        display: 'block',
        padding: 'var(--cmf-s-3) var(--cmf-s-4)',
        borderTop: '1px solid var(--cmf-border)',
        backgroundColor: 'var(--cmf-bg)',
        textAlign: 'start',
      },
    },
    {
      selector: '.fb-cmf .cmf-footer__actions',
      styles: {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--cmf-s-2)',
      },
    },
    { selector: '.fb-cmf .cmf-footer__spacer', styles: { flex: '1 1 auto' } },
    {
      selector: '.fb-cmf .cmf-status, .fb-cmf .fileResults',
      styles: {
        minHeight: '14px',
        paddingTop: 'var(--cmf-s-2)',
        fontSize: '11px',
        color: 'var(--cmf-text-2)',
      },
    },
    { selector: '.fb-cmf .fileInput', styles: { display: 'none' } },

    // -------------------------------------------------------------- dark mode
    { selector: '.__fb-dark-mode .fb-cmf', styles: { colorScheme: 'dark' } },
    {
      selector: '.__fb-dark-mode .fb-cmf .cmf-textarea, .__fb-dark-mode .fb-cmf .cmf-num, .__fb-dark-mode .fb-cmf select',
      styles: {
        backgroundColor: 'var(--card-background, #242526)',
        color: 'var(--primary-text, #e4e6eb)',
      },
    },

    // --------------------------------------------------------- reduced motion
    {
      selector: '@media (prefers-reduced-motion: reduce)',
      styles: '.fb-cmf, .fb-cmf * { transition: none !important; animation: none !important; }',
    },

    // ------------------------------------------- external-link icon
    {
      selector: `.${iconNewWindowClass}`,
      styles: {
        width: '1rem',
        height: '1rem',
      },
    },
    {
      selector: `.${iconNewWindowClass} a`,
      styles: {
        width: '1rem',
        position: 'relative',
        display: 'inline-block',
      },
    },
    {
      selector: `.${iconNewWindowClass} svg`,
      styles: {
        position: 'absolute',
        top: '-13.5px',
        stroke: 'rgb(101,103,107)',
      },
    },

    // ------------------------------------------- legacy fieldset fallback
    {
      selector: '.fb-cmf fieldset',
      styles: {
        margin: '0.5rem',
        padding: '0.5rem',
        borderStyle: 'solid',
        borderColor: 'var(--cmf-border-soft)',
      },
    },
    { selector: '.fb-cmf fieldset *', styles: { fontSize: '0.8125rem' } },
    {
      selector: '.fb-cmf fieldset legend',
      styles: {
        fontSize: '0.95rem',
        width: '95%',
        padding: '0 0.5rem 0.125rem 0.5rem',
        lineHeight: 2.5,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '0.5rem 0.5rem 0 0',
      },
    },
    {
      selector: '.fb-cmf fieldset legend:hover, .fb-cmf fieldset label:hover',
      styles: {
        backgroundColor: 'var(--cmf-hover)',
        cursor: 'pointer',
      },
    },
    {
      selector: '.fb-cmf fieldset.visible, .fb-cmf fieldset.visible legend',
      styles: { borderColor: 'var(--cmf-border)' },
    },
    {
      selector: '.fb-cmf fieldset.hidden, .fb-cmf fieldset.hidden legend',
      styles: { borderColor: 'var(--cmf-border-soft)' },
    },
    { selector: '.fb-cmf fieldset.hidden *:not(legend)', styles: { display: 'none' } },
    {
      selector: '.fb-cmf fieldset.visible legend::after',
      styles: 'content: "\\2212"; float: right;',
    },
    {
      selector: '.fb-cmf fieldset.hidden legend::after',
      styles: 'content: "\\002B"; float: right;',
    },
    {
      selector: '.fb-cmf fieldset label',
      styles: {
        display: 'inline-block',
        padding: '0.125rem 0',
        color: 'var(--cmf-text)',
        fontWeight: 'normal',
        width: '100%',
      },
    },
    {
      selector: '.fb-cmf fieldset label input',
      styles: {
        margin: '0 0.5rem 0 0.5rem',
        verticalAlign: 'baseline',
      },
    },
    { selector: '.fb-cmf fieldset label[disabled]', styles: { color: 'darkgrey' } },
    { selector: '.fb-cmf fieldset textarea', styles: { width: '100%', height: '12rem' } },
    {
      selector: '.fb-cmf fieldset select',
      styles: {
        border: '1px solid var(--cmf-border)',
        margin: '0 0.5rem 0 0.5rem',
        verticalAlign: 'baseline',
      },
    },
  ]);
}
