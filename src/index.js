/**
 * FB - Clean My Feeds (Main Entry Point)
 *
 * ## Bootstrap Sequence & Architecture
 * 1. **Execution Timing**: Runs at `@run-at document-start` to inject styles and intercept feed rendering
 *    before Facebook's client scripts finish loading.
 * 2. **State & Storage**:
 *    - Creates an IndexedDB store handle (`idb-keyval`) for persistence.
 *    - Initializes application state (`createInitialState`).
 * 3. **Non-DOM Early Initialization**:
 *    - Initiates options loading and language detection (`initLanguageAndOptions`).
 *    - Assembles the post obscuring pipeline (`createPostObscurer`).
 *    - Inverts control by composing feed cleaners and route-specific dirty checkers (`createFeedCleaners`).
 * 4. **DOM-Ready Ignition (`startUp`)**:
 *    - Polls until `document.head`, `document.body`, and `VARS.optionsReady` are all resolved.
 *    - Registers Tampermonkey / Violentmonkey userscript menu command (`GM.registerMenuCommand`).
 *    - Injects dynamic anti-fingerprinting stylesheets (`addCSS`, `addExtraCSS`).
 *    - Mounts the VanJS settings dialog and floating toggle trigger (`buildMoppingDialog`).
 *    - Detects Chromium browser engine to calibrate Reels control layout offsets.
 *    - Pre-compiles multi-lingual sponsored and reels keywords into search trees (`buildDictionaries`).
 *    - Launches the adaptive scheduler loop (`createScheduler(...).start()`).
 *    - Enforces chronological feed redirection if configured (`registerRedirToMostRecent`).
 *
 * @module index
 */

import { createStore } from 'idb-keyval';
import {
  masterKeyWords,
  getTranslation,
  getSupportedLanguages,
  buildSponsoredDictionary,
  buildReelsDictionary
} from './i18n/index.js';
import {
  postAtt,
  postAttCPID,
  postAttChildFlag,
  postAttTab,
  mainColumnAtt,
  DB_CONFIG
} from './constants/index.js';
import { createInitialState } from './state/index.js';
import { buildMoppingDialog } from './modules/dialog/index.js';
import { createPostObscurer } from './modules/post-obscurer/index.js';
import {
  getUserOptions as loadUserOptionsCore,
  initLanguageAndOptions
} from './modules/user/index.js';
import {
  addCSS as injectCSS,
  addExtraCSS as injectExtraCSS
} from './modules/style-injector/index.js';
import {
  setFeedSettings as updateFeedSettings,
  registerRedirToMostRecent as checkRedirToMostRecent
} from './modules/feed-router/index.js';
import {
  isTheHouseDirty,
  gf_isTheHouseDirty,
  mp_isTheHouseDirty,
  sf_isTheHouseDirty,
  vf_isTheHouseDirty,
  pp_isTheHouseDirty
} from './modules/dirty-checker/index.js';
import { createFeedCleaners } from './modules/feed-cleaners/index.js';
import { createScheduler } from './modules/lifecycle/index.js';

(async function () {
  'use strict';

  // Format version string for userscript managers (replacing hyphens with spaces)
  const SCRIPT_VERSION = `v${GM.info.script.version.replaceAll('-', ' ')}`;
  const log = '-- fbcmf :: ';

  // IndexedDB persistence configuration
  const DBVARS = {
    DBName: DB_CONFIG.DB_NAME,
    DBStore: DB_CONFIG.DB_STORE,
    DBKey: DB_CONFIG.DB_KEY,
    ostore: createStore(DB_CONFIG.DB_NAME, DB_CONFIG.DB_STORE)
  };

  // State initialization
  const VARS = createInitialState();
  let KeyWords = {};

  /**
   * Refreshes the active translation dictionary when language preference updates.
   */
  function cloneKeywords() {
    KeyWords = getTranslation(VARS.language);
  }

  // Post obscurer service
  const postObscurer = createPostObscurer(VARS, () => KeyWords);
  const { toggleHiddenElements } = postObscurer;

  // Language & Options initialization
  function setLanguageAndOptions() {
    initLanguageAndOptions({
      VARS,
      DBVARS,
      masterKeyWords,
      cloneKeywords,
      log
    });
  }

  /**
   * Pre-compiles global cross-lingual sponsored and reels dictionaries.
   */
  function buildDictionaries() {
    VARS.dictionarySponsored = buildSponsoredDictionary();
    VARS.dictionaryReelsAndShortVideos = buildReelsDictionary();
  }

  /**
   * Injects dynamic CSS rules with randomized attribute tokens.
   */
  function addCSS() {
    injectCSS(VARS);
  }

  /**
   * Injects positioning rules for floating toggle button and options dialog.
   */
  function addExtraCSS() {
    injectExtraCSS(VARS, masterKeyWords);
  }

  /**
   * Loads options from IndexedDB, applying schema defaults and compiling filters.
   */
  async function getUserOptions() {
    return loadUserOptionsCore({
      VARS,
      DBVARS,
      masterKeyWords,
      cloneKeywords,
      log
    });
  }

  // Run early non-DOM dependent initialization
  setLanguageAndOptions();

  const doc = typeof document !== 'undefined' ? document : null;
  const win = typeof window !== 'undefined' ? window : null;

  /**
   * Toggles visibility of the settings configuration modal dialog.
   */
  function toggleDialog() {
    if (!doc) return;
    const elDialog = doc.getElementById('fbcmf');
    if (!elDialog) return;
    if (elDialog.hasAttribute(VARS.showAtt)) {
      elDialog.removeAttribute(VARS.showAtt);
    } else {
      elDialog.setAttribute(VARS.showAtt, '');
    }
  }

  // Bind dirty checker functions to active state and DOM document
  const dirtyChecker = {
    isTheHouseDirty: () => isTheHouseDirty(VARS, doc),
    gf_isTheHouseDirty: () => gf_isTheHouseDirty(VARS, doc),
    vf_isTheHouseDirty: () => vf_isTheHouseDirty(VARS, doc),
    mp_isTheHouseDirty: () => mp_isTheHouseDirty(VARS, doc),
    sf_isTheHouseDirty: () => sf_isTheHouseDirty(VARS, doc),
    pp_isTheHouseDirty: () => pp_isTheHouseDirty(VARS, doc)
  };

  // Instantiate feed cleaners via IoC factory
  const cleaners = createFeedCleaners({
    VARS,
    getKeyWords: () => KeyWords,
    masterKeyWords,
    postObscurer,
    dirtyChecker,
    log,
    doc,
    windowObj: win
  });

  const {
    mopUpTheNewsFeed,
    mopUpTheGroupsFeed,
    mopUpTheWatchVideosFeed,
    mopUpTheMarketplaceFeed,
    mopUpTheSearchFeed,
    mopUpTheReelFeed,
    mopUpTheProfilePage,
    mp_stopTrackingDirtIntoMyHouse
  } = cleaners;

  /**
   * Classifies current location and updates feed context flags on VARS.
   */
  function setFeedSettings(forceUpdate = false) {
    return updateFeedSettings({
      VARS,
      windowObj: win,
      doc,
      forceUpdate,
      onMarketplaceEnter: mp_stopTrackingDirtIntoMyHouse
    });
  }

  /**
   * Evaluates chronological feed redirection (`/?sk=h_chr`).
   */
  function registerRedirToMostRecent() {
    checkRedirToMostRecent({ VARS, windowObj: win });
  }

  let firstRun = true;
  let scheduler = null;

  /**
   * Startup ignition loop: awaits DOM and options readiness before mounting UI and scheduler.
   */
  function startUp() {
    if (document.head && document.body && VARS.optionsReady) {
      if (firstRun) {
        // Register userscript menu command in extension popup
        GM.registerMenuCommand(KeyWords.GM_MENU_SETTINGS, toggleDialog);

        // Inject randomized CSS stylesheets
        addCSS();

        // Build and mount settings UI dialog
        buildMoppingDialog({
          VARS,
          KeyWords,
          masterKeyWords,
          DBVARS,
          SCRIPT_VERSION,
          postAtt,
          postAttTab,
          postAttCPID,
          postAttChildFlag,
          mainColumnAtt,
          log,
          cloneKeywords,
          getSupportedLanguages,
          setLanguageAndOptions,
          getUserOptions,
          addCSS,
          addExtraCSS,
          setFeedSettings,
          toggleHiddenElements,
          toggleDialog,
          mopUpTheNewsFeed,
          mopUpTheGroupsFeed,
          mopUpTheWatchVideosFeed,
          mopUpTheMarketplaceFeed,
          mopUpTheSearchFeed,
          mopUpTheReelFeed
        });

        // Set positioning attributes and extra CSS synchronously
        addExtraCSS();

        // Chromium spacing adjustment for Reels controls
        VARS.isChromium = !!unsafeWindow.chrome && /Chrome|CriOS/.test(navigator.userAgent);
        buildDictionaries();

        // Instantiate and start adaptive lifecycle scheduler
        scheduler = createScheduler({
          VARS,
          setFeedSettings,
          cleaners: {
            mopUpTheNewsFeed,
            mopUpTheGroupsFeed,
            mopUpTheWatchVideosFeed,
            mopUpTheMarketplaceFeed,
            mopUpTheSearchFeed,
            mopUpTheReelFeed,
            mopUpTheProfilePage
          },
          windowObj: window
        });
        scheduler.start();
        firstRun = false;
      }

      // Check if user should be redirected to chronological feed
      registerRedirToMostRecent();
    } else {
      // Retry in 10ms until head, body, and storage options are ready
      setTimeout(startUp, 10);
    }
  }

  startUp();
})();
