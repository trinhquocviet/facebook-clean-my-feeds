import { describe, it, expect } from 'bun:test';
import {
  nf_isSuggested,
  nf_isPeopleYouMayKnow,
  nf_isPaidPartnership,
  nf_isShortReelVideo,
  nf_postExceedsLikeCount,
  nf_isUnjoinedGroupPost
} from '@/modules/detection/rules/news-feed.js';
import {
  gf_isSuggested,
  gf_isShortReelVideo
} from '@/modules/detection/rules/groups.js';
import {
  vf_isVideoLive,
  vf_isInstagram
} from '@/modules/detection/rules/videos.js';

describe('modules/detection/rules', () => {
  const KeyWords = {
    NF_SUGGESTIONS: 'Suggested for you',
    NF_PEOPLE_YOU_MAY_KNOW: 'People you may know',
    NF_PAID_PARTNERSHIP: 'Paid partnership',
    NF_SHORT_REEL_VIDEO: 'Short Reel',
    NF_LIKES_MAXIMUM: 'Exceeds Likes',
    GF_SUGGESTIONS: 'Group Suggestions',
    GF_SHORT_REEL_VIDEO: 'Group Short Reel',
    VF_LIVE: 'Live Video',
    VF_INSTAGRAM: 'Instagram'
  };

  describe('news-feed rules', () => {
    it('nf_isPeopleYouMayKnow returns reason when PYMK link is present', () => {
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('/friends/') ? [{ href: '/friends/' }] : [])
      };
      expect(nf_isPeopleYouMayKnow(mockPost, KeyWords)).toBe(KeyWords.NF_PEOPLE_YOU_MAY_KNOW);
    });

    it('nf_isPaidPartnership returns reason when link matches business help', () => {
      const mockPost = {
        querySelector: (sel) => (sel.includes('/business/help/') ? {} : null)
      };
      expect(nf_isPaidPartnership(mockPost, KeyWords)).toBe(KeyWords.NF_PAID_PARTNERSHIP);
    });

    it('nf_isShortReelVideo returns reason when exactly 1 reel link exists', () => {
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('/reel/') ? [{ href: '/reel/1' }] : [])
      };
      expect(nf_isShortReelVideo(mockPost, KeyWords)).toBe(KeyWords.NF_SHORT_REEL_VIDEO);

      const multipleReelsPost = {
        querySelectorAll: (sel) => (sel.includes('/reel/') ? [{ href: '/reel/1' }, { href: '/reel/2' }] : [])
      };
      expect(nf_isShortReelVideo(multipleReelsPost, KeyWords)).toBe('');
    });

    it('nf_postExceedsLikeCount detects counts exceeding maximum threshold', () => {
      const VARS = { Options: { NF_LIKES_MAXIMUM_COUNT: '500' } };
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('role="toolbar"') ? [{ textContent: '1.2K' }] : [])
      };
      expect(nf_postExceedsLikeCount(mockPost, KeyWords, VARS)).toBe(KeyWords.NF_LIKES_MAXIMUM);
    });

    it('nf_isUnjoinedGroupPost detects group link with join button in header', () => {
      const mockButton = { tagName: 'BUTTON' };
      const mockHeader = {
        querySelector: (sel) => (sel.includes('[role="button"]') ? mockButton : null)
      };
      const mockGroupLink = {
        closest: (sel) => (sel === 'h4' ? mockHeader : null)
      };
      const mockPost = {
        querySelector: (sel) => (sel.includes('/groups/') ? mockGroupLink : null)
      };

      expect(nf_isUnjoinedGroupPost(mockPost)).toBe(true);
    });

    describe('nf_isSuggested', () => {
      it('returns reason when suggestion query matches text not starting with number', () => {
        const mockSpan = {
          children: [],
          childElementCount: 0,
          textContent: 'Suggested for you'
        };
        const mockPost = {
          querySelector: () => null,
          querySelectorAll: (sel) => {
            if (sel.includes('div[aria-posinset]')) {
              return [mockSpan];
            }
            return [];
          }
        };
        expect(nf_isSuggested(mockPost, KeyWords, {})).toBe(KeyWords.NF_SUGGESTIONS);
      });

      it('returns empty string when suggestion query text starts with number (comment count)', () => {
        const mockSpan = {
          children: [],
          childElementCount: 0,
          textContent: '5 people commented on this'
        };
        const mockPost = {
          querySelector: () => null,
          querySelectorAll: (sel) => {
            if (sel.includes('div[aria-posinset]')) {
              return [mockSpan];
            }
            return [];
          }
        };
        expect(nf_isSuggested(mockPost, KeyWords, {})).toBe('');
      });

      it('returns reason when nf_isGroupsYouMightLike matches', () => {
        const mockPost = {
          querySelector: () => null,
          querySelectorAll: (sel) => {
            if (sel.includes('/groups/discover')) {
              return [{ href: '/groups/discover' }];
            }
            return [];
          }
        };
        expect(nf_isSuggested(mockPost, KeyWords, {})).toBe(KeyWords.NF_SUGGESTIONS);
      });

      it('returns reason when isAdTrackingUrl detects ad parameter', () => {
        const VARS = { isNF: true };
        const longLink = 'https://www.facebook.com/ad/?__cft__[0]=' + 'z'.repeat(320);
        const mockPost = {
          querySelector: () => null,
          querySelectorAll: (sel) => {
            if (sel.includes('__cft__[0]=')) {
              return [{ href: longLink }];
            }
            return [];
          }
        };
        expect(nf_isSuggested(mockPost, KeyWords, VARS)).toBe(KeyWords.NF_SUGGESTIONS);
      });

      it('returns empty string for a clean post', () => {
        const mockPost = {
          querySelector: () => null,
          querySelectorAll: () => []
        };
        expect(nf_isSuggested(mockPost, KeyWords, {})).toBe('');
      });
    });
  });

  describe('groups rules', () => {
    it('gf_isShortReelVideo detects single reel link', () => {
      const mockPost = {
        querySelectorAll: () => [{ href: '/reel/123' }]
      };
      expect(gf_isShortReelVideo(mockPost, KeyWords)).toBe(KeyWords.GF_SHORT_REEL_VIDEO);
    });
  });

  describe('videos rules', () => {
    it('vf_isVideoLive detects live indicator', () => {
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('presentation') ? [{}] : [])
      };
      expect(vf_isVideoLive(mockPost, KeyWords)).toBe(KeyWords.VF_LIVE);
    });

    it('vf_isInstagram detects instagram svg icon', () => {
      const mockPost = {
        querySelectorAll: (sel) => (sel.includes('href="#"') ? [{}] : [])
      };
      expect(vf_isInstagram(mockPost, KeyWords)).toBe(KeyWords.VF_INSTAGRAM);
    });
  });
});
