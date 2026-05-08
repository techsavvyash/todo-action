import { describe, expect, it, vi } from "vitest";
import type { ActionConfig } from "../../src/action/config.js";
import { DEFAULTS } from "../../src/action/constants.js";
import { runAction, type ActionLogger } from "../../src/action/runner.js";

function config(overrides: Partial<ActionConfig> = {}): ActionConfig {
  return {
    assignees: [],
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

describe("runAction", () => {
  it("scans changed files and passes TODO comments to the issue creator", async () => {
    const octokit = {};
    const outputs = new Map<string, number>();
    const logger: ActionLogger = {
      info: vi.fn(),
      setOutput: (name, value) => outputs.set(name, value),
    };
    const createIssues = vi.fn().mockResolvedValue(1);

    await runAction({
      createIssues,
      getChangedFiles: vi.fn().mockResolvedValue([
        {
          path: "src/example.ts",
          content: [
            "export function example() {",
            "  // TODO: persist the new state",
            "  return true;",
            "}",
          ].join("\n"),
          patch: [
            "@@ -1,2 +1,4 @@",
            " export function example() {",
            "+  // TODO: persist the new state",
            "+  return true;",
            " }",
          ].join("\n"),
        },
      ]),
      getOctokit: vi.fn().mockReturnValue(octokit),
      logger,
      readConfig: () => config(),
    });

    expect(createIssues).toHaveBeenCalledWith(
      octokit,
      expect.objectContaining({ labels: ["todo"] }),
      [
        expect.objectContaining({
          file: "src/example.ts",
          marker: "TODO",
          text: "persist the new state",
        }),
      ],
    );
    expect(outputs.get("todos-found")).toBe(1);
    expect(outputs.get("issues-created")).toBe(1);
  });

  it("fails after reporting outputs when fail-on-todos is enabled", async () => {
    const logger: ActionLogger = {
      info: vi.fn(),
      setOutput: vi.fn(),
    };

    await expect(
      runAction({
        createIssues: vi.fn().mockResolvedValue(0),
        getChangedFiles: vi.fn().mockResolvedValue([
          {
            path: "main.py",
            content: "# TODO: remove the temporary fallback\n",
            patch: "@@ -0,0 +1,1 @@\n+# TODO: remove the temporary fallback",
          },
        ]),
        getOctokit: vi.fn().mockReturnValue({}),
        logger,
        readConfig: () => config({ failOnTodos: true }),
      }),
    ).rejects.toThrow("Found 1 TODO comment(s) in changed lines.");

    expect(logger.setOutput).toHaveBeenCalledWith("todos-found", 1);
    expect(logger.setOutput).toHaveBeenCalledWith("issues-created", 0);
  });
});
