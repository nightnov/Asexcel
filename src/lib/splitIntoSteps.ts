export interface ContentBlock {
  /** Step number extracted from a top-level "N. ..." line, or null for
   * intro text, bullet-only content, and code blocks. */
  step: number | null;
  /** Markdown for this block, with the leading "N. " marker stripped
   * (the number is shown separately as a badge instead). */
  markdown: string;
}

/**
 * Splits an assistant reply into separate bubbles: each top-level numbered
 * step becomes its own block (with the number pulled out to render as a
 * badge instead of a list marker), while intro sentences, non-numbered
 * paragraphs, and fenced code blocks each become their own block too.
 * Fenced code blocks are never split apart, even if they contain blank
 * lines or lines that look like list markers.
 */
export function splitIntoSteps(content: string): ContentBlock[] {
  const lines = content.split("\n");
  const blocks: ContentBlock[] = [];
  let current: string[] = [];
  let currentStep: number | null = null;
  let inCodeFence = false;

  const flush = () => {
    const text = current.join("\n").trim();
    if (text) blocks.push({ step: currentStep, markdown: text });
    current = [];
    currentStep = null;
  };

  for (const line of lines) {
    const isFenceLine = /^\s*```/.test(line);

    if (isFenceLine) {
      if (!inCodeFence) {
        flush();
        inCodeFence = true;
        current.push(line);
      } else {
        current.push(line);
        inCodeFence = false;
        flush();
      }
      continue;
    }

    if (inCodeFence) {
      current.push(line);
      continue;
    }

    const isIndented = /^\s{2,}\S/.test(line);
    const numberedMatch = !isIndented ? line.match(/^\s*(\d+)[.)]\s+(.*)$/) : null;

    if (numberedMatch) {
      flush();
      currentStep = parseInt(numberedMatch[1], 10);
      current.push(numberedMatch[2]);
      continue;
    }

    if (line.trim() === "") {
      flush();
      continue;
    }

    current.push(line);
  }
  flush();

  return blocks;
}
