import * as core from "@actions/core";

export interface ActionConfig {
  token: string;
  mode: "auto" | "pr" | "push" | "commit";
  commitSha?: string;
  labels: string[];
  assignees: string[];
  markers: string[];
  titlePrefix: string;
  dryRun: boolean;
  dedupe: boolean;
  failOnFindings: boolean;
  exclude: string[];
}

export function readConfig(): ActionConfig {
  return {
    token: core.getInput("github-token", { required: true }),
    mode: normalizeMode(core.getInput("mode") || "auto"),
    commitSha: core.getInput("commit-sha") || undefined,
    labels: parseList(core.getInput("labels")),
    assignees: parseList(core.getInput("assignees")),
    markers: parseList(core.getInput("markers") || "TODO,FIXME"),
    titlePrefix: core.getInput("title-prefix") || "TODO:",
    dryRun: core.getBooleanInput("dry-run"),
    dedupe: core.getBooleanInput("dedupe"),
    failOnFindings: core.getBooleanInput("fail-on-findings"),
    exclude: parseList(core.getInput("exclude")),
  };
}

function normalizeMode(value: string): ActionConfig["mode"] {
  if (value === "auto" || value === "pr" || value === "push" || value === "commit") {
    return value;
  }

  throw new Error(`Invalid mode "${value}". Expected auto, pr, push, or commit.`);
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
