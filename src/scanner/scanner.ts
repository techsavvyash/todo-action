import { addedLinesByFile, type PatchFile } from "../diff/patch.js";
import { resolveLanguage } from "../parsers/languages.js";
import { collectCommentNodes, parseContent, type SyntaxNode } from "../parsers/treeSitter.js";
import { fingerprintTodo, type TodoComment } from "../todos/todo.js";

export interface ScanOptions {
  markers?: string[];
  exclude?: string[];
}

const DEFAULT_MARKERS = ["TODO", "FIXME"];

export function scanChangedFiles(files: PatchFile[], options: ScanOptions = {}): TodoComment[] {
  const addedLineMap = addedLinesByFile(files);
  const markers = options.markers?.length ? options.markers : DEFAULT_MARKERS;
  const markerPattern = buildMarkerPattern(markers);
  const exclude = options.exclude?.filter(Boolean) ?? [];
  const todoComments: TodoComment[] = [];

  for (const file of files) {
    if (!file.content || exclude.some((part) => file.path.includes(part))) {
      continue;
    }

    const language = resolveLanguage(file.path);
    const addedLines = addedLineMap.get(file.path);
    if (!language || !addedLines || addedLines.size === 0) {
      continue;
    }

    const root = parseContent(file.content, language.language);
    const commentNodes = collectCommentNodes(root);

    for (const node of commentNodes) {
      if (!nodeIntersectsAddedLines(node, addedLines)) {
        continue;
      }

      const rawComment = file.content.slice(node.startIndex, node.endIndex);
      const normalizedComment = normalizeCommentText(rawComment);
      const match = normalizedComment.match(markerPattern);
      if (!match) {
        continue;
      }

      const marker = match[1].toUpperCase();
      const text = (match[2] || normalizedComment).trim();
      const withoutFingerprint = {
        marker,
        text,
        file: file.path,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1,
        language: language.id,
        commentText: normalizedComment,
      };

      todoComments.push({
        ...withoutFingerprint,
        fingerprint: fingerprintTodo(withoutFingerprint),
      });
    }
  }

  return todoComments;
}

function nodeIntersectsAddedLines(node: SyntaxNode, addedLines: Set<number>): boolean {
  for (let line = node.startPosition.row + 1; line <= node.endPosition.row + 1; line += 1) {
    if (addedLines.has(line)) {
      return true;
    }
  }

  return false;
}

function buildMarkerPattern(markers: string[]): RegExp {
  const markerAlternation = markers.map(escapeRegExp).join("|");
  return new RegExp(`\\b(${markerAlternation})\\b(?:\\([^)]*\\))?\\s*[:\\-]?\\s*([^\\n]*)`, "i");
}

function normalizeCommentText(comment: string): string {
  let value = comment.trim();

  if (value.startsWith("/*")) {
    value = value.replace(/^\/\*/, "").replace(/\*\/$/, "");
  } else if (value.startsWith("//")) {
    value = value.replace(/^\/\/+/, "");
  } else if (value.startsWith("#")) {
    value = value.replace(/^#+/, "");
  }

  return value
    .split("\n")
    .map((line) => line.trim().replace(/^\*+\s?/, ""))
    .join("\n")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
