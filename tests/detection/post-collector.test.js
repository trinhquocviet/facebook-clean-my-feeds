import { describe, it, expect } from 'bun:test';
import { nf_getCollectionOfPosts } from '@/modules/detection/post-collector.js';

describe('modules/detection/post-collector', () => {
  it('returns posts when matching query selector ladder', () => {
    const mockPosts = [{ id: 'post1' }, { id: 'post2' }];
    const mockDoc = {
      querySelector: () => null,
      querySelectorAll: (sel) => {
        if (sel.includes('[data-pagelet*="FeedUnit_"]')) {
          return mockPosts;
        }
        return [];
      }
    };

    const posts = nf_getCollectionOfPosts(mockDoc);
    expect(posts.length).toBe(2);
    expect(posts[0].id).toBe('post1');
  });

  it('detects customTag and queries with custom selector', () => {
    let queriedWithCustomTag = false;
    const mockDoc = {
      querySelector: () => ({ tagName: 'ybrgmpsb-unlrhoua' }),
      querySelectorAll: (sel) => {
        if (sel.includes('ybrgmpsb-unlrhoua')) {
          queriedWithCustomTag = true;
          return [{ id: 'customPost' }];
        }
        return [];
      }
    };

    const posts = nf_getCollectionOfPosts(mockDoc);
    expect(queriedWithCustomTag).toBe(true);
    expect(posts.length).toBe(1);
  });
});
