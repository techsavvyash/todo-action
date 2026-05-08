import * as core from "@actions/core";
import * as github from "@actions/github";
import type { TodoFinding } from "../core/findings.js";
import type { ActionConfig } from "./config.js";
import type { Octokit } from "./githubClient.js";

export async function createIssues(
  octokit: Octokit,
  config: ActionConfig,
  findings: TodoFinding[],
): Promise<number> {
  const { owner, repo } = github.context.repo;
  let created = 0;

  for (const finding of findings) {
    const title = buildIssueTitle(config.titlePrefix, finding);
    const body = buildIssueBody(finding);

    if (config.dedupe && (await issueExists(octokit, finding.fingerprint))) {
      core.info(`Skipping duplicate issue for ${finding.file}:${finding.startLine}`);
      continue;
    }

    if (config.dryRun) {
      core.info(`[dry-run] ${title}\n${body}`);
      continue;
    }

    await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: config.labels,
      assignees: config.assignees,
    });
    created += 1;
  }

  return created;
}

async function issueExists(octokit: Octokit, fingerprint: string): Promise<boolean> {
  const { owner, repo } = github.context.repo;
  const query = `repo:${owner}/${repo} is:issue is:open in:body ${fingerprint}`;
  const { data } = await octokit.rest.search.issuesAndPullRequests({ q: query, per_page: 1 });
  return data.total_count > 0;
}

function buildIssueTitle(prefix: string, finding: TodoFinding): string {
  const normalizedPrefix = prefix.trim();
  const text = finding.text.length > 80 ? `${finding.text.slice(0, 77)}...` : finding.text;
  return `${normalizedPrefix} ${text || `${finding.file}:${finding.startLine}`}`;
}

function buildIssueBody(finding: TodoFinding): string {
  return [
    `<!-- todo-action:fingerprint=${finding.fingerprint} -->`,
    "",
    `A ${finding.marker} comment was introduced in the diff.`,
    "",
    `File: \`${finding.file}\``,
    `Line: ${finding.startLine}`,
    `Language: ${finding.language}`,
    "",
    "```",
    finding.commentText,
    "```",
  ].join("\n");
}
