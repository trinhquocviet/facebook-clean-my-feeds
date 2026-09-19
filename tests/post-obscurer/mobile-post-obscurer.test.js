import { describe, test, expect, beforeEach } from 'bun:test';
import { createMobilePostObscurer } from '@/modules/post-obscurer/mobile-post-obscurer.js';
import {
  postAtt,
  mobileContentAtt,
  mobileSummaryAtt,
  mobileCollapsedAtt,
  mobileDividerCollapsedAtt
} from '@/constants/index.js';
import { createInitialState } from '@/state/index.js';

describe('modules/post-obscurer/mobile-post-obscurer', () => {
  let VARS;
  let KeyWords;
  let mockDoc;

  function createMockElement(tag) {
    const listeners = {};
    const styleProps = {};
    const el = {
      nodeType: 1,
      tagName: tag.toUpperCase(),
      attributes: {},
      children: [],
      childNodes: [],
      dataset: {},
      style: {
        _props: styleProps,
        get height() { return styleProps.height || ''; },
        set height(val) { styleProps.height = val; },
        get display() { return styleProps.display || ''; },
        set display(val) { styleProps.display = val; },
        get minHeight() { return styleProps.minHeight || ''; },
        set minHeight(val) { styleProps.minHeight = val; },
        get maxHeight() { return styleProps.maxHeight || ''; },
        set maxHeight(val) { styleProps.maxHeight = val; },
        setProperty(k, v, priority) {
          styleProps[k] = v;
          styleProps[k + '_priority'] = priority || '';
        },
        getPropertyValue(k) {
          return styleProps[k] || '';
        },
        getPropertyPriority(k) {
          return styleProps[k + '_priority'] || '';
        }
      },
      classList: {
        _classes: new Set(),
        get length() { return this._classes.size; },
        add(...args) { args.forEach((c) => this._classes.add(c)); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        [Symbol.iterator]() { return this._classes.values(); }
      },
      parentNode: null,
      previousElementSibling: null,
      nextElementSibling: null,
      firstElementChild: null,
      get firstChild() { return this.childNodes[0] || null; },
      textContent: '',
      ownerDocument: null,
      setAttribute(name, value) {
        this.attributes[name] = String(value);
      },
      getAttribute(name) {
        return this.attributes[name] !== undefined ? this.attributes[name] : null;
      },
      hasAttribute(name) {
        return this.attributes[name] !== undefined;
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      appendChild(child) {
        if (child.parentNode && child.parentNode.children) {
          const idx = child.parentNode.children.indexOf(child);
          if (idx !== -1) child.parentNode.children.splice(idx, 1);
          const cIdx = child.parentNode.childNodes.indexOf(child);
          if (cIdx !== -1) child.parentNode.childNodes.splice(cIdx, 1);
        }
        child.parentNode = this;
        this.children.push(child);
        this.childNodes.push(child);
        this.firstElementChild = this.children[0] || null;
        return child;
      },
      querySelector(selector) {
        return null;
      },
      addEventListener(evt, fn) {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt].push(fn);
      },
      dispatchEvent(evt) {
        const type = typeof evt === 'string' ? evt : evt.type;
        if (listeners[type]) {
          listeners[type].forEach((fn) => fn(evt));
        }
        return true;
      },
      click() {
        const event = {
          type: 'click',
          preventDefault() {},
          stopPropagation() {},
          stopImmediatePropagation() {}
        };
        if (listeners.click) {
          listeners.click.forEach((fn) => fn(event));
        }
      }
    };
    return el;
  }

  beforeEach(() => {
    VARS = createInitialState();
    VARS.isMobile = true;
    VARS.hideAtt = 'cmf-hide-123';
    VARS.showAtt = 'cmf-show-123';
    VARS.Options.VERBOSITY_LEVEL = '1';
    VARS.Options.VERBOSITY_DEBUG = false;

    KeyWords = {
      VERBOSITY_MESSAGE: ['Hide', 'Hidden - ']
    };

    mockDoc = {
      createElement: (tag) => {
        const el = createMockElement(tag);
        el.ownerDocument = mockDoc;
        return el;
      },
      createTextNode: (text) => ({ textContent: text, nodeType: 3 })
    };
  });

  test('in-cell collapsing preserves outer cell as direct child, resets inline heights, stamps cmfr, and wraps internal children', () => {
    const obscurer = createMobilePostObscurer(VARS, () => KeyWords);

    const vscroller = mockDoc.createElement('div');
    const cell = mockDoc.createElement('div');
    cell.classList.add('m');
    cell.style.height = '934px';
    cell.setAttribute('data-actual-height', '934');
    vscroller.appendChild(cell);

    const headerChild = mockDoc.createElement('div');
    headerChild.textContent = 'Post Author';
    const bodyChild = mockDoc.createElement('div');
    bodyChild.textContent = 'Post Content';
    cell.appendChild(headerChild);
    cell.appendChild(bodyChild);

    obscurer.nf_hidePost(cell, 'Sponsored');

    // Outer cell is STILL the direct child of vscroller!
    expect(cell.parentNode).toBe(vscroller);
    expect(vscroller.children.length).toBe(1);
    expect(vscroller.children[0]).toBe(cell);

    // Stamped attributes on cell
    expect(cell.getAttribute(postAtt)).toBe('Sponsored');
    expect(cell.getAttribute('cmfr')).toBe('Sponsored');
    expect(cell.hasAttribute(mobileCollapsedAtt)).toBe(true);

    // Inline height overridden and original height stored
    expect(cell.style.getPropertyValue('height')).toBe('auto');
    expect(cell.style.getPropertyPriority('height')).toBe('important');
    expect(cell.dataset.cmfOrigHeight).toBe('934px');
    expect(cell.hasAttribute('data-actual-height')).toBe(false);

    // Inside cell: details element containing summary and content wrapper
    const details = cell.children[0];
    expect(details.tagName).toBe('DETAILS');
    expect(details.classList.contains('cmf-mobile-details')).toBe(true);
    // Attribute key cmfr is stamped on details!
    expect(details.getAttribute(postAtt)).toBe('Sponsored');
    expect(details.getAttribute('cmfr')).toBe('Sponsored');

    const summary = details.children[0];
    expect(summary.tagName).toBe('SUMMARY');
    expect(summary.hasAttribute(mobileSummaryAtt)).toBe(true);
    expect(summary.getAttribute('role')).toBe('button');
    expect(summary.getAttribute('tabindex')).toBe('0');
    expect(summary.childNodes[0].textContent).toBe('Hidden - Sponsored');

    const contentWrap = details.children[1];
    expect(contentWrap.tagName).toBe('DIV');
    expect(contentWrap.hasAttribute(mobileContentAtt)).toBe(true);
    expect(contentWrap.children.includes(headerChild)).toBe(true);
    expect(contentWrap.children.includes(bodyChild)).toBe(true);
  });

  test('clicking on summary triggers expand and collapse toggling open state and content visibility', () => {
    const obscurer = createMobilePostObscurer(VARS, () => KeyWords);

    const cell = mockDoc.createElement('div');
    const child = mockDoc.createElement('div');
    child.textContent = 'Ad Content';
    cell.appendChild(child);

    obscurer.nf_hidePost(cell, 'Sponsored');

    const details = cell.children[0];
    const summary = details.children[0];
    const contentWrap = details.children[1];

    expect(details.hasAttribute('open')).toBe(false);
    expect(details.open).toBeFalsy();

    // 1. First click: Expands details
    summary.click();
    expect(details.hasAttribute('open')).toBe(true);
    expect(details.open).toBe(true);
    expect(contentWrap.style.display).toBe('block');
    expect(cell.style.getPropertyValue('height')).toBe('auto');
    expect(cell.style.getPropertyPriority('height')).toBe('important');

    // 2. Second click: Collapses details
    summary.click();
    expect(details.hasAttribute('open')).toBe(false);
    expect(details.open).toBe(false);
    expect(contentWrap.style.display).toBe('none');
    expect(cell.style.getPropertyValue('height')).toBe('auto');
    expect(cell.style.getPropertyPriority('height')).toBe('important');
  });

  test('collapses coupled adjacent 1px spacer divider in tandem', () => {
    const obscurer = createMobilePostObscurer(VARS, () => KeyWords);

    const divider = mockDoc.createElement('div');
    divider.setAttribute('data-actual-height', '1');

    const cell = mockDoc.createElement('div');
    cell.previousElementSibling = divider;
    divider.nextElementSibling = cell;

    obscurer.nf_hidePost(cell, 'Suggested: Follow');

    expect(divider.hasAttribute(mobileDividerCollapsedAtt)).toBe(true);
    expect(divider.hasAttribute(VARS.hideAtt)).toBe(true);
  });

  test('silent purge mode (VERBOSITY_LEVEL=0) collapses directly, clears height, and does not create details', () => {
    VARS.Options.VERBOSITY_LEVEL = '0';
    const obscurer = createMobilePostObscurer(VARS, () => KeyWords);

    const cell = mockDoc.createElement('div');
    cell.style.height = '600px';
    obscurer.nf_hidePost(cell, 'Sponsored');

    expect(cell.getAttribute(postAtt)).toBe('Sponsored');
    expect(cell.getAttribute('cmfr')).toBe('Sponsored');
    expect(cell.hasAttribute(VARS.hideAtt)).toBe(true);
    expect(cell.style.getPropertyValue('display')).toBe('none');
    expect(cell.style.getPropertyPriority('display')).toBe('important');
    expect(cell.style.getPropertyValue('height')).toBe('0px');
    expect(cell.style.getPropertyPriority('height')).toBe('important');
    expect(cell.children.some((c) => c.tagName === 'DETAILS')).toBe(false);
  });

  test('debug mode (VERBOSITY_DEBUG=true) creates open details and applies showAtt', () => {
    VARS.Options.VERBOSITY_DEBUG = true;
    const obscurer = createMobilePostObscurer(VARS, () => KeyWords);

    const cell = mockDoc.createElement('div');
    obscurer.nf_hidePost(cell, 'Sponsored');

    const details = cell.children[0];
    expect(details.hasAttribute('open')).toBe(true);
    expect(cell.hasAttribute(VARS.showAtt)).toBe(true);
  });

  test('isPostAlreadyObscured returns true for cells with postAtt or mobileCollapsedAtt', () => {
    const obscurer = createMobilePostObscurer(VARS, () => KeyWords);

    const cell = mockDoc.createElement('div');
    expect(obscurer.isPostAlreadyObscured(cell)).toBe(false);

    cell.setAttribute(mobileCollapsedAtt, '');
    expect(obscurer.isPostAlreadyObscured(cell)).toBe(true);

    const cell2 = mockDoc.createElement('div');
    cell2.setAttribute(postAtt, '1');
    expect(obscurer.isPostAlreadyObscured(cell2)).toBe(true);
  });
});
