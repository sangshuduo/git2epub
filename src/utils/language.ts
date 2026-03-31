export function detectLanguage(text: string): string {
  const sample = text.slice(0, 1000);
  const cjkPattern = /[\u4e00-\u9fff\u3400-\u4dbf]/g;
  const cjkMatches = sample.match(cjkPattern);
  if (cjkMatches && cjkMatches.length > 10) {
    return "zh";
  }
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/g;
  const japaneseMatches = sample.match(japanesePattern);
  if (japaneseMatches && japaneseMatches.length > 10) {
    return "ja";
  }
  const koreanPattern = /[\uac00-\ud7af]/g;
  const koreanMatches = sample.match(koreanPattern);
  if (koreanMatches && koreanMatches.length > 10) {
    return "ko";
  }
  return "en";
}
