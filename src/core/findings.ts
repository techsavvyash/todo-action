import { createHash } from "node:crypto";

export type SupportedLanguage = "go" | "javascript" | "typescript" | "python";

export interface TodoFinding {
  fingerprint: string;
  marker: string;
  text: string;
  file: string;
  startLine: number;
  endLine: number;
  language: SupportedLanguage;
  commentText: string;
}

export function fingerprintFinding(input: Omit<TodoFinding, "fingerprint">): string {
  const stableParts = [
    input.file,
    input.language,
    input.marker.toUpperCase(),
    normalizeForFingerprint(input.text),
  ];

  return createHash("sha256").update(stableParts.join("\0")).digest("hex");
}

export function normalizeForFingerprint(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
