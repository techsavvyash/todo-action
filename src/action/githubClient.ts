import * as github from "@actions/github";
import type { PatchFile } from "../core/diff.js";
import type { ActionConfig } from "./config.js";

export type Octokit = ReturnType<typeof github.getOctokit>;

type GitHubFile = {
  filename: string;
  patch?: string;
  status?: string;
};

export async function getChangedFiles(
  octokit: Octokit,
  config: ActionConfig,
): Promise<PatchFile[]> {
  const mode = resolveMode(config.mode);

  if (mode === "pr") {
    return getPullRequestFiles(octokit);
  }

  if (mode === "commit") {
    return getCommitFiles(octokit, config.commitSha ?? github.context.sha);
  }

  return getPushFiles(octokit);
}

async function getPullRequestFiles(octokit: Octokit): Promise<PatchFile[]> {
  const { owner, repo } = github.context.repo;
  const pull = github.context.payload.pull_request;
  if (!pull?.number || !pull.head?.sha) {
    throw new Error(
      "Pull request number and head SHA were not available in the GitHub event payload.",
    );
  }

  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pull.number,
    per_page: 100,
  });

  return attachContents(octokit, files, pull.head.sha);
}

async function getCommitFiles(octokit: Octokit, ref: string): Promise<PatchFile[]> {
  const { owner, repo } = github.context.repo;
  const { data } = await octokit.rest.repos.getCommit({ owner, repo, ref });
  return attachContents(octokit, data.files ?? [], ref);
}

async function getPushFiles(octokit: Octokit): Promise<PatchFile[]> {
  const { owner, repo } = github.context.repo;
  const before = github.context.payload.before;
  const after = github.context.payload.after ?? github.context.sha;
  if (!before || !after) {
    throw new Error("Push comparison requires before and after SHAs in the GitHub event payload.");
  }

  const { data } = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${before}...${after}`,
  });

  return attachContents(octokit, data.files ?? [], after);
}

async function attachContents(
  octokit: Octokit,
  files: GitHubFile[],
  ref: string,
): Promise<PatchFile[]> {
  const result: PatchFile[] = [];

  for (const file of files) {
    if (file.status === "removed") {
      continue;
    }

    result.push({
      path: file.filename,
      patch: file.patch,
      content: await getFileContent(octokit, file.filename, ref),
    });
  }

  return result;
}

async function getFileContent(
  octokit: Octokit,
  filePath: string,
  ref: string,
): Promise<string | null> {
  const { owner, repo } = github.context.repo;

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref,
    });

    if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
      return null;
    }

    return Buffer.from(data.content, data.encoding as BufferEncoding).toString("utf8");
  } catch (error) {
    if (error instanceof Error) {
      return null;
    }
    throw error;
  }
}

function resolveMode(mode: ActionConfig["mode"]): Exclude<ActionConfig["mode"], "auto"> {
  if (mode !== "auto") {
    return mode;
  }

  if (
    github.context.eventName === "pull_request" ||
    github.context.eventName === "pull_request_target"
  ) {
    return "pr";
  }

  if (github.context.eventName === "push") {
    return "push";
  }

  return "commit";
}
