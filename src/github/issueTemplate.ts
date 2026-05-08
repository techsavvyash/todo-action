import type { TodoComment } from "../todos/todo.js";

const FINGERPRINT_COMMENT_RE = /<!--\s*todo-action:fingerprint=/;

export function renderIssueBody(template: string, todoComment: TodoComment): string {
  const rendered = renderTemplate(template, {
    commentText: todoComment.commentText,
    endLine: String(todoComment.endLine),
    file: todoComment.file,
    fingerprint: todoComment.fingerprint,
    fingerprintComment: fingerprintComment(todoComment),
    language: todoComment.language,
    marker: todoComment.marker,
    startLine: String(todoComment.startLine),
    text: todoComment.text,
  });

  if (FINGERPRINT_COMMENT_RE.test(rendered)) {
    return rendered;
  }

  return [fingerprintComment(todoComment), "", rendered].join("\n");
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9]+)\s*\}\}/g, (match, key: string) => {
    return values[key] ?? match;
  });
}

function fingerprintComment(todoComment: TodoComment): string {
  return `<!-- todo-action:fingerprint=${todoComment.fingerprint} -->`;
}
