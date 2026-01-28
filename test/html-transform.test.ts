import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from '../src/html-transform.js';

describe('HTML Transform Module', () => {
  describe('htmlToMarkdown', () => {
    describe('basic conversion', () => {
      it('should convert simple HTML to markdown', () => {
        const html = '<p>Hello world</p>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('Hello world');
      });

      it('should preserve headings', () => {
        const html = '<h1>Title</h1><p>Content</p>';
        const result = htmlToMarkdown(html);
        expect(result).toContain('# Title');
        expect(result).toContain('Content');
      });

      it('should handle empty input', () => {
        expect(htmlToMarkdown('')).toBe('');
        expect(htmlToMarkdown(null as unknown as string)).toBe(null);
        expect(htmlToMarkdown(undefined as unknown as string)).toBe(undefined);
      });
    });

    describe('image removal', () => {
      it('should remove regular images', () => {
        const html = '<p>Text <img src="test.jpg" alt="test"> more text</p>';
        const result = htmlToMarkdown(html);
        expect(result).not.toContain('img');
        expect(result).not.toContain('test.jpg');
        expect(result).toBe('Text more text');
      });

      it('should remove tracking pixels', () => {
        const html = '<p>Text<img src="track.gif" width="1" height="1">more</p>';
        const result = htmlToMarkdown(html);
        expect(result).not.toContain('track.gif');
      });
    });

    describe('link handling', () => {
      it('should convert links to markdown', () => {
        const html = '<a href="https://example.com">Example</a>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('[Example](https://example.com)');
      });

      it('should simplify redundant links', () => {
        const html = '<a href="https://example.com">https://example.com</a>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('https://example.com');
      });

      it('should simplify links with URL without protocol', () => {
        const html = '<a href="https://example.com">example.com</a>';
        const result = htmlToMarkdown(html);
        expect(result).toBe('https://example.com');
      });
    });

    describe('Safe Links unwrapping', () => {
      it('should unwrap Microsoft Safe Links', () => {
        const safeLink =
          'https://na01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com%2Fpage&data=abc123';
        const html = `<a href="${safeLink}">Click here</a>`;
        const result = htmlToMarkdown(html);
        expect(result).toContain('https://example.com/page');
        expect(result).not.toContain('safelinks.protection.outlook.com');
      });

      it('should handle Safe Links in plain text', () => {
        const html =
          '<p>Visit https://eur01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fgoogle.com&data=xyz</p>';
        const result = htmlToMarkdown(html);
        expect(result).toContain('https://google.com');
      });
    });

    describe('element removal', () => {
      it('should remove script tags', () => {
        const html = '<p>Text</p><script>alert("xss")</script><p>More</p>';
        const result = htmlToMarkdown(html);
        expect(result).not.toContain('script');
        expect(result).not.toContain('alert');
      });

      it('should remove style tags', () => {
        const html = '<style>.red { color: red; }</style><p>Text</p>';
        const result = htmlToMarkdown(html);
        expect(result).not.toContain('style');
        expect(result).not.toContain('color');
      });

      it('should keep nav with useful content', () => {
        const html = '<nav><a href="/home">Home</a></nav>';
        const result = htmlToMarkdown(html);
        expect(result).toContain('Home');
      });
    });

    describe('media URL extraction', () => {
      it('should extract iframe URLs', () => {
        const html = '<iframe src="https://youtube.com/embed/xyz"></iframe>';
        const result = htmlToMarkdown(html);
        expect(result).toContain('https://youtube.com/embed/xyz');
      });

      it('should extract video URLs', () => {
        const html = '<video src="https://example.com/video.mp4"></video>';
        const result = htmlToMarkdown(html);
        expect(result).toContain('https://example.com/video.mp4');
      });
    });
  });

  describe('whitespace normalization', () => {
    it('should collapse multiple spaces to single space', () => {
      const html = '<p>Text     with     spaces</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Text with spaces');
      expect(result).not.toMatch(/ {2}/); // No double spaces
    });

    it('should handle 150 spaces in the middle of text', () => {
      const spaces = ' '.repeat(150);
      const html = `<p>A new model I'm excited about${spaces}Forwarded this email?</p>`;
      const result = htmlToMarkdown(html);

      // Should not have more than 1 consecutive space
      expect(result).not.toMatch(/ {2,}/);
      expect(result).toBe("A new model I'm excited about Forwarded this email?");
    });

    it('should handle 200 spaces', () => {
      const spaces = ' '.repeat(200);
      const html = `<p>Before${spaces}After</p>`;
      const result = htmlToMarkdown(html);

      expect(result).not.toMatch(/ {2,}/);
      expect(result).toBe('Before After');
    });

    it('should convert non-breaking spaces to regular spaces and collapse', () => {
      // \u00A0 is non-breaking space
      const html = '<p>Text\u00A0\u00A0\u00A0with\u00A0nbsp</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Text with nbsp');
    });

    it('should handle mixed regular and non-breaking spaces', () => {
      const html = '<p>A   \u00A0\u00A0   B</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });

    it('should handle tabs', () => {
      const html = '<p>Tab\t\t\there</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Tab here');
    });

    it('should collapse multiple newlines to paragraph breaks', () => {
      const html = '<p>First</p>\n\n\n\n<p>Second</p>';
      const result = htmlToMarkdown(html);
      // Should have at most one empty line between paragraphs
      expect(result).not.toMatch(/\n\n\n/);
    });

    it('should trim leading and trailing whitespace', () => {
      const html = '   <p>  Text  </p>   ';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Text');
    });

    it('should handle whitespace across line boundaries after join', () => {
      // This tests the issue where spaces might appear after joining lines
      const html = '<p>Line 1          </p><p>          Line 2</p>';
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/ {2,}/);
    });
  });

  describe('Unicode space normalization', () => {
    it('should normalize En Space (U+2002)', () => {
      const html = '<p>A\u2002\u2002\u2002B</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });

    it('should normalize Em Space (U+2003)', () => {
      const html = '<p>A\u2003\u2003\u2003B</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });

    it('should normalize Thin Space (U+2009)', () => {
      const html = '<p>A\u2009\u2009\u2009B</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });

    it('should normalize Hair Space (U+200A)', () => {
      const html = '<p>A\u200A\u200A\u200AB</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });

    it('should normalize Narrow NBSP (U+202F)', () => {
      const html = '<p>A\u202F\u202F\u202FB</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });

    it('should normalize Ideographic Space (U+3000)', () => {
      const html = '<p>A\u3000\u3000\u3000B</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });

    it('should normalize 150 Em Spaces', () => {
      const spaces = '\u2003'.repeat(150);
      const html = `<p>Before${spaces}After</p>`;
      const result = htmlToMarkdown(html);
      expect(result).toBe('Before After');
      expect(result).not.toMatch(/ {2,}/);
    });

    it('should normalize mixed Unicode spaces', () => {
      const html = '<p>A\u00A0\u2002\u2003\u2009\u200A\u202F\u3000B</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('A B');
    });
  });

  describe('invisible character removal', () => {
    it('should remove zero-width spaces (U+200B)', () => {
      const html = '<p>Text\u200Bwith\u200Bzero\u200Bwidth</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Textwithzerowidth');
      expect(result).not.toContain('\u200B');
    });

    it('should remove zero-width non-joiner (U+200C)', () => {
      const html = '<p>A\u200CB</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('AB');
    });

    it('should remove zero-width joiner (U+200D)', () => {
      const html = '<p>A\u200DB</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('AB');
    });

    it('should remove left-to-right mark (U+200E)', () => {
      const html = '<p>LTR\u200Emark</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('LTRmark');
    });

    it('should remove right-to-left mark (U+200F)', () => {
      const html = '<p>RTL\u200Fmark</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('RTLmark');
    });

    it('should remove word joiner (U+2060)', () => {
      const html = '<p>Word\u2060joiner</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Wordjoiner');
    });

    it('should remove BOM (U+FEFF)', () => {
      const html = '<p>\uFEFFStart</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Start');
    });

    it('should remove soft hyphen (U+00AD)', () => {
      const html = '<p>Soft\u00ADhyphen</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Softhyphen');
    });

    it('should remove combining grapheme joiner (U+034F)', () => {
      const html = '<p>CGJ\u034Ftest</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('CGJtest');
    });

    it('should remove directional formatting characters', () => {
      // U+202A-202E are directional formatting characters
      const html = '<p>\u202ALeft\u202B\u202C\u202D\u202ERight</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('LeftRight');
    });
  });

  describe('real-world email scenarios', () => {
    it('should handle typical forwarded email pattern with spaces', () => {
      const html = `
        <div>
          <p>A new model I'm excited about</p>
          <div style="margin-left: 100px;">
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </div>
          <p>Forwarded this email?</p>
        </div>
      `;
      const result = htmlToMarkdown(html);
      expect(result).not.toMatch(/ {2,}/);
    });

    it('should handle email with lots of formatting whitespace', () => {
      const html = `
        <table>
          <tr>
            <td>              Content here              </td>
          </tr>
        </table>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toBe('Content here');
    });

    it('should handle complex email with tracking pixel and safe links', () => {
      const html = `
        <html>
          <body>
            <img src="http://track.example.com/pixel.gif" width="1" height="1">
            <p>Hello,</p>
            <p>Check out this <a href="https://na01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com&data=abc">link</a></p>
            <img src="logo.png" alt="Logo">
            <script>console.log('track');</script>
          </body>
        </html>
      `;
      const result = htmlToMarkdown(html);
      expect(result).toContain('Hello,');
      expect(result).toContain('[link](https://example.com)');
      expect(result).not.toContain('track.example.com');
      expect(result).not.toContain('safelinks');
      expect(result).not.toContain('script');
      expect(result).not.toContain('logo.png');
    });

    it('should handle HTML entities converted to spaces', () => {
      // &nbsp; entities should be converted to spaces and then collapsed
      const html = '<p>Word&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;another</p>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Word another');
    });
  });

  describe('edge cases', () => {
    it('should handle only whitespace input', () => {
      const html = '     \n\n\t\t     ';
      const result = htmlToMarkdown(html);
      expect(result).toBe('');
    });

    it('should handle deeply nested elements', () => {
      const html = '<div><div><div><p>Deep</p></div></div></div>';
      const result = htmlToMarkdown(html);
      expect(result).toBe('Deep');
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<p>Unclosed paragraph';
      const result = htmlToMarkdown(html);
      expect(result).toContain('Unclosed paragraph');
    });
  });
});

/**
 * IMPORTANT: The HTML-to-Markdown transformation is ONLY applied when
 * `simplifyHtml` is enabled. This can be done via:
 *
 * 1. CLI flag: --simplify-html
 * 2. CLI flag: --read-only (which defaults simplifyHtml to true)
 * 3. Tool parameter: { simplifyHtml: true } in the tool call
 *
 * If the agent is still seeing raw HTML or excessive whitespace, check:
 * - Is the server started with --simplify-html or --read-only?
 * - Is the tool call including simplifyHtml: true?
 * - Is the dist/ build up to date? (run npm run build)
 */

// Test the tool context integration
describe('toolContext integration', () => {
  it('should transform HTML when simplifyHtml is enabled in context', async () => {
    const { toolContext, shouldSimplifyHtml } = await import('../src/tool-context.js');

    // Without context, shouldSimplifyHtml returns false
    expect(shouldSimplifyHtml()).toBe(false);

    // With context and simplifyHtml: true, it should return true
    let result: boolean | undefined;
    await toolContext.run(
      { toolName: 'test-tool', simplifyHtml: true, readOnlyMode: false, toonMode: false },
      () => {
        result = shouldSimplifyHtml();
      }
    );
    expect(result).toBe(true);

    // With context and simplifyHtml: false, it should return false
    await toolContext.run(
      { toolName: 'test-tool', simplifyHtml: false, readOnlyMode: false, toonMode: false },
      () => {
        result = shouldSimplifyHtml();
      }
    );
    expect(result).toBe(false);
  });

  it('should NOT transform HTML for OneNote tools even when simplifyHtml is true', async () => {
    const { toolContext, shouldSimplifyHtml } = await import('../src/tool-context.js');

    let result: boolean | undefined;
    await toolContext.run(
      {
        toolName: 'get-onenote-page-content',
        simplifyHtml: true,
        readOnlyMode: false,
        toonMode: false,
      },
      () => {
        result = shouldSimplifyHtml();
      }
    );
    expect(result).toBe(false);
  });
});

// Standalone function tests to debug normalizeWhitespace behavior
describe('Debug: Whitespace handling step-by-step', () => {
  it('should verify regex for collapsing spaces works', () => {
    const input = 'A' + ' '.repeat(150) + 'B';
    const result = input.replace(/ {2,}/g, ' ');
    expect(result).toBe('A B');
  });

  it('should verify the full pipeline handles 150 spaces', () => {
    const html = '<p>Start' + ' '.repeat(150) + 'End</p>';
    console.log('Input HTML length:', html.length);

    const result = htmlToMarkdown(html);
    console.log('Output:', JSON.stringify(result));
    console.log('Output length:', result.length);

    // Find any occurrence of multiple spaces
    const doubleSpaceMatch = result.match(/ {2,}/g);
    console.log('Double space matches:', doubleSpaceMatch);

    expect(result).toBe('Start End');
  });

  it('should show what Turndown outputs before normalization', () => {
    // We can't directly test intermediate state, but we can test with minimal HTML
    const html = '<span>A</span>          <span>B</span>';
    const result = htmlToMarkdown(html);
    console.log('Span test output:', JSON.stringify(result));
    expect(result).not.toMatch(/ {2,}/);
  });
});
