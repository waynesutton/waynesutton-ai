import { describe, expect, it } from "vitest";
import dashboardSource from "../../pages/Dashboard.tsx?raw";
import {
  CONFIG_GROUPS,
  CONFIG_TABS,
  CONFIG_TAB_ALL,
  isConfigGroupId,
  isConfigTab,
} from "./configGroups";

// Card ids ConfigSection actually renders, read from the JSX so the two lists
// cannot drift without this test noticing.
const renderedCardIds = Array.from(
  dashboardSource.matchAll(/data-config-card="([^"]+)"/g),
  (match) => match[1],
);

const groupedCardIds = CONFIG_GROUPS.flatMap((group) => group.cards.map((card) => card.id));

describe("site config groups", () => {
  it("lists every rendered card exactly once", () => {
    expect([...groupedCardIds].sort()).toEqual([...renderedCardIds].sort());
    expect(new Set(groupedCardIds).size).toBe(groupedCardIds.length);
  });

  it("renders cards inside the panel of the group that owns them", () => {
    for (const group of CONFIG_GROUPS) {
      const open = dashboardSource.indexOf(`<ConfigPanel group={CONFIG_GROUP_BY_ID.${group.id}}`);
      const close = dashboardSource.indexOf("</ConfigPanel>", open);
      expect(open, `panel for ${group.id}`).toBeGreaterThan(-1);
      const panel = dashboardSource.slice(open, close);
      for (const card of group.cards) {
        expect(panel, `${card.id} inside ${group.id}`).toContain(
          `data-config-card="${card.id}"`,
        );
      }
    }
  });

  it("puts All first and one tab per group", () => {
    expect(CONFIG_TABS[0].id).toBe(CONFIG_TAB_ALL);
    expect(CONFIG_TABS.slice(1).map((tab) => tab.id)).toEqual(CONFIG_GROUPS.map((g) => g.id));
  });

  it("guards saved tab values", () => {
    expect(isConfigTab(CONFIG_TAB_ALL)).toBe(true);
    expect(isConfigTab("features")).toBe(true);
    expect(isConfigTab("nope")).toBe(false);
    expect(isConfigTab(null)).toBe(false);
    expect(isConfigGroupId(CONFIG_TAB_ALL)).toBe(false);
  });
});
