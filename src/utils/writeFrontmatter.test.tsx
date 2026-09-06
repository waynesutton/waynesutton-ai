import { describe, expect, it } from "vitest";
import { parseFrontmatterDocument } from "../components/FrontmatterForm";
import { parseWriteFrontmatter, patchWriteFrontmatter } from "./writeFrontmatter";

describe("local writing frontmatter", () => {
  it("preserves unknown YAML, comments, multiline fields and body when editing a title", () => {
    const raw = '---\ntitle: "Before"\n# keep this\ncustom:\n  nested: true\nfooter: |\n  First line\n  Second line\n---\n\n# Body\n';
    const { values } = parseFrontmatterDocument(raw, "post");
    expect(patchWriteFrontmatter(raw, "post", values, { ...values, title: "After" })).toBe(raw.replace('"Before"', '"After"'));
  });
  it("replaces a block tag list without changing the next extension", () => {
    const raw = '---\ntags:\n  - old\ncustom: yes\n---\nBody';
    const { values } = parseFrontmatterDocument(raw, "post");
    expect(patchWriteFrontmatter(raw, "post", values, { ...values, tags: ["new", "two"] })).toBe('---\ntags: ["new", "two"]\ncustom: yes\n---\nBody');
  });
  it("does not overwrite unfinished YAML", () => {
    const raw = '---\ntitle: unfinished';
    const { values } = parseFrontmatterDocument(raw, "post");
    expect(patchWriteFrontmatter(raw, "post", values, { ...values, title: "After" })).toBe(raw);
  });
  it("preserves CRLF and clears an optional image", () => {
    const raw = '---\r\ntitle: "Draft"\r\nimage: "https://example.com/a.png"\r\ncustom: true\r\n---\r\nBody';
    const { values } = parseFrontmatterDocument(raw, "post");
    expect(patchWriteFrontmatter(raw, "post", values, { ...values, image: "" })).toBe(raw.replace('image: "https://example.com/a.png"\r\n', ''));
  });
  it("keeps comments and blank lines while replacing a complete block list", () => {
    const raw = '---\ntags:\n  - old\n\n# list comment\n  - another\ncustom: yes\n---\nBody';
    const { values, formIssue } = parseWriteFrontmatter(raw, "post");
    expect(formIssue).toBeNull();
    expect(values.tags).toEqual(["old", "another"]);
    expect(patchWriteFrontmatter(raw, "post", values, { ...values, tags: ["new"] })).toBe('---\ntags: ["new"]\n\n# list comment\ncustom: yes\n---\nBody');
  });
  it("supports unindented lists and quoted keys without creating duplicate fields", () => {
    const raw = '---\n"tags":\n- old\n- another\n\'title\': "Before"\n---';
    const { values, formIssue } = parseWriteFrontmatter(raw, "post");
    expect(formIssue).toBeNull();
    expect(values.title).toBe("Before");
    expect(values.tags).toEqual(["old", "another"]);
    expect(patchWriteFrontmatter(raw, "post", values, { ...values, title: "After", tags: ["new"] })).toBe('---\n"tags": ["new"]\n\'title\': "After"\n---');
  });
  it("accepts a closing delimiter at EOF", () => {
    const parsed = parseWriteFrontmatter('---\ntitle: "Draft"\n---', "post");
    expect(parsed.hasFrontmatter).toBe(true);
    expect(parsed.formIssue).toBeNull();
    expect(parsed.values.title).toBe("Draft");
  });
  it("keeps advanced known YAML values untouched and explains why the form is unavailable", () => {
    const raw = '---\ntitle: |\n  Multiple\n\n  lines\n---\nBody';
    const parsed = parseWriteFrontmatter(raw, "post");
    expect(parsed.formIssue).toContain("YAML");
    expect(patchWriteFrontmatter(raw, "post", parsed.values, { ...parsed.values, title: "Changed" })).toBe(raw);
  });
  it("refuses duplicate known fields instead of leaving conflicting values", () => {
    const raw = '---\ntitle: "One"\n"title": "Two"\n---';
    const parsed = parseWriteFrontmatter(raw, "post");
    expect(parsed.formIssue).toContain("Duplicate");
    expect(patchWriteFrontmatter(raw, "post", parsed.values, { ...parsed.values, title: "Changed" })).toBe(raw);
  });

});
