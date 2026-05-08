import path from "node:path";
import Go from "tree-sitter-go";
import JavaScript from "tree-sitter-javascript";
import Python from "tree-sitter-python";
import TypeScriptParsers from "tree-sitter-typescript";
import type { Language } from "tree-sitter";
import type { SupportedLanguage } from "./findings.js";

const { tsx, typescript } = TypeScriptParsers;

export interface LanguageDefinition {
  id: SupportedLanguage;
  extensions: string[];
  filenames?: string[];
  language: Language;
}

const definitions: LanguageDefinition[] = [
  {
    id: "go",
    extensions: [".go"],
    language: Go,
  },
  {
    id: "javascript",
    extensions: [".js", ".jsx", ".mjs", ".cjs"],
    language: JavaScript,
  },
  {
    id: "typescript",
    extensions: [".ts"],
    language: typescript,
  },
  {
    id: "typescript",
    extensions: [".tsx"],
    language: tsx,
  },
  {
    id: "python",
    extensions: [".py"],
    language: Python,
  },
];

export function resolveLanguage(filePath: string): LanguageDefinition | undefined {
  const basename = path.basename(filePath);
  const extension = path.extname(filePath);

  return definitions.find((definition) => {
    return definition.extensions.includes(extension) || definition.filenames?.includes(basename);
  });
}
