import { describe, expect, it } from "vitest";
import { scanChangedFiles } from "./scanner.js";

describe("scanChangedFiles", () => {
  it("finds TODO comments in added TypeScript comment nodes", () => {
    const content = [
      "export function example() {",
      '  const value = "TODO: not a comment";',
      "  // TODO: wire this to persistence",
      "  return value;",
      "}",
    ].join("\n");

    const todoComments = scanChangedFiles([
      {
        path: "src/example.ts",
        content,
        patch: [
          "@@ -1,3 +1,5 @@",
          " export function example() {",
          '+  const value = "TODO: not a comment";',
          "+  // TODO: wire this to persistence",
          "+  return value;",
          " }",
        ].join("\n"),
      },
    ]);

    expect(todoComments).toHaveLength(1);
    expect(todoComments[0]).toMatchObject({
      file: "src/example.ts",
      startLine: 3,
      marker: "TODO",
      text: "wire this to persistence",
      language: "typescript",
    });
  });

  it("finds TODO comments in added JavaScript comment nodes", () => {
    const content = [
      "export function example() {",
      '  const value = "TODO: not a comment";',
      "  // TODO: debounce the expensive update",
      "  return value;",
      "}",
    ].join("\n");

    const todoComments = scanChangedFiles([
      {
        path: "src/example.js",
        content,
        patch: [
          "@@ -1,3 +1,5 @@",
          " export function example() {",
          '+  const value = "TODO: not a comment";',
          "+  // TODO: debounce the expensive update",
          "+  return value;",
          " }",
        ].join("\n"),
      },
    ]);

    expect(todoComments).toHaveLength(1);
    expect(todoComments[0]).toMatchObject({
      file: "src/example.js",
      startLine: 3,
      marker: "TODO",
      text: "debounce the expensive update",
      language: "javascript",
    });
  });

  it("finds Go block comments that intersect added lines", () => {
    const content = [
      "package main",
      "",
      "/*",
      " * TODO: remove the temporary migration path",
      " */",
      "func main() {}",
    ].join("\n");

    const todoComments = scanChangedFiles([
      {
        path: "main.go",
        content,
        patch: [
          "@@ -1,2 +1,6 @@",
          " package main",
          " ",
          "+/*",
          "+ * TODO: remove the temporary migration path",
          "+ */",
          "+func main() {}",
        ].join("\n"),
      },
    ]);

    expect(todoComments).toHaveLength(1);
    expect(todoComments[0]).toMatchObject({
      file: "main.go",
      startLine: 3,
      endLine: 5,
      marker: "TODO",
      text: "remove the temporary migration path",
      language: "go",
    });
  });

  it("finds Python hash comments and ignores string literals", () => {
    const content = [
      "def example():",
      '    value = "TODO: not a comment"',
      "    # FIXME - handle empty response",
      "    return value",
    ].join("\n");

    const todoComments = scanChangedFiles([
      {
        path: "example.py",
        content,
        patch: [
          "@@ -1,2 +1,4 @@",
          " def example():",
          '+    value = "TODO: not a comment"',
          "+    # FIXME - handle empty response",
          "+    return value",
        ].join("\n"),
      },
    ]);

    expect(todoComments).toHaveLength(1);
    expect(todoComments[0]).toMatchObject({
      file: "example.py",
      startLine: 3,
      marker: "FIXME",
      text: "handle empty response",
      language: "python",
    });
  });

  it("ignores unsupported files", () => {
    const todoComments = scanChangedFiles([
      {
        path: "README.md",
        content: "<!-- TODO: ignored for v1 -->",
        patch: "@@ -0,0 +1,1 @@\n+<!-- TODO: ignored for v1 -->",
      },
    ]);

    expect(todoComments).toEqual([]);
  });
});
