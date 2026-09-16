/**
 * Application state schema and factory for FB - Clean My Feeds.
 *
 * @module state/app-state
 */

import {
  SCAN_CONFIG,
  FILTER_SEPARATOR,
} from '@/constants/index.js';

/**
 * Creates a fresh, fully initialized application state container.
 * Enforces static object topology (V8 hidden class stabilization)
 * with zero dead properties and explicit runtime keys.
 *
 * @returns {Object} Canonical VARS state container.
 */
export function createInitialState() {
  return {
    // ------------------------------------------------------------------------
    // Scanner & Performance State
    // ------------------------------------------------------------------------
    /** Starting scan count loop value for a post */
    scanCountStart: SCAN_CONFIG.SCAN_COUNT_START,
    /** Maximum consecutive loops to inspect a post */
    scanCountMaxLoop: SCAN_CONFIG.SCAN_COUNT_MAX_LOOP,
    /** Number of consecutive loops that reported no change in HTML structure */
    noChangeCounter: 0,

    // ------------------------------------------------------------------------
    // User Preferences, Filtering & Dictionaries
    // ------------------------------------------------------------------------
    /** Detected or user-selected Facebook language code */
    language: '',
    /** Active user settings dictionary loaded from IndexedDB */
    Options: {},
    /** Flag indicating whether Options have been fully loaded */
    optionsReady: false,
    /** Blocked keywords and regex rules */
    Filters: {},
    /** Token separator string for delimited keyword filters */
    SEP: FILTER_SEPARATOR,
    /** Flag indicating whether info / banner boxes should be hidden in current feed */
    hideAnInfoBox: false,
    /** Dictionary mapping keywords to sponsored categories */
    dictionarySponsored: {},
    /** Dictionary mapping keywords to reels & short videos */
    dictionaryReelsAndShortVideos: {},

    // ------------------------------------------------------------------------
    // Feed Navigation Context Flags
    // ------------------------------------------------------------------------
    /** News feed active */
    isNF: false,
    /** Groups feed active */
    isGF: false,
    /** Videos / Watch feed active */
    isVF: false,
    /** Marketplace feed active */
    isMF: false,
    /** Aggregate flag: any supported Facebook feed active */
    isAF: false,
    /** Search feed active */
    isSF: false,
    /** Reels feed active */
    isRF: false,
    /** Profile page active */
    isPP: false,
    /** Reel video processing via timeouts instead of mutations */
    isRF_InTimeoutMode: false,

    // Sub-feed classification types
    /** Groups feed sub-type: 'group' | 'groups' | 'groups-recent' | 'search' */
    gfType: '',
    /** Videos feed sub-type: 'videos' | 'search' | 'item' */
    vfType: '',
    /** Marketplace feed sub-type: 'marketplace' | 'category' | 'item' | 'search' */
    mpType: '',

    // Navigation and URL tracking
    /** Previously inspected page URL */
    prevURL: '',
    /** Previously inspected URL pathname */
    prevPathname: '',
    /** Previously inspected URL query string */
    prevQuery: '',

    // ------------------------------------------------------------------------
    // Echo / Consecutive Hidden Post Grouping
    // ------------------------------------------------------------------------
    /** DOM element containing echo summary message */
    echoEl: null,
    /** Number of consecutive posts currently hidden */
    echoCount: 0,
    /** Unique group ID for consecutive hidden posts */
    echoCPID: '',

    // ------------------------------------------------------------------------
    // Environment & Theme
    // ------------------------------------------------------------------------
    /** Dark mode state: true | false | null (unresolved) */
    isDarkMode: null,
    /** Browser detection flag for Chromium video controls accommodation */
    isChromium: false,

    // ------------------------------------------------------------------------
    // Dynamic Obfuscated CSS & Attribute Names
    // ------------------------------------------------------------------------
    /** Session-unique <style> element ID */
    cssID: '',
    /** Session-unique attribute name for hidden post elements */
    hideAtt: '',
    /** Session-unique attribute name for childless hidden items */
    hideWithNoCaptionAtt: '',
    /** Session-unique attribute name for revealing hidden elements */
    showAtt: '',
    /** Session-unique CSS class name for childless elements */
    cssHideEl: '',
    /** Session-unique CSS class name for hiding share counters */
    cssHideNumberOfShares: '',

    // ------------------------------------------------------------------------
    // UI Elements
    // ------------------------------------------------------------------------
    /** Floating settings toggle button DOM element */
    btnToggleEl: null,
  };
}

/**
 * Resets all feed context boolean flags to false.
 * Used during navigation transitions in setFeedSettings().
 *
 * @param {Object} state - The application state container.
 * @returns {Object} The mutated state container.
 */
export function resetFeedFlags(state) {
  if (!state) return state;
  state.isNF = false;
  state.isGF = false;
  state.isVF = false;
  state.isMF = false;
  state.isSF = false;
  state.isRF = false;
  state.isPP = false;
  state.isAF = false;
  return state;
}

/**
 * Resets the echo counter and group ID for consecutive hidden posts.
 *
 * @param {Object} state - The application state container.
 * @returns {Object} The mutated state container.
 */
export function resetEchoState(state) {
  if (!state) return state;
  state.echoCount = 0;
  state.echoCPID = '';
  return state;
}
