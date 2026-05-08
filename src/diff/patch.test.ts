import { describe, expect, it } from "vitest";
import { addedLinesByFile, addedLinesFromPatch } from "./patch.js";

describe("addedLinesFromPatch", () => {
  it("tracks added line numbers across multiple hunks", () => {
    const patch = [
      "@@ -1,3 +10,4 @@",
      " const first = true;",
      "+// TODO: first new line",
      "-const removed = true;",
      "+const added = true;",
      " const last = true;",
      "@@ -20,2 +30,3 @@",
      " const next = true;",
      "+// FIXME: second hunk",
    ].join("\n");

    expect([...addedLinesFromPatch(patch)]).toEqual([11, 12, 31]);
  });
});

describe("addedLinesByFile", () => {
  it("omits files without added lines", () => {
    const result = addedLinesByFile([
      {
        path: "src/changed.ts",
        patch: "@@ -1,1 +1,2 @@\n const value = true;\n+// TODO: added",
      },
      {
        path: "src/metadata.ts",
        patch: undefined,
      },
    ]);

    expect(result.get("src/changed.ts")).toEqual(new Set([2]));
    expect(result.has("src/metadata.ts")).toBe(false);
  });
});
