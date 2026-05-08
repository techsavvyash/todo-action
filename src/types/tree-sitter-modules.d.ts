declare module "tree-sitter" {
  export interface Point {
    row: number;
    column: number;
  }

  export interface SyntaxNode {
    type: string;
    startIndex: number;
    endIndex: number;
    startPosition: Point;
    endPosition: Point;
    childCount: number;
    child(index: number): SyntaxNode | null;
  }

  export interface Tree {
    rootNode: SyntaxNode;
  }

  export interface Language {}

  export default class Parser {
    setLanguage(language: Language): void;
    parse(input: string): Tree;
  }
}

declare module "tree-sitter-go" {
  import type { Language } from "tree-sitter";
  const language: Language;
  export = language;
}

declare module "tree-sitter-javascript" {
  import type { Language } from "tree-sitter";
  const language: Language;
  export = language;
}

declare module "tree-sitter-python" {
  import type { Language } from "tree-sitter";
  const language: Language;
  export = language;
}

declare module "tree-sitter-typescript" {
  import type { Language } from "tree-sitter";
  const languages: {
    tsx: Language;
    typescript: Language;
  };
  export = languages;
}
