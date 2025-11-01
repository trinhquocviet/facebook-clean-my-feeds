export interface FeedSettings {
  scanCountStart:   number, // - how many times to scan a post
  scanCountMaxLoop: number, // Nov 2023; changed from 12 to 15, need to make code a tad bit more aggressive.
  noChangeCounter:  number, // number of consecutive loops that reported no change in html structure.
  language:         string, // - langauge (default to EN)
  
  Options:          Object, // - user options
  optionsReady:     boolean,
  
  Filters:          Object, // - blocked text
  SEP:              string, // - blocked text separator

  dictionarySponsored: Object,
  dictionaryReelsAndShortVideos: Object,

  // - Feed toggles
  isNF:             boolean, // news
  isGF:             boolean, // groups
  isVF:             boolean, // videos
  isMF:             boolean, // marketplace
  isAF:             boolean, // all feeds
  isSF:             boolean, // search feed
  isRF:             boolean, // reel feed
  isPP:             boolean, // profile page

  isRF_InTimeoutMode: boolean, // -- processing Reel videos in timeout calls instead of mutations

  // groups feed type : 'group' = single group; 'groups' = multiple groups;
  gfType: string,

  // watch/videos feed type : 'vidoes' = normal feed; 'search' = search videos;
  vfType: string,

  // marketplace feed type: 'marketplace' = default view; 'category' = category view; 'item' = viewing an item; 'search' = search results;
  mpType: string,

  // remember current URL - used for page change detection
  prevURL: string,
  prevPathname: string,
  prevQuery: string,
  
  echoEl: HTMLElement| null, // element containing echo message about post(s) being hidden
  echoElFirstNote: HTMLElement | null, // for restoring "missing" echo message
  echoElCreatedCount: number,
  echoELFirstPost: HTMLElement | null,

  
  echoCount: number, // how many consecutive posts have been hidden
  echoCPID: string, // current consecutive posts id

  
  isDarkMode: boolean | null, // dark-mode ..

  // StyleSheet Id
  cssID: string,
  cssOID: string,

  // Attribute names
  hideAtt: string,
  showAtt: string,

  // special attribute
  b1Att: string,
  b2Att: string,

  // CSS class names
  cssHideEl: string,
  cssEcho: string,
  cssHideNumberOfShares: string,

  // toggle dialog button (visible if is a Feed page)
  btnToggleEl: HTMLElement | null,
  iconNewWindowClass: string,

  // - for reels - chromium browsers needs more space for video controls...
  isChromium: boolean,
  tempStyleSheetCode: string,
}

export default {
  // - how many times to scan a post
  scanCountStart: 0,
  scanCountMaxLoop: 15, // Nov 2023; changed from 12 to 15, need to make code a tad bit more aggressive.

  noChangeCounter: 0, // number of consecutive loops that reported no change in html structure.

  // - langauge (default to EN)
  language: 'en',
  // - user options
  Options: {},
  optionsReady: false,
  // - blocked text
  Filters: {},
  // - blocked text separator
  SEP: '¦¦',

  dictionarySponsored: {},
  dictionaryReelsAndShortVideos: {},

  // - Feed toggles
  isNF: false, // news
  isGF: false, // groups
  isVF: false, // videos
  isMF: false, // marketplace
  isAF: false, // all feeds
  isSF: false, // search feed
  isRF: false, // reel feed
  isPP: false, // profile page

  isRF_InTimeoutMode: false, // -- processing Reel videos in timeout calls instead of mutations

  // groups feed type : 'group' = single group; 'groups' = multiple groups;
  gfType: '',

  // watch/videos feed type : 'vidoes' = normal feed; 'search' = search videos;
  vfType: '',

  // marketplace feed type: 'marketplace' = default view; 'category' = category view; 'item' = viewing an item; 'search' = search results;
  mpType: '',

  // remember current URL - used for page change detection
  prevURL: '',
  prevPathname: '',
  prevQuery: '',

  // element containing echo message about post(s) being hidden
  echoEl: null,
  echoElFirstNote: null, // for restoring "missing" echo message
  echoElCreatedCount: 0,
  echoELFirstPost: null,
  // how many consecutive posts have been hidden
  echoCount: 0,
  // current consecutive posts id
  echoCPID: '',

  // dark-mode ..
  isDarkMode: null,

  // StyleSheet Id
  cssID: '',
  cssOID: '',

  // Attribute names
  hideAtt: '',
  showAtt: '',

  // special attribute
  b1Att: '',
  b2Att: '',

  // CSS class names
  cssHideEl: '',
  cssEcho: '',
  cssHideNumberOfShares: '',

  // toggle dialog button (visible if is a Feed page)
  btnToggleEl: null,
  // - icon close / times
  // iconClose: images.iconClose,
  // - script's logo
  // logoHTML: images.logo,
  // - new window icon
  // iconNewWindow: images.iconNewWindow,
  iconNewWindowClass: 'cmf-link-new',
  // - for reels - chromium browsers needs more space for video controls...
  isChromium: false,
  tempStyleSheetCode: '',
} satisfies FeedSettings;