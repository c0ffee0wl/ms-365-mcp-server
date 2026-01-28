import TurndownService from 'turndown';

// Use Turndown's built-in .remove() method - no custom rules needed
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
}).remove(['script', 'style', 'img', 'noscript']); // Built-in removal

export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return html;
  try {
    return turndown.turndown(html);
  } catch {
    return html; // Fallback to original on error
  }
}
