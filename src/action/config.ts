import * as core from "@actions/core";
import { DEFAULTS, INPUTS, VALID_MODES } from "./constants.js";

type ActionMode = (typeof VALID_MODES)[number];

export interface ActionConfig {
  token: string;
  mode: ActionMode;
  commitSha?: string;
  labels: string[];
  assignees: string[];
  markers: string[];
  titlePrefix: string;
  issueBodyTemplate: string;
  dryRun: boolean;
  dedupe: boolean;
  failOnTodos: boolean;
  exclude: string[];
}

export function readConfig(): ActionConfig {
  return {
    token: core.getInput(INPUTS.githubToken, { required: true }),
    mode: normalizeMode(core.getInput(INPUTS.mode) || DEFAULTS.mode),
    commitSha: core.getInput(INPUTS.commitSha) || undefined,
    labels: parseList(core.getInput(INPUTS.labels)),
    assignees: parseList(core.getInput(INPUTS.assignees)),
    markers: parseList(core.getInput(INPUTS.markers) || DEFAULTS.markers),
    titlePrefix: core.getInput(INPUTS.titlePrefix) || DEFAULTS.titlePrefix,
    issueBodyTemplate: core.getInput(INPUTS.issueBodyTemplate) || DEFAULTS.issueBodyTemplate,
    dryRun: core.getBooleanInput(INPUTS.dryRun),
    dedupe: core.getBooleanInput(INPUTS.dedupe),
    failOnTodos: core.getBooleanInput(INPUTS.failOnTodos),
    exclude: parseList(core.getInput(INPUTS.exclude)),
  };
}

function normalizeMode(value: string): ActionMode {
  if (isActionMode(value)) {
    return value;
  }

  throw new Error(`Invalid mode "${value}". Expected ${VALID_MODES.join(", ")}.`);
}

function isActionMode(value: string): value is ActionMode {
  return VALID_MODES.includes(value as ActionMode);
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
