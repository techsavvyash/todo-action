export interface PatchFile {
  path: string;
  patch?: string | null;
  content?: string | null;
}

const HUNK_RE = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function addedLinesByFile(
  files: Pick<PatchFile, "path" | "patch">[],
): Map<string, Set<number>> {
  const result = new Map<string, Set<number>>();

  for (const file of files) {
    if (!file.patch) {
      continue;
    }

    const added = addedLinesFromPatch(file.patch);
    if (added.size > 0) {
      result.set(file.path, added);
    }
  }

  return result;
}

export function addedLinesFromPatch(patch: string): Set<number> {
  const added = new Set<number>();
  let newLine = 0;

  for (const rawLine of patch.split("\n")) {
    const hunk = rawLine.match(HUNK_RE);
    if (hunk) {
      newLine = Number(hunk[1]);
      continue;
    }

    if (rawLine.startsWith("+++") || rawLine.startsWith("---")) {
      continue;
    }

    if (rawLine.startsWith("+")) {
      added.add(newLine);
      newLine += 1;
      continue;
    }

    if (!rawLine.startsWith("-")) {
      newLine += 1;
    }
  }

  return added;
}
