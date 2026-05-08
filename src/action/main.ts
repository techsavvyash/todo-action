import * as core from "@actions/core";
import * as github from "@actions/github";
import { getChangedFiles } from "../github/changedFiles.js";
import { createIssues } from "../github/issues.js";
import { runAction } from "./runner.js";

export async function run(): Promise<void> {
  await runAction({
    createIssues,
    getChangedFiles,
    getOctokit: github.getOctokit,
    logger: core,
  });
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
