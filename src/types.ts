export interface BookConfig {
  readonly title?: string;
  readonly author?: string;
  readonly language?: string;
  readonly cover?: string;
  readonly chapters?: readonly string[];
}

export interface CliOptions {
  readonly output?: string;
  readonly format: "epub" | "pdf";
  readonly title?: string;
  readonly author?: string;
  readonly lang?: string;
  readonly cover?: string;
  readonly keepSvg: boolean;
  readonly branch?: string;
  readonly token?: string;
  readonly config?: string;
  readonly verbose: boolean;
}

export interface BookMetadata {
  readonly title: string;
  readonly author: string;
  readonly language: string;
  readonly cover?: string;
}

export interface Chapter {
  readonly title: string;
  readonly filePath: string;
  readonly content: string;
  readonly order: number;
  readonly part?: string;
}

export interface ParsedChapter {
  readonly title: string;
  readonly filePath: string;
  readonly htmlContent: string;
  readonly images: readonly ImageRef[];
  readonly order: number;
  readonly part?: string;
}

export interface ImageRef {
  readonly originalPath: string;
  readonly resolvedPath: string;
  readonly isRemote: boolean;
  readonly isSvg: boolean;
}

export interface ProcessedImage {
  readonly originalPath: string;
  readonly outputPath: string;
  readonly data: Buffer;
  readonly mimeType: string;
}

export interface DiscoveryResult {
  readonly chapters: readonly Chapter[];
  readonly metadata: BookMetadata;
}

export interface PipelineContext {
  readonly repoDir: string;
  readonly options: CliOptions;
  readonly source: string;
}
