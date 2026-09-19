import { describe, it, expect } from 'bun:test';
import { m_getCollectionOfCells } from '@/modules/detection/mobile/post-collector.js';

describe('modules/detection/mobile/post-collector', () => {
  it('returns empty array when doc is null or missing vscroller', () => {
    expect(m_getCollectionOfCells(null)).toEqual([]);
    expect(m_getCollectionOfCells({})).toEqual([]);
    expect(m_getCollectionOfCells({ querySelector: () => null })).toEqual([]);
  });

  it('collects all direct div.m children under vscroller regardless of .displayed class', () => {
    const child1 = { nodeType: 1, tagName: 'DIV', classList: { contains: (c) => c === 'm' || c === 'displayed' } };
    const child2 = { nodeType: 1, tagName: 'DIV', classList: { contains: (c) => c === 'm' } }; // Not displayed!
    const nonDiv = { nodeType: 1, tagName: 'SPAN', classList: { contains: (c) => c === 'm' } };
    const nonM = { nodeType: 1, tagName: 'DIV', classList: { contains: () => false } };

    const mockVscroller = {
      children: [child1, child2, nonDiv, nonM]
    };

    const mockDoc = {
      querySelector: (sel) => (sel.includes('vscroller') ? mockVscroller : null)
    };

    const cells = m_getCollectionOfCells(mockDoc);
    expect(cells.length).toBe(2);
    expect(cells[0]).toBe(child1);
    expect(cells[1]).toBe(child2);
  });

  it('falls back to finding vscroller within screen-root', () => {
    const child = { nodeType: 1, tagName: 'DIV', classList: { contains: (c) => c === 'm' } };
    const mockVscroller = { children: [child] };
    const mockScreenRoot = {
      querySelector: (sel) => (sel.includes('vscroller') ? mockVscroller : null)
    };
    const mockDoc = {
      querySelector: () => null,
      getElementById: (id) => (id === 'screen-root' ? mockScreenRoot : null)
    };

    const cells = m_getCollectionOfCells(mockDoc);
    expect(cells.length).toBe(1);
    expect(cells[0]).toBe(child);
  });
});
