import * as core from "@actions/core";
import * as github from "@actions/github";
import type { ActionConfig } from "../action/config.js";
import type { TodoComment } from "../todos/todo.js";
import type { Octokit } from "./changedFiles.js";
import { renderIssueBody } from "./issueTemplate.js";

export async function createIssues(
  octokit: Octokit,
  config: ActionConfig,
  todoComments: TodoComment[],
): Promise<number> {
  const { owner, repo } = github.context.repo;
  let created = 0;

  for (const todoComment of todoComments) {
    const title = buildIssueTitle(config.titlePrefix, todoComment);
    const body = renderIssueBody(config.issueBodyTemplate, todoComment);

    if (config.dedupe && (await issueExists(octokit, todoComment.fingerprint))) {
      core.info(`Skipping duplicate issue for ${todoComment.file}:${todoComment.startLine}`);
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

function buildIssueTitle(prefix: string, todoComment: TodoComment): string {
  const normalizedPrefix = prefix.trim();
  const text =
    todoComment.text.length > 80 ? `${todoComment.text.slice(0, 77)}...` : todoComment.text;
  return `${normalizedPrefix} ${text || `${todoComment.file}:${todoComment.startLine}`}`;
}
