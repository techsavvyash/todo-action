import * as core from "@actions/core";
import * as github from "@actions/github";
import { scanChangedFiles } from "../core/scanner.js";
import { readConfig } from "./config.js";
import { getChangedFiles } from "./githubClient.js";
import { createIssues } from "./issues.js";

export async function run(): Promise<void> {
  const config = readConfig();
  const octokit = github.getOctokit(config.token);
  const files = await getChangedFiles(octokit, config);
  const findings = scanChangedFiles(files, {
    markers: config.markers,
    exclude: config.exclude,
  });

  for (const finding of findings) {
    core.info(`Found ${finding.marker} in ${finding.file}:${finding.startLine} - ${finding.text}`);
  }

  const created = await createIssues(octokit, config, findings);
  core.setOutput("todos-found", findings.length);
  core.setOutput("issues-created", created);

  if (config.failOnFindings && findings.length > 0) {
    throw new Error(`Found ${findings.length} TODO comment(s) in changed lines.`);
  }
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
