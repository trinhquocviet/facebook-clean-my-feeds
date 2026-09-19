import { describe, it, expect, beforeEach } from 'bun:test';
import { addCSS, addExtraCSS } from '@/modules/style-injector/index.js';
import { createInitialState } from '@/state/index.js';
import { masterKeyWords } from '@/i18n/index.js';

describe('modules/style-injector', () => {
  let mockDoc;
  let headEl;
  let styleEl;
  let VARS;

  beforeEach(() => {
    VARS = createInitialState();
    styleEl = null;

    headEl = {
      appendChild: (el) => {
        styleEl = el;
      }
    };

    const docAttrs = {};
    mockDoc = {
      head: headEl,
      documentElement: {
        setAttribute: (k, v) => { docAttrs[k] = v; },
        getAttribute: (k) => docAttrs[k]
      },
      getElementsByTagName: (tag) => (tag === 'head' ? [headEl] : []),
      getElementById: (id) => (styleEl && styleEl.id === id ? styleEl : null),
      createElement: (tag) => {
        const attrs = {};
        const children = [];
        const el = {
          tagName: tag.toUpperCase(),
          id: '',
          textContent: '',
          setAttribute: (k, v) => {
            attrs[k] = v;
            if (k === 'id') el.id = v;
          },
          getAttribute: (k) => attrs[k],
          appendChild: (c) => {
            children.push(c);
            if (c && typeof c.text === 'string') {
              el.textContent += c.text;
            }
          },
          replaceChildren: () => {
            children.length = 0;
            el.textContent = '';
          },
          get children() { return children; }
        };
        return el;
      },
      createTextNode: (text) => ({ text }),
      querySelector: (selector) => {
        if (selector === '.fb-cmf-toggle') {
          const attrs = {};
          return {
            setAttribute: (k, v) => { attrs[k] = v; },
            getAttribute: (k) => attrs[k],
          };
        }
        if (selector === '[role="banner"]') {
          return {};
        }
        return null;
      }
    };
  });

  it('addCSS generates random attributes and injects stylesheet', () => {
    addCSS(VARS, mockDoc);

    expect(VARS.cssID).toBeDefined();
    expect(VARS.cssID.length).toBeGreaterThan(0);
    expect(VARS.hideAtt).toBeDefined();
    expect(VARS.hideWithNoCaptionAtt).toBeDefined();
    expect(VARS.cssHideEl).toBeDefined();
    expect(VARS.cssHideNumberOfShares).toBeDefined();
    expect(VARS.showAtt).toBeDefined();

    expect(styleEl).toBeDefined();
    expect(styleEl.getAttribute('type')).toBe('text/css');
    expect(styleEl.children.length).toBeGreaterThan(0);
  });

  it('addCSS resets stylesheet on subsequent calls if already created', () => {
    addCSS(VARS, mockDoc);
    const firstCSSID = VARS.cssID;

    addCSS(VARS, mockDoc);
    expect(VARS.cssID).toBe(firstCSSID);
  });

  it('addExtraCSS configures data attributes on toggle button and dialog', () => {
    addCSS(VARS, mockDoc);
    VARS.Options = {
      CMF_BTN_OPTION: '1',
      CMF_DIALOG_OPTION: '1'
    };

    let btnPos = '';
    let dlgPos = '';

    mockDoc.querySelector = (sel) => {
      if (sel === '.fb-cmf-toggle') {
        return {
          setAttribute: (k, v) => { if (k === 'data-cmf-pos') btnPos = v; }
        };
      }
      return null;
    };
    mockDoc.getElementById = (id) => {
      if (id === 'fbcmf') {
        return {
          setAttribute: (k, v) => { if (k === 'data-cmf-dlg') dlgPos = v; }
        };
      }
      if (id === VARS.cssID) return styleEl;
      return null;
    };

    addExtraCSS(VARS, masterKeyWords, mockDoc);

    expect(btnPos).toBe('top-right');
    expect(dlgPos).toBe('right');
  });

  it('addExtraCSS updates documentElement and injects banner CSS without [role="banner"] in DOM', () => {
    addCSS(VARS, mockDoc);
    VARS.Options = {
      CMF_BTN_OPTION: '1',
      CMF_DIALOG_OPTION: '0'
    };

    mockDoc.querySelector = (sel) => {
      // Simulate reload where Facebook React has NOT rendered role="banner"
      if (sel === '[role="banner"]') return null;
      if (sel === '.fb-cmf-toggle') {
        return {
          setAttribute: () => {}
        };
      }
      return null;
    };

    addExtraCSS(VARS, masterKeyWords, mockDoc);

    expect(mockDoc.documentElement.getAttribute('data-cmf-pos')).toBe('top-right');
    expect(styleEl.textContent).toContain('margin-right: 42px');

    // Calling addExtraCSS again should not duplicate the rule
    const lenBefore = styleEl.textContent.length;
    addExtraCSS(VARS, masterKeyWords, mockDoc);
    expect(styleEl.textContent.length).toBe(lenBefore);
  });
});
