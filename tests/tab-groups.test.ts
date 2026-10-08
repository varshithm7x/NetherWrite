import { describe, expect, it } from 'vitest';
import type { Tab } from '../src/types';
import {
  getUngroupedTabsToPreserve,
  isUngroupedTab,
  mergePaneTabsWithPreservedUngrouped,
  mergeTabsById,
} from '../src/utils/tabGroups';

const tab = (id: string, groupId?: string | null): Tab => ({
  id,
  path: `${id}.md`,
  name: id,
  isModified: false,
  groupId,
});

describe('tab group preservation helpers', () => {
  it('treats tabs without a known group as ungrouped', () => {
    expect(isUngroupedTab(tab('plain'), [{ id: 'group-a' }])).toBe(true);
    expect(isUngroupedTab(tab('removed-group', 'missing'), [{ id: 'group-a' }])).toBe(true);
    expect(isUngroupedTab(tab('grouped', 'group-a'), [{ id: 'group-a' }])).toBe(false);
  });

  it('merges tabs by id while preserving first-seen order', () => {
    expect(mergeTabsById([tab('a'), tab('b')], [tab('b'), tab('c')]).map((t) => t.id))
      .toEqual(['a', 'b', 'c']);
  });

  it('preserves ungrouped tabs from flat state and pane state', () => {
    const preserved = getUngroupedTabsToPreserve(
      [tab('flat-ungrouped'), tab('grouped', 'group-a')],
      [tab('pane-ungrouped'), tab('flat-ungrouped'), tab('other-group', 'group-b')],
      [{ id: 'group-a' }],
    );

    expect(preserved.map((t) => t.id)).toEqual([
      'flat-ungrouped',
      'pane-ungrouped',
      'other-group',
    ]);
  });

  it('keeps ungrouped titlebar tabs when active group pane tabs change', () => {
    const merged = mergePaneTabsWithPreservedUngrouped(
      [tab('group-a-1', 'group-a'), tab('group-a-2', 'group-a')],
      [tab('group-a-1', 'group-a'), tab('plain'), tab('group-b-1', 'group-b')],
      [{ id: 'group-a' }, { id: 'group-b' }],
    );

    expect(merged.map((t) => t.id)).toEqual([
      'group-a-1',
      'group-a-2',
      'plain',
    ]);
  });
});
