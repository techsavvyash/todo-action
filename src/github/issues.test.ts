import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionConfig } from "../action/config.js";
import { DEFAULTS } from "../action/constants.js";
import type { TodoComment } from "../todos/todo.js";

vi.mock("@actions/core", () => ({
  info: vi.fn(),
}));

vi.mock("@actions/github", () => ({
  context: {
    repo: {
      owner: "acme",
      repo: "project",
    },
  },
}));

const { createIssues } = await import("./issues.js");

function config(overrides: Partial<ActionConfig> = {}): ActionConfig {
  return {
    assignees: ["ash"],
    commitSha: undefined,
    dedupe: true,
    dryRun: false,
    exclude: [],
    failOnTodos: false,
    issueBodyTemplate: DEFAULTS.issueBodyTemplate,
    labels: ["todo"],
    markers: ["TODO", "FIXME"],
    mode: "commit",
    titlePrefix: "TODO:",
    token: "token",
    ...overrides,
  };
}

function todoComment(overrides: Partial<TodoComment> = {}): TodoComment {
  return {
    commentText: "TODO: extract this behavior",
    endLine: 12,
    file: "src/example.ts",
    fingerprint: "abc123",
    language: "typescript",
    marker: "TODO",
    startLine: 12,
    text: "extract this behavior",
    ...overrides,
  };
}

describe("createIssues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an issue with fingerprint metadata for each TODO comment", async () => {
    const issuesCreate = vi.fn().mockResolvedValue({});
    const octokit = {
      rest: {
        issues: { create: issuesCreate },
        search: { issuesAndPullRequests: vi.fn().mockResolvedValue({ data: { total_count: 0 } }) },
      },
    };

    const created = await createIssues(octokit as never, config(), [todoComment()]);

    expect(created).toBe(1);
    expect(issuesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: ["ash"],
        body: expect.stringContaining("<!-- todo-action:fingerprint=abc123 -->"),
        labels: ["todo"],
        owner: "acme",
        repo: "project",
        title: "TODO: extract this behavior",
      }),
    );
  });

  it("skips duplicate open issues when dedupe is enabled", async () => {
    const issuesCreate = vi.fn();
    const octokit = {
      rest: {
        issues: { create: issuesCreate },
        search: { issuesAndPullRequests: vi.fn().mockResolvedValue({ data: { total_count: 1 } }) },
      },
    };

    const created = await createIssues(octokit as never, config(), [todoComment()]);

    expect(created).toBe(0);
    expect(issuesCreate).not.toHaveBeenCalled();
  });

  it("renders a custom issue body template", async () => {
    const issuesCreate = vi.fn().mockResolvedValue({});
    const octokit = {
      rest: {
        issues: { create: issuesCreate },
        search: { issuesAndPullRequests: vi.fn().mockResolvedValue({ data: { total_count: 0 } }) },
      },
    };

    await createIssues(
      octokit as never,
      config({
        issueBodyTemplate: [
          "## {{marker}} in {{file}}",
          "",
          "Line range: {{startLine}}-{{endLine}}",
          "",
          "{{commentText}}",
        ].join("\n"),
      }),
      [todoComment()],
    );

    expect(issuesCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        body: [
          "<!-- todo-action:fingerprint=abc123 -->",
          "",
          "## TODO in src/example.ts",
          "",
          "Line range: 12-12",
          "",
          "TODO: extract this behavior",
        ].join("\n"),
      }),
    );
  });
});
