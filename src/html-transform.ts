import TurndownService from 'turndown';

// Minimal interface for Turndown's node type (avoids browser-only HTMLElement)
interface TurndownNode {
  nodeName: string;
  getAttribute(name: string): string | null;
  textContent?: string | null;
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
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
  filter: (node: TurndownNode) => {
    if (node.nodeName !== 'IMG') return false;
    const width = node.getAttribute('width');
    const height = node.getAttribute('height');
    // Remove 1x1 tracking pixels
    return width === '1' || height === '1';
  },
  replacement: () => '',
});

// Custom rule to simplify <br> tags - use single newline instead of double
turndown.addRule('simplifyBreaks', {
  filter: 'br',
  replacement: () => '\n',
});

// Custom rule to optimize links:
// - Remove title attributes (rarely useful, wastes tokens)
// - Simplify redundant links where text === URL
turndown.addRule('optimizeLinks', {
  filter: 'a',
  replacement: (content: string, node: TurndownNode) => {
    const href = node.getAttribute('href');
    if (!href) return content; // No href, just return text

    const trimmedContent = content.trim();
    // If link text is the same as URL, just show the URL (auto-linked by most renderers)
    if (trimmedContent === href || trimmedContent === href.replace(/^https?:\/\//, '')) {
      return href;
    }

    // Otherwise return standard markdown link without title
    return `[${trimmedContent}](${href})`;
  },
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
 * Remove invisible Unicode characters that waste tokens
 * These are often inserted by email clients or copy-paste operations
 */
function removeInvisibleChars(text: string): string {
  // List of invisible/formatting characters to remove:
  // - Zero-width characters (200B-200D)
  // - Soft hyphen (00AD)
  // - Word joiner (2060)
  // - BOM (FEFF)
  // - Directional marks and embeddings (200E-200F, 202A-202E)
  // eslint-disable-next-line no-misleading-character-class
  return text.replace(/[\u200B-\u200F\u00AD\u2060\uFEFF\u202A-\u202E]/g, '');
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

    // Post-process: remove invisible characters
    markdown = removeInvisibleChars(markdown);

    // Post-process: normalize whitespace
    markdown = normalizeWhitespace(markdown);

    return markdown;
  } catch {
    return html; // Fallback to original on error
  }
}
