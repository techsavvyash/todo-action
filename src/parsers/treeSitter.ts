import Parser, { type Language, type SyntaxNode } from "tree-sitter";

export type { SyntaxNode };

export function parseContent(content: string, language: Language): SyntaxNode {
  const parser = new Parser();
  parser.setLanguage(language);
  return parser.parse(content).rootNode;
}

export function collectCommentNodes(root: SyntaxNode): SyntaxNode[] {
  const comments: SyntaxNode[] = [];
  const stack: SyntaxNode[] = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }

    if (node.type === "comment") {
      comments.push(node);
    }

    for (let index = node.childCount - 1; index >= 0; index -= 1) {
      const child = node.child(index);
      if (child) {
        stack.push(child);
      }
    }
  }

  return comments;
}
