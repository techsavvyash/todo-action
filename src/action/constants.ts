export const INPUTS = {
  assignees: "assignees",
  commitSha: "commit-sha",
  dedupe: "dedupe",
  dryRun: "dry-run",
  exclude: "exclude",
  failOnTodos: "fail-on-todos",
  githubToken: "github-token",
  issueBodyTemplate: "issue-body-template",
  labels: "labels",
  markers: "markers",
  mode: "mode",
  titlePrefix: "title-prefix",
} as const;

export const DEFAULTS = {
  issueBodyTemplate: [
    "A {{marker}} comment was introduced in the diff.",
    "",
    "File: `{{file}}`",
    "Line: {{startLine}}",
    "Language: {{language}}",
    "",
    "```",
    "{{commentText}}",
    "```",
  ].join("\n"),
  markers: "TODO,FIXME",
  mode: "auto",
  titlePrefix: "TODO:",
} as const;

export const VALID_MODES = ["auto", "pr", "push", "commit"] as const;
