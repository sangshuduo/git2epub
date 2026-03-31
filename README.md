# git2epub

Convert GitHub-hosted markdown repositories into EPUB or PDF e-books.

## Features

- Clone any GitHub/GitLab repository (public or private) and convert its markdown files into a single EPUB or PDF
- Auto-discovers chapters from `SUMMARY.md`, `TOC.md`, or filesystem ordering
- Supports `git2epub.yaml` config files for fine-grained control
- Processes and embeds images (including SVG-to-PNG conversion via sharp)
- Syntax-highlighted code blocks via rehype-highlight
- PDF output via Puppeteer (optional)

## Requirements

- Node.js >= 18
- Git (for cloning repositories)

## Installation

```bash
# Clone and build
git clone https://github.com/sangshuduo/git2epub.git
cd git2epub
npm install
npm run build

# Or install globally
npm link
```

## Usage

```bash
# Basic — generate an EPUB from a GitHub repo
git2epub https://github.com/user/book

# Specify output file and format
git2epub https://github.com/user/book -o mybook.epub
git2epub https://github.com/user/book -f pdf -o mybook.pdf

# From a local directory
git2epub ./my-markdown-book

# With metadata overrides
git2epub https://github.com/user/book --title "My Book" --author "Jane Doe" --lang en

# Private repository
git2epub https://github.com/user/private-book --token ghp_xxxxx

# Verbose output
git2epub https://github.com/user/book -v
```

## CLI Options

| Option                | Description                                  | Default                |
| --------------------- | -------------------------------------------- | ---------------------- |
| `-o, --output <file>` | Output filename                              | `<repo-name>.<format>` |
| `-f, --format <type>` | Output format: `epub` or `pdf`               | `epub`                 |
| `--title <title>`     | Override book title                          | Auto-detected          |
| `--author <author>`   | Override author name                         | Auto-detected          |
| `--lang <code>`       | Override language code                       | `en`                   |
| `--cover <path>`      | Cover image path or URL                      | None                   |
| `--keep-svg`          | Keep SVGs as-is instead of converting to PNG | `false`                |
| `--branch <name>`     | Git branch to use                            | Default branch         |
| `--token <token>`     | GitHub/GitLab token for private repos        | None                   |
| `--config <file>`     | Path to config file                          | `git2epub.yaml`        |
| `-v, --verbose`       | Verbose output                               | `false`                |

## Config File

Place a `git2epub.yaml` in your repository root to configure the conversion:

```yaml
title: "My Book Title"
author: "Author Name"
language: "en"
cover: "images/cover.png"
chapters:
  - introduction.md
  - chapter-01/index.md
  - chapter-02/index.md
  - appendix.md
```

CLI options take precedence over config file values.

## Pipeline

The conversion runs through five stages:

1. **Fetch** — Clone or copy the repository to a temporary directory
2. **Discover** — Find chapters via `SUMMARY.md`/`TOC.md`, config file, or filesystem scan
3. **Parse** — Convert markdown to HTML using unified/remark/rehype
4. **Transform** — Process images, rewrite paths, convert SVGs
5. **Build** — Assemble the final EPUB or PDF

## Development

```bash
npm install
npm run build
npm test
```

Pre-commit hooks are managed by [pre-commit](https://pre-commit.com/) and run prettier, eslint, type checking, and tests automatically.

## License

MIT
