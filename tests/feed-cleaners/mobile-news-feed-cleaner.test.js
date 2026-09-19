import { describe, it, expect, beforeEach } from 'bun:test';
import { m_mopUpTheNewsFeed } from '@/modules/feed-cleaners/mobile/news-feed-cleaner.js';
import { mainColumnAtt } from '@/constants/index.js';

describe('modules/feed-cleaners/mobile/news-feed-cleaner', () => {
  let VARS;
  let KeyWords;
  let hiddenFeatures;
  let hiddenPosts;
  let postObscurer;

  beforeEach(() => {
    VARS = {
      isMobile: true,
      Filters: { GLOBAL_BLOCKED_ENABLED: false, GLOBAL_BLOCKED_TERMS: [] },
      Options: { VERBOSITY_LEVEL: '1', VERBOSITY_DEBUG: false }
    };
    KeyWords = {
      SPONSORED: 'Sponsored',
      NF_FOLLOW: 'Suggested: Follow',
      NF_UNJOINED_GROUP: 'Unjoined Group',
      NF_STORIES: 'Stories',
      NF_REELS: 'Reels',
      MOBILE_AD_LABELS: ['Ad'],
      MOBILE_FOLLOW_LABELS: ['Follow'],
      MOBILE_JOIN_LABELS: ['Join'],
      MOBILE_GROUP_SUFFIXES: ['Public group']
    };

    hiddenFeatures = [];
    hiddenPosts = [];

    postObscurer = {
      isPostAlreadyObscured: (cell) => cell._hidden || false,
      nf_isPostAlreadyHidden: (cell) => cell._hidden || false,
      hideFeature: (cell, reason) => {
        cell._hidden = true;
        hiddenFeatures.push({ cell, reason });
      },
      nf_hidePost: (cell, reason) => {
        cell._hidden = true;
        hiddenPosts.push({ cell, reason });
      }
    };
  });

  it('returns early when isTheHouseDirty returns [null, null]', () => {
    let collectionCalled = false;
    const ctx = {
      VARS,
      KeyWords,
      postObscurer,
      isTheHouseDirty: () => [null, null],
      doc: {
        querySelector: () => {
          collectionCalled = true;
          return null;
        }
      }
    };

    m_mopUpTheNewsFeed(ctx);
    expect(collectionCalled).toBe(false);
  });

  it('runs full waterfall and hides sponsored, follow, group, stories, and reels', () => {
    const mainColumn = {
      innerHTML: 'vscroller-content-12345',
      setAttribute: (attr, val) => {
        mainColumn[attr] = val;
      }
    };

    // 1. Stories Tray cell
    const storyCard = { getAttribute: () => 'Create story', ariaLabel: 'Create story' };
    const storiesTrayCell = {
      nodeType: 1,
      tagName: 'DIV',
      textContent: 'Stories Create story',
      classList: { contains: (c) => c === 'm' },
      querySelector: (sel) => {
        if (sel.includes('hscroller')) return { querySelectorAll: () => [storyCard] };
        if (sel.includes('button')) return storyCard;
        return null;
      },
      querySelectorAll: () => []
    };

    // 2. 1px Divider Spacer (should be skipped!)
    const spacerDivider = {
      nodeType: 1,
      tagName: 'DIV',
      textContent: '',
      classList: { contains: (c) => c === 'm' },
      getAttribute: (a) => (a === 'data-actual-height' ? '1' : null)
    };

    // 3. Sponsored post cell
    const adSubtitle = { textContent: 'Ad 󰞋󱙷' };
    const sponsoredCell = {
      nodeType: 1,
      tagName: 'DIV',
      textContent: 'Panasonic Vietnam Ad',
      classList: { contains: (c) => c === 'm' },
      querySelector: (sel) => (sel.includes('button') ? {} : null),
      querySelectorAll: () => [adSubtitle]
    };

    // 4. Suggested Follow post cell
    const followBtn = { textContent: 'Follow' };
    const followCell = {
      nodeType: 1,
      tagName: 'DIV',
      textContent: 'Hay Nhức Nhói Follow',
      classList: { contains: (c) => c === 'm' },
      querySelector: (sel) => (sel.includes('button') ? {} : null),
      querySelectorAll: () => [followBtn]
    };

    // 5. Unjoined Group post cell
    const joinBtn = { textContent: 'Join' };
    const groupSubtitle = {
      getAttribute: () => 'Lê Đức, Sep 12, Public group',
      ariaLabel: 'Lê Đức, Sep 12, Public group'
    };
    const unjoinedGroupCell = {
      nodeType: 1,
      tagName: 'DIV',
      textContent: 'Hội máy hàn cell pin tự chế Join',
      classList: { contains: (c) => c === 'm' },
      querySelector: (sel) => (sel.includes('button') ? {} : null),
      querySelectorAll: (sel) => (sel.includes('[aria-label]') ? [groupSubtitle] : [joinBtn])
    };

    // 6. Reels card cell
    const reelCard = {
      getAttribute: () => 'View reel video from Johnny with 86 thousand views .',
      ariaLabel: 'View reel video from Johnny with 86 thousand views .'
    };
    const reelsCell = {
      nodeType: 1,
      tagName: 'DIV',
      textContent: 'Johnny 86K views',
      classList: { contains: (c) => c === 'm' },
      querySelector: (sel) => (sel.includes('button') ? {} : null),
      querySelectorAll: () => [reelCard]
    };

    // 7. Organic clean post (should be preserved!)
    const cleanCell = {
      nodeType: 1,
      tagName: 'DIV',
      textContent: 'Just a normal friend post',
      classList: { contains: (c) => c === 'm' },
      querySelector: (sel) => (sel.includes('button') ? {} : null),
      querySelectorAll: () => [{ textContent: 'Just a normal friend post' }]
    };

    const vscroller = {
      children: [
        storiesTrayCell,
        spacerDivider,
        sponsoredCell,
        followCell,
        unjoinedGroupCell,
        reelsCell,
        cleanCell
      ]
    };

    const doc = {
      querySelector: (sel) => (sel.includes('vscroller') ? vscroller : null)
    };

    const ctx = {
      VARS,
      KeyWords,
      postObscurer,
      isTheHouseDirty: () => [mainColumn, null],
      doc
    };

    m_mopUpTheNewsFeed(ctx);

    // Stamped mainColumnAtt
    expect(mainColumn[mainColumnAtt]).toBe(mainColumn.innerHTML.length.toString());

    // Verified hidden features
    expect(hiddenFeatures.length).toBe(2);
    expect(hiddenFeatures[0].reason).toBe('Stories');
    expect(hiddenFeatures[1].reason).toBe('Reels');

    // Verified hidden posts
    expect(hiddenPosts.length).toBe(3);
    expect(hiddenPosts[0].reason).toBe('Sponsored');
    expect(hiddenPosts[1].reason).toBe('Suggested: Follow');
    expect(hiddenPosts[2].reason).toBe('Unjoined Group');

    // Organic post NOT hidden
    expect(cleanCell._hidden).toBeUndefined();
  });
});
