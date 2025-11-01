import { get, set, del, createStore } from 'idb-keyval';
import masterKeyWords from 'modules/masterKeywords';
import type { Language } from 'modules/masterKeywords/types';
import { generateRandomString, cleanText } from 'utils/string';
import { findFirstMatch, findFirstMatchRegExp } from 'utils/post';
import { isDarkMode } from 'utils/darkmode';
import { buildSS } from 'utils/stylesheet';
import { log } from 'utils/debug';
import { CMFToggleBtn, cmfToggleBtnTag } from 'components/cmfToggleBtn';
import { CMFConfigModal, cmfConfigModalTag } from 'components/cmfConfigModal';
import images from 'constants/images';
import { type FeedSettings } from 'modules/feedSettings';
import { nf_getCollectionOfPosts } from 'utils/nf';
import { cmfSessionManager } from './modules/windowStorage';

(async function () {
  'use strict';
  
  // -- TM doesn't like spacesin version number, so convert to human-readable-format.
  const SCRIPT_VERSION = 'v' + GM.info.script.version.replaceAll('-', ' ');

  // - override idb-keyval's default db and store names.
  let DBVARS = {
    DBName: 'dbCMF',
    DBStore: 'Mopping',
    DBKey: 'Options',
    ostore: null
  };

  // - make sure the db's store exists ...
  DBVARS.ostore = createStore(DBVARS.DBName, DBVARS.DBStore);

  // - post attribute - hidden and reason
  const postAtt = 'cmfr';
  // - post attribute - consecutive posts id
  const postAttCPID = 'cmfcpid';
  // - post property - # of light dusting duties done
  const postPropDS = 'cmfDusted';
  // - post's child element attribute - used for queries that original don't include the parent element.
  const postAttChildFlag = 'cmfcf';
  // - post's toggle state bar + post tab.
  const postAttTab = 'cmftsb';
  // - marketplace post - indicate already scanned
  const postAttMPSkip = 'cmfsmp';
  // - reel video attribute
  const rvAtt = 'cmfrv';
  // - ...
  const mainColumnAtt = 'cmfmc';

  // ! cmfCongfigModalHerere
  let cmfCongfigModal = document.createElement(cmfConfigModalTag) as CMFConfigModal;
  document.body.appendChild(cmfCongfigModal);

  // - Feed Details variables
  // -- nb: setFeedSettings() adjusts some of these settings.
  const VARS: FeedSettings = cmfSessionManager.getFeedSettings();

  let KeyWords: Language = masterKeyWords.translations['en'];
  function cloneKeywords() {
    const { language } = cmfSessionManager.getFeedSettings();
    if (language) {
      KeyWords = { ...masterKeyWords.translations[language] };
    }
  }

  // -- which language is the FB page in?
  function setLanguageAndOptions() {
    // - run this function when HEAD is available.
    // - also run getUserOptions().
    if (document.head) {
      // ...
      let result = getUserOptions().then(() => {
        // -- getUserOptions() will set the language.
        return true;
      });
    }
    else {
      setTimeout(setLanguageAndOptions, 5);
    }
  }

  function buildDictionaries() {
    // -- Sponsored
    VARS.dictionarySponsored = Object.values(masterKeyWords.translations).map(translation => translation.SPONSORED);
    VARS.dictionarySponsored = Object.values(masterKeyWords.translations).flatMap(translation => [
      // -- the ?.toLowerCase() - optional chaining - used when there's a value.
      translation.SPONSORED?.toLowerCase(),
      translation.SPONSORED_EXTRA?.toLowerCase()
    ]).filter(Boolean);

    // -- Reels and Short Videos
    VARS.dictionaryReelsAndShortVideos = Object.values(masterKeyWords.translations).map(translation => translation.NF_REELS_SHORT_VIDEOS);
  }

  // -- stylesheet builder
  VARS.tempStyleSheetCode = ''; // holds the SS code while it is being built.
  const addToSS = (classes: string, styles: string) => VARS.tempStyleSheetCode += buildSS(classes, styles);

  // -- various CSS
  function addCSS() {
    // - CSS styles for hiding or highlighting the selected posts / element
    // - CSS styles for dialog panel
    let head, elStylesheet;
    let isNewCSS = true;

    if (VARS.cssID !== '') {
      // - Reset the existing Stylesheet
      elStylesheet = document.getElementById(VARS.cssID);
      if (elStylesheet) {
        elStylesheet.replaceChildren();
        isNewCSS = false;
      }
    }
    if (isNewCSS) {
      // - Create the new Stylesheet head + classnames
      VARS.cssID = generateRandomString().toUpperCase();
      elStylesheet = document.createElement('style');
      elStylesheet.setAttribute('type', 'text/css');
      elStylesheet.setAttribute('id', VARS.cssID);
      head = document.getElementsByTagName('head')[0];
      head.appendChild(elStylesheet);

      // - remember <element> attribute names (for other functions to use)
      VARS.hideAtt = generateRandomString(); // - the parent element - hides the nth level down element
      VARS.hideWithNoCaptionAtt = generateRandomString(); // - the element to hide - where there's no child element
      VARS.cssHideEl = generateRandomString(); // - the element to hide - where there's no child element
      VARS.cssHideNumberOfShares = generateRandomString(); // - hide "# shares" on posts.
      VARS.showAtt = generateRandomString(); // - for revealing hidden elements.
    }
    VARS.tempStyleSheetCode = ''; // reset temp CSS code.

    // -- override random class names - for testing purposes only.
    // VARS.hideAtt = 'cmfr-hide';
    // VARS.cssHideEl = 'cmfr-hide-element';
    // VARS.cssHideNumberOfShares = 'cmfr-hide-shares';


    // -- **** fix fb's bug in not "hiding" certain elements properly when scrolling
    addToSS('body > div[style*="position: absolute"], ' +
      'body > div[style*="position:absolute"]',
      'top: -1000000px !important;'
    );

    // -- hide the post
    // -- not using hidden post caption facility
    addToSS(
      `div[${VARS.hideAtt}]`,
      'max-height: 0; overflow: hidden; margin-bottom:0 !important;'
    );

    // -- reveal the post
    // -- first one, inside a <details> element (showAtt's attribute not required)
    // -- second one, not inside a <details> element
    // -- not using hidden post caption facility
    addToSS(
      `details[${postAtt}][open] > div, ` +
      `details[${postAtt}][open] > span > div, ` + // -- usually aside components
      `div[${VARS.showAtt}]:not([id="fbcmf"])`,
      'max-height: 10000px; overflow: auto; margin-bottom:1rem !important; ' +
      'border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; background-color: var(--card-background)'
    );

    // -- summary element - list-style removes the twistie symbol
    // -- using the +/- symbols to open/close
    addToSS(
      `details[${postAtt}] > summary`,
      'cursor: pointer; list-style: none; ' +
      'position: relative; ' +
      'margin: auto; padding: 0.75rem; ' +
      'border-radius: 0.5rem; font-style: italic; ' +
      'width: inherit; ' +
      'color: var(--primary-text); ' +
      ((VARS.Options.VERBOSITY_MESSAGE_COLOUR === '') ? '' : ` color: ${VARS.Options.VERBOSITY_MESSAGE_COLOUR}; `) +
      `background-color:${(VARS.Options.VERBOSITY_MESSAGE_BG_COLOUR === '') ? masterKeyWords.defaults.VERBOSITY_MESSAGE_BG_COLOUR : VARS.Options.VERBOSITY_MESSAGE_BG_COLOUR};`
    );
    addToSS(
      `details[${postAtt}="~"] > summary`,
      'margin: 0 1rem; '
    );
    addToSS(
      `details[${postAtt}] > summary:hover`,
      'text-decoration: underline;'
    );
    // -- formatting of +/-
    addToSS(
      `details[${postAtt}] > summary::after`,
      'color: var(--color); ' +
      'border-radius: 50%; font-style: normal; ' +
      'width: 24px; height: 24px; line-height: 20px;' +
      'font-size: 1rem; font-weight: bold; transform: translateY(-50%); text-align: center;' +
      'position: absolute; top: 50%; right: 0.25rem;'
    );
    addToSS(
      `details[${postAtt}] > summary::after`,
      'content:"\\002B";' // "+"
    );
    addToSS(
      `details[${postAtt}][open] > summary::after`,
      'content: "\\2212";' // "-"
    );
    addToSS(
      `details[${postAtt}] > summary:hover::after`,
      'background-color: var(--hover-overlay);'
    );

    // -- reveal a hidden post
    addToSS(
      `details[${postAtt}]`,
      'margin-bottom: 1rem; '
    );
    addToSS(
      `details[${postAtt}][open] > summary`,
      'border-bottom-left-radius: 0; border-bottom-right-radius: 0;'
    );

    // -- hide a component (e.g. marketplace item)
    addToSS(
      `div[${VARS.hideWithNoCaptionAtt}],` +
      `span[${VARS.hideWithNoCaptionAtt}]`,
      'display: none;'
    );
    // -- show a component (e.g. marketplace item)
    addToSS(
      `div[${VARS.hideWithNoCaptionAtt}][${VARS.showAtt}], ` +
      `span[${VARS.hideWithNoCaptionAtt}][${VARS.showAtt}]`,
      'display: block;'
    );

    // - mini-caption (for gf + vf consecutive mode)
    addToSS(
      `h6[${postAttTab}]`,
      'border-radius: 0.55rem 0.55rem 0 0; width:75%; margin:0 auto; padding: 0.45rem 0.25rem; font-style:italic; text-align:center; font-weight:normal;' +
      ((VARS.Options.VERBOSITY_MESSAGE_COLOUR === '') ? '' : `  color: ${VARS.Options.VERBOSITY_MESSAGE_COLOUR}; `) +
      `background-color:${(VARS.Options.VERBOSITY_MESSAGE_BG_COLOUR === '') ? masterKeyWords.defaults.VERBOSITY_MESSAGE_BG_COLOUR : VARS.Options.VERBOSITY_MESSAGE_BG_COLOUR}; `
    );


    // -- # shares
    addToSS(
      `[${VARS.cssHideNumberOfShares}]`,
      'display:none !important;'
    );

    // - dailog box CSS
    // --- dialog box; position + flex
    // let bColour = (VARS.Options.CMF_BORDER_COLOUR === '') ? masterKeyWords.defaults.CMF_BORDER_COLOUR : VARS.Options.CMF_BORDER_COLOUR;
    let bColour = 'var(--divider)';
    let tColour = 'var(--primary-text)';
    // - left / right done in fn addExtraCSS()
    addToSS(
      '.fb-cmf ',
      'position:fixed; top:0.15rem; bottom:0.15rem; display:flex; flex-direction:column; width: 100%; max-width:30rem; padding:0 1rem; z-index:5;' +
      'box-shadow: 0 12px 28px 0 var(--shadow-2), 0 2px 4px 0 var(--shadow-1), inset 0 0 0 1px var(--shadow-inset);' +
      `border-radius: 0.5rem; opacity:0; visibility:hidden; color:${tColour};`
      // `border:2px solid ${bColour}; border-radius: 0.5rem; opacity:0; visibility:hidden; color:${tColour};`
    );
    // - dialog's background color
    // if (VARS.isDarkMode) {
    //     addToSS('.fb-cmf', 'background-color:var(--web-wash);');
    // }
    // else {
    //     addToSS('.fb-cmf', 'background-color: var(--card-background);');
    // }
    addToSS('.fb-cmf', 'background-color: var(--card-background);');

    // addToSS('.__fb-light-mode .fb-cmf', 'background-color:#fefefa;');
    // addToSS('.__fb-dark-mode .fb-cmf', 'background-color:var(--web-wash);');
    // addToSS('.fb-cmf', 'background-color:floralwhite;'); // -- fall back colour.
    // addToSS('.fb-cmf', 'background-color:var(--web-wash);'); // -- fall back colour.

    addToSS(
      '.fb-cmf header',
      'display:flex; justify-content:space-between; direction:ltr;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-icon',
      'flex-grow:0; align-self:auto; width:75px; text-align:left; order:1;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-icon svg',
      'width:64px; height:64px; margin:2px 0;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-title',
      'flex-grow:2; align-self:auto; order:2;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-title .script-version',
      'font-size: 0.75rem; font-weight: normal;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-lang-1',
      'padding-top:1.25rem;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-lang-2',
      'padding-top:0.75rem;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-title > div',
      'font-size:1.35rem; font-weight: 700; text-align:center;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-title > small',
      'display:block; font-size:0.8rem; text-align:center;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-close',
      'flex-grow:0; align-self:auto; width:75px; text-align:right; padding: 1.5rem 0 0 0; order:3;'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-close button',
      'width: 2.25rem; height: 2.25rem; ' +
      'transition-property: color, fill, stroke; transition-timing-function: var(--fds-soft); transition-duration: var(--fds-fast);' +
      'cursor: pointer; background-color: transparent;' +
      'border-radius: 50%; border: none;' +
      'color: var(--secondary-icon);'
    );
    addToSS(
      '.fb-cmf header .fb-cmf-close button:hover',
      'background-color: var(--hover-overlay);'
    );

    // -- content
    addToSS(
      '.fb-cmf div.content',
      `flex:1; overflow: hidden auto; border:1px solid ${bColour}; border-radius:0.5rem; color: var(--primary-text);`
    );
    addToSS(
      '.fb-cmf fieldset',
      'margin:0.5rem; padding:0.5rem; border-style: solid;'
    );
    addToSS(
      '.fb-cmf fieldset *',
      // 'font-size: calc(var(--body-font-size) * 0.9);'
      //'font-size: var(--body-font-size);'
      'font-size: 0.8125rem;'
    )
    addToSS(
      '.fb-cmf fieldset legend',
      'font-size: 0.95rem;' +
      'width: 95%;  padding: 0 0.5rem 0.125rem 0.5rem;' +
      'line-height: 2.5; ' +
      'border-width: 2px; border-style: solid; border-radius: 0.5rem 0.5rem 0 0 ;'
    );
    addToSS(
      '.fb-cmf fieldset legend:hover,' +
      '.fb-cmf fieldset label:hover',
      //'background-color: LightGrey; cursor: pointer;'
      'background-color: var(--hover-overlay); cursor: pointer;'
    );
    addToSS(
      '.fb-cmf fieldset.visible,' +
      '.fb-cmf fieldset.visible legend ',
      `border-color: ${bColour};`
    );
    addToSS(
      '.fb-cmf fieldset.hidden,' +
      '.fb-cmf fieldset.hidden legend ',
      'border-color: LightGrey;'
    );
    addToSS(
      '.fb-cmf fieldset.hidden *:not(legend) ',
      'display: none;'
    );
    addToSS(
      '.fb-cmf fieldset.visible legend::after',
      'content: "\\2212"; float:right;' // "-"
    )
    addToSS(
      '.fb-cmf fieldset.hidden legend::after',
      'content: "\\002B"; float:right;' // "+"
    )
    addToSS(
      '.fb-cmf fieldset label',
      'display:inline-block; padding:0.125rem 0; color: var(--primary-text); font-weight: normal; width:100%;'
    );
    addToSS(
      '.fb-cmf fieldset label input',
      'margin: 0 0.5rem 0 0.5rem; vertical-align:baseline;' // left & right margins for RTL & LTR text
    );
    addToSS(
      '.fb-cmf fieldset label[disabled]',
      'color:darkgrey;'
    );
    addToSS(
      '.fb-cmf fieldset textarea',
      'width:100%; height:12rem;'
    );
    addToSS(
      '.fb-cmf fieldset select',
      'border: 2px inset lightgray;' +
      'margin: 0 0.5rem 0 0.5rem; vertical-align:baseline;' // left & right margins for RTL & LTR text
    )
    addToSS(
      '.__fb-dark-mode .fb-cmf fieldset textarea,' +
      '.__fb-dark-mode .fb-cmf fieldset input[type="input"]' +
      '.__fb-dark-mode .fb-cmf fieldset select',
      'background-color:var(--comment-background); color:var(--primary-text);'
    );
    // -- footer - buttons + results
    addToSS(
      '.fb-cmf footer',
      'display: grid; justify-content: space-evenly; padding:1rem 0.25rem; text-align:center;'
    );
    addToSS(
      '.fb-cmf .buttons button',
      // 'margin-left: 1rem; margin-right:1rem;'
      'margin-left: 0.25rem; margin-right: 0.25rem;'
    );
    // -- footer - file input
    addToSS(
      '.fb-cmf .fileInput',
      'display:none;'
    );
    // -- footer - import results
    addToSS(
      '.fb-cmf .fileResults',
      'grid-column-start: 1; grid-column-end: 6; font-style:italic; margin-top: 0.5rem;'
    );
    // -- show dialog box (default is not to show)
    addToSS(
      `.fb-cmf[${VARS.showAtt}]`,
      'opacity:1; transform:scale(1); visibility:visible;'
    );
    // -- new window icon
    addToSS(
      `.${VARS.iconNewWindowClass}`,
      'width: 1rem; height: 1rem;'
    );
    // 'width: 1rem; height: 1rem; margin-left: 0.2rem; margin-right: 0.2rem;'
    addToSS(
      `.${VARS.iconNewWindowClass} a`,
      'width: 1rem; position: relative; display: inline-block;'
    );
    addToSS(
      `.${VARS.iconNewWindowClass} svg`,
      'position: absolute; top: -13.5px; stroke: rgb(101, 103, 107);'
    );

    // - save & apply the CSS
    elStylesheet.appendChild(document.createTextNode(VARS.tempStyleSheetCode));
    VARS.tempStyleSheetCode = '';
  }

  function addExtraCSS() {
    // - extra CSS styles
    // - fb can sometimes be a bit slow in loading certain parts of the site ...
    // - ... this function is called several ms later ...
    // - ... and when saving the options (via save button)

    // -- button location
    let cmfBtnLocation = masterKeyWords.defaults.CMF_BTN_OPTION;
    // -- dialog location
    let cmfDlgLocation = masterKeyWords.defaults.CMF_DIALOG_OPTION;
    // -- read in the settings
    if (VARS.Options.hasOwnProperty('CMF_BTN_OPTION')) {
      if (VARS.Options.CMF_BTN_OPTION.toString() !== '') {
        cmfBtnLocation = VARS.Options.CMF_BTN_OPTION;
      }
    }
    if (VARS.Options.hasOwnProperty('CMF_DIALOG_OPTION')) {
      if (VARS.Options.CMF_DIALOG_OPTION.toString() !== '') {
        cmfDlgLocation = VARS.Options.CMF_DIALOG_OPTION;
      }
    }
    cmfBtnLocation = cmfBtnLocation.toString();
    cmfDlgLocation = cmfDlgLocation.toString();

    // Grab the existing Stylesheet and amend it
    let elStylesheet = document.getElementById(VARS.cssID);
    let styles;

    VARS.tempStyleSheetCode = ''; // reset
    styles = '';

    // - button's location.
    if (cmfBtnLocation === '1') {
      // - top right
      if (document.querySelector('[role="banner"]')) {
        // - oldish FB structure has menu buttons across the top (changed for some users in Apr/May 2022)
        addToSS(
          'div[role="banner"] > div:last-of-type div[role="navigation"]',
          'margin-right: 42px;'
        );
      }
      styles = 'position:fixed; top:0.5rem; right:0.5rem; display:none;';
    }
    else if (cmfBtnLocation === '2') {
      // - disabled, use "Settings" in the user script menu.
      // - no css
      styles = 'display: none !important;';
    }
    else {
      // - cmfBtnLocation === "0" : bottom left
      // - has the buttons running down the side of the page (May 2022 ->).
      // styles = 'position:fixed; bottom:4.25rem; left:1.1rem; display:none;';
      styles = 'position: fixed; bottom: 1rem; left: 1rem; display:none; z-index: 999;'; // position
      styles += 'background: var(--secondary-button-background-floating); padding: 0.5rem; width: 3rem; height: 3rem; border: 0; border-radius: 1.5rem;'; // styles
      styles += 'box-shadow: 0 2px 4px var(--shadow-1), 0 12px 28px var(--shadow-2);'; // drop shadow
    }
    if (styles.length > 0) {
      addToSS(
        '.fb-cmf-toggle',
        styles
      );
      // - btn - basic styling.
      // addToSS('.fb-cmf-toggle', 'border-radius:0.3rem;');
      addToSS('.fb-cmf-toggle svg', 'height: 95%; aspect-ratio : 1 / 1;');
      addToSS('.fb-cmf-toggle:hover', 'cursor:pointer;');
      // - dialog box's display
      addToSS(`.fb-cmf-toggle[${VARS.showAtt}]`, 'display:block;');
    }
    // - dialog box's left/right + animated open/close behaviour
    if (cmfDlgLocation === '1') {
      // - right
      styles = 'right:0.35rem; margin-left:1rem; transform:scale(0);transform-origin:top right;';
    }
    else {
      // - left (cmfDlgLocation === '0')
      styles = 'left:4.25rem; margin-right:1rem; transform:scale(0);transform-origin:center center;';
    }
    addToSS(
      '.fb-cmf',
      styles +
      'transition:transform .45s ease, opacity .25s ease, visibility 1s ease;'
    );

    addToSS(
      'div#fbcmf footer > button',
      'font-family: inherit; cursor: pointer;' +
      'height: var(--button-height-medium); padding: 0 var(--button-padding-horizontal-medium);' +
      'border: none; border-radius: var(--button-corner-radius);' +
      'background-color: var(--secondary-button-background);' +
      '-webkit-transition: background-color 0.2s linear; transition: background-color 0.2s linear;' +
      'font-size: .9375rem; font-weight: 600;' +
      'color: var(--secondary-button-text);'
    );
    addToSS(
      '#fbcmf footer > button:hover',
      'font-family: inherit;' +
      'background-color: var(--primary-button-background);' +
      'color: var(--primary-button-text);'
    );
    if (VARS.tempStyleSheetCode.length > 0) {
      elStylesheet.appendChild(document.createTextNode(VARS.tempStyleSheetCode));
      VARS.tempStyleSheetCode = '';
    }
  }

  // -- get the user's settings ...
  async function getUserOptions() {
    // -- read in the saved data, else set defaults.
    let changed = false;
    // - reset Options
    VARS.Options = new Object();
    VARS.optionsReady = false;

    // - has the user previously saved options?
    // -- if yes, the update Options
    let result = await get(DBVARS.DBKey, DBVARS.ostore).then((values) => {
      if (values) {
        // -- has data
        VARS.Options = JSON.parse(values);
        return 1;
      }
      else {
        // -- no data (first time)
        return 0;
      }
    }).catch((err) => {
      log.info(`getuserOptions() > get() - Error:`, err);
    });

    let language =  document.head.parentNode.lang || 'en';
    if (!VARS.Options.hasOwnProperty('CMF_DIALOG_LANGUAGE')) {
      cmfSessionManager.updateFeedSettings({ language });
    } else {
      const uiLang = VARS.Options.CMF_DIALOG_LANGUAGE || 'en';
      language = masterKeyWords.translations.hasOwnProperty(uiLang)
      ? uiLang
      : masterKeyWords.translations.hasOwnProperty(language)
        ? language
        : 'en';

      cmfSessionManager.updateFeedSettings({ language })
    }
    VARS.Options.CMF_DIALOG_LANGUAGE = language;

    cloneKeywords();


    // -- check that all variables exists ... if not, assign them default values..
    // -- Sponsored (always enabled)
    // Sponsored keys check
    [
      'NF_SPONSORED',
      'GF_SPONSORED',
      'VF_SPONSORED',
      'MP_SPONSORED',
    ].forEach(key => {
      const currentValue = VARS.Options[key];
      if (!VARS.Options.hasOwnProperty(key)) {
        VARS.Options[key] = masterKeyWords.defaults['SPONSORED'];
        changed = true;
      }
    });

    // -- which option has been enabled / disabled?
    VARS.hideAnInfoBox = false;
    log('KeyWords: ', KeyWords);
    for (const key in KeyWords) {
      log( 'getUserOptions() > key:', key);
      if (key.slice(0, 3) === 'NF_' && key.slice(0, 10) !== 'NF_BLOCKED') {
        if (!VARS.Options.hasOwnProperty(key)) {
          VARS.Options[key] = masterKeyWords.defaults[key];
          changed = true;
        }
      }
      else if (key.slice(0, 3) === 'GF_' && key.slice(0, 10) !== 'GF_BLOCKED') {
        if (!VARS.Options.hasOwnProperty(key)) {
          VARS.Options[key] = masterKeyWords.defaults[key];
          changed = true;
        }
      }
      else if (key.slice(0, 3) === 'VF_' && key.slice(0, 10) !== 'VF_BLOCKED') {
        if (!VARS.Options.hasOwnProperty(key)) {
          VARS.Options[key] = masterKeyWords.defaults[key];
          changed = true;
        }
      }
      else if (key.slice(0, 3) === 'MP_' && key.slice(0, 10) !== 'MP_BLOCKED') {
        if (!VARS.Options.hasOwnProperty(key)) {
          VARS.Options[key] = masterKeyWords.defaults[key];
          changed = true;
        }
      }
      else if (key.slice(0, 3) === 'PP_' && key.slice(0, 10) !== 'PP_BLOCKED') {
        if (!VARS.Options.hasOwnProperty(key)) {
          VARS.Options[key] = masterKeyWords.defaults[key];
          changed = true;
        }
      }
      else if (key.slice(0, 10) === 'OTHER_INFO') {
        if (!VARS.Options.hasOwnProperty(key)) {
          VARS.Options[key] = masterKeyWords.defaults[key];
          changed = true;
        }
        if (VARS.Options[key]) {
          VARS.hideAnInfoBox = true;
        }
      }
    }

    // -- all other options.
    if (!VARS.Options.hasOwnProperty('NF_BLOCKED_ENABLED')) {
      VARS.Options.NF_BLOCKED_ENABLED = masterKeyWords.defaults.NF_BLOCKED_ENABLED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('NF_BLOCKED_FEED')) {
      VARS.Options.NF_BLOCKED_FEED = masterKeyWords.defaults.NF_BLOCKED_FEED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('NF_BLOCKED_TEXT')) {
      VARS.Options.NF_BLOCKED_TEXT = '';
      changed = true;
    }

    if (!VARS.Options.hasOwnProperty('GF_BLOCKED_ENABLED')) {
      VARS.Options.GF_BLOCKED_ENABLED = masterKeyWords.defaults.GF_BLOCKED_ENABLED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('GF_BLOCKED_FEED')) {
      VARS.Options.GF_BLOCKED_FEED = masterKeyWords.defaults.GF_BLOCKED_FEED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('GF_BLOCKED_TEXT')) {
      VARS.Options.GF_BLOCKED_TEXT = '';
      changed = true;
    }

    if (!VARS.Options.hasOwnProperty('VF_BLOCKED_ENABLED')) {
      VARS.Options.VF_BLOCKED_ENABLED = masterKeyWords.defaults.VF_BLOCKED_ENABLED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('VF_BLOCKED_FEED')) {
      VARS.Options.VF_BLOCKED_FEED = masterKeyWords.defaults.VF_BLOCKED_FEED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('VF_BLOCKED_TEXT')) {
      VARS.Options.VF_BLOCKED_TEXT = '';
      changed = true;
    }

    if (!VARS.Options.hasOwnProperty('MP_BLOCKED_ENABLED')) {
      VARS.Options.MP_BLOCKED_ENABLED = masterKeyWords.defaults.MP_BLOCKED_ENABLED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('MP_BLOCKED_FEED')) {
      VARS.Options.MP_BLOCKED_FEED = masterKeyWords.defaults.MP_BLOCKED_FEED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('MP_BLOCKED_TEXT')) {
      VARS.Options.MP_BLOCKED_TEXT = '';
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('MP_BLOCKED_TEXT_DESCRIPTION')) {
      VARS.Options.MP_BLOCKED_TEXT_DESCRIPTION = '';
      changed = true;
    }

    if (!VARS.Options.hasOwnProperty('PP_BLOCKED_ENABLED')) {
      VARS.Options.PP_BLOCKED_ENABLED = masterKeyWords.defaults.PP_BLOCKED_ENABLED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('PP_BLOCKED_FEED')) {
      VARS.Options.PP_BLOCKED_FEED = masterKeyWords.defaults.PP_BLOCKED_FEED;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('PP_BLOCKED_TEXT')) {
      VARS.Options.PP_BLOCKED_TEXT = '';
      changed = true;
    }

    if (!VARS.Options.hasOwnProperty('VERBOSITY_LEVEL')) {
      VARS.Options.VERBOSITY_LEVEL = masterKeyWords.defaults.DLG_VERBOSITY;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('VERBOSITY_MESSAGE_COLOUR')) {
      VARS.Options.VERBOSITY_MESSAGE_COLOUR = '';
      changed = true;
    }
    // - nb: test conditions, undefined needs to be tested before using .toString(), otherwise JS complains...
    if (
      (!VARS.Options.hasOwnProperty('VERBOSITY_MESSAGE_BG_COLOUR')) ||
      (VARS.Options.VERBOSITY_MESSAGE_BG_COLOUR === undefined) ||
      (VARS.Options.VERBOSITY_MESSAGE_BG_COLOUR.toString() === '')
    ) {
      VARS.Options.VERBOSITY_MESSAGE_BG_COLOUR = masterKeyWords.defaults.VERBOSITY_MESSAGE_BG_COLOUR;
      changed = true;
    }
    if (
      (!VARS.Options.hasOwnProperty('VERBOSITY_DEBUG')) ||
      (VARS.Options.VERBOSITY_DEBUG === undefined) ||
      (VARS.Options.VERBOSITY_DEBUG.toString() === '')
    ) {
      VARS.Options.VERBOSITY_DEBUG = masterKeyWords.defaults.VERBOSITY_DEBUG;
      changed = true;
    }

    if (!VARS.Options.hasOwnProperty('CMF_BTN_OPTION')) {
      VARS.Options.CMF_BTN_OPTION = masterKeyWords.defaults.CMF_BTN_OPTION;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('CMF_DIALOG_OPTION')) {
      VARS.Options.CMF_DIALOG_OPTION = masterKeyWords.defaults.CMF_DIALOG_OPTION;
      changed = true;
    }
    if (
      (!VARS.Options.hasOwnProperty('CMF_BORDER_COLOUR')) ||
      (VARS.Options.CMF_BORDER_COLOUR.toString() === undefined) ||
      (VARS.Options.CMF_BORDER_COLOUR.toString() === '')
    ) {
      VARS.Options.CMF_BORDER_COLOUR = masterKeyWords.defaults.CMF_BORDER_COLOUR;
      changed = true;
    }
    if (!VARS.Options.hasOwnProperty('NF_LIKES_MAXIMUM_COUNT')) {
      VARS.Options.NF_LIKES_MAXIMUM_COUNT = '';
      changed = true;
    }



    if (changed) {
      // - save the changes ...
      // -- usually happen if first time setup or change in Options' variables.
      let result = await set(DBVARS.DBKey, JSON.stringify(VARS.Options), DBVARS.ostore).then(() => {
        return true;
      }).catch((err) => {
        log.info(`getUserOptions() > changed > saving - failed, Error: ${err}`);
        return false;
      });
      if (VARS.Options.VERBOSITY_DEBUG) {
        if (result) {
          log.info(`Changed - success`);
        }
        else {
          log.info(`Changed - failed`);
        }
      }
    }

    // split the blocks of texts entries into arrays and translate to lowercase.
    VARS.Filters = new Object();

    // -- original list of text for each feed
    let nfBlockedText = '';
    let gfBlockedText = '';
    let vfBlockedText = '';
    let ppBlockedText = '';
    let mpBlockedText = '';
    let mpBlockedTextDesc = '';
    if (VARS.Options.NF_BLOCKED_ENABLED === true) {
      nfBlockedText = VARS.Options.NF_BLOCKED_TEXT;
    }
    if (VARS.Options.GF_BLOCKED_ENABLED === true) {
      gfBlockedText = VARS.Options.GF_BLOCKED_TEXT;
    }
    if (VARS.Options.VF_BLOCKED_ENABLED === true) {
      vfBlockedText = VARS.Options.VF_BLOCKED_TEXT;
    }
    if (VARS.Options.MP_BLOCKED_ENABLED === true) {
      mpBlockedText = VARS.Options.MP_BLOCKED_TEXT;
      mpBlockedTextDesc = VARS.Options.MP_BLOCKED_TEXT_DESCRIPTION;
    }
    if (VARS.Options.PP_BLOCKED_ENABLED === true) {
      ppBlockedText = VARS.Options.PP_BLOCKED_TEXT;
    }

    // -- final list of text for each feed
    let nfBlockedTextList = '';
    let gfBlockedTextList = '';
    let vfBlockedTextList = '';
    let ppBlockedTextList = '';
    let mpBlockedTextList = '';
    let mpBlockedTextDescList = '';

    // -- ##_BLOCKED_FEED[X] : 0 = NF, 1 = GF, 2 = VF.
    // -- rule: both feeds must be enabled before appending text list from one feed to another text list
    // -- news feed:
    if (VARS.Options.NF_BLOCKED_ENABLED) {
      nfBlockedTextList = nfBlockedText; // final list
      // -- add gf to nf
      if (VARS.Options.GF_BLOCKED_ENABLED && VARS.Options.GF_BLOCKED_FEED[0] === '1') {
        if (gfBlockedText.length > 0) {
          nfBlockedTextList += ((nfBlockedTextList.length > 0) ? VARS.SEP : '') + gfBlockedText;
        }
      }
      // -- add vf to nf
      if (VARS.Options.VF_BLOCKED_ENABLED && VARS.Options.VF_BLOCKED_FEED[0] === '1') {
        if (vfBlockedText.length > 0) {
          nfBlockedTextList += ((nfBlockedTextList.length > 0) ? VARS.SEP : '') + vfBlockedText;
        }
      }
    }
    // -- groups feed:
    if (VARS.Options.GF_BLOCKED_ENABLED) {
      gfBlockedTextList = gfBlockedText; // final list
      // -- add nf to gf
      if (VARS.Options.NF_BLOCKED_ENABLED && VARS.Options.NF_BLOCKED_FEED[1] === '1') {
        if (nfBlockedText.length > 0) {
          gfBlockedTextList += ((gfBlockedTextList.length > 0) ? VARS.SEP : '') + nfBlockedText;
        }
      }
      // -- add vf to gf
      if (VARS.Options.VF_BLOCKED_ENABLED && VARS.Options.VF_BLOCKED_FEED[1] === '1') {
        if (vfBlockedText.length > 0) {
          gfBlockedTextList += ((gfBlockedTextList.length > 0) ? VARS.SEP : '') + vfBlockedText;
        }
      }
    }
    // -- videos feed:
    if (VARS.Options.VF_BLOCKED_ENABLED) {
      vfBlockedTextList = vfBlockedText; // final list
      // -- add nf to vf
      if (VARS.Options.NF_BLOCKED_ENABLED && VARS.Options.NF_BLOCKED_FEED[2] === '1') {
        if (nfBlockedText.length > 0) {
          vfBlockedTextList += ((vfBlockedTextList.length > 0) ? VARS.SEP : '') + nfBlockedText;
        }
      }
      // -- add gf to vf
      if (VARS.Options.GF_BLOCKED_ENABLED && VARS.Options.GF_BLOCKED_FEED[2] === '1') {
        if (gfBlockedText.length > 0) {
          vfBlockedTextList += ((vfBlockedTextList.length > 0) ? VARS.SEP : '') + gfBlockedText;
        }
      }
    }

    // -- market place (stand-alone):
    if (VARS.Options.MP_BLOCKED_ENABLED) {
      mpBlockedTextList = mpBlockedText;
      mpBlockedTextDescList = mpBlockedTextDesc;
    }

    // -- profile page (stand-alone):
    if (VARS.Options.PP_BLOCKED_ENABLED) {
      ppBlockedTextList = ppBlockedText;
    }

    // -- populate the VARS.Filters.###...
    // -- news feed:
    VARS.Filters.NF_BLOCKED_TEXT = [];
    VARS.Filters.NF_BLOCKED_TEXT_LC = [];
    VARS.Filters.NF_BLOCKED_ENABLED = false;
    if (VARS.Options.NF_BLOCKED_ENABLED && nfBlockedTextList.length > 0) {
      VARS.Filters.NF_BLOCKED_ENABLED = true;
      VARS.Filters.NF_BLOCKED_TEXT = nfBlockedTextList.split(VARS.SEP);
      VARS.Filters.NF_BLOCKED_TEXT_LC = VARS.Filters.NF_BLOCKED_TEXT.map(btext => btext.toLowerCase());
    }
    // -- groups feed:
    VARS.Filters.GF_BLOCKED_TEXT = [];
    VARS.Filters.GF_BLOCKED_TEXT_LC = [];
    VARS.Filters.GF_BLOCKED_ENABLED = false;
    if (VARS.Options.GF_BLOCKED_ENABLED && gfBlockedTextList.length > 0) {
      VARS.Filters.GF_BLOCKED_ENABLED = true;
      VARS.Filters.GF_BLOCKED_TEXT = gfBlockedTextList.split(VARS.SEP);
      VARS.Filters.GF_BLOCKED_TEXT_LC = VARS.Filters.GF_BLOCKED_TEXT.map(btext => btext.toLowerCase());
    }
    // -- watch videos feed
    VARS.Filters.VF_BLOCKED_TEXT = [];
    VARS.Filters.VF_BLOCKED_TEXT_LC = [];
    VARS.Filters.VF_BLOCKED_ENABLED = false;
    if (VARS.Options.VF_BLOCKED_ENABLED && vfBlockedTextList.length > 0) {
      VARS.Filters.VF_BLOCKED_ENABLED = true;
      VARS.Filters.VF_BLOCKED_TEXT = vfBlockedTextList.split(VARS.SEP);
      VARS.Filters.VF_BLOCKED_TEXT_LC = VARS.Filters.VF_BLOCKED_TEXT.map(btext => btext.toLowerCase());
    }
    // -- marketplace  feed
    VARS.Filters.MP_BLOCKED_TEXT = [];
    VARS.Filters.MP_BLOCKED_TEXT_LC = [];
    VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION = [];
    VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION_LC = [];
    VARS.Filters.MP_BLOCKED_ENABLED = false;
    if (VARS.Options.MP_BLOCKED_ENABLED && ((mpBlockedTextList.length > 0) || (mpBlockedTextDescList.length > 0))) {
      VARS.Filters.MP_BLOCKED_ENABLED = true;
      // -- prices ::
      VARS.Filters.MP_BLOCKED_TEXT = mpBlockedTextList.split(VARS.SEP);
      VARS.Filters.MP_BLOCKED_TEXT_LC = VARS.Filters.MP_BLOCKED_TEXT.map(btext => btext.toLowerCase());
      // -- description ::
      VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION = mpBlockedTextDescList.split(VARS.SEP);
      VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION_LC = VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION.map(btext => btext.toLowerCase());
    }

    // -- profile page feed
    VARS.Filters.PP_BLOCKED_TEXT = [];
    VARS.Filters.PP_BLOCKED_TEXT_LC = [];
    VARS.Filters.PP_BLOCKED_ENABLED = false;
    if (VARS.Options.PP_BLOCKED_ENABLED && ppBlockedTextList.length > 0) {
      VARS.Filters.PP_BLOCKED_ENABLED = true;
      VARS.Filters.PP_BLOCKED_TEXT = ppBlockedTextList.split(VARS.SEP);
      VARS.Filters.PP_BLOCKED_TEXT_LC = VARS.Filters.PP_BLOCKED_TEXT.map(btext => btext.toLowerCase());
    }

    // log.info( 'getUserOptions() - Options:', VARS.Options);
    // log.info( 'getUserOptions() - Filters:', VARS.Filters);

    VARS.optionsReady = true;
  }

  // -- run some functions now - not dependent on HEAD being available.
  //    (includes getUserOptions())
  setLanguageAndOptions();

  // -- dailog box for displaying options (called in runMO)
  function buildMoppingDialog() {
    // build the dialog box component ...
    // -- BODY must be available for use.
    // -- used for displaying/getting/setting the various options
    log( 'buildMoppingDialog()');
    function createSingleCB(cbName, cbReadOnly = false) {
      // -- create toggle style checkboxes
      const CBTYPE = 'T'; // checkbox, single value, Toggle style
      let cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.setAttribute('cbType', CBTYPE);
      cb.name = cbName;
      cb.value = cbName;
      cb.checked = VARS.Options[cbName];
      let label = document.createElement('label');
      if (cbReadOnly) {
        cb.checked = true;
        cb.disabled = true;
        label.setAttribute('disabled', 'disabled');
      }
      label.appendChild(cb);
      if (KeyWords[cbName]) {
        if (Array.isArray(KeyWords[cbName]) === false) {
          label.appendChild(document.createTextNode(KeyWords[cbName]));
        }
        else {
          label.appendChild(document.createTextNode(Array.from(KeyWords[cbName]).join(', ')));
        }
      }
      else if (['NF_SPONSORED', 'GF_SPONSORED', 'VF_SPONSORED', 'MP_SPONSORED'].includes(cbName)) {
        label.appendChild(document.createTextNode(KeyWords.SPONSORED));
      }
      else {
        label.appendChild(document.createTextNode(cbName));
      }
      let div = document.createElement('div');
      div.appendChild(label);
      return div;
    }

    function createMultipeCBs(cbName, cbReadOnlyIdx = -1) {
      // -- create multiple values checkboxes
      const CBTYPE = 'M'; // checkbox, Multiple values
      let arrElements = [];
      for (let i = 0; i < KeyWords[cbName].length; i++) {
        let div = document.createElement('div');
        let cbKeyWord = KeyWords[cbName][i];
        let cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('cbType', CBTYPE);
        cb.name = cbName;
        cb.value = i;
        cb.checked = VARS.Options[cbName][i] === '1';
        let label = document.createElement('label');
        if (i === cbReadOnlyIdx) {
          cb.checked = true;
          cb.disabled = true;
          label.setAttribute('disabled', 'disabled');
        }
        label.appendChild(cb);
        label.appendChild(document.createTextNode(cbKeyWord));
        div.appendChild(label);
        arrElements.push(div);
      }
      let br = document.createElement('br');
      arrElements.push(br);
      return arrElements;
    }

    function createRB(rbName, rbValue, rbLabelText) {
      let div = document.createElement('div');
      let rb = document.createElement('input');
      rb.type = 'radio';
      rb.name = rbName;
      rb.value = rbValue;
      rb.checked = (VARS.Options[rbName] === rbValue);
      let label = document.createElement('label');
      label.appendChild(rb);
      label.appendChild(document.createTextNode(rbLabelText));
      div.appendChild(label);
      return div;
    }

    function createInput(iName, iLabel) {
      let div = document.createElement('div');
      let input = document.createElement('input');
      input.type = 'text';
      input.name = iName;
      input.value = VARS.Options[iName];
      let label = document.createElement('label');
      label.appendChild(document.createTextNode(iLabel));
      label.appendChild(document.createElement('br'));
      label.appendChild(input);
      div.appendChild(label);
      return div;
    }
    function createSelectLanguage() {
      let div = document.createElement('div');
      let select = getLanguagesComponent();
      let label = document.createElement('label');
      label.appendChild(document.createTextNode(`${KeyWords.CMF_DIALOG_LANGUAGE_LABEL}:`));
      label.appendChild(document.createElement('br'));
      label.appendChild(select);
      div.appendChild(label);
      return div;
    }

    function createCheckboxAndInput(cbName, iName) {
      // -- checkbox with input box.
      // -- no read-only attributes
      // -- no multiple keyword values.

      // -- create checkbox first.
      const CBTYPE = 'T';
      let cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.setAttribute('cbType', CBTYPE);
      cb.name = cbName;
      cb.value = cbName;
      cb.checked = VARS.Options[cbName];

      // -- create input box
      let input = document.createElement('input');
      input.type = 'text';
      input.name = iName;
      input.value = VARS.Options[iName];
      input.placeholder = '1000';
      input.size = 6;
      input.addEventListener('input', checkInputNumber, false);

      // -- wrap checkbox and input inside a label
      let label = document.createElement('label');
      label.appendChild(cb);
      label.appendChild(document.createTextNode(KeyWords[cbName] + ': '));
      label.appendChild(input);

      // -- wrap inside a div container ..
      let div = document.createElement('div');
      div.appendChild(label);
      return div;
    }

    function checkInputNumber(event) {
      // -- accept numbers/digits only.
      const el = event.target;
      if (el.value === '') {
        return true;
      }
      const digitsValues = el.value.replace(/\D/g, '');
      el.value = digitsValues.length > 0 ? parseInt(digitsValues) : '';
    }

    function getLanguagesComponent() {
      const elSelect = document.createElement('select');
      elSelect.name = 'CMF_DIALOG_LANGUAGE';
      // let elOption = document.createElement('option');
      // elOption.value = 'default';
      // elSelect.appendChild(elOption);
      Object.keys(masterKeyWords.translations).forEach(languageCode => {
        const elOption = document.createElement('option');
        elOption.value = languageCode;
        elOption.textContent = masterKeyWords.translations[languageCode].CMF_DIALOG_LANGUAGE;
        if (languageCode === cmfSessionManager.getFeedSettings().language) {
          elOption.setAttribute('selected', '');
        }
        elSelect.appendChild(elOption);
      })

      return elSelect;
    }

    function createDialog(languageChanged = false) {
      let dlg, hdr, hdr1, hdr2, hdr3, htxt, stxt, btn, cnt, fs, l, s, ta, div, footer;

      if (languageChanged) {
        cmfSessionManager.updateFeedSettings({ language: VARS.Options.CMF_DIALOG_LANGUAGE });
        cloneKeywords();
      }

      if (languageChanged === false) {
        // -- new dialog-box

        // -- wrapper
        dlg = document.createElement('div');
        dlg.id = 'fbcmf';
        dlg.className = 'fb-cmf';
        // class "show" reveals the dialog.
        // -- header (logo + title + close button)
        hdr = document.createElement('header');
        hdr1 = document.createElement('div');
        hdr1.className = 'fb-cmf-icon';
        hdr1.innerHTML = images.logo;

        hdr2 = document.createElement('div');
        hdr2.className = 'fb-cmf-title';

        hdr3 = document.createElement('div');
        hdr3.className = 'fb-cmf-close';
        btn = document.createElement('button');
        btn.innerHTML = images.iconClose;
        btn.addEventListener('click', toggleDialog, false);
        hdr3.appendChild(btn);

        hdr.appendChild(hdr1);
        hdr.appendChild(hdr2);
        hdr.appendChild(hdr3);
        dlg.appendChild(hdr);

        // content container
        cnt = document.createElement('div');
        cnt.classList.add('content');

      }
      else {
        // -- existing dialog-box
        // -- UI's language has changed - reset some descriptive text
        dlg = document.getElementById('fbcmf');
        hdr = dlg.querySelector('header');
        hdr2 = hdr.querySelector('.fb-cmf-title');
        while (hdr2.firstChild) {
          hdr2.removeChild(hdr2.firstChild);
        }
        hdr2.classList.remove('fb-cmf-lang-1');
        hdr2.classList.remove('fb-cmf-lang-2');

        cnt = dlg.querySelector('.content');
        while (cnt.firstChild) {
          cnt.removeChild(cnt.firstChild);
        }
      }
      dlg.setAttribute('dir', masterKeyWords.translations[cmfSessionManager.getFeedSettings().language].LANGUAGE_DIRECTION);

      // -- header - title block
      htxt = document.createElement('div');
      htxt.textContent = masterKeyWords.translations.en.DLG_TITLE;
      s = document.createElement('small');
      s.className = 'script-version';
      s.appendChild(document.createTextNode(` (${SCRIPT_VERSION})`));
      htxt.appendChild(s);
      hdr2.appendChild(htxt);
      if (cmfSessionManager.getFeedSettings().language !== 'en') {
        stxt = document.createElement('small');
        stxt.textContent = `(${KeyWords.DLG_TITLE})`;
        hdr2.appendChild(stxt);
        hdr2.classList.add('fb-cmf-lang-2');
      }
      else {
        hdr2.classList.add('fb-cmf-lang-1');
      }

      // -- News Feed options
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_NF;
      fs.appendChild(l);
      fs.appendChild(createSingleCB('NF_SPONSORED', false)); // -- changed to false (Dec 2023)
      for (const key in KeyWords) {
        if (key.slice(0, 3) === 'NF_') {
          if (key.slice(0, 8) === 'NF_BLOCK') {
            continue;
          }
          if (key.slice(0, 8) === 'NF_LIKES') {
            if (key === 'NF_LIKES_MAXIMUM') {
              fs.appendChild(createCheckboxAndInput(key, 'NF_LIKES_MAXIMUM_COUNT'));
            }
          }
          else {
            fs.appendChild(createSingleCB(key));
          }
        }
      }

      // -- Keywords to block - News Feed
      fs.appendChild(document.createElement('br'));
      l = document.createElement('strong');
      l.textContent = KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE + ":";
      fs.appendChild(l);

      createMultipeCBs('NF_BLOCKED_FEED', 0).forEach(el => {
        fs.appendChild(el);
      });

      fs.appendChild(createSingleCB('NF_BLOCKED_ENABLED'));
      fs.appendChild(createSingleCB('NF_BLOCKED_RE'));
      s = document.createElement('small');
      s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
      fs.appendChild(s);
      ta = document.createElement('textarea');
      ta.name = 'NF_BLOCKED_TEXT';
      ta.textContent = VARS.Options.NF_BLOCKED_TEXT.split(VARS.SEP).join('\n');
      fs.appendChild(ta);
      cnt.appendChild(fs);

      // -- Groups Feed options
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_GF;
      fs.appendChild(l);
      fs.appendChild(createSingleCB('GF_SPONSORED', false)); // -- changed to false (Dec 2023)
      for (const key in KeyWords) {
        if (key.slice(0, 3) === 'GF_' && key.slice(0, 8) !== 'GF_BLOCK') {
          fs.appendChild(createSingleCB(key));
        }
      }

      // -- Keywords to block - Groups Feed
      fs.appendChild(document.createElement('br'));
      l = document.createElement('strong');
      l.textContent = KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE + ':';
      fs.appendChild(l);

      createMultipeCBs('GF_BLOCKED_FEED', 1).forEach(el => {
        fs.appendChild(el);
      });

      fs.appendChild(createSingleCB('GF_BLOCKED_ENABLED'));
      fs.appendChild(createSingleCB('GF_BLOCKED_RE'));
      s = document.createElement('small');
      s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
      fs.appendChild(s);
      ta = document.createElement('textarea');
      ta.name = 'GF_BLOCKED_TEXT';
      ta.textContent = VARS.Options.GF_BLOCKED_TEXT.split(VARS.SEP).join('\n');
      fs.appendChild(ta);
      cnt.appendChild(fs);

      // -- MarketPlace option(s)
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_MP;
      fs.appendChild(l);
      fs.appendChild(createSingleCB('MP_SPONSORED', false)); // -- changed to false (Dec 2023)

      // -- Keywords to block - Marketplace Feed
      fs.appendChild(document.createElement('br'));
      l = document.createElement('strong');
      l.textContent = KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE + ':';
      fs.appendChild(l);

      createMultipeCBs('MP_BLOCKED_FEED', 0).forEach(el => {
        fs.appendChild(el);
      });
      // -- 2 x textarea boxes; one for prices and one for description
      fs.appendChild(createSingleCB('MP_BLOCKED_ENABLED'));
      fs.appendChild(createSingleCB('MP_BLOCKED_RE'));
      l = document.createElement('strong');
      l.textContent = 'Prices: ';
      fs.appendChild(l);
      fs.appendChild(document.createElement('br'));
      s = document.createElement('small');
      s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
      fs.appendChild(s);
      ta = document.createElement('textarea');
      ta.name = 'MP_BLOCKED_TEXT';
      ta.textContent = VARS.Options.MP_BLOCKED_TEXT.split(VARS.SEP).join('\n');
      fs.appendChild(ta);
      fs.appendChild(document.createElement('br'));
      fs.appendChild(document.createElement('br'));

      l = document.createElement('strong');
      l.textContent = 'Description: ';
      fs.appendChild(l);
      fs.appendChild(document.createElement('br'));
      s = document.createElement('small');
      s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
      fs.appendChild(s);
      ta = document.createElement('textarea');
      ta.name = 'MP_BLOCKED_TEXT_DESCRIPTION';
      ta.textContent = VARS.Options.MP_BLOCKED_TEXT_DESCRIPTION.split(VARS.SEP).join('\n');
      fs.appendChild(ta);

      cnt.appendChild(fs);


      // -- Watch Videos Feed options
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_VF;
      fs.appendChild(l);
      fs.appendChild(createSingleCB('VF_SPONSORED', false)); // -- changed to false (Dec 2023)
      for (const key in KeyWords) {
        if (key.slice(0, 3) === 'VF_' && key.slice(0, 8) !== 'VF_BLOCK') {
          fs.appendChild(createSingleCB(key));
        }
      }

      // -- Keywords to block - Watch Videos Feed
      fs.appendChild(document.createElement('br'));
      l = document.createElement('strong');
      l.textContent = KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE + ':';
      fs.appendChild(l);

      createMultipeCBs('VF_BLOCKED_FEED', 2).forEach(el => {
        fs.appendChild(el);
      });

      fs.appendChild(createSingleCB('VF_BLOCKED_ENABLED'));
      fs.appendChild(createSingleCB('VF_BLOCKED_RE'));
      s = document.createElement('small');
      s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
      fs.appendChild(s);
      ta = document.createElement('textarea');
      ta.name = 'VF_BLOCKED_TEXT';
      ta.textContent = VARS.Options.VF_BLOCKED_TEXT.split(VARS.SEP).join('\n');
      fs.appendChild(ta);
      cnt.appendChild(fs);


      // -- Profile Page feed options
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_PP;
      fs.appendChild(l);
      // fs.appendChild(createSingleCB('PP_SPONSORED', false));
      for (const key in KeyWords) {
        if (key.slice(0, 3) === 'PP_' && key.slice(0, 8) !== 'PP_BLOCK') {
          fs.appendChild(createSingleCB(key));
        }
      }

      // -- Keywords to block - Profile page
      fs.appendChild(document.createElement('br'));
      l = document.createElement('strong');
      l.textContent = KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE + ':';
      fs.appendChild(l);

      createMultipeCBs('PP_BLOCKED_FEED', 0).forEach(el => {
        fs.appendChild(el);
      });

      fs.appendChild(createSingleCB('PP_BLOCKED_ENABLED'));
      fs.appendChild(createSingleCB('PP_BLOCKED_RE'));
      s = document.createElement('small');
      s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
      fs.appendChild(s);
      ta = document.createElement('textarea');
      ta.name = 'PP_BLOCKED_TEXT';
      ta.textContent = VARS.Options.PP_BLOCKED_TEXT.split(VARS.SEP).join('\n');
      fs.appendChild(ta);
      cnt.appendChild(fs);


      // -- Other items options
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_OTHER;
      fs.appendChild(l);
      for (const key in KeyWords) {
        if (key.slice(0, 10) === 'OTHER_INFO') {
          fs.appendChild(createSingleCB(key));
        }
      }
      cnt.appendChild(fs);

      // -- Reels
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.REELS_TITLE;
      fs.appendChild(l);
      fs.appendChild(createSingleCB('REELS_CONTROLS'), false);
      fs.appendChild(l);
      fs.appendChild(createSingleCB('REELS_DISABLE_LOOPING'), false);
      cnt.appendChild(fs);

      // -- Verbosity
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_VERBOSITY;
      fs.appendChild(l);
      s = document.createElement('span');
      s.appendChild(document.createTextNode(`${KeyWords.DLG_VERBOSITY_CAPTION}:`));
      fs.appendChild(s);
      fs.appendChild(createRB('VERBOSITY_LEVEL', '0', `${KeyWords.VERBOSITY_MESSAGE[0]}`));
      fs.appendChild(createRB('VERBOSITY_LEVEL', '1', `${KeyWords.VERBOSITY_MESSAGE[1]}______`));
      fs.appendChild(createRB('VERBOSITY_LEVEL', '2', `${KeyWords.VERBOSITY_MESSAGE[3]}`));
      fs.appendChild(document.createElement('br'));
      fs.appendChild(createInput('VERBOSITY_MESSAGE_COLOUR', `${KeyWords.VERBOSITY_MESSAGE_COLOUR}:`));
      fs.appendChild(createInput('VERBOSITY_MESSAGE_BG_COLOUR', `${KeyWords.VERBOSITY_MESSAGE_BG_COLOUR}:`));
      fs.appendChild(document.createElement('br'));
      fs.appendChild(createSingleCB('VERBOSITY_DEBUG'));
      cnt.appendChild(fs);

      // -- cmf customisations
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.CMF_CUSTOMISATIONS;
      fs.appendChild(l);
      s = document.createElement('span');
      s.appendChild(document.createTextNode(`${KeyWords.CMF_BTN_LOCATION}:`));
      fs.appendChild(s);
      let len = KeyWords.CMF_BTN_OPTION.length;
      for (let i = 0; i < len; i++) {
        fs.appendChild(createRB('CMF_BTN_OPTION', i.toString(), KeyWords.CMF_BTN_OPTION[i]));
      }
      fs.appendChild(document.createElement('br'));
      s = document.createElement('span');
      s.appendChild(document.createTextNode(`${KeyWords.CMF_DIALOG_LOCATION}:`));
      fs.appendChild(s);
      fs.appendChild(createRB('CMF_DIALOG_OPTION', '0', KeyWords.CMF_DIALOG_OPTION[0]));
      fs.appendChild(createRB('CMF_DIALOG_OPTION', '1', KeyWords.CMF_DIALOG_OPTION[1]));
      fs.appendChild(document.createElement('br'));
      fs.appendChild(createInput('CMF_BORDER_COLOUR', `${KeyWords.CMF_BORDER_COLOUR}:`));

      // - ui language
      // fs.appendChild(document.createElement('br'));
      // s = document.createElement('span');
      // s.appendChild(document.createTextNode(`${KeyWords.CMF_DIALOG_LANGUAGE_LABEL}:`));
      // fs.appendChild(s);
      // fs.appendChild(document.createElement('br'));
      // fs.appendChild(getLanguagesComponent());
      // cnt.appendChild(fs);

      fs.appendChild(document.createElement('br'));
      fs.appendChild(createSelectLanguage());
      cnt.appendChild(fs);


      // -- tips
      fs = document.createElement('fieldset');
      l = document.createElement('legend');
      l.textContent = KeyWords.DLG_TIPS;
      fs.appendChild(l);
      s = document.createElement('span');
      s.appendChild(document.createTextNode(KeyWords.DLG_TIPS_CONTENT));
      fs.appendChild(s);
      cnt.appendChild(fs);

      if (languageChanged === false) {
        dlg.appendChild(cnt);

        // -- Actions (buttons) + status
        footer = document.createElement('footer');
        // footer.classList.add('buttons');

        // -- Make a list of buttons
        const btnList = [
          {
            id: 'BTNSave', // save
            text: KeyWords.DLG_BUTTONS[0],
            event: saveUserOptions,
          },
          // {
          //     id: 'BTNClose', // close
          //     text: KeyWords.DLG_BUTTONS[1],
          //     event: toggleDialog,
          // },
          {
            id: 'BTNExport', // export
            text: KeyWords.DLG_BUTTONS[2],
            event: exportUserOptions,
          },
          {
            id: 'BTNImport', // import
            text: KeyWords.DLG_BUTTONS[3],
            event: importUserOptions,
          },
          {
            id: 'BTNReset', // reset
            text: KeyWords.DLG_BUTTONS[4],
            event: resetUserOptions,
          }
        ];

        for (const btnAttrs of btnList) {
          const btnEl = document.createElement('button');
          btnEl.setAttribute('id', btnAttrs.id);
          btnEl.textContent = btnAttrs.text;
          btnEl.addEventListener('click', btnAttrs.event, false);
          footer.appendChild(btnEl);
        }

        // -- file input field is hidden, but triggered by the Import button.
        const fileImport = document.createElement('input');
        fileImport.setAttribute('type', 'file');
        fileImport.setAttribute('id', `FI${postAtt}`);
        fileImport.classList.add('fileInput');
        footer.appendChild(fileImport);

        // -- save/export/import/reset status/results
        div = document.createElement('div');
        div.classList.add('fileResults');
        div.innerHTML = '&nbsp;';
        footer.appendChild(div);

        dlg.appendChild(footer);

        document.body.appendChild(dlg);

        // -- add event listeners to the import button and file input field
        let fileInput = document.getElementById(`FI${postAtt}`);
        fileInput.addEventListener('change', importUserOptions, false);
        // -- make the btn Import trigger file input ...
        let btnImport = document.getElementById('BTNImport');
        btnImport.addEventListener('click', function () {
          fileInput.click();
        }, false);
      }
      else {
        // -- language changed
        const footer = dlg.querySelector('footer');
        let btn = footer.querySelector('#BTNSave');
        btn.textContent = KeyWords.DLG_BUTTONS[0];
        // btn = footer.querySelector('#BTNClose');
        // btn.textContent = KeyWords.DLG_BUTTONS[1];
        btn = footer.querySelector('#BTNExport');
        btn.textContent = KeyWords.DLG_BUTTONS[2];
        btn = footer.querySelector('#BTNImport');
        btn.textContent = KeyWords.DLG_BUTTONS[3];
        btn = footer.querySelector('#BTNReset');
        btn.textContent = KeyWords.DLG_BUTTONS[4];
        addLegendEvents();
      }
    }

    function updateDialog() {
      let content = document.getElementById('fbcmf').querySelector('.content');
      if (content) {
        // -- toggle checkboxes
        let cbs = Array.from(content.querySelectorAll('input[type="checkbox"][cbtype="T"]'));
        cbs.forEach(cb => {
          if (VARS.Options.hasOwnProperty(cb.name)) {
            cb.checked = VARS.Options[cb.name];
          }
        });
        // -- multiple values checkboxes
        cbs = Array.from(content.querySelectorAll('input[type="checkbox"][cbtype="M"]'));
        cbs.forEach(cb => {
          if (VARS.Options.hasOwnProperty(cb.name)) {
            cb.checked = VARS.Options[cb.name][parseInt(cb.value)] === '1';
          }
        });
        // -- radios
        let rbs = content.querySelectorAll('input[type="radio"]');
        rbs.forEach(rb => {
          if (VARS.Options.hasOwnProperty(rb.name) && (rb.value === VARS.Options[rb.name])) {
            rb.checked = VARS.Options[rb.name];
          }
        });
        // -- textareas
        let tas = Array.from(content.querySelectorAll('textarea'));
        tas.forEach(ta => {
          if (VARS.Options.hasOwnProperty(ta.name)) {
            ta.value = VARS.Options[ta.name].replaceAll(VARS.SEP, '\n');
          }
        });
        // -- plain inputs
        let inputs = Array.from(content.querySelectorAll('input[type="text"]'));
        inputs.forEach(inp => {
          if (VARS.Options.hasOwnProperty(inp.name)) {
            inp.value = VARS.Options[inp.name];
          }
        });
        // -- selects
        let selects = Array.from(content.querySelectorAll('select'));
        selects.forEach(select => {
          if (VARS.Options.hasOwnProperty(select.name)) {
            for (let i = 0; i < select.options.length; i++) {
              const option = select.options[i];
              if (option.value === VARS.Options[select.name]) {
                option.selected = true;
              } else {
                option.selected = false;
              }
            }
          }
        });
      }
    }

    async function saveUserOptions(event, source = 'dialog') {
      // -- save Options in indexeddb as JSON.
      let languageChanged = false;
      if (source === 'dialog') {
        let md, cbs, rbs, tas, inputs, selects;

        // -- grab the dialog box and get the various options.
        md = document.getElementById('fbcmf');

        // -- input validation for NF_LIKES_MAXIMUM_COUNT
        const elLikesMaximum = md.querySelector('input[name="NF_LIKES_MAXIMUM"]');
        if (elLikesMaximum.checked) {
          const elLikesMaximumCount = md.querySelector('input[name="NF_LIKES_MAXIMUM_COUNT"]');
          if (elLikesMaximumCount.value.length === 0) {
            alert(KeyWords.NF_LIKES_MAXIMUM + '?');
            elLikesMaximumCount.focus();
            return;
          }
        }

        // -- checkboxes (toggle variations)
        cbs = Array.from(md.querySelectorAll('input[type="checkbox"][cbtype="T"]'));
        cbs.forEach(cb => {
          VARS.Options[cb.name] = cb.checked;
        });
        // -- checkboxes (multipe values variations)
        let cbName = 'NF_BLOCKED_FEED';
        cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
        cbs.forEach(cb => {
          VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
        });
        cbName = 'GF_BLOCKED_FEED';
        cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
        cbs.forEach(cb => {
          VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
        });
        cbName = 'VF_BLOCKED_FEED';
        cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
        cbs.forEach(cb => {
          VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
        });
        cbName = 'MP_BLOCKED_FEED';
        cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
        cbs.forEach(cb => {
          VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
        });
        cbName = 'PP_BLOCKED_FEED';
        cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
        cbs.forEach(cb => {
          VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
        });

        // -- radios
        rbs = md.querySelectorAll('input[type="radio"]:checked');
        rbs.forEach(rb => {
          VARS.Options[rb.name] = rb.value;
        });
        // -- text input
        inputs = Array.from(md.querySelectorAll('input[type="text"]'));
        inputs.forEach(inp => {
          VARS.Options[inp.name] = inp.value;
        });
        // -- Blocked text (textareas)
        tas = md.querySelectorAll('textarea');
        tas.forEach(ta => {
          let txtn = ta.value.split('\n');
          let txts = [];
          txtn.forEach(txt => {
            if (txt.trim().length > 0) {
              txts.push(txt); // -- do not trim - retain entry as is.
            }
          });
          VARS.Options[ta.name] = txts.join(VARS.SEP);
        });
        // -- selects
        selects = Array.from(md.querySelectorAll('select'));
        selects.forEach(select => {
          VARS.Options[select.name] = select.value;
        });

        // -- did the ui language change?
        languageChanged = (cmfSessionManager.getFeedSettings().language !== VARS.Options.CMF_DIALOG_LANGUAGE);
      }
      else if (source === 'reset') {
        languageChanged = true;
      }


      // -- clear out items that are not valid.
      let md = document.getElementById('fbcmf');
      let inputs = Array.from(md.querySelectorAll('input:not([type="file"]), textarea, select'));
      let validNames = [];
      inputs.forEach(inp => {
        if (!validNames.includes(inp.name)) {
          validNames.push(inp.name);
        }
      });
      for (let key in VARS.Options) {
        if (!validNames.includes(key)) {
          if (VARS.Options.VERBOSITY_DEBUG) {
            log.info( 'saveUserOptions(); Deleting key:', key);
          }
          delete VARS.Options[key];
        }
      }

      // -- save options
      let result = await set(DBVARS.DBKey, JSON.stringify(VARS.Options), DBVARS.ostore).then(() => {
        // -- refresh options and split blocks of texts
        let result2 = getUserOptions().then(() => {
          return true;
        });
        return result2;
      }).catch((err) => {
        log.info(`saveUserOptions() > set() -> Error:`, err);
        return false;
      });
      if (VARS.Options.VERBOSITY_DEBUG) {
        log.info(`saveUserOptions() > set() -> Saved:`, result);
      }

      // - update some variables.
      if (result) {

        if (languageChanged) {
          createDialog(true);
        }

        setFeedSettings(true);
        // - rebuild css - need user's preferences to take effect
        addCSS();
        addExtraCSS();
        // -- reset the main-column watcher ...
        const elements = document.querySelectorAll(`[${mainColumnAtt}]`);
        for (const element of elements) {
          element.removeAttribute(mainColumnAtt);
        }
        // - check if toggling debugging mode.
        toggleHiddenElements();
      }
      document.querySelector('#fbcmf .fileResults').textContent = `Last Saved @ ${(new Date()).toTimeString().slice(0, 8)}`;

      // -- reset the posts and do the cleaning/mopping up again ...
      if (VARS.isAF) {
        // -- "reset" scan counts
        VARS.scanCountStart += 100;
        VARS.scanCountMaxLoop += 100;

        // -- purge the hidden post captions
        // -- however, need to move the div out of the <detais> ...
        let details = document.querySelectorAll(`details[${postAtt}]`);
        for (const element of details) {
          const elParent = element.parentElement;
          const elContent = element.lastElementChild;
          if (elContent && elContent.tagName === 'DIV') {
            elParent.appendChild(elContent);
          }
          // -- no need to copy the classes from <details> to parent - parent already have them.
          elParent.removeChild(element);
        }

        // -- purge the mini-captions
        let miniCaptions = document.querySelectorAll(`h6[${postAttTab}]`);
        for (const miniCaption of miniCaptions) {
          const elParent = miniCaption.parentElement;
          elParent.removeChild(miniCaption);
        }

        // -- remove attribute
        let elements = document.querySelectorAll(`[${postAtt}]`);
        for (const element of elements) {
          element.removeAttribute(postAtt);
          element.removeAttribute(VARS.hideAtt);
          element.removeAttribute(VARS.cssHideEl);
          element.removeAttribute(VARS.cssHideNumberOfShares);
          element.removeAttribute(VARS.showAtt);
        }
        // -- remove other attributes
        elements = document.querySelectorAll(`[${postAttCPID}], [${postAttChildFlag}]`);
        for (const element of elements) {
          if (element.hasAttribute(postAttCPID)) {
            element.removeAttribute(postAttCPID);
          }
          if (element.hasAttribute(postAttChildFlag)) {
            element.removeAttribute(postAttChildFlag);
          }
        }
        // -- remove some more attributes
        // -- (don't add cssShow to query, the button needs it ...)
        elements = document.querySelectorAll(`[${VARS.hideAtt}], [${VARS.cssHideEl}], [${VARS.cssHideNumberOfShares}]`);
        for (const element of elements) {
          element.removeAttribute(VARS.hideAtt);
          element.removeAttribute(VARS.cssHideEl);
          element.removeAttribute(VARS.cssHideNumberOfShares);
          element.removeAttribute(VARS.showAtt);
        }

        if (VARS.isNF) {
          mopUpTheNewsFeed();
        }
        else if (VARS.isGF) {
          mopUpTheGroupsFeed();
        }
        else if (VARS.isVF) {
          mopUpTheWatchVideosFeed();
        }
        else if (VARS.isMF) {
          mopUpTheMarketplaceFeed();
        }
        else if (VARS.isSF) {
          mopUpTheSearchFeed();
        }
        else if (VARS.isRF) {
          mopUpTheReelFeed('saveUserOptions');
        }
      }
      // log.info( 'saveUserOptions(); OPTIONS:', VARS.Options);
    }

    function exportUserOptions() {
      // -- export user's options into a text file.
      let exportOptions = document.createElement("a");
      exportOptions.href = window.URL.createObjectURL(new Blob([JSON.stringify(VARS.Options)], { type: "text/plain" }));
      exportOptions.download = 'fb - clean my feeds - settings.json';
      exportOptions.click();
      exportOptions.remove();
      document.querySelector('#fbcmf .fileResults').textContent = 'Exported: fb - clean my feeds - settings.json';
    }

    function importUserOptions(event) {
      // -- import user's options from a text file.
      let fileResults = document.querySelector('#fbcmf .fileResults');
      let file = event.target.files[0];
      let fileN = event.target.files[0].name;
      // -- setup reader for reading in the file
      let reader = new FileReader();
      // -- what to do when reader is called.
      reader.onload = (file) => {
        try {
          let fileContent = JSON.parse(file.target.result);
          if (
            fileContent.hasOwnProperty('NF_SPONSORED') &&
            fileContent.hasOwnProperty('GF_SPONSORED') &&
            fileContent.hasOwnProperty('VF_SPONSORED') &&
            fileContent.hasOwnProperty('MP_SPONSORED')
          ) {
            VARS.Options = fileContent;
            // log.info( 'importUserOptions() > reader.onload: Options:', VARS.Options);
            // -- save the file to the db
            // -- save will run getUserOptions();
            let result = saveUserOptions(null, 'file').then(() => {
              updateDialog();
              fileResults.textContent = `File imported: ${fileN}`;
              return true;
            });
          }
          else {
            fileResults.textContent = `File NOT imported: ${fileN}`;
          }
        }
        catch (e) {
          fileResults.textContent = `File NOT imported: ${fileN}`;
        }
      };
      // -- call reader to read in the file ...
      reader.readAsText(file);
    }

    function resetUserOptions() {
      // -- reset the options to original state (before customisations)
      del(DBVARS.DBKey, DBVARS.ostore)
        .then(() => {
          // log.info( 'resetUserOptions();', 'Data deleted successfully');

          // - reset language - setLanguageAndOptions() > getUserOptions() will correct this value.
          VARS.Options.CMF_DIALOG_LANGUAGE = '';
          setLanguageAndOptions();
          let result = saveUserOptions(null, 'reset').then(() => {
            updateDialog();
            return true;
          });
        })
        .catch((error) => {
          log.info( 'resetUserOptions(); Error - unable to delete Data.', error);
        });
    }

    function createToggleButton() {
      let cmfToggleBtn = document.createElement(cmfToggleBtnTag) as CMFToggleBtn;
      cmfToggleBtn.setAttribute('title', KeyWords.DLG_TITLE);

      document.body.appendChild(cmfToggleBtn);
      cmfToggleBtn.buttonElement?.addEventListener('click', toggleDialog, false);

      VARS.btnToggleEl = cmfToggleBtn;
    }

    function addLegendEvents() {
      const elFBCMF = document.getElementById('fbcmf');
      if (elFBCMF) {
        const legends = elFBCMF.querySelectorAll('legend');
        legends.forEach(legend => {
          legend.parentElement.classList.add('hidden');
          legend.addEventListener('click', function () {
            legend.parentElement.classList.toggle('hidden');
            legend.parentElement.classList.toggle('visible');
          });
        });
      }
    }

    createToggleButton();
    createDialog();
    addLegendEvents();
  }
  // --- end of dailog code.

  // -- toggleDialog() function placed here to allow a GM.registerMenuCommand(...) to call it.
  function toggleDialog() {
    cmfCongfigModal?.toggle();

    const elDialog = document.getElementById('fbcmf');
    if (elDialog.hasAttribute(VARS.showAtt)) {
      elDialog.removeAttribute(VARS.showAtt);
    }
    else {
      elDialog.setAttribute(VARS.showAtt, '');
    }
  }

  // adjust some settings - if URL has changed.
  function setFeedSettings(forceUpdate = false) {
    if ((VARS.prevURL !== window.location.href) || forceUpdate) {
      // - remember current page's URL
      VARS.prevURL = window.location.href;
      // -- pathname pattern: /marketplace...
      VARS.prevPathname = window.location.pathname;
      // -- search pattern: ?query= ...
      VARS.prevQuery = window.location.search;
      // - reset feeds flags
      VARS.isNF = false;
      VARS.isGF = false;
      VARS.isVF = false;
      VARS.isMF = false;
      VARS.isSF = false;
      VARS.isRF = false;
      VARS.isPP = false;
      if ((VARS.prevPathname === '/') || (VARS.prevPathname === '/home.php')) {
        // -- news feed
        // -- nb: "Feeds (most recent)" combines a few feeds into one ... apply NF rules to all, except Groups.
        if (VARS.prevQuery.indexOf('?filter=groups') < 0) {
          VARS.isNF = true;
        }
        else {
          VARS.isGF = true;
          VARS.gfType = 'groups-recent';
        }
      }
      else if (VARS.prevPathname.indexOf('/groups/') >= 0) {
        // -- groups feed
        VARS.isGF = true;
        if (VARS.prevPathname.indexOf('/groups/feed') >= 0) {
          VARS.gfType = 'groups';
        }
        else if (VARS.prevPathname.indexOf('/groups/search') >= 0) {
          VARS.gfType = 'search';
        }
        else if (VARS.prevPathname.indexOf('?filter=groups&sk=h_chr') >= 0) {
          VARS.gfType = 'groups-recent';
        }
        else {
          VARS.gfType = 'group';
        }
      }
      else if (VARS.prevPathname.indexOf('/watch') >= 0) {
        // -- watch videos feed
        VARS.isVF = true;
        if (VARS.prevPathname.indexOf('/watch/search') >= 0) {
          VARS.vfType = 'search';
        }
        else if (VARS.prevQuery.indexOf('?ref=seach') >= 0) {
          VARS.vfType = 'item';
        }
        else if (VARS.prevQuery.indexOf('?v=') >= 0) {
          VARS.vfType = 'item';
        }
        else {
          VARS.vfType = 'videos';
        }
      }
      else if (VARS.prevPathname.indexOf('/marketplace') >= 0) {
        // -- marketplace
        VARS.isMF = true;
        mp_stopTrackingDirtIntoMyHouse();
        if (VARS.isMF && VARS.prevPathname.indexOf('/item/') >= 0) {
          // - viewing an item
          VARS.mpType = 'item';
        }
        else if (VARS.prevPathname.indexOf('/search') >= 0) {
          // - searching within marketplace ... (has similar layout to category feed)
          VARS.mpType = 'search';
        }
        else if (VARS.prevPathname.indexOf('/category/') >= 0) {
          // - category feed
          VARS.mpType = 'category';
        }
        else {
          // -- check again for category - may have a location in the pathName ...
          // -- pattern: :: https://www.facebook.com/marketplace/<location>/sports
          const urlBits = VARS.prevPathname.split('/');
          if (urlBits.length > 3) {
            VARS.mpType = 'category';
          }
          else {
            VARS.mpType = 'marketplace';
          }
        }
      }
      else if (VARS.prevPathname.indexOf('/commerce/listing/') >= 0) {
        // - a group's for sale post - redirected to marketplace ...
        // - same layout as a marketplace item.
        VARS.isMF = true;
        VARS.mpType = 'item';
      }
      else if (['/search/top/', '/search/top', '/search/posts/', '/search/posts', '/search/pages/'].indexOf(VARS.prevPathname) >= 0) {
        // -- search results page : "All" and "Posts"
        VARS.isSF = true;
      }
      else if (VARS.prevPathname.indexOf('/reel/') >= 0) {
        // -- reel(s) page
        // VARS.isRF = true;
        VARS.isRF = (VARS.Options.REELS_CONTROLS === true) || (VARS.Options.REELS_DISABLE_LOOPING === true);
      }
      else if (VARS.prevPathname.indexOf('/profile.php') >= 0) {
        // -- profile page (usually a public page)
        VARS.isPP = true;
      }
      else if (VARS.prevPathname.substring(1).length > 1 && VARS.prevPathname.substring(1).indexOf('/') < 0) {
        // else if (document.querySelector('a[href*="/about"] > div > span')) { <-- to slow to detect - not available onload.
        // -- profile page (usually person)
        VARS.isPP = true;
      }

      VARS.isAF = (VARS.isNF || VARS.isGF || VARS.isVF || VARS.isMF || VARS.isSF || VARS.isRF || VARS.isPP);

      // when to display the cmf button
      if (VARS.isAF) {
        if (VARS.btnToggleEl) {
          VARS.btnToggleEl.setAttribute(VARS.showAtt, '');
        }
      }
      else {
        if (VARS.btnToggleEl) {
          VARS.btnToggleEl.removeAttribute(VARS.showAtt);
        }
      }

      // - reset consecutive count of hidden posts
      VARS.echoCount = 0;

      // -- reset the no-change-counter
      VARS.noChangeCounter = 0;

      // log.info(`setFeedSettings() :: isAF: ${VARS.isAF}; isNF: ${VARS.isNF}; isGF: ${VARS.isGF}; isVF: ${VARS.isVF}; isMF: ${VARS.isMF}; isSF: ${VARS.isSF}; isRF: ${VARS.isRF}; isPP: ${VARS.isPP}`);

      return true;
    }
    else {
      return false;
    }
  }

  function climbUpTheTree(element, numberOfBranches = 1) {
    while (element && numberOfBranches > 0) {
      element = element.parentNode;
      numberOfBranches--;
    }
    return element || null;
  }

  function doLightDusting(post) {
    // - remove 'dusty' elements that interfere with querySelectorAll, nth-of-type, :not() queries.
    // -- needs to run a few times to be effective.
    let scanCount = VARS.scanCountStart;
    if (post[postPropDS] !== undefined) {
      scanCount = parseInt(post[postPropDS]);
      scanCount = (scanCount < VARS.scanCountStart) ? VARS.scanCountStart : scanCount;
    }
    if (scanCount < VARS.scanCountMaxLoop) {
      const dustySpots = post.querySelectorAll('[data-0="0"]');
      if (dustySpots) {
        dustySpots.forEach((element) => {
          element.remove();
        });
      }
      scanCount++;
      post[postPropDS] = scanCount;
    }
  }

  function scanTreeForText(theNode) {
    const arrayTextValues = [];
    const elements = theNode.querySelectorAll(':scope > div, :scope > blockquote, :scope > span');

    for (const element of elements) {
      if (element.hasAttribute('aria-hidden') && element.getAttribute('aria-hidden') === "false") {
        // -- skip this branch (hidden)
        continue;
      }

      // -- scan this branch
      const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let currentNode;
      while ((currentNode = walk.nextNode())) {
        const elParent = currentNode.parentElement;
        const elParentTN = elParent.tagName.toLowerCase();
        const val = cleanText(currentNode.textContent).trim();

        // log.info( '---> scanTreeForText(); currentNode:', currentNode, elParent, elParentTN, val);

        if (val === '' || val.toLowerCase() === 'facebook') {
          // -- skip this node
          continue;
        }

        if (elParent.hasAttribute('aria-hidden') && elParent.getAttribute('aria-hidden') === 'true') {
          // -- skip this node
          continue;
        }

        if (elParentTN === 'div' && elParent.hasAttribute('role') && elParent.getAttribute('role') === 'button') {
          // -- February 2024 - issue with "Anonymous participant" not being detected properly
          // -- when viewing a post in a group (not groups feed), "Anonymous participant" is inside a div:button wrapped inside an object.
          if (elParent.parentElement && elParent.parentElement.tagName.toLowerCase() !== 'object') {
            // -- skip this node
            continue;
          }
        }

        if (elParentTN === 'title') {
          // -- skip this node
          continue;
        }

        // -- February 2024 - issue with "Anonymous participant" not being detected properly
        // --- usually has a div with role of button, and that div only has 1 descendant.
        // --- previously, we skipped when a div has a button role.
        const elGeneric = elParent.closest('div[role="button"]');
        const elGenericDescendantsCount = elGeneric ? countDescendants(elGeneric) : 0;
        // log.info( 'scanTreeForText(); final test:', elGeneric, elParent, currentNode, elGenericDescendantsCount, val);
        if (elGenericDescendantsCount < 2 && val.length > 1) {
          // - keep 2+ char strings.
          arrayTextValues.push(...val.split('\n'));
        }
        else {
          // -- skip this node (hidden / meta info)
        }
      }
    }

    // -- remove duplicates and return results.
    // log.info( 'scanTreeForText(); returning::', theNode, arrayTextValues);
    return [...new Set(arrayTextValues)];
  }

  function mp_scanTreeForText(theNode) {
    const arrayTextValues = [];
    let n;
    const walk = document.createTreeWalker(theNode, NodeFilter.SHOW_TEXT, null);
    while ((n = walk.nextNode())) {
      let val = cleanText(n.textContent).trim();
      if ((val !== '') && (val.length > 1) && (val.toLowerCase() !== 'facebook')) {
        // - keep 2+ char strings.
        // arrayTextValues.push(val);
        arrayTextValues.push(val.toLowerCase());
      }
    }
    return arrayTextValues;
  }

  function scanImagesForAltText(theNode) {
    const arrayAltTextValues = [];
    const images = theNode.querySelectorAll('img[alt]');
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.alt.length > 0 && img.naturalWidth > 32) {
        // -- (emojis usually have widths < 33 ... skip them)
        const sAlt = cleanText(img.alt);
        if (!arrayAltTextValues.includes(sAlt)) {
          arrayAltTextValues.push(sAlt);
        }
      }
    }
    return arrayAltTextValues;
  }

  function countDescendants(element) {
    return element.querySelectorAll('div, span').length;
  }

  function extractTextContent(post, selector, maxBlocks) {
    // - get the text node values of the regular feed posts
    // - get the alt-text values of any images in the feed posts
    // -- scan the top portion of the posts (first maxBlocks blocks)
    // -- parameters:
    //    post: post to scan
    //    selector: querySelector's query
    //    maxBlocks: max number of blocks to scan
    const blocks = post.querySelectorAll(selector);
    const arrayTextValues = [];

    // - process first maxBlocks blocks
    // - block 0 = Suggested headings, block 1 = title/heading, block 2 = content, block 3 = info box / comments, block 4 = comments
    // - nb: some suggested posts only have one block ...
    for (let b = 0; b < Math.min(maxBlocks, blocks.length); b++) {
      const block = blocks[b];
      if (countDescendants(block) > 0) {
        arrayTextValues.push(...scanTreeForText(block));
        arrayTextValues.push(...scanImagesForAltText(block));
      }
    }

    return arrayTextValues.filter(item => item !== '');
  }

  function addCaptionForHiddenPost(post, reason, marker = '') {
    // :: caption for a post/feature that has been hidden ...
    // -- using <details><summary>...</summary> ~~ post ~~ </details> structure.
    // :: return : nothing

    // -- create the details/summary component
    const elDetails = document.createElement('details');
    const elSummary = document.createElement('summary');
    const elText = document.createTextNode(KeyWords.VERBOSITY_MESSAGE[1] + reason);

    elSummary.appendChild(elText);
    elDetails.appendChild(elSummary);
    // -- nb: marker is sometimes "false" when not used by caller ...
    elDetails.setAttribute(postAtt, (marker === false ? '' : marker));

    // -- duplicate the post's class(es) - prevents fb from removing the post (Feb 2024).
    if (post.classList.length > 0) {
      elDetails.classList.add(...post.classList);
    }
    // -- add the caption component above the post
    post.parentNode.appendChild(elDetails);
    // -- move the post inside the caption's component.
    elDetails.appendChild(post);

    // - in debugging mode?
    if (VARS.Options.VERBOSITY_DEBUG) {
      post.setAttribute(VARS.showAtt, '');
      elDetails.setAttribute('open', '');
    }
  }

  function addMiniCaption(post, reason) {
    // :: add a small caption to indicate why the post is hidden/flagged
    // -- in debugging mode ***
    // :: return : nothing

    post.setAttribute(VARS.hideAtt, '');

    const elTab = document.createElement('h6');
    elTab.setAttribute(postAttTab, '0');
    elTab.textContent = reason;

    post.insertBefore(elTab, post.firstElementChild);
  }

  function sanitizeReason(reason) {
    // -- setting an attribute, so remove double quotes from reason's text.
    return reason.replaceAll('"', '');
  }

  function hideFeature(post, reason, marker = '') {
    // -- hide something (not part of a regular feed)
    // -- no consecutive counts (VARS.echoCount is ignored)
    // -- Verbosity_Level: 0 = hide; 1|2 treated as 1 (no consecutive mode)

    // -- mark the post with the reason to hide the post.
    post.setAttribute(postAtt, sanitizeReason(reason));

    // -- add a caption or not?
    if ((VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      // -- insert a caption for a hidden post
      addCaptionForHiddenPost(post, reason, marker);
    }
    else {
      // -- no caption required ...
      // -- use an attribute to hide the post
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options.VERBOSITY_DEBUG) {
        // -- insert a small label to indicate why post was flagged
        addMiniCaption(post, reason);
      }
    }
  }

  function toggleHiddenElements() {
    const containers = Array.from(document.querySelectorAll('[' + VARS.hideAtt + ']'));
    const blocks = Array.from(document.querySelectorAll('[' + VARS.cssHideEl + ']'));
    const shares = Array.from(document.querySelectorAll('[' + VARS.cssHideNumberOfShares + ']'));

    const elements = [...containers, ...blocks, ...shares];

    if (VARS.Options.VERBOSITY_DEBUG) {
      for (const element of elements) {
        element.setAttribute(VARS.showAtt, '');
      }
    }
    else {
      for (const element of elements) {
        element.removeAttribute(VARS.showAtt);
      }
    }
  }

  function toggleConsecutivesElements(ev) {
    ev.stopPropagation();
    const elSummary = ev.target;
    const elDetails = elSummary.parentElement;
    const elPostContent = elDetails.querySelector('div');
    const cpidValue = elPostContent.getAttribute(postAttCPID);

    const collection = document.querySelectorAll(`div[${postAttCPID}="${cpidValue}"]`);

    if (elDetails.hasAttribute('open')) {
      // -- moving into closed state
      collection.forEach(post => {
        post.removeAttribute(VARS.showAtt);
      });
    }
    else {
      // -- moving into open state
      collection.forEach(post => {
        post.setAttribute(VARS.showAtt, '');
      });
    }
  }

  function gf_hidePost(post, reason, marker) {
    // :: hide a group feed post ...
    // -- has consecutive counts
    // -- Verbosity_Level: 0 = hide; 1 = single info note; 2 = consecutive info notes
    // -- return : nothing

    // log.info( 'gf_hidePost(); v_L:', VARS.Options.VERBOSITY_LEVEL, VARS.echoEl, VARS.echoCount, reason, post);

    post.setAttribute(postAtt, sanitizeReason(reason));

    if ((VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      // -- insert either single caption for a hidden post or accumulate a caption for 2+ consecutive hidden posts
      // -- nb: calling function will either zap or increment VARS.echoCount
      // --     they don't look at VARS.Options.VERBOSITY_LEVEL's value

      // -- the group post's element is the container ...
      // -- so, need to go down a level to insert the caption ...
      const elPostContent = post.querySelector('div');

      if (VARS.Options.VERBOSITY_LEVEL === '1') {
        // -- single caption only mode
        // -- insert a caption for a hidden post
        addCaptionForHiddenPost(elPostContent, reason, marker);
      }
      else {
        // -- consecutive caption mode (VARS.Options.VERBOSITY_LEVEL === '2')

        if (VARS.echoCount === 1) {
          // - first post in a possible consecutive collection.
          // - CPID = consecutive post id
          addCaptionForHiddenPost(elPostContent, reason, marker);
          VARS.echoCPID = generateRandomString();
          VARS.echoEl = elPostContent;
          VARS.echoEl.setAttribute(postAttCPID, VARS.echoCPID);
        }
        else {
          // - 2+ consecutive posts being hidden

          // log.info( 'gf_hidePost(); echoEL:', VARS.echoEl, VARS.echoCount, reason, post);

          // -- get the primary details element
          const elDetails = VARS.echoEl.closest('details');

          if (VARS.echoCount === 2) {
            // -- second post in same consecutive group, go back to first one and amend it ...
            addMiniCaption(VARS.echoEl, reason);
            // -- listen to open/close event - trigger a call to open/close the consecutive posts
            elDetails.addEventListener('click', toggleConsecutivesElements);
          }

          // -- update the main caption hidden post element
          elDetails.querySelector('summary').lastChild.textContent = VARS.echoCount + KeyWords.VERBOSITY_MESSAGE[1];

          // second+ posts need a mini-caption
          const elMiniCaptionSpot = elPostContent;
          // -- second+ post in same consecutive group
          addMiniCaption(elMiniCaptionSpot, reason);

          // - consecutive posts level - flag it as part of a consecutive group
          elPostContent.setAttribute(postAttCPID, VARS.echoCPID);

        }
      }

      //log.info('gf_hidePost():', VARS.echoElFirst);
    }
    else {
      // -- verbosity_level = 0
      // -- no caption required
      // -- use an attribute to hide the post
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options.VERBOSITY_DEBUG) {
        // -- insert a small label to indicate why post was flagged
        addMiniCaption(post, reason);
        post.setAttribute(VARS.showAtt, '');
      }
    }
  }

  function vf_hidePost(post, reason, marker = '') {
    // :: hide a video post ...
    // -- applies to watch videos feed
    // -- parameter 'marker' - for setting details' postTab value (optional)
    // -- no consecutive counts
    // -- Verbosity_Level: 0 = hide; 1|2 treated as 1 (no consecutive mode)
    // -- return :: nothing

    // -- mark the post with the reason for post being hidden/flagged
    post.setAttribute(postAtt, sanitizeReason(reason));

    // -- add a caption or not?
    if ((VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      // -- insert a caption for a hidden post
      addCaptionForHiddenPost(post, reason, marker);
    }
    else {
      // -- verbosity_level = 0
      // -- no caption required ...
      // -- use an attribute to hide the post
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options.VERBOSITY_DEBUG) {
        // -- insert a small label to indicate why post was flagged
        addMiniCaption(post, reason);
        post.setAttribute(VARS.showAtt, '');
      }
    }
    //log.info('nf_hidePost():', VARS.echoElFirst);
  }

  function nf_hidePost(post, reason, marker = '~') {
    // :: hide a post ...
    // -- applies to news feed + search feed
    // -- parameter 'marker' - for setting details' postTab value (optional)
    // -- no consecutive counts
    // -- Verbosity_Level: 0 = hide; 1|2 treated as 1 (no consecutive mode)
    // -- return :: nothing

    // -- mark the post with the reason for post being hidden/flagged
    post.setAttribute(postAtt, sanitizeReason(reason));

    // -- add a caption or not?
    if ((VARS.Options.VERBOSITY_LEVEL !== '0') && (reason !== '')) {
      // -- insert a caption for a hidden post
      addCaptionForHiddenPost(post, reason, marker);
    }
    else {
      // -- verbosity_level = 0
      // -- no caption required ...
      // -- use an attribute to hide the post
      post.setAttribute(VARS.hideAtt, '');
      if (VARS.Options.VERBOSITY_DEBUG) {
        // -- insert a small label to indicate why post was flagged
        addMiniCaption(post, reason);
        post.setAttribute(VARS.showAtt, '');
      }
    }
    //log.info('nf_hidePost():', VARS.echoElFirst);
  }

  function hideBlock(block, link, reason) {
    block.setAttribute(VARS.cssHideEl, '');
    link.setAttribute(postAtt, sanitizeReason(reason));
    // - in debugging mode?
    if (VARS.Options.VERBOSITY_DEBUG) {
      block.setAttribute(VARS.showAtt, '');
    }
  }


  function nf_isSponsored_ShadowRoot1(post) {
    // -- works for some languages - can be quite accurate.
    // -- in the early start, this function may have a late hit rate - fb sometimes tad bit slow in loading <element> holding the sponsored text.

    // -- Find the canvas element within the specified hierarchy
    let hasSponsoredText = false;
    const elCanvas = post.querySelector('a > span > span[aria-labelledby] > canvas');
    if (elCanvas) {
      // -- Get the 'aria-labelledby' attribute of the parent element
      const elementId = elCanvas.parentElement.getAttribute('aria-labelledby');
      // -- Check if the ID has the peculiar pattern we expect
      if (elementId && elementId.slice(0, 1) === ':') {
        // -- Escape the colon character in the ID for use in querySelector
        const escapedId = elementId.replace(/(:)/g, '\\$1');
        // -- Find the span element using the escaped ID
        const elSpan = document.querySelector(`[id="${escapedId}"]`);
        if (elSpan) {
          // -- Check if the span's text content is 'Sponsored' (in user's language)
          let lcText = elSpan.textContent.trim().toLowerCase();
          hasSponsoredText = VARS.dictionarySponsored.includes(lcText);
          // log.info( 'nf_isSponsored_ShadowRoot1(); results : ' + hasSponsoredText + "; context: " + elSpan.textContent);
        }
      }
    }
    return hasSponsoredText;
  }

  function nf_isSponsored_ShadowRoot2(post) {
    // -- works for some languages - can be quite accurate.
    // -- in the early start, this function may have a late hit rate - fb sometimes tad bit slow in loading <element> holding the sponsored text.

    // -- Find the use element within the specified hierarchy
    let hasSponsoredText = false;
    const elUse = post.querySelector('a > span > span[aria-labelledby] svg > use[*|href]');
    if (elUse) {
      // -- Get the "id" for find the element having the text we want to scan
      const elementId = elUse.href.baseVal;
      if (elementId !== "" && elementId.slice(0, 1) === "#") {
        // -- Find the text element having the elementId
        const elText = document.querySelector(`${elementId}`);
        if (elText) {
          // -- Check if the text's text content is 'Sponsored' (in user's language)
          let lcText = elText.textContent.trim().toLowerCase();
          hasSponsoredText = VARS.dictionarySponsored.includes(lcText);
          // log.info( 'nf_isSponsored_ShadowRoot2(); results : ' + hasSponsoredText + "; context: " + elText.textContent + "; lcText: " + lcText);
          // log.info( 'nf_isSponsored_ShadowRoot2(); dictionary : ' +VARS.dictionarySponsored );
        }
      }
    }
    return hasSponsoredText;
  }

  function nf_isSponsored_Plain(post) {
    // -- works for some languages - more accurate than the other methods.
    // -- simple structure.

    let hasSponsoredText = false;
    const queryElement = 'div[id] > span > a[role="link"] > span';
    const elSpans = post.querySelectorAll(queryElement);

    elSpans.forEach(elSpan => {
      if (!elSpan.querySelector('svg')) {
        const lcText = elSpan.textContent.trim().toLowerCase();
        hasSponsoredText = VARS.dictionarySponsored.includes(lcText);
        //log.info( 'nf_isSponsored_Plain(); results: ' + hasSponsoredText + "; context: " + elSpan.textContent);
      }
    });

    return hasSponsoredText;
  }

  function isSponsored(post) {
    // Is it a sponsored post?
    // -- applies to News feed, Groups feed, Videos Feed
    // -- mopUpTheMarketplaceFeed() looks after marketplace feed sponsored posts/items.

    let isSponsoredPost = false;

    if (VARS.isNF) {
      // - try method #1 - content
      isSponsoredPost = nf_isSponsored_Plain(post);
      if (isSponsoredPost == false) {
        // - try method #2 - shadow root
        isSponsoredPost = nf_isSponsored_ShadowRoot1(post);
        if (isSponsoredPost == false) {
          // - try method #3 - shadow root
          isSponsoredPost = nf_isSponsored_ShadowRoot2(post);
        }
      }
      // log.info( 'isSponsoredNF(); isSponsoredPost: ', isSponsoredPost, post);
    }
    if (isSponsoredPost === false) {
      // - try method #4 - structure ... tricky to get the size right .. prone to some false-hits.
      const PARAM_FIND = '__cft__[0]=';
      // was 308 ... trying 309
      // const PARAM_MIN_SIZE = VARS.isSF ? 250 : VARS.isVF ? 299 : 309 ;
      const PARAM_MIN_SIZE = VARS.isSF ? 250 : VARS.isVF ? 299 : 311; // 309? // 331?

      let elLinks = [];
      if (VARS.isNF || VARS.isGF) {
        // -- news feed
        // -- and possibly groups feed (haven't seen a sponsored post in groups for ages!)
        elLinks = Array.from(post.querySelectorAll(`div[aria-posinset] span > a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`));
        if (elLinks.length === 0) {
          // -- try again, some users don't have the aria-posinet attribute.
          elLinks = Array.from(post.querySelectorAll(`div[aria-describedby] span > a[href*="${PARAM_FIND}"]:not([href^="/groups/"]):not([href*="section_header_type"])`));
        }
      }
      else if (VARS.isVF) {
        // -- watch videos feed has a slightly different html structure for sponsored posts.
        // log.info( "isSponsored(); video post:", post);
        elLinks = Array.from(post.querySelectorAll(`div > div > div > div > span > span > div > a[href*="${PARAM_FIND}"]`));
      }
      else if (VARS.isSF) {
        // -- search feed - has a slightly different html structure for sponsored posts.
        elLinks = Array.from(post.querySelectorAll(`div[role="article"] span > a[href*="${PARAM_FIND}"]`));
      }
      if ((elLinks.length > 0) && (elLinks.length < 10)) {
        // > 0 : found a built post
        // < 10 : found a built post, but does not have an embedded post
        // > 9 : embedded post - unlikely to be sponsored

        // test the first 3 links.
        // -- fb sometimes changes the 4th & 5th links after playing video, which can trigger a false isSponsoredPost flag.
        const elMax = Math.min(2, elLinks.length);

        for (let i = 0; i < elMax; i++) {
          let el = elLinks[i];
          let pos = el.href.indexOf(PARAM_FIND);
          //if (VARS.isNF) log.info( "isSponsored(); isNF():: " + i + "; pos >= 0 : " + (pos >= 0) + "; " + el.href.slice(pos).length, (el.href.slice(pos).length >= PARAM_MIN_SIZE), el);
          //if (VARS.isVF) log.info( "isSponsored(); isVF():: " + i + "; pos >= 0 : " + (pos >= 0) + "; " + el.href.slice(pos).length, (el.href.slice(pos).length >= PARAM_MIN_SIZE), el);
          if (pos >= 0) {
            // log.info( "isSponsored(); testing: " + el.href.slice(pos).length, (el.href.slice(pos).length > PARAM_MIN_SIZE), post);
            if (el.href.slice(pos).length >= PARAM_MIN_SIZE) {
              // log.info( "isSponsored(); sliced: " + i + "; " + el.href.slice(pos).length, el.href, post);
              // log.info( "isSponsored(); # links: " + elLinks.length, post);
              isSponsoredPost = true;
              break;
            }
          }
        }
      }
    }

    return isSponsoredPost;
  }

  function querySelectorAllNoChildren(container = document, queries = [], minText = 0, executeAllQueries = false) {
    // -- nb: .querySelectorAll(..) can have multiple queries and will execute them all (regardless of results)
    if (!Array.isArray(queries)) {
      queries = [queries];
    }

    if (queries.length === 0) {
      return [];
    }

    if (executeAllQueries) {
      return Array.from(container.querySelectorAll(queries)).filter((el) => {
        return el.children.length === 0 && el.textContent.length >= minText;
      });
    }

    for (const query of queries) {
      const elements = container.querySelectorAll(query);
      for (const element of elements) {
        if (element.children.length === 0 && element.textContent.length >= minText) {
          return [element];
        }
      }
    }

    return [];
  }

  function nf_isSuggested(post) {
    // - check if any of the suggestions / recommendations type post
    // -- nb: "<name> commented / <name> replied to a commment" posts have similar structure - but have extra elements ...
    // -- nb: "x people recently commented" posts have similar structure - suggested/recommended posts don't start with a number ...

    const queries = [
      //     // -- June 2024
      //     'div[aria-posinset] span> div[id] > span:nth-of-type(1):not([style]):not([class])',
      //     'div[aria-describedby] span> div[id] > span:nth-of-type(1):not([style]):not([class])',

      // -- github 30/06/2024 mr-pokemon
      'div[aria-posinset] > div > div > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > span > div > span:nth-of-type(1)',
      'div[aria-describedby] > div > div > div > div > div > div:nth-of-type(2) > div > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(2) > span > div > span:nth-of-type(1)',
    ];

    const elSuggestion = querySelectorAllNoChildren(post, queries, 1);
    if (elSuggestion.length > 0) {
      if (nf_isReelsAndShortVideos(post).length > 0) {
        // -- false-positive hit.
        return '';
      }
      // -- pattern: a digit from 0 to 9 or any number in the unicode space
      // --- Basic Latin: \u0030-\u0039 (Range: 0-9)
      // --- Arabic-Indic Digits: \u0660-\u0669 (Range: ٠-٩)
      // --- Eastern Arabic-Indic Digits: \u06F0-\u06F9 (Range: ۰-۹)
      // --- Devanagari Digits: \u0966-\u096F (Range: ०-९)
      // --- Bengali Digits: \u09E6-\u09EF (Range: ০-৯)
      // --- Myanmar Digits: \u1040-\u1049 (Range: ၀-၉)
      // --- Thai Digits: \u0E50-\u0E59 (Range: ๐-๙)
      // --- Tibetan Digits: \u0F20-\u0F29 (Range: ༠-༩)
      // const pattern = /([0-9]|[\u0660-\u0669])/;
      const pattern = /([0-9]|[\u0660-\u0669]|[\u06F0-\u06F9]|[\u0966-\u096F]|[\u09E6-\u09EF]|[\u1040-\u1049]|[\u0E50-\u0E59]|[\u0F20-\u0F29])/;
      // -- if text starts with a number, return nothing, else the trigger word.
      const firstCharacter = cleanText(elSuggestion[0].textContent).trim().slice(0, 1);
      // log.info('isSuggested - match test:', firstCharacter, pattern.test(firstCharacter), pattern.test(firstCharacter) ? 'No': 'Yes' );
      return (pattern.test(firstCharacter)) ? '' : KeyWords.NF_SUGGESTIONS;
    }
    else if (nf_isGroupsYouMightLike(post)) {
      return KeyWords.NF_SUGGESTIONS;
    }
    return '';
  }

  function nf_isGroupsYouMightLike(post) {
    // -- 21/09/2024 - <name>, here are groups you might like
    const query = 'a[href*="/groups/discover"]';
    const results = post.querySelectorAll(query);
    return (results.length > 0);
  }

  function gf_isSuggested(post) {
    // - check if any of the suggestions / recommendations type post
    // -- get the blocks/sections, then have a look for <i> in 1st block (providing there's more than 1 block)
    // -- (query bypasses the dusty elements)
    // -- some users don't have [aria-posinset], hence [aria-describedby]
    let results = '';
    let blocksQuery = 'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
    let blocks = post.querySelectorAll(blocksQuery);
    if (blocks.length <= 1) {
      // try again .. (December 2022 change)
      blocksQuery = 'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
      blocks = post.querySelectorAll(blocksQuery);
    }
    if (blocks.length > 1) {
      let suggIcon = blocks[0].querySelector('i[data-visualcompletion="css-img"][style]');
      if (suggIcon) {
        results = KeyWords.GF_SUGGESTIONS;
      }
      else {
        // -- a sneaky group post without the standard suggestion/recommendation header
        let query = 'h3 > div > span ~ span > span > div > div';
        let sneakyGroupPost = blocks[1].querySelector(query);
        if (sneakyGroupPost) {
          results = KeyWords.GF_SUGGESTIONS;
        }
      }
    }
    return results;
  }

  function nf_isPeopleYouMayKnow(post) {
    //const queryPYMK = 'a[href*="/friends/suggestions/"][role="link"]';
    // -- Sept 2024
    const queryPYMK = 'a[href*="/friends/"][role="link"]';
    const linksPYMK = post.querySelectorAll(queryPYMK);
    return (linksPYMK.length === 0) ? '' : KeyWords.NF_PEOPLE_YOU_MAY_KNOW;
  }

  function nf_isPaidPartnership(post) {
    const queryPP = 'span[dir] > span[id] a[href^="/business/help/"]';
    const elPaidPartnership = post.querySelector(queryPP);
    return (elPaidPartnership === null) ? '' : KeyWords.NF_PAID_PARTNERSHIP;
  }

  function nf_isSponsoredPaidBy(post) {
    const querySPB = 'div:nth-child(2) > div > div:nth-child(2) > span[class] > span[id] > div:nth-child(2)';
    const sponsoredPaidBy = querySelectorAllNoChildren(post, querySPB, 1);
    return (sponsoredPaidBy.length === 0) ? '' : KeyWords.NF_SPONSORED_PAID;
  }

  function nf_isReelsAndShortVideos(post) {
    // -- reels and short videos (multiple)
    const queryReelsAndShortVideos = 'a[href="/reel/?s=ifu_see_more"]';
    const elReelsAndShortVideos = post.querySelector(queryReelsAndShortVideos);

    // -- method one
    if (elReelsAndShortVideos !== null) {
      return KeyWords.NF_REELS_SHORT_VIDEOS;
    }
    // -- method two
    const queryManyReels = 'a[href*="/reel/"]';
    const manyReels = post.querySelectorAll(queryManyReels);
    if (manyReels.length > 4) {
      return KeyWords.NF_REELS_SHORT_VIDEOS;
    }

    // -- method three
    // -- (dictionary based rule)
    const buttonDiv = post.querySelector('div[role="button"] > i ~ div');
    if (buttonDiv && buttonDiv.textContent) {
      const buttonText = buttonDiv.textContent.trim().toLowerCase();
      // log.info( "nf_isReelsAndShortVideos(); buttonText: ", buttonText);
      // log.info( "nf_isReelsAndShortVideos(); dictionary: ", VARS.dictionaryReelsAndShortVideos)
      if (VARS.dictionaryReelsAndShortVideos.find(item => item === buttonText)) {
        return KeyWords.NF_REELS_SHORT_VIDEOS;
      }
    }

    return '';
  }

  function nf_isShortReelVideo(post) {
    // -- reel/short video post (single)
    // -- post must have only one reel link
    const querySRV = 'a[href*="/reel/"]';
    const elementsSRV = Array.from(post.querySelectorAll(querySRV));
    return (elementsSRV.length !== 1) ? '' : KeyWords.NF_SHORT_REEL_VIDEO;
  }

  function gf_isShortReelVideo(post) {
    // -- reel/short video post (single)
    // -- post must have only one reel link
    const querySRV = 'a[href*="/reel/"]';
    const elementsSRV = Array.from(post.querySelectorAll(querySRV));
    return (elementsSRV.length !== 1) ? '' : KeyWords.GF_SHORT_REEL_VIDEO;
  }

  function nf_isEventsYouMayLike(post) {
    // -- events you may like posts
    const query = (':scope div > div:nth-of-type(2) > div > div >  h3 > span');
    const events = querySelectorAllNoChildren(post, query, 0);
    return (events.length === 0) ? '' : KeyWords.NF_EVENTS_YOU_MAY_LIKE;
  }

  function nf_isFollow(post) {
    // -- follow someone/something post
    // - Pre 09/2024
    // const queryFollow = ':scope h4[id] > span > div > span';
    // - 09/2024 - added the extra query
    //const queryFollow = ':scope h4[id] > span > div > span, :scope h4[id] > span > span > div > span, :scope h4[id] > div > span > span[class] > div[class] > span[class]';
    const queryFollow = [
      ':scope h4[id] > span > div > span',
      ':scope h4[id] > span > span > div > span',
      ':scope h4[id] > div > span > span[class] > div[class] > span[class]',
      ':scope h4[id] > span > span > span > span'
    ];
    const elementsFollow = querySelectorAllNoChildren(post, queryFollow, 0, false);
    // if (elementsFollow.length > 0) log.info( "nf_isFollow(post); elementsFollow:", elementsFollow, post);
    return (elementsFollow.length !== 1) ? '' : KeyWords.NF_FOLLOW;
  }

  function nf_isParticipate(post) {
    // -- participate in a post ...
    const queryParticipate = ':scope h4[id] > div[class] > span[dir] > span[class] > div[class] > span[class]';
    const elementsParticipate = querySelectorAllNoChildren(post, queryParticipate, 0);
    return (elementsParticipate.length !== 1) ? '' : KeyWords.NF_PARTICIPATE;
  }

  // function findFirstMatch(postFullText, textValuesToFind) {
  //   const foundText = textValuesToFind.find(text => postFullText.includes(text));
  //   return foundText !== undefined ? foundText : '';
  // }

  // function findFirstMatchRegExp(postFullText, regexpTextValuesToFind) {
  //   // -- using Regular Expressions
  //   // -- user supplied the RE patterns
  //   for (const pattern of regexpTextValuesToFind) {
  //     // -- do not use 'g' - want to reset lastindex to 0 for each test.
  //     // --'i' flag for case-insensitive matching;
  //     const regex = new RegExp(pattern, 'i');
  //     if (regex.test(postFullText)) {
  //       return pattern;
  //     }
  //   }
  //   return '';
  // }

  function nf_isBlockedText(post) {
    // - check for blocked text - partial text match
    // -- news feed post's blocks (have 1-4 blocks)
    // -- scan 1st & 3rd blocks
    // -- used by the fn extractTextContent() and fn doMoppingInfoBox()
    const postTexts = (extractTextContent(post, nf_getBlocksQuery(post), 3)).join(' ').toLowerCase();
    if (VARS.Options.NF_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.NF_BLOCKED_TEXT_LC);
      return blockedText;
    }
    else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.NF_BLOCKED_TEXT_LC);
      return blockedText;
    }
  }

  function gf_isBlockedText(post) {
    // - check for blocked text - partial text match
    // -- groups feed post's blocks (have 1-4 blocks)
    // -- scan first 3 blocks
    // -- some users don't have [aria-posinset], hence [aria-describedby]

    const postTexts = (extractTextContent(post, gf_getBlocksQuery(post), 3)).join(' ').toLowerCase();
    if (VARS.Options.GF_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.GF_BLOCKED_TEXT_LC);
      return blockedText;
    }
    else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.GF_BLOCKED_TEXT_LC);
      return blockedText;
    }

  }

  function vf_isBlockedText(post, queryBlocks) {
    // - check for blocked text - partial text match
    // -- regular videos feed post's blocks (have 1-3 blocks)
    // -- scan 1st block only
    const postTexts = (extractTextContent(post, queryBlocks, 1)).join(' ').toLowerCase();
    if (VARS.Options.vF_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.VF_BLOCKED_TEXT_LC);
      return blockedText;
    }
    else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.VF_BLOCKED_TEXT_LC);
      return blockedText;
    }
  }

  function pp_isBlockedText(post) {
    // - check for blocked text - partial text match
    // -- news feed post's blocks (have 1-4 blocks)
    // -- scan 1st & 3rd blocks
    // -- used by the fn extractTextContent() and fn doMoppingInfoBox()
    const postTexts = (extractTextContent(post, nf_getBlocksQuery(post), 3)).join(' ').toLowerCase();
    if (VARS.Options.PP_BLOCKED_RE) {
      const blockedText = findFirstMatchRegExp(postTexts, VARS.Filters.PP_BLOCKED_TEXT_LC);
      return blockedText;
    }
    else {
      const blockedText = findFirstMatch(postTexts, VARS.Filters.PP_BLOCKED_TEXT_LC);
      return blockedText;
    }
  }

  function vf_isVideoLive(post) {
    // - check for "LIVE" indicator on videos
    const liveRule = 'div[role="presentation"] ~ div > div:nth-of-type(1) > span';
    const elLive = post.querySelectorAll(liveRule);
    return (elLive.length > 0) ? KeyWords.VF_LIVE : '';
  }

  function vf_isInstagram(post) {
    // - check for Instagram video posts
    // -- usually marked with authors having href="#"
    // -- nb: some sponsored posts may have a similar structure - ignore for now.
    const instagramRule = 'div > div > div > div > div > a[href="#"] > div > svg';
    const elInstagram = post.querySelectorAll(instagramRule);
    return (elInstagram.length > 0) ? KeyWords.VF_INSTAGRAM : '';
  }

  function findDuplicateVideos(urlQuery, postQuery, patternUsed) {
    // - scan the document for all videos having the same video id.
    const watchVideos = document.querySelectorAll(urlQuery);
    // log.info( 'findDuplicateVideos(); video: ', urlQuery, ' count:', watchVideos.length);
    if (watchVideos.length < 2) {
      return;
    }
    // - flag those duplicates ...
    // for (let i = watchVideos.length - 1; i >= 1; i--) {
    //     const videoPost = watchVideos[i].closest(postQuery);
    //     // log.info( 'findDuplicateVideos(); found duplicate?', videoPost);
    //     if (videoPost) {
    //         log.info( 'findDuplicateVideos(); duplicate: ', urlQuery, postQuery, patternUsed, videoPost);
    //         vf_hidePost(videoPost, KeyWords.VF_DUPLICATE_VIDEOS, '');
    //     }
    // }
    for (let i = 1; i < watchVideos.length; i++) {
      const videoPost = watchVideos[i].closest(postQuery);
      // log.info( 'findDuplicateVideos(); found duplicate?', videoPost);
      if (videoPost) {
        log.info( 'findDuplicateVideos(); duplicate: ', urlQuery, postQuery, patternUsed, videoPost);
        vf_hidePost(videoPost, KeyWords.VF_DUPLICATE_VIDEOS, '');
      }
    }
  }

  function vf_hideDuplicateVideos(post, postQuery) {
    // -- check for duplicate video posts
    // -- hides duplicate videos
    // :: return : <nothing>

    // -- nb: there's two video url patterns to look for ...
    // -- nb: each video post has two links to the video.

    // -- try pattern #1: "/watch/?v=....&..."
    const elWatchVideo = post.querySelector('div > span > a[href*="/watch/?v="]');
    if (elWatchVideo) {
      // - extract the video-id
      const watchVideoVID = new URL(elWatchVideo.href).searchParams.get('v');
      if (watchVideoVID) {
        findDuplicateVideos(`div > span > a[href*="/watch/?v=${watchVideoVID}&"]`, postQuery, '1');
      }
    }
    else {
      // -- try pattern #2:  "/<profile-name>/videos/.../?"
      const elUserVideo = post.querySelector('div > span > a[href*="/videos/"]');
      if (elUserVideo) {
        // -- extract the video-id
        const watchVideoVID = elUserVideo.href.split('/videos/')[1].split('/')[0];
        if (watchVideoVID) {
          findDuplicateVideos(`div > span > a[href*="/videos/${watchVideoVID}/"]`, postQuery, '2');
        }
      }
    }
  }

  function vf_hideSponsoredBlock(post, query, queryBlocks) {
    let videoBlocks = post.querySelectorAll(queryBlocks);
    if (videoBlocks.length < 3) {
      return;
    }
    const thirdBlock = videoBlocks[2];
    if (thirdBlock.hasAttribute('class')) {
      return;
    }
    if (thirdBlock.hasAttribute(VARS.hideAtt)) {
      return;
    }
    thirdBlock.setAttribute(VARS.hideAtt, 'Sponsored Content');
    log.info( 'vf_hideSponsoredBlock(); third block hidden:', thirdBlock);
  }

  function getVideoPublisherPathFromURL(videoURL) {

    // -- sample incoming href:  "https://www.facebook.com/watch/accesshollywood/?__cft__[0]=AZXwuwSI60vEG7hi6bj6YdygG6S8_Afw8RDQ3P-WX2316ihzte0s3aHyt_d-lNbJsqsfaayjaKMYsZNnrysjlKgUioONtwOdliRijNMzf5t81m1NRoqCkhsH2AuhRcpfi3AzBMIyMtbvnSgtU5ETIXEAT7NWllDpX-MdZN1eZElI9_yA8ebTVTyB6Ly58z5bv_E&__tn__=%3C"
    // -- sample return href: "https://www.facebook.com/accesshollywood/"

    const beginURL = videoURL.split('?')[0];
    if (!beginURL) {
      return '';
    }
    if (beginURL.indexOf('/watch/') >= 0) {
      return beginURL.replace('/watch/', '/');
    }
    else {
      return '';
    }
  }


  function vf_setPostLinkToOpenInNewTab(post) {
    // -- from the watch videos feed, open a video post in a new window
    // -- add an icon next to the other icons at the top of the video post.
    // -- (there's no equivalent function for news feed posts - no quick way of getting the post's URL)
    // :: return <nothing>

    try {
      if (post.querySelector(`.${VARS.iconNewWindowClass}`)) {
        // -- already has the open in new window component
        return;
      }

      // - parts of the post's link can be found in the first link
      const postLinks = post.querySelectorAll('div > span > a[href*="/watch/?v="][role="link"]');

      if (postLinks.length > 0) {
        const postLink = postLinks[0];
        // -- get the container for the lower part of the header block.
        const elHeader = climbUpTheTree(postLink, 3);
        const blockOfIcons = elHeader.querySelector(':scope > div:nth-of-type(2) > span');
        let newLink = '';

        // if (blockOfIcons && blockOfIcons.querySelector(`.${VARS.iconNewWindowClass}`) === null) {
        if (blockOfIcons) {
          // -- need to create the video post's link
          // -- nb: last post may not be a post - it could be the "You've completely caught up. Check again later for more updates" post.
          // --     it doesn't have a set of icons ...
          const videoId = new URL(postLink.href).searchParams.get('v');

          if (videoId !== null) {
            // -- output structure: https://www.facebook.com/<publisher>/videos/?v=<video id>
            // --- try this:        https://www.facebook.com/<publisher>/videos/1106976933678203/
            const publisherLink = getVideoPublisherPathFromURL(post.querySelector('a[href*="/watch/"]').href);
            if (publisherLink === '') {
              return;
            }
            newLink = publisherLink + 'videos/' + videoId + '/';
          }
          else {
            return;
          }
        }
        else {
          // -- hmm, we don't have the info to reconstruct a video post link.
          return;
        }

        // -- put in fb's spacer between icons.
        const spanSpacer = document.createElement('span');
        spanSpacer.innerHTML = '<span><span style="position:absolute;width:1px;height:1px;">&nbsp;</span><span aria-hidden="true"> · </span></span>';
        blockOfIcons.appendChild(spanSpacer);

        const container = document.createElement('span');
        container.className = VARS.iconNewWindowClass;
        const span2 = document.createElement('span');
        const linkNew = document.createElement('a');
        linkNew.setAttribute('href', newLink);
        linkNew.innerHTML = images.iconNewWindow;
        linkNew.setAttribute('target', '_blank');
        span2.appendChild(linkNew);
        container.appendChild(span2);

        blockOfIcons.appendChild(container);
      }
    }
    catch (error) {
      log.error('vf_setPostLinkToOpenInNewTab(); Error:', post, error);
    }
  }

  function mp_getBlockedPrices(elBlockOfText) {
    // -- scan the first price listed in itemPrices for a match.
    // -- (second price is the old one (with strike-through))
    // -- needs to be an extact match.
    // :: return : blocked text or ''.
    if (VARS.Filters.MP_BLOCKED_TEXT.length > 0) {
      const itemPrices = mp_scanTreeForText(elBlockOfText);
      const blockedPrices = findFirstMatch(itemPrices, VARS.Filters.MP_BLOCKED_TEXT_LC);
      return blockedPrices;
    }
    return '';
  }

  function mp_getBlockedTextDescription(collectionBlocksOfText, skipFirstBlock = true) {
    // -- scan the various blocks of text for blocked text.
    // -- partial match.
    // :: return : blocked text or ''.
    if (VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION.length > 0) {
      const startIndex = skipFirstBlock ? 1 : 0;
      for (let i = startIndex; i < collectionBlocksOfText.length; i++) {
        const descriptionTextList = mp_scanTreeForText(collectionBlocksOfText[i]);
        const descriptionText = descriptionTextList.join(' ').toLowerCase();
        const blockedText = findFirstMatch(descriptionText, VARS.Filters.MP_BLOCKED_TEXT_DESCRIPTION_LC);
        if (blockedText.length > 0) {
          return blockedText;
        }
      }
    }
    return '';
  }

  function mp_doBlockingByBlockedText() {
    // -- scan the marketplace for items
    // -- hide an item if the price is listed in the list of blocked text
    // -- hide an item if the descriptinis listed in the list of blocked description text
    // :: return <nothing>


    const queries = [
      // -- October 2024 (fb changed code - personalised and non-personalised)
      // -- landing page listing
      `div[style]:not([${postAtt}]) > div > div > span > div > div > div > div > a[href*="/marketplace/item/"]`,
      `div[style]:not([${postAtt}]) > div > div > span > div > div > div > div > a[href*="/marketplace/np/item/"]`,
      // -- category page listing
      `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/item/"]`,
      `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/np/item/"]`,

      // -- March 2024 (fb changed code - personalised and non-personalised)
      // -- landing page listing
      `div[style]:not([${postAtt}]) > div > div > span > div > div > a[href*="/marketplace/item/"]`,
      `div[style]:not([${postAtt}]) > div > div > span > div > div > a[href*="/marketplace/np/item/"]`,
      // -- category page listing
      `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/item/"]`,
      `div[style]:not([${postAtt}]) > div > span > div > div > a[href*="/marketplace/np/item/"]`
    ];
    let items = [];
    for (const query of queries) {
      items = document.querySelectorAll(query);
      if (items.length > 0) {
        break;
      }
    }
    for (const item of items) {
      // - item's container
      const box = item.closest('div[style]');
      if (box.hasAttribute(postAttMPSkip)) {
        if (box.innerHTML.length == box.getAttribute(postAttMPSkip)) {
          continue;
        }
      }
      // - blocks of text to scan
      const queryTextBlock = ':scope > div > div:nth-of-type(2) > div';
      const blocksOfText = item.querySelectorAll(queryTextBlock);
      if (blocksOfText.length > 0) {
        // -- price(s) is in first block
        const blockedTextPrices = mp_getBlockedPrices(blocksOfText[0]);
        // -- description is in other blocks
        const blockedTextDescription = mp_getBlockedTextDescription(blocksOfText, true);

        if (blockedTextPrices.length > 0) {
          // -- hide the item
          mp_hideBox(box, blockedTextPrices);
        }
        else if (blockedTextDescription.length > 0) {
          // -- hide the item
          mp_hideBox(box, blockedTextDescription);
        }
        else {
          // -- flag the item not to be scanned again
          box.setAttribute(postAtt, '');
          // box.setAttribute(postAttMPSkip, box.innerHTML.length);
        }
      }
    }
  }

  function vf_scrubSponsoredBlock(post) {
    // - some videos have a sponsored block beneath the video block/section
    // - includes "watch more ___ videos by ___"
    // :: return <nothing>
    const queryForContainer = ':scope > div > div > div > div > div > div:nth-of-type(2)';
    const blocksContainer = post.querySelector(queryForContainer);
    if (blocksContainer && blocksContainer.childElementCount > 0) {
      const adBlock = blocksContainer.querySelector(':scope > a');
      if (adBlock && !adBlock.hasAttribute(postAtt)) {
        hideBlock(adBlock, adBlock, KeyWords.SPONSORED);
      }
    }
  }

  function swatTheMosquitos(post) {
    // - scan the post for any gifs that is animating (pausing them once)
    // -- does not hide the post!
    // :: return <nothing>
    const query = getMosquitosQuery();
    const animatedGIFs = post.querySelectorAll(query);
    // log.info( 'swatTheMosquitos(); animatedGIFs::', animatedGIFs, post);
    for (const gif of animatedGIFs) {
      // mimic user clicking on animating gif
      // - which will trigger fb's click event.
      // - grab the A tag that is displayed when paused (uses Opacity)
      let parent = climbUpTheTree(gif, 2);
      let sibling = parent.querySelector(':scope > a');
      if (!sibling) {
        // -- pre 2023 rule
        parent = climbUpTheTree(gif, 3);
        sibling = parent.querySelector(':scope > a');
      }
      // log.info( 'swatTheMosquitos(); gif / parent / sibling:', gif, parent, sibling);
      if (sibling) {
        const sibingCS = window.getComputedStyle(sibling);
        if (sibingCS.opacity === '0') {
          // 0 = animating; 1 = paused;
          gif.parentElement.click();
          // log.info( 'swatTheMosquitos() - paused', gif);
        }
        gif.parentElement.setAttribute(postAtt, '1');
      }
    }
  }

  function nf_getBlocksQuery(post) {
    // :: return the query needed to get a group post's blocks
    // - block 0 = Suggested headings, block 1 = title/heading, block 2 = content, block 3 = info box / comments, block 4 = comments
    // -- some users don't have [aria-posinset], hence [aria-describedby]
    let blocksQuery = 'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
    let blocks = post.querySelectorAll(blocksQuery);
    if (blocks.length <= 1) {
      // -- try again .. (December 2022 change)
      // -- no need to do another querySelectorAll(..) - extractTextContent will do this.
      blocksQuery = 'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
    }
    return blocksQuery;
  }

  function gf_getBlocksQuery(post) {
    // :: return the query needed to get a group post's blocks
    // - block 0 = Suggested headings, block 1 = title/heading, block 2 = content, block 3 = info box / comments, block 4 = comments
    let blocksQuery = 'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
    let blocks = post.querySelectorAll(blocksQuery);
    if (blocks.length <= 1) {
      // try again .. (Dec 2022 change)
      // -- no need to do another querySelectorAll(..) - extractTextContent will do this.
      blocksQuery = 'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
    }
    return blocksQuery;
  }

  function getMosquitosQuery() {
    const queryForMosquitos = `div[role="button"][aria-label*="GIF"]:not([${postAtt}]) > i:not([data-visualcompletion])`;
    return queryForMosquitos;
  }

  function nf_hasAnimatedGifContent(post) {
    // - scan the post's content for any animated gifs
    // -- scan the post's content block (2nd block) only (ignore comments block)
    // -- the gif is usually either MP4 or GIPHY ... with an round dashed label "GIF" overlay
    // :: return <reason>

    const postBlocks = post.querySelectorAll(nf_getBlocksQuery(post));

    if (postBlocks.length >= 2) {
      const contentBlock = postBlocks[1];
      const queryForAnimatedGIF = getMosquitosQuery();
      const animatedGIFs = contentBlock.querySelectorAll(queryForAnimatedGIF);
      const animatedGIFsText = (animatedGIFs.length > 0) ? KeyWords.GF_ANIMATED_GIFS_POSTS : '';
      // log.info( 'nf_hasAnimatedGifContent(); results::', contentBlock, animatedGIFs.length, animatedGIFsText, post);
      return animatedGIFsText;
    }
    return '';
  }

  function gf_hasAnimatedGifContent(post) {
    // - scan the post's content for any animated gifs
    // -- scan the post's content block only (ignore comments block)
    // -- the gif is usually either MP4 or GIPHY ... with an round dashed label "GIF" overlay
    // :: return <reason>

    const postBlocks = post.querySelectorAll(gf_getBlocksQuery(post));

    if (postBlocks.length >= 2) {
      const contentBlock = postBlocks[1];
      const queryForAnimatedGIF = getMosquitosQuery();
      const animatedGIFs = contentBlock.querySelectorAll(queryForAnimatedGIF);
      const animatedGIFsText = (animatedGIFs.length > 0) ? KeyWords.GF_ANIMATED_GIFS_POSTS : '';
      // log.info( 'gf_hasAnimatedGifContent(); results::', contentBlock, animatedGIFs.length, animatedGIFsText, post);
      return animatedGIFsText;
    }
    return '';
  }

  function nf_scrubTheTabbies() {
    // -- Tablist : stories | reels | rooms
    // -- Stories
    // -- both appear at top of NF
    const queryTabList = 'div[role="main"] > div > div > div > div > div > div > div > div[role="tablist"]';
    const elTabList = document.querySelector(queryTabList);
    if (elTabList) {
      if (elTabList.hasAttribute(postAttChildFlag)) {
        return;
      }
      // -- parent is 4 levels up.
      const elParent = climbUpTheTree(elTabList, 4);
      if (elParent) {
        hideFeature(elParent, (KeyWords.NF_TABLIST_STORIES_REELS_ROOMS[cmfSessionManager.getFeedSettings().language]).replaceAll('"', ''), false);
        elTabList.setAttribute(postAttChildFlag, 'tablist');
        return;
      }
    }
    else {
      // - Stories only
      // -- two patterns
      // -- - one with listing of stories
      // -- - one with no listing of stories

      // const queryForCreateStory = 'a[href*="/stories/create"]'; - too loose, grabs the FB menu's entries as well ...
      const queryForCreateStory = 'div[role="main"] > div > div > div > div > div > div > div > div a[href*="/stories/create"]';
      const elCreateStory = document.querySelector(queryForCreateStory);
      if (elCreateStory && !elCreateStory.hasAttribute(postAttChildFlag)) {
        const elParent = getStoriesParent(elCreateStory);
        if (elParent !== null) {
          hideFeature(elParent, KeyWords.NF_TABLIST_STORIES_REELS_ROOMS, false);
          elCreateStory.setAttribute(postAttChildFlag, '1');
        }
      }
    }

  }


  function getStoriesParent(element) {
    const elAFewBranchesUp = climbUpTheTree(element, 4);
    const moreStories = elAFewBranchesUp.querySelectorAll('a[href*="/stories/"]');
    let elParent = null;
    if (moreStories.length > 1) {
      // -- query results has create and at least 1 story link
      elParent = climbUpTheTree(element.closest('div[aria-label][role="region"]'), 4);
    }
    else {
      // -- query results has one link - create story
      elParent = climbUpTheTree(element, 7);
    }
    return elParent;
  }

  function nf_isStoriesPost(post) {
    // - Stories posts
    // -- appears in News-Feed stream
    const queryForStory = '[href^="/stories/"][href*="source=from_feed"]';
    const elStory = post.querySelector(queryForStory);
    return (elStory) ? KeyWords.NF_STORIES : '';
  }

  function nf_cleanTheConsoleTable(findItem = 'Sponsored') {
    // -- mopping up the news feed aside panel. findItem values: Sponosored | Suggestions
    // :: return : <nothing>

    const query = 'div[role="complementary"] > div > div > div > div > div:not([data-visualcompletion])';
    const asideBoxes = document.querySelectorAll(query);
    if (asideBoxes.length === 0) {
      return;
    }
    // -- only interested in the first container.
    const asideContainer = asideBoxes[0];
    if (asideContainer.childElementCount === 0) {
      return;
    }

    let elItem = null;
    let reason = '';
    if (findItem === 'Sponsored') {
      elItem = asideContainer.querySelector(`:scope > span:not([${postAtt}])`);
      if (elItem && elItem.innerHTML.length > 0) {
        reason = KeyWords.SPONSORED;
      }
    }
    else if (findItem === 'Suggestions') {
      elItem = asideContainer.querySelector(`:scope > div:not([${postAtt}])`);
      if (elItem && elItem.innerHTML.length > 0) {
        // -- check for birthdays
        const birthdays = elItem.querySelectorAll('a[href="/events/birthdays/"]').length > 0;
        // -- check for "your pages and profiles"
        // -- suggested groups only have 1 i[..] attribute
        const pagesAndProfiles = elItem.querySelectorAll('div > i[data-visualcompletion="css-img"]').length > 1;

        if (birthdays === false && pagesAndProfiles === false) {
          reason = KeyWords.NF_SUGGESTIONS;
        }
      }
    }
    if (reason.length > 0) {
      nf_hidePost(elItem, reason);
    }
  }

  function gf_cleanTheConsoleTable(findItem = 'Suggestions') {
    // -- mopping up the groups feed aside panel - suggested
    // :: return : <nothing>

    // log.info( 'gf_cleanTheConsoleTable() - fix me!');

    // return;


    if (findItem !== 'Suggestions') {
      return;
    }

    const query = `a[href*="/groups/discover"]:not([${postAtt}]) > span > span`;
    const asideBoxes = querySelectorAllNoChildren(document, query, 1);
    if (asideBoxes.length === 0) {
      return;
    }

    for (const asideBox of asideBoxes) {
      // parent is 21 levels up ...
      const elParent = climbUpTheTree(asideBox, 21);
      asideBox.closest('a').setAttribute(postAtt, KeyWords.GF_SUGGESTIONS);
      hideFeature(elParent, KeyWords.GF_SUGGESTIONS, true);
    }
  }

  function gf_setPostLinkToOpenInNewTab(post) {
    // -- from the groups feed, open a group post in a new window
    // -- add an icon next to the other icons at the top of the group post.
    // -- (there's no equivalent function for news feed posts - no quick way of getting the post's URL)
    // :: return <nothing>

    // log.info( 'gf_setPostLinkToOpenInNewTab(); post:', post);

    try {
      if (post.hasAttribute('class') && post.classList.length > 0) {
        // -- not a group post.
        return;
      }
      if (post.querySelector(`.${VARS.iconNewWindowClass}`)) {
        // -- already has the open in new window component
        return;
      }
      // - parts of the post's link can be found in the first link
      const postLinks = post.querySelectorAll('div > div > a[href*="/groups/"][role="link"]');
      if (postLinks.length > 0) {
        const postLink = postLinks[0];
        // -- get the container for the lower part of the header block.
        const elHeader = climbUpTheTree(postLink, 4);
        const blockOfIcons = elHeader.querySelector(':scope > div:nth-of-type(2) > div > div:nth-of-type(2) > span > span');
        let newLink = '';

        // if (blockOfIcons && blockOfIcons.querySelector(`.${VARS.iconNewWindowClass}`) === null) {
        if (blockOfIcons) {
          // -- need to create the group post's link
          // -- nb: last post may not be a post - it could be the "You've completely caught up. Check again later for more updates" post.
          // --     it doesn't have a set of icons ...
          const postId = new URLSearchParams(postLink.href).get('multi_permalinks');
          if (postId !== null) {
            // -- sample link: https://www.facebook.com/groups/424532172574012/?hoisted_section_header_type=recently_seen&multi_permalinks=720886619605231&__cft__[0]=AZV1vpwA0h21cVRZoS_GM3Q7H_Ul77iObEbYu2EA4oL7XyM-C78sQp5KIEpPooBCQZ2dmAMTvpCi1qYt5VxSTiCQCBkTmv8_Ra77OyacW2l685TVbttwb4qwKUm6AVr0zIapBxKODmLHgnNcYaSkXeCEOMEMdxQajQX8NTcniWYUA7OuVNY5C4F-ETSuab37Azw&__tn__=%3C%3C%2CP-R
            // -- .. converted to: https://www.facebook.com/groups/424532172574012/posts/720886619605231/
            // -- post link structure: https://www.facebook.com/groups/<group id>/posts/<post id>/
            newLink = postLink.href.split('?')[0] + 'posts/' + postId + '/';
          }
          else {
            return;
          }
        }
        else {
          // -- hmm, we don't have the info to reconstruct a group post link.
          return;
        }

        // -- put in fb's spacer between icons.
        const spanSpacer = document.createElement('span');
        spanSpacer.innerHTML = '<span><span style="position:absolute;width:1px;height:1px;">&nbsp;</span><span aria-hidden="true"> · </span></span>';
        blockOfIcons.appendChild(spanSpacer);

        const container = document.createElement('span');
        container.className = VARS.iconNewWindowClass;
        const span2 = document.createElement('span');
        const linkNew = document.createElement('a');
        linkNew.setAttribute('href', newLink);
        linkNew.innerHTML = images.iconNewWindow;
        linkNew.setAttribute('target', '_blank');
        span2.appendChild(linkNew);
        container.appendChild(span2);

        blockOfIcons.appendChild(container);
      }
    }
    catch (error) {
      log.error( 'gf_setPostLinkToOpenInNewTab(); Error:', post, error);
    }
  }

  function scrubInfoBoxes(post) {
    // -- hide the "truth" info boxes that appear in posts having a certain topic.
    // :: return <nothing>
    let hiding = false;

    if (VARS.Options.OTHER_INFO_BOX_CLIMATE_SCIENCE) {
      const elLink = post.querySelector(`a[href*="${masterKeyWords.pathInfo.OTHER_INFO_BOX_CLIMATE_SCIENCE.pathMatch}"]:not([${postAtt}])`);
      if (elLink !== null) {
        // - block @ 5 levels up.
        const block = climbUpTheTree(elLink, 5);
        hideBlock(block, elLink, KeyWords.OTHER_INFO_BOX_CLIMATE_SCIENCE);
        hiding = true;
      }
    }
    //log.info('scrubInfoBoxes():', hiding, VARS.Options.OTHER_INFO_BOX_CORONAVIRUS, masterKeyWords.pathInfo.OTHER_INFO_BOX_CORONAVIRUS.pathMatch, post);
    if (!hiding && VARS.Options.OTHER_INFO_BOX_CORONAVIRUS) {
      const elLink = post.querySelector(`a[href*="${masterKeyWords.pathInfo.OTHER_INFO_BOX_CORONAVIRUS.pathMatch}"]:not([${postAtt}])`);
      if (elLink !== null) {
        // - block @ 5 levels up.
        const block = climbUpTheTree(elLink, 5);
        hideBlock(block, elLink, KeyWords.OTHER_INFO_BOX_CORONAVIRUS);
        hiding = true;
      }
    }
    if (!hiding && VARS.Options.OTHER_INFO_BOX_SUBSCRIBE) {
      const elLink = post.querySelector(`a[href*="${masterKeyWords.pathInfo.OTHER_INFO_BOX_SUBSCRIBE.pathMatch}"]:not([${postAtt}])`);
      if (elLink !== null) {
        // - block @ 5 levels up.
        const block = climbUpTheTree(elLink, 5);
        hideBlock(block, elLink, KeyWords.OTHER_INFO_BOX_SUBSCRIBE);
        hiding = true;
      }
    }
  }

  function nf_hideNumberOfShares(post) {
    // -- hide the number of shares component
    // :: return <nothing>
    const query = `div[data-visualcompletion="ignore-dynamic"] > div:not([class]) > div:not([class]) > div:not([class]) > div[class] > div:nth-of-type(1) > div > div > span > div:not([id]) > span[dir]:not(${postAtt})`;
    const shares = post.querySelectorAll(query);
    for (const share of shares) {
      share.setAttribute(VARS.cssHideNumberOfShares, '');
      if (VARS.Options.VERBOSITY_DEBUG) {
        share.setAttribute(VARS.showAtt, '');
      }
      share.setAttribute(postAtt, 'Shares');
    }
  }

  function gf_hideNumberOfShares(post) {
    // -- groups feed posts have same '# shares' html structure as news feed posts.
    // -- .. hence calling nf_hideNumberOfShares(...)
    // :: return <nothing>
    nf_hideNumberOfShares(post);
  }

  function nf_postExceedsLikeCount(post) {
    // -- hide posts having Like counts over a certain number
    // const query = 'div[data-visualcompletion="ignore-dynamic"] > div:not([class]) > div:not([class]) > div:not([class]) > div[class] > div:nth-of-type(1) > div > div[class] > span > div[role="button"] > span[class][aria-hidden] > span:not([class]) > span[class]';
    const queryLikes = 'span[role="toolbar"] ~ div div[role="button"] > span[class][aria-hidden] > span:not([class]) > span[class]';
    const elLikes = post.querySelectorAll(queryLikes);
    if (elLikes.length > 0) {
      const maxLikes = parseInt(VARS.Options.NF_LIKES_MAXIMUM_COUNT);
      const postLikesCount = getFullNumber(elLikes[0].textContent.trim());
      // const postLikesCount = parseInt(elLikes[0].textContent);
      const results = postLikesCount >= maxLikes ? KeyWords.NF_LIKES_MAXIMUM : '';
      // log.info( 'nf_postExceedsLikeCount(); results:', results, maxLikes, postLikesCount, post);
      return results;
    }
    return false;
  }

  function getFullNumber(value) {
    // -- convert shortened numbers into full numbers
    // -- e.g 323 to 323; 1.2K to 1200; 1.4M to 1400000;
    // :: returns a whole number.
    let nvalue = 0;
    if (value !== '') {
      value = value.toUpperCase();
      if (value.endsWith('K') || value.endsWith('M')) {
        let multiplier = 1;
        let pow_Y = 0;
        if (value.endsWith('K')) {
          // -- thousands
          multiplier = 1000;
          pow_Y = 3;
        }
        else if (value.endsWith('M')) {
          // -- millions
          multiplier = 1000000;
          pow_Y = 6;
        }

        let bits = value.replace(/[KM]/g, '').replace(',', '.').split('.');

        nvalue = parseInt(bits[0], 10) * multiplier;

        if (bits.length > 1) {
          nvalue += (parseInt(bits[1], 10) * Math.pow(10, (pow_Y - bits[1].length)));
        }
      }
      else {
        // -- less than 1000.
        nvalue = parseInt(value, 10);
      }
    }
    // log.info('results:', value, nvalue);
    return nvalue;
  }


  function nf_scrubTheSurvey() {
    // -- fb survey
    // -- appears on the home page ..
    // document.querySelectorAll('a[href*="/survey/?session="] > div[role="none"]')[0].closest('[style*="border-radius"]').parentElement.parentElement.parentElement
    let btnSurvey = document.querySelector(`a[href*="/survey/?session="] > div[role="none"]:not([${postAtt}])`);
    if (btnSurvey) {
      let elContainer = climbUpTheTree(btnSurvey.closest('[style*="border-radius"]'), 3);
      if (elContainer) {
        hideFeature(elContainer, 'Survey', false);
        btnSurvey.setAttribute(postAttChildFlag, KeyWords.NF_SURVEY);
      }
    }
  }

  function hasSizeChanged(oldValue, newValue) {
    // -- any changes in the size of the html structure?
    // -- nb: fb is constantly changing something small ... hence the tolerance
    const tolerance = 16;
    // log.info( `hasSizeChanged(${oldValue}, ${newValue}); results: ${Math.abs(parseInt(newValue, 10) - parseInt(oldValue, 10))}`);
    return Math.abs(parseInt(newValue, 10) - parseInt(oldValue, 10)) > tolerance;
  }

  function isTheHouseDirty() {
    // -- check if the main column exists and has changed ...
    // -- check if dialog exists and has changed ...
    // -- applies to news feed,
    // -- using a quick/crude method of testing if something changed - check size of innerHTML
    // -- (a more advanced, but slower method would be hashing)
    // :: return : array of two items

    const arrReturn = [null, null]; // -- null means no change.

    // -- main column / content (feed)
    const mainColumnQuery = 'div[role="navigation"] ~ div[role="main"]';
    const mainColumn = document.querySelector(mainColumnQuery);
    if (mainColumn) {
      if (mainColumn.hasAttribute(mainColumnAtt) === false) {
        // -- first timer ...
        arrReturn[0] = mainColumn;
      }
      else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
        // -- change detected ...
        arrReturn[0] = mainColumn;
      }
    }

    // -- dialog (article popup)
    const elDialog = document.querySelector('div[role="dialog"]');
    if (elDialog) {
      if (elDialog.hasAttribute(mainColumnAtt) === false) {
        arrReturn[1] = elDialog;
      }
      else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
        arrReturn[1] = elDialog;
      }
    }

    VARS.noChangeCounter++;
    return arrReturn;

  }

  function gf_isTheHouseDirty() {
    // -- check if the main column exists and has changed ...
    // -- check if dialog exists and has changed ...
    // -- applies to groups feed, group feed ...
    // -- using a quick/crude method of testing if something changed - check size of innerHTML
    // -- (a more advanced, but slower method would be hashing)
    // :: return : array of two items

    const arrReturn = [null, null]; // -- null means no change.

    // -- main column / content (feed)
    const mainColumnQuery = 'div[role="navigation"] ~ div[role="main"]';
    const mainColumn = document.querySelector(mainColumnQuery);
    if (mainColumn) {
      if (mainColumn.hasAttribute(mainColumnAtt) === false) {
        // -- first timer ...
        arrReturn[0] = mainColumn;
      }
      else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
        // -- change detected ...
        arrReturn[0] = mainColumn;
      }
    }
    else {
      // -- inside a group profile ...
      const mainColumnQueryGP = 'div[role="main"] div[role="feed"]';
      const mainColumnGP = document.querySelector(mainColumnQueryGP);
      if (mainColumnGP) {
        if (mainColumnGP.hasAttribute(mainColumnAtt) === false) {
          // -- first timer ...
          arrReturn[0] = mainColumnGP;
        }
        else if (hasSizeChanged(mainColumnGP.getAttribute(mainColumnAtt), mainColumnGP.innerHTML.length)) {
          // -- change detected ...
          arrReturn[0] = mainColumnGP;
        }
      }
    }


    // -- dialog (article popup)
    const elDialog = document.querySelector('div[role="dialog"]');
    if (elDialog) {
      if (elDialog.hasAttribute(mainColumnAtt) === false) {
        arrReturn[1] = elDialog;
      }
      else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
        arrReturn[1] = elDialog;
      }
    }


    VARS.noChangeCounter++;
    return arrReturn;

  }

  function mp_isTheHouseDirty() {
    // -- check if the main column size has changed ...
    // -- if yes, do scanning.
    // -- applies to marketplace ...

    // -- two scenarios; 1) non-dialog mode, 2) dailog mode (viewing a single item).

    // -- viewing an item in dialog mode or page mode ..
    if (VARS.mpType === 'item') {
      // -- do not test for mainColumnAtt first - in dialog mode that area is [hidden] and causes the function to return null ...
      const mainColumnDM = document.querySelector('div[hidden] ~ div[class*="__"] div[role="dialog"]');
      if (mainColumnDM) {
        if (mainColumnDM.hasAttribute(mainColumnAtt)) {
          if (hasSizeChanged(mainColumnDM.getAttribute(mainColumnAtt), mainColumnDM.innerHTML.length)) {
            // -- change detected ...
            return mainColumnDM;
          }
        }
        else {
          // -- main column not yet marked
          return mainColumnDM;
        }
      }
      const mainColumnPM = document.querySelector('div[role="navigation"] ~ div[role="main"]');
      if (mainColumnPM) {
        if (mainColumnPM.hasAttribute(mainColumnAtt)) {
          if (hasSizeChanged(mainColumnPM.getAttribute(mainColumnAtt), mainColumnPM.innerHTML.length.toString())) {
            // -- change detected ...
            return mainColumnPM;
          }
        }
        else {
          // -- main column not yet marked
          return mainColumnPM;
        }
      }
    }
    else {
      // -- standard mp pages.
      const mainColumn = document.querySelector(`[${mainColumnAtt}]`);
      if (mainColumn) {
        if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
          // -- change detected ...
          return mainColumn;
        }
      }
      else {
        // -- main column not yet  marked
        const query = 'div[role="navigation"] ~ div[role="main"]';
        const mainColumn = document.querySelector(query);
        if (mainColumn) {
          return mainColumn;
        }
      }
    }
    // -- either main column not found or no change in size.
    // log.info( 'nf_isTheHouseDirty(); - no mainColumn found / no change in size');
    VARS.noChangeCounter++;
    return null;
  }

  function sf_isTheHouseDirty() {
    // -- check if the main column size has changed ...
    // -- if yes, do scanning.
    // -- applies to search results feed

    const query = 'div[role="region"] ~ div[role="main"]';
    const mainColumn = document.querySelector(query);
    if (mainColumn) {
      if (mainColumn.hasAttribute(mainColumnAtt) === false) {
        // -- first timer
        return mainColumn;
      }
      if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
        return mainColumn;
      }
    }

    // log.info( 'nf_isTheHouseDirty(); - no mainColumn found / no change in size');
    VARS.noChangeCounter++;
    return null;
  }

  function vf_isTheHouseDirty() {
    // -- check if the main column size has changed ...
    // -- if yes, do scanning.
    // -- applies to videos feed ...

    const arrReturn = [null, null]; // -- null means no change

    // -- main column / content (feed)
    // -- nb: sometimes we get more than one set of elements matching this ..
    // -- the first 2 could be related to "new videos for you * 1" ..
    // -- so grab the last one ...
    const mainColumnQuery = 'div[role="navigation"] ~ div[role="main"] div[role="main"] > div > div > div > div > div';
    const mainColumns = document.querySelectorAll(mainColumnQuery);
    //const mainColumn = document.querySelector(mainColumnQuery);
    let mainColumn = null;
    if (mainColumns.length > 0) {
      // - bypass the "new videos for you * 1" ...
      mainColumn = mainColumns[mainColumns.length - 1];
    }
    // log.info( 'vf_isTheHouseDirty(); mainColumn(1):', mainColumn);
    if (mainColumn) {
      if (mainColumn.hasAttribute(mainColumnAtt) === false) {
        // -- first  timer
        arrReturn[0] = mainColumn;
      }
      else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
        // -- change detected ...
        arrReturn[0] = mainColumn;
      }
    }

    // -- dialog box (clicked 'expand' from video feed)
    // -- nb: vfType === 'item'
    const elDialog = document.querySelector('div[role="dialog"] div[role="main"]');
    // log.info( 'vf_isTheHouseDirty(); mainColumn(2):', elDialog);
    if (elDialog) {
      if (elDialog.hasAttribute(mainColumnAtt) === false) {
        arrReturn[1] = elDialog;
      }
      else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
        arrReturn[1] = elDialog;
      }
    }

    VARS.noChangeCounter++;
    return arrReturn;
  }

  function pp_isTheHouseDirty() {
    // -- check if the main column size has changed ...
    // -- if yes, do scanning.
    // -- applies to profile pages feed

    const arrReturn = [null, null]; //-- null means no change

    // -- main column / content (feed)
    const mainColumnQuery = 'div[role="main"]';
    const mainColumn = document.querySelector(mainColumnQuery);
    if (mainColumn) {
      if (mainColumn.hasAttribute(mainColumnAtt) === false) {
        // -- first timer
        arrReturn[0] = mainColumn;
      }
      else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
        // -- change detected ...
        arrReturn[0] = mainColumn;
      }
    }

    // -- dialog (article popup)
    const elDialog = document.querySelector('div[role="dialog"]');
    if (elDialog) {
      if (elDialog.hasAttribute(mainColumnAtt) === false) {
        arrReturn[1] = elDialog;
      }
      else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
        arrReturn[1] = elDialog;
      }
    }

    VARS.noChangeCounter++;
    return arrReturn;
  }

  function mopUpTheNewsFeed() {
    // -- mopping up the news feed page

    const [mainColumn, elDialog] = isTheHouseDirty();
    if (mainColumn === null && elDialog === null) {
      return;
    }

    if (mainColumn) {

      // -- Tablist - not part of the general news feed stream
      // -- Includes Stories (standalone tab)
      if (VARS.Options.NF_TABLIST_STORIES_REELS_ROOMS) {
        nf_scrubTheTabbies();
      }
      if (VARS.Options.NF_SURVEY) {
        nf_scrubTheSurvey();
      }

      // -- aside's sponsored
      if (VARS.Options.NF_SPONSORED) {
        nf_cleanTheConsoleTable('Sponsored');
      }

      // -- aside's suggestions
      if (VARS.Options.NF_SUGGESTIONS) {
        nf_cleanTheConsoleTable('Suggestions');
      }

      // -- news feed stream ...
      const posts = nf_getCollectionOfPosts();

      // log.info( 'mopUpTheNewsFeed(); number of posts:', posts.length);

      for (const post of posts) {

        if (post.innerHTML.length === 0) {
          // -- fb is clearing out the posts as the user scrolls ...
        }
        else {
          let hideReason = '';
          let isSponsoredPost = false;

          if (post.hasAttribute(postAtt)) {
            // -- already flagged ...
            hideReason = 'hidden';
          }
          // else if ((post[postPropDS] !== undefined) && (parseInt(post[postPropDS]) >= VARS.scanCountMaxLoop)) {
          //     // -- skip these - already been scanned a few times
          //     log.info(log, 'mopping(); skipping:' + post[postPropDS] + '; ' + post);
          // }
          else {
            doLightDusting(post);

            if (hideReason === '' && VARS.Options.NF_REELS_SHORT_VIDEOS) {
              hideReason = nf_isReelsAndShortVideos(post);
            }
            if (hideReason === '' && VARS.Options.NF_SHORT_REEL_VIDEO) {
              hideReason = nf_isShortReelVideo(post);
            }
            if (hideReason === '' && VARS.Options.NF_PAID_PARTNERSHIP) {
              hideReason = nf_isPaidPartnership(post);
            }
            if (hideReason === '' && VARS.Options.NF_PEOPLE_YOU_MAY_KNOW) {
              hideReason = nf_isPeopleYouMayKnow(post);
            }
            if (hideReason === '' && VARS.Options.NF_SUGGESTIONS) {
              hideReason = nf_isSuggested(post);
            }
            if (hideReason === '' && VARS.Options.NF_FOLLOW) {
              hideReason = nf_isFollow(post);
            }
            if (hideReason === '' && VARS.Options.NF_PARTICIPATE) {
              hideReason = nf_isParticipate(post);
            }
            if (hideReason === '' && VARS.Options.NF_SPONSORED_PAID) {
              hideReason = nf_isSponsoredPaidBy(post);
            }
            if (hideReason === '' && VARS.Options.NF_EVENTS_YOU_MAY_LIKE) {
              hideReason = nf_isEventsYouMayLike(post);
            }
            if (hideReason === '' && VARS.Options.NF_STORIES) {
              hideReason = nf_isStoriesPost(post);
            }
            if (hideReason === '' && VARS.Options.NF_ANIMATED_GIFS_POSTS) {
              hideReason = nf_hasAnimatedGifContent(post);
            }
            // -- placed here due to "overlaps" between this rule and at least 1 of the above rule.
            if (hideReason === '' && VARS.Options.NF_SPONSORED && isSponsored(post)) {
              isSponsoredPost = true;
              hideReason = KeyWords.SPONSORED;
            }
            // -- sponsored + blocked text sometimes overlap. sponsored takes priority.
            if (hideReason === '' && VARS.Options.NF_BLOCKED_ENABLED) {
              hideReason = nf_isBlockedText(post);
            }
            if (hideReason === '' && VARS.Options.NF_LIKES_MAXIMUM && VARS.Options.NF_LIKES_MAXIMUM !== '') {
              hideReason = nf_postExceedsLikeCount(post);
            }
          }

          if (hideReason.length > 0) {
            if (hideReason !== 'hidden') {
              // -- post not yet hidden, hide it.
              nf_hidePost(post, hideReason, isSponsoredPost);
            }
          }
          else {
            // -- not a hidden post

            // -- run pause animation (useful to hide those animated posts/comments)
            if (VARS.Options.NF_ANIMATED_GIFS_PAUSE) {
              swatTheMosquitos(post);
            }
            // -- hide info boxes
            if (VARS.hideAnInfoBox) {
              scrubInfoBoxes(post);
            }
            // -- hide number of shares box
            if (VARS.Options.NF_SHARES) {
              nf_hideNumberOfShares(post);
            }
          }
        }
      }

      mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
      VARS.noChangeCounter = 0;
    }

    if (elDialog) {
      // -- viewing a post in a "dialog-box" (triggered by viewing more comments)
      if (VARS.Options.NF_ANIMATED_GIFS_PAUSE) {
        swatTheMosquitos(elDialog);
      }
      elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
      VARS.noChangeCounter = 0;
    }

  }

  function mopUpTheGroupsFeed() {
    // -- mopping up the groups feed page

    // log.info('mopUpTheGroupsFeed(), gfType:', VARS.gfType, '; hide an info box:', VARS.hideAnInfoBox);

    const [mainColumn, elDialog] = gf_isTheHouseDirty();
    if (mainColumn === null && elDialog === null) {
      return;
    }

    if (mainColumn) {

      if (VARS.gfType === 'groups' || VARS.gfType === 'groups-recent' || VARS.gfType === 'search') {
        // - main groups feed.
        // -- 'groups' - accessible via the Groups link
        // -- 'groups-recent' - accessible via the Feeds > group link (has similar HTML structure to News Feed)
        // -- 'search' - groups (same layout as groups feed)

        // -- aside's suggestions (also appears above feed on narrow pages)
        if (VARS.Options.GF_SUGGESTIONS) {
          gf_cleanTheConsoleTable('Suggestions');
        }

        // -- groups feed stream ...
        const query = VARS.gfType === 'groups-recent' ? 'h2[dir="auto"] + div > div' : 'div[role="feed"] > div';
        const posts = Array.from(document.querySelectorAll(query));
        if (posts.length > 0) {
          // log.info('---> mopUpTheGroupsFeed() - multiple groups');
          const count = posts.length;
          const start = (count < 25) ? 0 : (count - 25);

          // for (const post of posts) {
          for (let i = start; i < count; i++) {
            const post = posts[i];

            if (post.innerHTML.length === 0) {
              continue;
            }

            let hideReason = '';

            // -- add the "open post in new tab link+icon".
            if ((VARS.gfType === 'groups') && (post[postPropDS] === undefined)) {
              gf_setPostLinkToOpenInNewTab(post);
            }

            if (post.hasAttribute(postAtt)) {
              // -- already flagged
              hideReason = 'hidden';
            }
            // else if ((post[postPropDS] !== undefined) && (parseInt(post[postPropDS]) >= VARS.scanCountMaxLoop)) {
            //     // -- skip these - already been scanned a few times
            // }
            else {

              doLightDusting(post);

              if (hideReason === '' && VARS.Options.GF_SPONSORED && isSponsored(post)) {
                hideReason = KeyWords.SPONSORED;
              }
              if (hideReason === '' && VARS.Options.GF_SUGGESTIONS) {
                hideReason = gf_isSuggested(post);
              }
              // if (hideReason === '' && VARS.Options.GF_PAID_PARTNERSHIP) {
              //     //log.info( 'mopUpTheGroupsFeed(), ---- Paid partnership - needs code ----')
              // }
              if (hideReason === '' && VARS.Options.GF_SHORT_REEL_VIDEO) {
                hideReason = gf_isShortReelVideo(post);
              }
              if (hideReason === '' && VARS.Options.GF_BLOCKED_ENABLED) {
                hideReason = gf_isBlockedText(post);
              }
              if (hideReason === '' && VARS.Options.GF_ANIMATED_GIFS_POSTS) {
                hideReason = gf_hasAnimatedGifContent(post);
              }
            }

            if (hideReason.length > 0) {
              // -- increment hidden count
              VARS.echoCount++;
              if (hideReason !== 'hidden') {
                // -- post not yet hidden, hide it.
                gf_hidePost(post, hideReason);
              }
            }
            else {
              // -- not a hidden post
              // -- reset hidden count
              VARS.echoCount = 0;
              // -- run pause animation (useful to hide those animated comments)
              if (VARS.Options.GF_ANIMATED_GIFS_PAUSE) {
                // log.info( 'pausing animations ...');
                swatTheMosquitos(post);
              }
              // -- hide info boxes
              if (VARS.hideAnInfoBox) {
                scrubInfoBoxes(post);
              }
              // -- hide number of shares box
              if (VARS.Options.GF_SHARES) {
                gf_hideNumberOfShares(post);
              }
            }
            // log.info('mopUpTheGroupsFeed:', hideReason, VARS.echoCount, post);
          }
        }
        // log.info('<--- mopUpTheGroupsFeed() - multiple groups');
      }
      else {
        // - single group ...
        const query = 'div[role="feed"] > div';
        const posts = Array.from(document.querySelectorAll(query));
        if (posts.length) {
          // log.info('---> mopUpTheGroupsFeed() - single group');
          for (const post of posts) {

            if (post.innerHTML.length === 0) {
              continue;
            }

            let hideReason = '';

            if (post.hasAttribute(postAtt)) {
              // -- already flagged
              hideReason = 'hidden';
            }
            // else if ((post[postPropDS] !== undefined) && (parseInt(post[postPropDS]) >= VARS.scanCountMaxLoop)) {
            //     // -- skip these - already scanned a few times
            //     // log.info( 'skipping:', post);
            // }
            else {
              doLightDusting(post);

              if (hideReason === '' && VARS.Options.GF_SHORT_REEL_VIDEO) {
                hideReason = gf_isShortReelVideo(post);
              }
              if (hideReason === '' && VARS.Options.GF_BLOCKED_ENABLED) {
                hideReason = gf_isBlockedText(post);
              }
              if (hideReason === '' && VARS.Options.GF_ANIMATED_GIFS_POSTS) {
                hideReason = gf_hasAnimatedGifContent(post);
              }
            }

            if (hideReason.length > 0) {
              // -- increment hidden counter
              VARS.echoCount++;
              if (hideReason !== 'hidden') {
                // -- post not yet hidden, hide it.
                gf_hidePost(post, hideReason);
              }
            }
            else {
              // -- not a hidden post
              // -- reset hidden count
              VARS.echoCount = 0;
              // -- run pause animation (useful to hide those animated posts/comments)
              if (VARS.Options.GF_ANIMATED_GIFS_PAUSE) {
                // log.info( 'pausing animations ...');
                swatTheMosquitos(post);
              }
              // -- hide info boxes
              if (VARS.hideAnInfoBox) {
                scrubInfoBoxes(post);
              }
              // -- hide number of shares box
              if (VARS.Options.GF_SHARES) {
                gf_hideNumberOfShares(post);
              }
            }
          }
          // log.info('<--- mopUpTheGroupsFeed() - single group');
        }
      }

      mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
      VARS.noChangeCounter = 0;
    }

    if (elDialog) {
      // -- viewing a post in a "dialog-box" (triggered by viewing more comments)
      if (VARS.Options.GF_ANIMATED_GIFS_PAUSE) {
        swatTheMosquitos(elDialog);
      }
      elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
      VARS.noChangeCounter = 0;
    }

  }

  function mopUpTheWatchVideosFeed() {
    // -- mopping up the watch videos feed page

    const [mainColumn, elDialog] = vf_isTheHouseDirty();
    // log.info( 'mopUpTheWatchVideosFeed(); video type:', VARS.vfType, '; mainColumn:', mainColumn, '; elDialog:', elDialog);
    if (mainColumn === null && elDialog === null) {
      return;
    }

    const container = (elDialog ? elDialog : mainColumn);
    // log.info( 'mopUpTheWatchVideosFeed(); container:', container);
    if (container) {
      let query;
      let queryBlocks;
      if (VARS.vfType === 'videos') {
        // -- normal feed
        query = ':scope > div > div:not([class]) > div';
        queryBlocks = ':scope > div > div > div > div > div:nth-of-type(2) > div';
      }
      else if (VARS.vfType === 'search') {
        // -- videos --> search
        query = 'div[role="feed"] > div[role="article"]';
        queryBlocks = ':scope > div > div > div > div > div > div > div:nth-of-type(2)';
      }
      else if (VARS.vfType === 'item') {
        // -- videos --> search --> item (videos being listed below the video of interest)
        // -- video - via link
        query = 'div[id="watch_feed"] > div > div:nth-of-type(2) > div > div > div > div:nth-of-type(2) > div > div > div > div';
        queryBlocks = ':scope > div > div > div > div > div:nth-of-type(2) > div';
      }
      else {
        return;
      }

      //            log.info( 'mopUpTheWatchVideosFeed(); container:', container, '; type:', VARS.vfType, '; query:', query);

      if (VARS.vfType !== 'search') {
        const posts = container.querySelectorAll(query);
        // log.info( 'mopUpTheWatchVideosFeed(); container:', container, '; type:', VARS.vfType, '; query:', query, '; posts:', posts);
        for (const post of posts) {
          // if (post.innerHTML.length === 0) {
          //     continue;
          // }
          if (countDescendants(post) < 3) {
            // -- bad post - purge it.
            // -- fb sometimes "forget" to finish creating a post
            // log.info( 'videos - dummy post found and removed ... next post:', post.parentElement.nextElementSibling);
            // -- disabled the .remove() as it can sometimes be a bit too aggressive ...
            // post.parentElement.remove();
            continue;
          }

          let hideReason = '';

          // -- add the open post in new tab link+icon.
          if ((VARS.vfType === 'videos') && (post[postPropDS] === undefined)) {
            vf_setPostLinkToOpenInNewTab(post);
          }

          if (post.hasAttribute(postAtt)) {
            // -- already hidden
            hideReason = 'hidden';
          }
          // else if ((post[postPropDS] !== undefined) && (parseInt(post[postPropDS]) >= VARS.scanCountMaxLoop)) {
          //     // -- skip these - already been scanned a few times
          //     // log.info( 'video; skipping;', post[postPropDS], VARS.scanCountMaxLoop, post);
          // }
          else {
            doLightDusting(post);

            if (hideReason === '' && VARS.Options.VF_SPONSORED && isSponsored(post)) {
              hideReason = KeyWords.SPONSORED;
            }
            if (hideReason === '' && VARS.Options.VF_LIVE) {
              hideReason = vf_isVideoLive(post);
            }
            if (hideReason === '' && VARS.Options.VF_INSTAGRAM) {
              hideReason = vf_isInstagram(post);
            }
            if (hideReason === '' && VARS.Options.VF_DUPLICATE_VIDEOS) {
              // -- vf_hideDuplicateVideos() will hide the duplicates
              // -- returns nothing.
              vf_hideDuplicateVideos(post, query);
              if (post.hasAttribute(postAtt)) {
                // -- prevent doubling up of hiding the video post.
                hideReason === 'hidden';
              }
            }
            if (hideReason === '' && VARS.Options.VF_BLOCKED_ENABLED) {
              hideReason = vf_isBlockedText(post, queryBlocks);
            }
            // log.info( 'mopUpTheWatchVideosFeed(); ::: hideReason:', hideReason, post, queryBlocks);
          }

          if (hideReason.length > 0) {
            if (hideReason !== 'hidden') {
              // -- post not yet hidden, hide it.
              vf_hidePost(post, hideReason);
            }
          }
          else {
            // -- not a hidden post
            // -- run pause animation (useful to hide those animated posts/comments)
            if (VARS.Options.VF_ANIMATED_GIFS_PAUSE) {
              // log.info( 'pausing animations ...');
              swatTheMosquitos(post);
            }
            // -- hide info boxes
            if (VARS.hideAnInfoBox) {
              scrubInfoBoxes(post);
            }
            // -- nb: videos do not have a number of shares box

            // -- hide sponsored blocks (appears between video & comments)
            vf_scrubSponsoredBlock(post);
          }

          // -- check for sponsored content beneath the video ...
          vf_hideSponsoredBlock(post, query, queryBlocks);
        }
      }
      else {
        // -- search videos
        // -- structure is different from regular video feed
        // -- thumbnail on left, text on right
        const posts = document.querySelectorAll(query);
        for (const post of posts) {

          let hideReason = '';

          if (post.hasAttribute(postAtt)) {
            // -- already hidden
            hideReason = 'hidden';
          }
          else {
            if (VARS.Options.VF_BLOCKED_ENABLED) {
              hideReason = vf_isBlockedText(post, queryBlocks);
            }
          }

          if (hideReason.length > 0) {
            if (hideReason !== 'hidden') {
              // -- post not yet hidden, hide it.
              vf_hidePost(post, hideReason);
            }
          }
          else {
            // -- not a hidden post
          }
        }
      }

      container.setAttribute(mainColumnAtt, container.innerHTML.length.toString());
      VARS.noChangeCounter = 0;
    }

    if (elDialog) {
      // -- viewing a post in a "dialog-box" (triggered by viewing more comments)
      if (VARS.Options.NF_ANIMATED_GIFS_PAUSE) {
        swatTheMosquitos(elDialog);
      }
      // elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
      // VARS.noChangeCounter = 0;
    }

  }

  function mp_hideBox(box, reason) {
    box.setAttribute(VARS.hideWithNoCaptionAtt, '');
    box.setAttribute(postAtt, sanitizeReason(reason));
    if (VARS.Options.VERBOSITY_DEBUG) {
      box.setAttribute(VARS.showAtt, '');
    }
  }

  function mp_stopTrackingDirtIntoMyHouse() {
    // -- remove tracking bits
    const collectionOfLinks = document.querySelectorAll('a[href*="/?ref="]');
    for (const trackingLink of collectionOfLinks) {
      trackingLink.href = trackingLink.href.split('/?ref')[0];
    }
  }

  function mp_hideSponsoredItems() {

    // -- landing page listing - items above categories
    // -- sponsored posts have <span> as the first child element ...
    const query = `div[${mainColumnAtt}] > div > div > div > div > div > div[style] > span`;
    const items = document.querySelectorAll(query);
    for (const item of items) {
      // - item's container
      // const box = item.closest('div[style]');
      const box = item.parentElement;
      if (box.hasAttribute(postAttMPSkip)) {
        if (box.innerHTML.length == box.getAttribute(postAttMPSkip)) {
          continue;
        }
      }
      mp_hideBox(box, KeyWords.SPONSORED);
    }
  }

  function mopUpTheMarketplaceFeed() {
    // -- mopping up parts of the Marketplace ...

    const mainColumn = mp_isTheHouseDirty();
    // log.info( 'clean(); mainColumn:', mainColumn, VARS.mpType);
    if (mainColumn === null) {
      return;
    }

    mp_stopTrackingDirtIntoMyHouse();

    // log.info( 'mopUpTheMarketplaceFeed(); mpType:', VARS.mpType);

    if (VARS.mpType === 'marketplace' || VARS.mpType === 'item') {
      // - standard marketplace page
      // - on the item page, there's listing of items to sell ... (similar structure to standard marketplace page)


      if (VARS.Options.MP_SPONSORED) {
        // -- sponsored items (above sections) (untested)
        mp_hideSponsoredItems();

        // -- sponsored items in "categories"
        // -- two parts - heading + item
        // -- nb: adguard base filter hides the heading, but not the item
        const queryHeadings = `div:not([${postAtt}]) > a[href="/ads/about/?entry_product=ad_preferences"], div:not([${postAtt}]) > object > a[href="/ads/about/?entry_product=ad_preferences"]`;
        const headings = document.querySelectorAll(queryHeadings);

        let queryItems = `div[style]:not([${postAtt}]) > span > div:first-of-type > a:not([href*="marketplace"])`;
        let items = document.querySelectorAll(queryItems);
        if (items.length === 0) {
          // -- structure changed in Nov 2023.
          queryItems = `div[style]:not([${postAtt}]) > span > div:first-of-type > div > a:not([href*="marketplace"])`;
          items = document.querySelectorAll(queryItems);
        }

        // log.info('marketplace(); headings:', headings);
        // log.info('marketplace(); items:', items);
        // log.info('marketplace(); bool:', (VARS.Options.MP_SPONSORED && (headings.length > 0) && (items.length > 0)));

        if (VARS.Options.MP_SPONSORED && (headings.length > 0) && (items.length > 0)) {
          for (const heading of headings) {
            // heading = heading.parentElement;
            mp_hideBox(heading.parentElement, KeyWords.SPONSORED);
          }
          for (const item of items) {
            // const parentItem = climbUpTheTree(item, 3);
            const parentItem = climbUpTheTree(item, 4);
            mp_hideBox(parentItem, KeyWords.SPONSORED);
          }
        }
      }

      if (VARS.Options.MP_BLOCKED_ENABLED) {
        mp_doBlockingByBlockedText();
      }
    }
    if (VARS.mpType === 'item') {
      // -- viewing a marketplace item - a small sponsored box often shows up on the right.
      if (VARS.Options.MP_SPONSORED) {
        const elDialog = document.querySelector('div[role="dialog"]');
        if (elDialog) {
          // -- viewing a mp item via mp feed (no new tab or reloaded page)
          const query = `span h2 [href*="/ads/about/"]:not([${postAtt}])`;
          const elLink = elDialog.querySelector(query);
          if (elLink) {
            const box = elLink.closest('h2').closest('span');
            mp_hideBox(box, KeyWords.SPONSORED);
            elLink.setAttribute(postAtt, KeyWords.SPONSORED);
          }
        }
        else {
          // -- viewing a mp item in a new tab / reloaded page.
          const query = `div[${mainColumnAtt}] span h2 [href*="/ads/about/"]:not([${postAtt}])`;
          const elLink = document.querySelector(query);
          if (elLink) {
            const box = elLink.closest('h2').closest('span');
            mp_hideBox(box, KeyWords.SPONSORED);
            elLink.setAttribute(postAtt, KeyWords.SPONSORED);
          }
        }
      }
    }
    else if ((VARS.mpType === 'category') || (VARS.mpType === 'search')) {
      // - viewing a markplace category or marketplace search results
      // - (both have similar layout)
      if (VARS.Options.MP_SPONSORED) {
        // -- sponsored items
        mp_hideSponsoredItems();
        // const query = `a[href*="/ads/"]:not([${postAtt}])`;
        // const elements = document.querySelectorAll(query);
        // for (const element of elements) {
        //     // log.info( 'mp-clean:', element);
        //     element.setAttribute(postAtt, element.innerHTML.length);
        //     const itemBox = climbUpTheTree(element.parentElement.closest('a'), 3);
        //     mp_hideBox(itemBox, KeyWords.SPONSORED);
        // }
      }
      if (VARS.Options.MP_BLOCKED_ENABLED) {
        mp_doBlockingByBlockedText();
      }
    }

    mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
    VARS.noChangeCounter = 0;

  }

  function mopUpTheSearchFeed() {
    // mopping up the search feed / results
    // -- (nb: has similar layout to news feed stream)
    // -- "borrow" news feed's text filter.

    const mainColumn = sf_isTheHouseDirty();
    if (mainColumn === null) {
      return;
    }

    if (VARS.Options.NF_BLOCKED_ENABLED) {
      //            const query = 'div[role="feed"] > div';
      const query = 'div[role="feed"] > div > div';
      const posts = Array.from(document.querySelectorAll(query));

      for (const post of posts) {

        if (post.innerHTML.length === 0) {
          continue;
        }

        let hideReason = '';
        let isSponsoredPost = false;

        if (post.hasAttribute(postAtt)) {
          hideReason = 'hidden';
        }
        else {
          if (VARS.Options.NF_SPONSORED && isSponsored(post)) {
            hideReason = KeyWords.SPONSORED;
            isSponsoredPost = true;
          }
          if (hideReason === '' && VARS.Options.NF_BLOCKED_ENABLED) {
            hideReason = nf_isBlockedText(post);
          }
        }

        if (hideReason.length > 0) {
          // -- increment hidden count
          VARS.echoCount++;
          if (hideReason !== 'hidden') {
            // -- post not yet hidden, hide it.
            nf_hidePost(post, hideReason, isSponsoredPost);
          }
        }
        else {
          // -- not a hidden post
          // -- reset hidden count
          VARS.echoCount = 0;
          // -- run pause animation (useful to hide those animated comments)
          if (VARS.Options.NF_ANIMATED_GIFS_PAUSE) {
            // log.info( 'pausing animations ...');
            swatTheMosquitos(post);
          }
          // -- hide info boxes
          if (VARS.hideAnInfoBox) {
            scrubInfoBoxes(post);
          }
        }
      }
    }

    mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
    VARS.noChangeCounter = 0;

  }

  function mopUpTheReelFeed(caller) {

    // -- Reels ...

    // -- saveUserOptions will also call this function ...

    // -- nb: videos from the watch videos feed are also collected in the query ..
    // -- .. but they do not have a container with [data-video-id] attribute
    // -- .. and therefore skipped ...

    // -- nb: setting VARS.isRF determines if this function is called or not.

    // log.info( 'mopUpTheReelFeed(); ', VARS.isRF, VARS.isRF_InTimeoutMode);

    if (!VARS.isRF) {
      // -- no longer in Reels Feed
      VARS.isRF_InTimeoutMode = false;
      return;
    }
    if (caller !== 'self' && VARS.isRF_InTimeoutMode === true) {
      // -- saveUserOptions or another function is calling and TimeoutMode is currently active.
      return;
    }

    const videoRules = `[data-video-id] video:not([${rvAtt}])`;
    const videos = document.querySelectorAll(videoRules);

    // log.info( 'mopUpTheReelFeed(); videos:', caller, videos);

    for (const video of videos) {
      // -- get the video's container's child element
      const elVideoId = video.closest('[data-video-id]');
      if (elVideoId) {
        // -- get the video's container
        const videoContainer = elVideoId.parentElement;
        if (videoContainer) {
          if (VARS.Options.REELS_CONTROLS === true) {
            // -- get the video's description + audio track info container.
            const descriptionOverlay = videoContainer.nextElementSibling;
            if (descriptionOverlay) {
              // -- make room to display the controls by moving the description element up a bit ...
              const elDescriptionContainer = descriptionOverlay.children[0];
              elDescriptionContainer.setAttribute('style', `margin-bottom:${VARS.isChromium ? '4.5' : '2.25'}rem;`);
              // -- enable controls on the video
              video.setAttribute('controls', 'true');
              // -- hide the video's sibling (makes it easier to click on the video's controls)
              const sibling = video.nextElementSibling;
              if (sibling) {
                sibling.setAttribute('style', 'display:none;');
              }
            }
          }
          if (VARS.Options.REELS_DISABLE_LOOPING === true) {
            // -- stop the video
            video.addEventListener('ended', function (ev) {
              ev.target.pause();
            });
          }
          video.setAttribute(rvAtt, '1');
        }
        else {
          // -- a video from the watch videos feed
          // -- hidden underneath the reels feed overlay)
        }
      }
    }
    // -- call me again in a few ms ...
    VARS.isRF_InTimeoutMode = true;
    setTimeout(function () {
      mopUpTheReelFeed('self');
    }, 1000);
  }

  function mopUpTheProfilePage() {
    // -- profile pages

    const proceed = VARS.Options.PP_BLOCKED_ENABLED || VARS.Options.PP_ANIMATED_GIFS_POSTS || VARS.Options.PP_ANIMATED_GIFS_PAUSE;
    // log.info( "mopUpTheProfilePage(); proceed:", proceed, "PP_BLOCKED_ENABLED:", VARS.Options.PP_BLOCKED_ENABLED, "PP_ANIMATED_GIFS_POSTS:", VARS.Options.PP_ANIMATED_GIFS_POSTS, "PP_ANIMATED_GIFS_PAUSE:", VARS.Options.PP_ANIMATED_GIFS_PAUSE);
    if (!proceed) {
      return;
    }

    const [mainColumn, elDialog] = pp_isTheHouseDirty();
    // log.info( "mopUpTheProfilePage(); mainC:", mainColumn, "elDialog:", elDialog);
    if (mainColumn === null && elDialog === null) {
      return;
    }

    // log.info( 'mopUpTheProfilePage(); size changed, doing some cleaning ... (mainColumn / elDialog)', mainColumn, elDialog);

    if (mainColumn) {
      // profile page feed stream ...
      //const query = 'div[role="main"] > div > div > div > div:nth-of-type(2) > div:nth-of-type(2) > div > div';
      //const query = 'div[role="main"] > div > div > div > div:nth-of-type(2) > div:nth-of-type(2) > div > div[class]';
      const query = 'div[role="main"] > div > div > div > div:nth-of-type(2) > div:not([class]) > div > div[class]';
      const posts = Array.from(document.querySelectorAll(query));

      //log.info( 'mopUpTheProfilePage(); # of posts: ' + posts.length);

      for (const post of posts) {
        if (post.innerHTML.length === 0) {
          continue;
        }

        let hideReason = '';
        const isSponsoredPost = false;

        if (post.hasAttribute(postAtt)) {
          hideReason = 'hidden';
        }
        else {
          if (hideReason === '' && VARS.Options.PP_ANIMATED_GIFS_POSTS) {
            hideReason = nf_hasAnimatedGifContent(post);
          }
          if (hideReason === '' && VARS.Options.PP_BLOCKED_ENABLED) {
            hideReason = pp_isBlockedText(post);
          }
        }

        //log.info( 'mopUpTheProfilePage(); hideReason:', hideReason, post );

        if (hideReason.length > 0) {
          if (hideReason !== 'hidden') {
            nf_hidePost(post, hideReason, isSponsoredPost);
          }
        }
        else {
          // -- run pause animation (useful to hide those animated comments)
          if (VARS.Options.PP_ANIMATED_GIFS_PAUSE) {
            // log.info( 'pausing animations ...');
            swatTheMosquitos(post);
          }
          // -- hide info boxes
          if (VARS.hideAnInfoBox) {
            scrubInfoBoxes(post);
          }
        }
      }
      mainColumn.setAttribute(mainColumnAtt, mainColumn.innerHTML.length.toString());
      VARS.noChangeCounter = 0;
    }

    if (elDialog) {
      // -- viewing a post in a "dialog-box" (triggered by viewing more comments)
      if (VARS.Options.PP_ANIMATED_GIFS_PAUSE) {
        swatTheMosquitos(elDialog);
      }
      elDialog.setAttribute(mainColumnAtt, elDialog.innerHTML.length.toString());
      VARS.noChangeCounter = 0;
    }

  }

  // **** TIMING COMPONENT ****

  let firstRun = true;
  let prevScrollY = window.scrollY;
  let lastCleaningTime = 0;
  let sleepDuration = 50;

  function processPage(eventType = 'timing') {

    // log.info( 'processPage(); (being) :: currentTime:', currentTime, '; lastCleaningTime:', lastCleaningTime, '; oldDuration:', oldDuration, '; sleepDuration:', sleepDuration, '; elapsedTime:', elapsedTime, '; counter: ', VARS.noChangeCounter);

    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - lastCleaningTime;
    const oldDuration = sleepDuration;



    if (eventType == 'url-changed') {
      // -- url has changed ...
      setFeedSettings();
      // log.info(`processPage(); :: url has changed; isAF: ${VARS.isAF}; isNF: ${VARS.isNF}; isGF: ${VARS.isGF}; isVF: ${VARS.isVF}; isMF: ${VARS.isMF}; isSF: ${VARS.isSF}; isRF: ${VARS.isRF};`);
    }
    else if (eventType === 'scrolling') {
      // -- page is scrolling ...

      if (sleepDuration < 151) {
        // -- .. and sleep duration is quite short ...
        // return;
        // log('processPage => sleepDuration < 151, remove this to hotfix Apr 12nd, 2025')
      }
      // -- else: sleep duration is quite long, so trigger a clean up request now ...
    }
    else if (elapsedTime < sleepDuration) {
      // -- called to early ...
      // log.info( 'processPage(); (early) :: currentTime:', currentTime, '; lastCleaningTime:', lastCleaningTime, '; oldDuration:', oldDuration, '; sleepDuration:', sleepDuration, '; elapsedTime:', elapsedTime, '; counter: ', VARS.noChangeCounter);
      return;
    }

    // -- do some mopping up ...
    if (VARS.isNF) {
      mopUpTheNewsFeed();
    }
    else if (VARS.isGF) {
      mopUpTheGroupsFeed();
    }
    else if (VARS.isVF) {
      mopUpTheWatchVideosFeed();
    }
    else if (VARS.isMF) {
      mopUpTheMarketplaceFeed();
    }
    else if (VARS.isSF) {
      mopUpTheSearchFeed();
    }
    else if (VARS.isRF) {
      mopUpTheReelFeed('sleeping');
    }
    else if (VARS.isPP) {
      mopUpTheProfilePage();
    }

    // -- sleep for a few ms and run me again ...
    // -- noChangeCounter is recording the number of loops where no changes have been detected
    if (VARS.isAF) {
      if (VARS.noChangeCounter < 16) {
        sleepDuration = 50;
      }
      else if (VARS.noChangeCounter < 31) {
        sleepDuration = 75;
      }
      else if (VARS.noChangeCounter < 46) {
        sleepDuration = 100;
      }
      else if (VARS.noChangeCounter < 61) {
        sleepDuration = 150;
      }
      else {
        sleepDuration = 1000;
      }
    }

    // log.info(`processPage(); > setFeedSettings() :: isAF: ${VARS.isAF}; isNF: ${VARS.isNF}; isGF: ${VARS.isGF}; isVF: ${VARS.isVF}; isMF: ${VARS.isMF}; isSF: ${VARS.isSF}; isRF: ${VARS.isRF};`);
    // log.info( 'processPage(); 3 :: timing: ', timing, '; counter: ', VARS.noChangeCounter, '; isScrolling: ', isScrolling);

    // -- have a nap and then scan again...
    lastCleaningTime = currentTime;
    // log.info( 'processPage(); (end) :: currentTime:', currentTime, '; lastCleaningTime:', lastCleaningTime, '; oldDuration:', oldDuration, '; sleepDuration:', sleepDuration, '; elapsedTime:', elapsedTime, '; counter: ', VARS.noChangeCounter);
    setTimeout(processPage, sleepDuration);
  }



  function registerRedirToMostRecent() {
    const redirToMostRecent = () => {
      const { origin, pathname, search } = window.location;
      const targetUrl = `${origin}/?sk=h_chr`;

      if (pathname === '/' && search.length === 0) {
        window.location.href = targetUrl;
      }
    }

    if (VARS.Options.NF_AUTO_REDIR_TO_MOST_RECENT) {
      redirToMostRecent();
    }
  }

  function startUp() {
    // -- run code soon as the elements HEAD, BDDY and variable Options are ready/available.
    // -- or when page url has changed ...
    // log( 'firstRun:', firstRun, '; OptionsReady:', VARS.optionsReady);
    if (document.head && document.body && VARS.optionsReady) {
      if (firstRun) {
        GM.registerMenuCommand(KeyWords.GM_MENU_SETTINGS, toggleDialog);
        addCSS();
        window.setTimeout(addExtraCSS, 150); // fb is sometimes laggy ...
        buildMoppingDialog();
        // -- for reels's controls - chromium browsers needs more spacing ...
        // -- requires: @grant        unsafeWindow
        VARS.isChromium = !!unsafeWindow.chrome && /Chrome|CriOS/.test(navigator.userAgent);
        // -- dictionary of words to use in filters.
        buildDictionaries();
        firstRun = false;
      }
      // -- check registerRedirToMostRecent
      registerRedirToMostRecent();

      // -- add some event listeners to detect if something is being changed ...
      window.addEventListener('scroll', function () {
        // -- wakey wakey!
        let currentScrollY = window.scrollY;
        let scrollingDistance = Math.abs(currentScrollY - prevScrollY);
        if (scrollingDistance > 20) {
          processPage('scrolling');
        }
      });

      window.addEventListener('popstate', function () {
        // -- closed a fb "dialog" (e.g. popout-reel from a news-feed)
        // -- fb mimics the back-button action
        processPage('url-changed');
      });


      let timerId = setInterval(function () {
        // -- watch the url-change (new page being loaded)
        if (VARS.prevURL !== window.location.href) {
          // log.info( 'url-changed:', VARS.prevURL, window.location.href);
          processPage('url-changed');
        }
      }, 500);

      // -- start scanning
      // -- (processPage will call setFeedSettings ..)
      processPage('url-changed');
    }
    else {
      setTimeout(startUp, 10);
    }
  }

  function handleClassListChange() {
    let modeHasChanged = false;
    let modeNow = isDarkMode();
    if (VARS.isDarkMode === null) {
      modeHasChanged = true;
    }
    else if (VARS.isDarkMode !== modeNow) {
      modeHasChanged = true;
    }

    if (modeHasChanged) {
      // -- update CSS

      VARS.isDarkMode = modeNow;
    }
  }

  // Initial check
  handleClassListChange();

  // -- Create an observer instance
  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        handleClassListChange();
      }
    }
  });

  // -- Start observing the target node for configured mutations
  observer.observe(document.documentElement, {
    attributes: true, // Observe changes to attributes
    attributeFilter: ['class'] // Only observe changes to the 'class' attribute
  });

  // setTimeout(startUp, 50);
  startUp();

})();