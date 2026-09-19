/**
 * Dialog Toggle, Section State, and Interaction Module
 * Part of FB - Clean My Feeds
 */

import { LOGO_HTML } from '@/constants/index.js';

const SURFACE_MAP = [
  [/^\/marketplace/, 'MP'],
  [/^\/(watch|videos|reel)/, 'VF'],
  [/^\/groups/, 'GF'],
];

/**
 * Determines which section should default to open based on the current Facebook URL.
 * @returns {string} Section key ('NF' | 'GF' | 'VF' | 'MP')
 */
export function defaultOpenKey() {
  const path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '/';
  for (const [re, key] of SURFACE_MAP) {
    if (re.test(path)) return key;
  }
  return 'NF';
}

/**
 * Applies the Enabled → dependent-controls gate inside one .cmf-filter panel.
 * @param {HTMLElement} panel - The .cmf-filter container element
 */
export function applyFilterGate(panel) {
  if (!panel) return;
  const toggle = panel.querySelector('[data-cmf-filter-toggle]');
  if (!toggle) return;
  const on = toggle.checked;
  panel.classList.toggle('is-off', !on);
  panel.querySelectorAll('[data-cmf-filter-dependent]').forEach(el => {
    if (el.tagName === 'TEXTAREA') {
      el.readOnly = !on;
    } else {
      el.disabled = !on;
    }
  });
}

/**
 * Re-applies every filter gate in the dialog. Safe to call repeatedly.
 * @param {HTMLElement} [root] - Optional root element (defaults to #fbcmf)
 */
export function refreshFilterGates(root = (typeof document !== 'undefined' ? document.getElementById('fbcmf') : null)) {
  if (!root) return;
  root.querySelectorAll('.cmf-filter').forEach(applyFilterGate);
}

/**
 * Wires sections, default open state, and filter gates. Idempotent.
 * @param {Object} [ctx] - Context object
 */
export function bindSectionEvents(ctx) {
  const root = typeof document !== 'undefined' ? document.getElementById('fbcmf') : null;
  if (!root) return;

  const openKey = defaultOpenKey();
  root.querySelectorAll('.cmf-section').forEach(section => {
    section.open = (section.dataset && section.dataset.cmfSection === openKey);
  });

  const content = root.querySelector('.content');
  if (content && (!content.dataset || !content.dataset.cmfBound)) {
    if (content.dataset) content.dataset.cmfBound = '1';
    content.addEventListener('change', (e) => {
      const panel = e.target.closest ? e.target.closest('.cmf-filter') : null;
      if (panel) applyFilterGate(panel);
    }, false);
  }

  refreshFilterGates(root);
}

/**
 * Binds Escape key close and Tab focus trap for the dialog.
 * @param {Object} [ctx] - Context object
 */
export function bindDialogKeys(ctx) {
  if (typeof document === 'undefined') return;
  const { VARS, toggleDialog } = ctx || {};
  const showAtt = VARS?.showAtt || 'data-cmf-show';

  document.addEventListener('keydown', (e) => {
    const root = document.getElementById('fbcmf');
    if (!root || !root.hasAttribute(showAtt)) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      if (typeof toggleDialog === 'function') {
        toggleDialog();
      } else {
        root.removeAttribute(showAtt);
      }
      const toggleBtn = VARS?.btnToggleEl || document.getElementById('fbcmfToggle');
      if (toggleBtn && typeof toggleBtn.focus === 'function') {
        toggleBtn.focus();
      }
      return;
    }

    if (e.key === 'Tab') {
      const focusable = Array.from(root.querySelectorAll(
        'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"]), summary'
      )).filter((el) => !el.disabled && el.offsetParent !== null);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, false);
}

/** Back-compat alias for addLegendEvents */
export const addLegendEvents = bindSectionEvents;

/**
 * Creates and appends the floating toggle button to document body
 * @param {Object} ctx - Context object
 */
export function createToggleButton(ctx) {
  const { VARS, KeyWords, toggleDialog, masterKeyWords } = ctx;
  let btn = document.createElement('button');
  btn.innerHTML = VARS?.logoHTML || LOGO_HTML;
  btn.id = 'fbcmfToggle';
  btn.title = KeyWords.DLG_TITLE;
  btn.className = 'fb-cmf-toggle fb-cmf-icon';

  const posMap = { '0': 'bottom-left', '1': 'top-right', '2': 'disabled' };
  const cmfBtnLocation = (VARS?.Options?.CMF_BTN_OPTION ?? masterKeyWords?.defaults?.CMF_BTN_OPTION ?? '0').toString();
  const posValue = posMap[cmfBtnLocation] || 'bottom-left';
  if (typeof btn.setAttribute === 'function') {
    btn.setAttribute('data-cmf-pos', posValue);
  }
  if (typeof document !== 'undefined' && document.documentElement && typeof document.documentElement.setAttribute === 'function') {
    document.documentElement.setAttribute('data-cmf-pos', posValue);
  }

  const target = document.body || document.documentElement;
  if (target) {
    target.appendChild(btn);
  }
  btn.addEventListener('click', toggleDialog, false);
  VARS.btnToggleEl = btn;
}
