/**
 * Dialog Toggle, Section State, and Interaction Module
 * Part of FB - Clean My Feeds
 */

import { LOGO_HTML } from '@/constants/index.js';
import { isMobileDevice, isMobileMSite } from '@/utils/index.js';

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
 * Attempts to dock the toggle button directly after the native "Facebook Menu" button.
 *
 * @param {HTMLElement} btn - The toggle button element
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if successfully docked, false otherwise
 */
export function dockMobileToggleButton(btn, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!btn || !doc || typeof doc.querySelector !== 'function') {
    return false;
  }
  const menuBtn = doc.querySelector('[aria-label="Facebook Menu"]') || doc.querySelector('[data-action-id="32742"]');
  if (menuBtn) {
    if (btn.previousElementSibling !== menuBtn) {
      if (typeof menuBtn.insertAdjacentElement === 'function') {
        menuBtn.insertAdjacentElement('afterend', btn);
      } else if (menuBtn.parentNode && typeof menuBtn.parentNode.insertBefore === 'function') {
        menuBtn.parentNode.insertBefore(btn, menuBtn.nextSibling);
      }
    }
    if (typeof btn.setAttribute === 'function') {
      btn.setAttribute('data-cmf-pos', 'mobile-menu');
    }
    return true;
  }
  return false;
}

/**
 * Mounts the toggle button using the appropriate strategy (mobile header docking vs. desktop append).
 *
 * @param {HTMLElement} btn - Toggle button element
 * @param {Object} [ctx={}] - Context object
 * @param {Document} [doc=document] - DOM document
 */
export function mountToggleButton(btn, ctx = {}, doc = (typeof document !== 'undefined' ? document : null)) {
  if (!btn || !doc) return;

  const isMobile = ctx?.VARS?.isMobile ?? (isMobileMSite(doc) || isMobileDevice(doc));
  if (isMobile) {
    const docked = dockMobileToggleButton(btn, doc);
    if (!docked) {
      const target = doc.body || doc.documentElement;
      if (target && typeof target.appendChild === 'function') {
        target.appendChild(btn);
      }
      if (typeof btn.setAttribute === 'function') {
        btn.setAttribute('data-cmf-pos', 'mobile-menu');
      }
    }
  } else {
    const target = doc.body || doc.documentElement;
    if (target && typeof target.appendChild === 'function') {
      target.appendChild(btn);
    }
  }
}

/**
 * Creates and mounts the toggle button to the document.
 *
 * @param {Object} ctx - Context object
 * @param {Document} [doc=document] - DOM document
 */
export function createToggleButton(ctx, doc = (typeof document !== 'undefined' ? document : null)) {
  const { VARS, KeyWords, toggleDialog } = ctx || {};
  const activeDoc = doc || (typeof document !== 'undefined' ? document : null);
  if (!activeDoc || typeof activeDoc.createElement !== 'function') return;

  let btn = activeDoc.createElement('button');
  btn.innerHTML = VARS?.logoHTML || LOGO_HTML;
  btn.id = 'fbcmfToggle';
  btn.title = KeyWords?.DLG_TITLE || 'Clean my feeds';
  btn.className = 'fb-cmf-toggle fb-cmf-icon';
  if (typeof btn.addEventListener === 'function' && typeof toggleDialog === 'function') {
    btn.addEventListener('click', toggleDialog, false);
  }

  mountToggleButton(btn, ctx, activeDoc);

  if (VARS) {
    VARS.btnToggleEl = btn;
  }
}
