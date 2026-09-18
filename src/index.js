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

  // TM doesn't like spaces in version number, so convert to human-readable format
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
  function cloneKeywords() {
    KeyWords = getTranslation(VARS.language);
  }

  // Post obscurer
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

  function buildDictionaries() {
    VARS.dictionarySponsored = buildSponsoredDictionary();
    VARS.dictionaryReelsAndShortVideos = buildReelsDictionary();
  }

  function addCSS() {
    injectCSS(VARS);
  }

  function addExtraCSS() {
    injectExtraCSS(VARS, masterKeyWords);
  }

  async function getUserOptions() {
    return loadUserOptionsCore({
      VARS,
      DBVARS,
      masterKeyWords,
      cloneKeywords,
      log
    });
  }

  // Run non-DOM dependent initialization
  setLanguageAndOptions();

  const doc = typeof document !== 'undefined' ? document : null;
  const win = typeof window !== 'undefined' ? window : null;

  // Dialog toggle handler
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

  // Feed cleaners assembly
  const dirtyChecker = {
    isTheHouseDirty: () => isTheHouseDirty(VARS, doc),
    gf_isTheHouseDirty: () => gf_isTheHouseDirty(VARS, doc),
    vf_isTheHouseDirty: () => vf_isTheHouseDirty(VARS, doc),
    mp_isTheHouseDirty: () => mp_isTheHouseDirty(VARS, doc),
    sf_isTheHouseDirty: () => sf_isTheHouseDirty(VARS, doc),
    pp_isTheHouseDirty: () => pp_isTheHouseDirty(VARS, doc)
  };

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

  // Route updater
  function setFeedSettings(forceUpdate = false) {
    return updateFeedSettings({
      VARS,
      windowObj: win,
      doc,
      forceUpdate,
      onMarketplaceEnter: mp_stopTrackingDirtIntoMyHouse
    });
  }

  function registerRedirToMostRecent() {
    checkRedirToMostRecent({ VARS, windowObj: win });
  }

  let firstRun = true;
  let scheduler = null;

  function startUp() {
    if (document.head && document.body && VARS.optionsReady) {
      if (firstRun) {
        GM.registerMenuCommand(KeyWords.GM_MENU_SETTINGS, toggleDialog);
        addCSS();
        window.setTimeout(addExtraCSS, 150);

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

        // Chromium spacing adjustment for Reels controls
        VARS.isChromium = !!unsafeWindow.chrome && /Chrome|CriOS/.test(navigator.userAgent);
        buildDictionaries();

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

      registerRedirToMostRecent();
    } else {
      setTimeout(startUp, 10);
    }
  }

  startUp();
})();
