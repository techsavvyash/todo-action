# TODO Issue Creator

GitHub Action that scans the diff for newly added `TODO` comments and creates issue tickets in the repository where the workflow runs.

It currently supports pull request diffs, push diffs, and a single commit SHA. The scanner only considers comments that overlap added lines in the diff, so pre-existing TODOs are ignored unless they are touched as new additions.

The v1 scanner is Tree-sitter-backed for:

- Go: `.go`
- JavaScript: `.js`, `.jsx`, `.mjs`, `.cjs`
- TypeScript: `.ts`, `.tsx`
- Python: `.py`

The action runs as a composite Node action. It installs dependencies and builds the TypeScript entrypoint at runtime so native Tree-sitter parser packages are available normally on the runner.

## Usage

```yaml
name: TODO issues

on:
  pull_request:
  push:

permissions:
  contents: read
  pull-requests: read
  issues: write

jobs:
  todo-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          github-token: ${{ github.token }}
          labels: todo,needs-triage
```

## Inputs

| Input                 | Default                 | Description                                                              |
| --------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `github-token`        | `${{ github.token }}`   | Token used to read diffs and create issues.                              |
| `mode`                | `auto`                  | `auto`, `pr`, `push`, or `commit`.                                       |
| `commit-sha`          | empty                   | Commit SHA to inspect when `mode` is `commit`.                           |
| `markers`             | `TODO,FIXME`            | Comma-separated markers to detect inside comment nodes.                  |
| `labels`              | `todo`                  | Comma-separated labels for created issues.                               |
| `assignees`           | empty                   | Comma-separated assignees for created issues.                            |
| `title-prefix`        | `TODO:`                 | Prefix for generated issue titles.                                       |
| `issue-body-template` | default markdown body   | Markdown template for generated issue bodies.                            |
| `dry-run`             | `false`                 | Log TODO comments without creating issues.                               |
| `dedupe`              | `true`                  | Search open issues for a hidden fingerprint before creating a new issue. |
| `fail-on-todos`       | `false`                 | Fail the workflow when TODO comments are found.                          |
| `exclude`             | `node_modules,dist,lib` | Comma-separated path substrings to skip.                                 |

## Issue Body Templates

Customize the generated issue body with `issue-body-template`:

```yaml
with:
  github-token: ${{ github.token }}
  issue-body-template: |
    ## {{marker}} in {{file}}

    Line: {{startLine}}
    Language: {{language}}

    ~~~text
    {{commentText}}
    ~~~
```

Supported placeholders: `{{marker}}`, `{{text}}`, `{{file}}`, `{{startLine}}`, `{{endLine}}`, `{{language}}`, `{{commentText}}`, `{{fingerprint}}`, and `{{fingerprintComment}}`.

The action automatically includes the hidden fingerprint comment if the template omits it, because dedupe depends on that value.

## Local development

```bash
npm install
npm run all
```

Use Node 24 locally:

```bash
nvm use 24
```

The code is split by responsibility so the GitHub Action stays thin:

- `src/action/`: action input parsing and orchestration.
- `src/github/`: GitHub API reads, issue creation, and dedupe behavior.
- `src/parsers/`: Tree-sitter language registration and syntax tree traversal.
- `src/scanner/`: parser-backed TODO scanner over changed files.
- `src/diff/` and `src/todos/`: pure diff parsing and TODO comment/fingerprint models.

The scanner and pure utilities are intentionally independent from GitHub Actions so a CLI or lint rule can call the same core later.
