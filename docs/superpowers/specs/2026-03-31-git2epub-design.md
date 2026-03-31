# git2epub — Design Spec

**Date:** 2026-03-31
**Status:** Approved

## Overview

A TypeScript CLI tool that converts GitHub-hosted books (markdown repositories) into EPUB or PDF files. Takes a repository URL (or local path) and produces a well-formatted e-book with proper chapter ordering, table of contents, embedded images, and syntax-highlighted code blocks.

## Architecture: Pipeline

A sequential pipeline of 5 stages, each a pure function:

```
Input (URL/path) → Fetch → Discover → Parse → Transform → Build → Output (EPUB/PDF)
```

1. **Fetch** — Download repo via GitHub API tarball (fast path) or `git clone` (fallback for private repos / non-GitHub hosts). Extract to a temp directory.
2. **Discover** — Determine chapter ordering and book metadata. Three strategies in priority order: config file → SUMMARY.md → filesystem auto-detect.
3. **Parse** — Read each markdown file, parse to AST using `unified`/`remark`. Collect image references.
4. **Transform** — Convert markdown AST to HTML. Convert SVGs to PNGs (unless `--keep-svg`). Resolve relative links between chapters.
5. **Build** — Assemble EPUB using `epub-gen-memory`. If `--pdf`, render combined HTML to PDF via Puppeteer.

## CLI Interface

```
git2epub <repo-url-or-path> [options]

Arguments:
  repo-url-or-path    GitHub/GitLab URL or local directory path

Options:
  -o, --output <file>     Output filename (default: <repo-name>.epub)
  -f, --format <type>     Output format: epub | pdf (default: epub)
  --title <title>         Override book title
  --author <author>       Override author name
  --lang <code>           Override language (e.g., en, zh)
  --cover <path-or-url>   Cover image path or URL
  --keep-svg              Keep SVGs as-is instead of converting to PNG
  --branch <name>         Git branch to use (default: main/master)
  --token <token>         GitHub/GitLab token for private repos
  --config <file>         Path to config file (default: git2epub.yaml in repo root)
  -v, --verbose           Verbose output
  --version               Show version
  -h, --help              Show help

Examples:
  git2epub https://github.com/user/book
  git2epub https://github.com/user/book -o mybook.epub --title "My Book"
  git2epub ./local-book-dir -f pdf --author "Jane Doe"
  git2epub https://github.com/user/private-book --token ghp_xxx
```

## Chapter Discovery & Ordering

Three strategies, tried in priority order:

### Priority 1: Config file (`git2epub.yaml`)

```yaml
title: "Claude Code Design Guide"
author: "6551Team"
language: zh
cover: images/cover.png
chapters:
  - 00-preface.md
  - part1/01-introduction.md
  - part1/02-quick-start.md
```

### Priority 2: `SUMMARY.md`

Parse the ordered list of markdown links (mdBook/GitBook convention):

```markdown
- [Introduction](./src/intro.md)
- [Chapter 1](./src/ch1.md)
```

### Priority 3: Filesystem auto-detect

- Scan for `.md` files (excluding README.md, CONTRIBUTING.md, LICENSE, etc.)
- Sort by numeric prefix: directories first (`part1/`, `part2/`), then files within each (`01-*.md`, `02-*.md`)
- Non-numbered files sorted alphabetically after numbered ones
- Nested directories flattened into a linear chapter sequence; directory names become part/section separators in the EPUB TOC

### Metadata auto-detection fallbacks

- **Title:** config → first `# heading` in README.md → repo name
- **Author:** config → repo owner name (via GitHub API) → "Unknown"
- **Language:** config → detect from content (first 1000 chars) → "en"
- **Cover:** config → `cover.png`/`cover.jpg` in repo root → none

## Image & Asset Handling

### Image collection

During the Parse stage, all image references in markdown (`![alt](path)`) are collected. Relative paths resolved against each chapter's location.

### SVG handling (default — convert to PNG)

- Use `sharp` to rasterize SVGs to PNGs at 2x resolution (retina clarity)
- Replace image references in HTML to point to converted PNGs
- `--keep-svg`: embed SVGs as-is (EPUB3 supports SVG, but Kindle does not)

### Other formats

- PNG, JPG, GIF — included as-is
- WebP — convert to PNG (limited e-reader support)

### Remote images

- Images referenced via URL (`![](https://...)`) downloaded and embedded locally
- Fail gracefully with warning if download fails — include alt text placeholder

### Size limits

- Warn if any single image exceeds 5MB
- Warn if total EPUB size exceeds 100MB

## EPUB Generation

- Use `epub-gen-memory` to build EPUB3 files in memory
- Each discovered chapter becomes an XHTML content document
- TOC generated from chapter titles (first `# heading` in each file)
- Nested TOC: parts become top-level entries, chapters nested underneath
- All images embedded in EPUB's `images/` directory
- Metadata written to OPF manifest
- Markdown → HTML via `unified` + `remark-parse` + `remark-rehype` + `rehype-stringify`
- Code blocks syntax-highlighted via `rehype-highlight` (CSS only, no JS)

## PDF Generation (`--pdf`)

- Use Puppeteer (headless Chrome) to render HTML to PDF
- Puppeteer is an optional dependency, installed on-demand
- If not installed, prompt: `"PDF generation requires Puppeteer. Install it? (npx git2epub --install-pdf-deps)"`
- Combine all chapters into single HTML with page breaks between chapters
- Print-friendly CSS stylesheet (serif font, proper margins, page numbers)

## Error Handling

- Markdown file fails to parse → warn and skip (don't fail entire build)
- Image conversion fails → warn and use placeholder
- Fatal errors only for: no chapters found, output file not writable

## Project Structure

```
git2epub/
├── src/
│   ├── cli.ts              # CLI entry point (commander)
│   ├── pipeline.ts         # Orchestrates the 5 pipeline stages
│   ├── stages/
│   │   ├── fetch.ts        # Download repo (GitHub API / git clone)
│   │   ├── discover.ts     # Chapter ordering, metadata detection
│   │   ├── parse.ts        # Markdown → AST, collect image refs
│   │   ├── transform.ts    # AST → HTML, SVG→PNG, resolve links
│   │   └── build.ts        # Assemble EPUB / PDF
│   ├── config.ts           # Load & merge git2epub.yaml + CLI flags
│   ├── types.ts            # Shared type definitions
│   └── utils/
│       ├── git.ts          # Git clone helper
│       ├── github-api.ts   # GitHub API tarball download
│       ├── images.ts       # Image download & SVG conversion
│       └── language.ts     # Language detection
├── package.json
├── tsconfig.json
├── README.md
└── tests/
    ├── stages/
    │   ├── fetch.test.ts
    │   ├── discover.test.ts
    │   ├── parse.test.ts
    │   ├── transform.test.ts
    │   └── build.test.ts
    └── fixtures/            # Sample repo structures for testing
```

## Key Dependencies

- `commander` — CLI parsing
- `unified` + `remark-parse` + `remark-rehype` + `rehype-stringify` + `rehype-highlight` — Markdown processing
- `sharp` — SVG/WebP to PNG conversion
- `epub-gen-memory` — EPUB assembly
- `js-yaml` — Config file parsing
- `puppeteer` — Optional, PDF generation only

## Build & Publish

- TypeScript compiled with `tsconfig.json` (ESM output, Node 18+)
- Published to npm as `git2epub`
- Usable via `npx git2epub <url>`
- `bin` field in package.json points to compiled CLI entry
