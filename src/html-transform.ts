import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Remove script, style, noscript elements (these have content)
turndown.remove(['script', 'style', 'noscript']);

// Custom rule to completely remove images (void elements need explicit handling)
turndown.addRule('removeImages', {
  filter: 'img',
  replacement: () => '',
});

// Custom rule to remove tracking pixels and 1x1 images that might slip through
turndown.addRule('removeTrackingPixels', {
  filter: (node: HTMLElement) => {
    if (node.nodeName !== 'IMG') return false;
    const width = node.getAttribute('width');
    const height = node.getAttribute('height');
    // Remove 1x1 tracking pixels
    return width === '1' || height === '1';
  },
  replacement: () => '',
});

/**
 * Extract the original URL from Microsoft Safe Links wrapper
 * Safe Links format: https://na01.safelinks.protection.outlook.com/?url=ENCODED_URL&data=...
 */
function unwrapSafeLinks(text: string): string {
  // Match Safe Links URLs and extract the original URL
  const safeLinkPattern =
    /https?:\/\/[a-z0-9]+\.safelinks\.protection\.outlook\.com\/\?url=([^&]+)(?:&[^\s)>\]]*)?/gi;

  return text.replace(safeLinkPattern, (match, encodedUrl) => {
    try {
      return decodeURIComponent(encodedUrl);
    } catch {
      return match; // Return original if decoding fails
    }
  });
}

/**
 * Clean up excessive whitespace and empty lines
 */
function normalizeWhitespace(text: string): string {
  return (
    text
      // Replace multiple newlines with max 2
      .replace(/\n{3,}/g, '\n\n')
      // Remove trailing whitespace on lines
      .replace(/[ \t]+$/gm, '')
      // Trim leading/trailing whitespace
      .trim()
  );
}

export function htmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return html;
  try {
    let markdown = turndown.turndown(html);

    // Post-process: unwrap Microsoft Safe Links
    markdown = unwrapSafeLinks(markdown);

    // Post-process: normalize whitespace
    markdown = normalizeWhitespace(markdown);

    return markdown;
  } catch {
    return html; // Fallback to original on error
  }
}
