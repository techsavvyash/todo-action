import type { getOctokit } from "@actions/github";
import type { PatchFile } from "../diff/patch.js";
import { scanChangedFiles } from "../scanner/scanner.js";
import type { TodoComment } from "../todos/todo.js";
import { type ActionConfig, readConfig } from "./config.js";

export interface ActionLogger {
  info(message: string): void;
  setOutput(name: string, value: number): void;
}

export interface ActionDependencies {
  createIssues(
    octokit: ReturnType<typeof getOctokit>,
    config: ActionConfig,
    todoComments: TodoComment[],
  ): Promise<number>;
  getChangedFiles(
    octokit: ReturnType<typeof getOctokit>,
    config: ActionConfig,
  ): Promise<PatchFile[]>;
  getOctokit: typeof getOctokit;
  logger: ActionLogger;
  readConfig?: () => ActionConfig;
}

export async function runAction(dependencies: ActionDependencies): Promise<void> {
  const config = (dependencies.readConfig ?? readConfig)();
  const octokit = dependencies.getOctokit(config.token);
  const files = await dependencies.getChangedFiles(octokit, config);
  const todoComments = scanChangedFiles(files, {
    markers: config.markers,
    exclude: config.exclude,
  });

  for (const todoComment of todoComments) {
    dependencies.logger.info(
      `Found ${todoComment.marker} in ${todoComment.file}:${todoComment.startLine} - ${todoComment.text}`,
    );
  }

  const created = await dependencies.createIssues(octokit, config, todoComments);
  dependencies.logger.setOutput("todos-found", todoComments.length);
  dependencies.logger.setOutput("issues-created", created);

  if (config.failOnTodos && todoComments.length > 0) {
    throw new Error(`Found ${todoComments.length} TODO comment(s) in changed lines.`);
  }
}
