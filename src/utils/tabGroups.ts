import type { Tab } from "../types";

type GroupLike = {
  id: string;
};

export function isUngroupedTab(tab: Tab, groups: GroupLike[]): boolean {
  return !tab.groupId || !groups.some((group) => group.id === tab.groupId);
}

export function mergeTabsById(...tabLists: Tab[][]): Tab[] {
  const seen = new Set<string>();
  const merged: Tab[] = [];

  for (const list of tabLists) {
    for (const tab of list) {
      if (seen.has(tab.id)) continue;
      seen.add(tab.id);
      merged.push(tab);
    }
  }

  return merged;
}

export function getUngroupedTabsToPreserve(
  flatTabs: Tab[],
  paneTabs: Tab[],
  groups: GroupLike[],
): Tab[] {
  return mergeTabsById(flatTabs, paneTabs).filter((tab) => isUngroupedTab(tab, groups));
}

export function mergePaneTabsWithPreservedUngrouped(
  paneTabs: Tab[],
  currentTabs: Tab[],
  groups: GroupLike[],
): Tab[] {
  const paneTabIds = new Set(paneTabs.map((tab) => tab.id));
  const ungroupedTabs = currentTabs.filter(
    (tab) => isUngroupedTab(tab, groups) && !paneTabIds.has(tab.id),
  );

  return [...paneTabs, ...ungroupedTabs];
}
