export const INPUTS = {
  assignees: "assignees",
  commitSha: "commit-sha",
  dedupe: "dedupe",
  dryRun: "dry-run",
  exclude: "exclude",
  failOnFindings: "fail-on-findings",
  githubToken: "github-token",
  labels: "labels",
  markers: "markers",
  mode: "mode",
  titlePrefix: "title-prefix",
} as const;

export const DEFAULTS = {
  markers: "TODO,FIXME",
  mode: "auto",
  titlePrefix: "TODO:",
} as const;

export const VALID_MODES = ["auto", "pr", "push", "commit"] as const;
