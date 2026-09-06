import { describe, expect, it } from "vitest";
import {
  TOOL_CATALOG,
  isPageTool,
  pageToolsFor,
  toolsForAudience,
} from "./catalog";
import { MCP_TOOLS, visibleMcpTools } from "../../../convex/mcp";
import { buildDashboardSearchIndex, searchDashboard } from "../dashboardSearch";
import { DOCS_TOPICS } from "../../components/dashboard/docsTopics";

describe("webmcp tool catalog", () => {
  it("keeps privileged and bulk tools out of the page audience", () => {
    expect(isPageTool("create_draft")).toBe(false);
    expect(isPageTool("export_all")).toBe(false);
    for (const tool of toolsForAudience("page")) {
      expect(tool.audiences).not.toContain("remote-pipeline");
    }
  });

  it("uses spec safe tool names", () => {
    for (const tool of TOOL_CATALOG) {
      expect(tool.name).toMatch(/^[A-Za-z0-9_.-]{1,128}$/);
    }
    expect(new Set(TOOL_CATALOG.map((t) => t.name)).size).toBe(TOOL_CATALOG.length);
  });

  it("only offers form and audio tools while that UI is mounted", () => {
    const always = pageToolsFor(new Set()).map((t) => t.name);
    expect(always).toContain("search_site");
    expect(always).toContain("get_current_page");
    expect(always).not.toContain("subscribe_newsletter");
    expect(always).not.toContain("submit_contact");
    expect(always).not.toContain("listen_to_post");

    const withForms = pageToolsFor(new Set(["newsletter", "contact"] as const)).map((t) => t.name);
    expect(withForms).toContain("subscribe_newsletter");
    expect(withForms).toContain("submit_contact");
    expect(withForms).not.toContain("listen_to_post");
  });

  it("mirrors the remote MCP server tool names", () => {
    const remote = [...toolsForAudience("remote-public"), ...toolsForAudience("remote-pipeline")]
      .map((t) => t.name)
      .sort();
    expect(remote).toEqual(MCP_TOOLS.map((t) => t.name).sort());
  });
});

describe("dashboard docs for webmcp", () => {
  it("has a webmcp topic that the command palette surfaces at the top", () => {
    expect(DOCS_TOPICS.some((t) => t.id === "webmcp")).toBe(true);
    const index = buildDashboardSearchIndex([]);
    const top = searchDashboard(index, "webmcp", 3);
    // Site Config card, feature entry, and docs topic all title match; the
    // docs topic and the feature link must both land in the top three.
    expect(top.some((r) => r.entry.target.docsTopic === "webmcp")).toBe(true);
    expect(top.some((r) => r.entry.target.configCard === "webmcp")).toBe(true);
  });

  it("documents slides, skills, and self-hosting deploys", () => {
    expect(DOCS_TOPICS.some((t) => t.id === "skills")).toBe(true);
    const writing = DOCS_TOPICS.find((t) => t.id === "writing")?.content ?? "";
    expect(writing).toContain("slides: true");
    const deploying = DOCS_TOPICS.find((t) => t.id === "deploying")?.content ?? "";
    expect(deploying).toContain("npm run deploy:static");
    expect(deploying).toContain("There is no `npm run deploy --prod` script");
    expect(deploying).not.toContain("helpful-ptarmigan-118");
    const index = buildDashboardSearchIndex([]);
    expect(searchDashboard(index, "slides", 8).some((r) => r.entry.id === "feature-slides")).toBe(
      true,
    );
  });
});

describe("remote MCP tools/list", () => {
  it("hides create_draft from anonymous callers and shows it with a pipeline key", () => {
    const anonymous = visibleMcpTools(false).map((t) => t.name);
    expect(anonymous).toHaveLength(7);
    expect(anonymous).not.toContain("create_draft");

    const keyed = visibleMcpTools(true).map((t) => t.name);
    expect(keyed).toHaveLength(8);
    expect(keyed).toContain("create_draft");
  });
});
