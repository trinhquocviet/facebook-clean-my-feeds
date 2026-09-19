import { describe, it, expect } from 'bun:test';
import { m_isTheHouseDirty } from '@/modules/dirty-checker/mobile-dirty-checker.js';
import { mainColumnAtt } from '@/constants/index.js';

describe('modules/dirty-checker/mobile-dirty-checker', () => {
  it('detects unflagged vscroller and returns as dirty', () => {
    const mockVscroller = {
      hasAttribute: (attr) => attr !== mainColumnAtt,
      getAttribute: () => null,
      innerHTML: '<div>post</div>'
    };
    const mockDoc = {
      querySelector: (sel) => (sel.includes('vscroller') ? mockVscroller : null)
    };
    const VARS = { noChangeCounter: 0 };

    const result = m_isTheHouseDirty(VARS, mockDoc);
    expect(result[0]).toBe(mockVscroller);
    expect(result[1]).toBe(null);
    expect(VARS.noChangeCounter).toBe(1);
  });

  it('detects size change on flagged vscroller', () => {
    const mockVscroller = {
      hasAttribute: (attr) => attr === mainColumnAtt,
      getAttribute: (attr) => (attr === mainColumnAtt ? '100' : null),
      innerHTML: 'a'.repeat(250) // Length delta > 16 chars
    };
    const mockDoc = {
      querySelector: (sel) => (sel.includes('vscroller') ? mockVscroller : null)
    };
    const VARS = { noChangeCounter: 0 };

    const result = m_isTheHouseDirty(VARS, mockDoc);
    expect(result[0]).toBe(mockVscroller);
  });

  it('returns [null, null] when no change occurred', () => {
    const mockVscroller = {
      hasAttribute: (attr) => attr === mainColumnAtt,
      getAttribute: (attr) => (attr === mainColumnAtt ? '100' : null),
      innerHTML: 'a'.repeat(105) // Delta <= 16 chars tolerance
    };
    const mockDoc = {
      querySelector: (sel) => (sel.includes('vscroller') ? mockVscroller : null)
    };
    const VARS = { noChangeCounter: 0 };

    const result = m_isTheHouseDirty(VARS, mockDoc);
    expect(result[0]).toBe(null);
    expect(result[1]).toBe(null);
  });
});
