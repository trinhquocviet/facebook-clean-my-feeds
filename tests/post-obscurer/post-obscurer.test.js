import { describe, test, expect, beforeEach } from 'bun:test';
import {
  createPostObscurer,
  buildDetailsCaption,
  buildMiniCaption,
  isPostAlreadyObscured,
  toggleHiddenElements,
} from '@/modules/post-obscurer/index.js';
import { postAtt, postAttCPID, postAttTab } from '@/constants/index.js';
import { createInitialState } from '@/state/index.js';

describe('modules/post-obscurer', () => {
  let VARS;
  let KeyWords;
  let postObscurer;
  let mockDoc;

  function createMockElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      attributes: {},
      children: [],
      childNodes: [],
      classList: {
        _classes: new Set(),
        get length() { return this._classes.size; },
        add(...args) { args.forEach(c => this._classes.add(c)); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        [Symbol.iterator]() { return this._classes.values(); }
      },
      parentNode: null,
      firstElementChild: null,
      lastChild: null,
      textContent: '',
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
        }
        child.parentNode = this;
        this.children.push(child);
        this.childNodes.push(child);
        this.firstElementChild = this.children[0] || null;
        this.lastChild = child;
        return child;
      },
      insertBefore(newNode, refNode) {
        if (newNode.parentNode && newNode.parentNode.children) {
          const idx = newNode.parentNode.children.indexOf(newNode);
          if (idx !== -1) newNode.parentNode.children.splice(idx, 1);
        }
        newNode.parentNode = this;
        const index = refNode ? this.children.indexOf(refNode) : -1;
        if (index === -1) {
          this.children.push(newNode);
          this.childNodes.push(newNode);
        } else {
          this.children.splice(index, 0, newNode);
          this.childNodes.splice(index, 0, newNode);
        }
        this.firstElementChild = this.children[0] || null;
        return newNode;
      },
      closest(selector) {
        let curr = this;
        while (curr) {
          if (matches(curr, selector)) return curr;
          curr = curr.parentNode;
        }
        return null;
      },
      querySelector(selector) {
        return querySelectorInternal(this, selector);
      },
      querySelectorAll(selector) {
        const results = [];
        querySelectorAllInternal(this, selector, results);
        return results;
      },
      addEventListener(event, handler) {
        this._listeners = this._listeners || {};
        this._listeners[event] = handler;
      }
    };
    return el;
  }

  function matches(el, selector) {
    if (!el || !el.tagName) return false;
    if (selector === 'details') return el.tagName === 'DETAILS';
    if (selector === 'div') return el.tagName === 'DIV';
    if (selector === 'summary') return el.tagName === 'SUMMARY';
    if (selector.startsWith(`details[${postAtt}]`)) {
      return el.tagName === 'DETAILS' && el.hasAttribute(postAtt);
    }
    if (selector.startsWith(`div[${postAttCPID}`)) {
      const match = selector.match(/="([^"]+)"/);
      return el.tagName === 'DIV' && match && el.getAttribute(postAttCPID) === match[1];
    }
    if (selector.startsWith(`[${postAtt}]`)) {
      return el.hasAttribute(postAtt);
    }
    if (selector.includes(',')) {
      const parts = selector.split(',').map(s => s.trim());
      return parts.some(p => matches(el, p));
    }
    if (selector.startsWith('[') && selector.endsWith(']')) {
      const attrName = selector.slice(1, -1);
      return el.hasAttribute(attrName);
    }
    return false;
  }

  function querySelectorInternal(node, selector) {
    for (const child of node.children) {
      if (matches(child, selector)) return child;
      const found = querySelectorInternal(child, selector);
      if (found) return found;
    }
    return null;
  }

  function querySelectorAllInternal(node, selector, results) {
    for (const child of node.children) {
      if (matches(child, selector)) results.push(child);
      querySelectorAllInternal(child, selector, results);
    }
  }

  beforeEach(() => {
    VARS = createInitialState();
    VARS.hideAtt = 'cmf-hide-123';
    VARS.showAtt = 'cmf-show-123';
    VARS.cssHideEl = 'cmf-css-hide';
    VARS.cssHideNumberOfShares = 'cmf-shares-hide';
    VARS.Options.VERBOSITY_LEVEL = '1';
    VARS.Options.VERBOSITY_DEBUG = false;

    KeyWords = {
      VERBOSITY_MESSAGE: ['Hide', 'Hidden - ', 'Show', 'Consecutives']
    };

    mockDoc = {
      createElement: (tag) => createMockElement(tag),
      createTextNode: (text) => ({ textContent: text }),
      querySelectorAll: (selector) => {
        const results = [];
        if (mockDoc.body) querySelectorAllInternal(mockDoc.body, selector, results);
        return results;
      },
      body: createMockElement('body')
    };

    globalThis.document = mockDoc;
    postObscurer = createPostObscurer(VARS, () => KeyWords);
  });

  describe('caption-builder submodule', () => {
    test('buildDetailsCaption creates details/summary element, moves post inside, and attaches reason', () => {
      const parent = mockDoc.createElement('div');
      const post = mockDoc.createElement('div');
      post.classList.add('user-post-class');
      parent.appendChild(post);

      const ctx = { VARS, getKeyWords: () => KeyWords };
      buildDetailsCaption(post, 'SPONSORED', 'marker-test', ctx);

      const details = parent.children.find(c => c.tagName === 'DETAILS');
      expect(details).toBeDefined();
      expect(details.getAttribute(postAtt)).toBe('marker-test');
      expect(details.classList.contains('user-post-class')).toBe(true);

      const summary = details.children.find(c => c.tagName === 'SUMMARY');
      expect(summary).toBeDefined();
      expect(summary.childNodes[0].textContent).toBe('Hidden - SPONSORED');
      expect(details.children.includes(post)).toBe(true);
    });

    test('buildDetailsCaption handles debug mode', () => {
      VARS.Options.VERBOSITY_DEBUG = true;
      const parent = mockDoc.createElement('div');
      const post = mockDoc.createElement('div');
      parent.appendChild(post);

      const ctx = { VARS, getKeyWords: () => KeyWords };
      buildDetailsCaption(post, 'DEBUG_REASON', '', ctx);

      const details = parent.children.find(c => c.tagName === 'DETAILS');
      expect(details.getAttribute('open')).toBe('');
      expect(post.getAttribute(VARS.showAtt)).toBe('');
    });

    test('buildMiniCaption inserts h6 element with reason and postAttTab', () => {
      const post = mockDoc.createElement('div');
      const inner = mockDoc.createElement('span');
      post.appendChild(inner);

      buildMiniCaption(post, 'Suggested', { VARS });

      expect(post.getAttribute(VARS.hideAtt)).toBe('');
      expect(post.firstElementChild.tagName).toBe('H6');
      expect(post.firstElementChild.getAttribute(postAttTab)).toBe('0');
      expect(post.firstElementChild.textContent).toBe('Suggested');
    });

    test('isPostAlreadyObscured detects direct attribute, parent details, and child details', () => {
      const post1 = mockDoc.createElement('div');
      post1.setAttribute(postAtt, '1');
      expect(isPostAlreadyObscured(post1)).toBe(true);

      const details = mockDoc.createElement('details');
      details.setAttribute(postAtt, 'marker');
      const post2 = mockDoc.createElement('div');
      details.appendChild(post2);
      expect(isPostAlreadyObscured(post2)).toBe(true);

      const post3 = mockDoc.createElement('div');
      expect(isPostAlreadyObscured(post3)).toBe(false);
      expect(isPostAlreadyObscured(null)).toBe(false);
    });
  });

  describe('visibility-toggle submodule', () => {
    test('toggleHiddenElements performs single-pass batch show/hide', () => {
      const el1 = mockDoc.createElement('div');
      el1.setAttribute(VARS.hideAtt, '');
      mockDoc.body.appendChild(el1);

      const el2 = mockDoc.createElement('div');
      el2.setAttribute(VARS.cssHideEl, '');
      mockDoc.body.appendChild(el2);

      // In normal mode: removes showAtt
      toggleHiddenElements({ VARS });
      expect(el1.getAttribute(VARS.showAtt)).toBe(null);

      // In debug mode: sets showAtt
      VARS.Options.VERBOSITY_DEBUG = true;
      toggleHiddenElements({ VARS });
      expect(el1.getAttribute(VARS.showAtt)).toBe('');
      expect(el2.getAttribute(VARS.showAtt)).toBe('');
    });
  });

  describe('hideFeature', () => {
    test('adds caption when VERBOSITY_LEVEL is not 0', () => {
      VARS.Options.VERBOSITY_LEVEL = '1';
      const parent = mockDoc.createElement('div');
      const feature = mockDoc.createElement('div');
      parent.appendChild(feature);

      postObscurer.hideFeature(feature, 'Stories', 'custom-marker');

      expect(feature.getAttribute(postAtt)).toBe('Stories');
      expect(parent.children[0].tagName).toBe('DETAILS');
    });

    test('sets hide attribute directly when VERBOSITY_LEVEL is 0', () => {
      VARS.Options.VERBOSITY_LEVEL = '0';
      const feature = mockDoc.createElement('div');

      postObscurer.hideFeature(feature, 'Stories');

      expect(feature.getAttribute(postAtt)).toBe('Stories');
      expect(feature.getAttribute(VARS.hideAtt)).toBe('');
    });
  });

  describe('hideSingleElement (shared core)', () => {
    test('wraps post in details when verbosity is active', () => {
      VARS.Options.VERBOSITY_LEVEL = '1';
      const parent = mockDoc.createElement('div');
      const post = mockDoc.createElement('div');
      parent.appendChild(post);

      postObscurer.hideSingleElement(post, 'Block Reason', 'custom-tag', true);

      expect(post.getAttribute(postAtt)).toBe('Block Reason');
      expect(parent.children[0].tagName).toBe('DETAILS');
      expect(parent.children[0].getAttribute(postAtt)).toBe('custom-tag');
    });

    test('respects revealInDebug flag when verbosity is 0', () => {
      VARS.Options.VERBOSITY_LEVEL = '0';
      VARS.Options.VERBOSITY_DEBUG = true;

      // With revealInDebug = true
      const post1 = mockDoc.createElement('div');
      postObscurer.hideSingleElement(post1, 'Reason 1', '', true);
      expect(post1.getAttribute(VARS.hideAtt)).toBe('');
      expect(post1.getAttribute(VARS.showAtt)).toBe('');

      // With revealInDebug = false (e.g. hideFeature)
      const post2 = mockDoc.createElement('div');
      postObscurer.hideSingleElement(post2, 'Reason 2', '', false);
      expect(post2.getAttribute(VARS.hideAtt)).toBe('');
      expect(post2.getAttribute(VARS.showAtt)).toBe(null);
    });
  });

  describe('vf_hidePost and nf_hidePost', () => {
    test('vf_hidePost sets postAtt and wraps in details with empty default marker', () => {
      const parent = mockDoc.createElement('div');
      const post = mockDoc.createElement('div');
      parent.appendChild(post);

      postObscurer.vf_hidePost(post, 'Video Ad');

      expect(post.getAttribute(postAtt)).toBe('Video Ad');
      expect(parent.children[0].tagName).toBe('DETAILS');
      expect(parent.children[0].getAttribute(postAtt)).toBe('');
    });

    test('nf_hidePost sets postAtt and wraps in details with ~ default marker', () => {
      const parent = mockDoc.createElement('div');
      const post = mockDoc.createElement('div');
      parent.appendChild(post);

      postObscurer.nf_hidePost(post, 'Sponsored');

      expect(post.getAttribute(postAtt)).toBe('Sponsored');
      expect(parent.children[0].tagName).toBe('DETAILS');
      expect(parent.children[0].getAttribute(postAtt)).toBe('~');
    });
  });

  describe('hideBlock', () => {
    test('sets cssHideEl on block and postAtt on link', () => {
      const block = mockDoc.createElement('div');
      const link = mockDoc.createElement('a');

      postObscurer.hideBlock(block, link, 'Marketplace Ad');

      expect(block.getAttribute(VARS.cssHideEl)).toBe('');
      expect(link.getAttribute(postAtt)).toBe('Marketplace Ad');
    });
  });

  describe('gf_hidePost and consecutive grouping', () => {
    test('handles single post hide in level 1', () => {
      VARS.Options.VERBOSITY_LEVEL = '1';
      const container = mockDoc.createElement('div');
      const innerPost = mockDoc.createElement('div');
      container.appendChild(innerPost);

      postObscurer.gf_hidePost(container, 'Group Post');

      expect(container.getAttribute(postAtt)).toBe('Group Post');
      expect(container.children[0].tagName).toBe('DETAILS');
    });

    test('handles consecutive post grouping in level 2', () => {
      VARS.Options.VERBOSITY_LEVEL = '2';

      // First post
      VARS.echoCount = 1;
      const container1 = mockDoc.createElement('div');
      const inner1 = mockDoc.createElement('div');
      container1.appendChild(inner1);
      postObscurer.gf_hidePost(container1, 'Post 1');

      expect(VARS.echoCPID.length).toBeGreaterThan(0);
      expect(VARS.echoEl).toBe(inner1);
      expect(inner1.getAttribute(postAttCPID)).toBe(VARS.echoCPID);

      // Second post in consecutive group
      VARS.echoCount = 2;
      const container2 = mockDoc.createElement('div');
      const inner2 = mockDoc.createElement('div');
      container2.appendChild(inner2);
      postObscurer.gf_hidePost(container2, 'Post 2');

      expect(inner2.getAttribute(postAttCPID)).toBe(VARS.echoCPID);
      const details = container1.children[0];
      expect(details.tagName).toBe('DETAILS');
      const summary = details.children.find(c => c.tagName === 'SUMMARY');
      expect(summary.childNodes[0].textContent).toBe('2Hidden - ');
    });
  });
});
