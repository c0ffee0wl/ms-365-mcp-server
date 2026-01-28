#!/usr/bin/env node
/**
 * Debug script to verify HTML transformation is working correctly.
 * Run with: node scripts/debug-html-transform.js
 */

import { htmlToMarkdown } from '../dist/html-transform.js';

console.log('=== HTML Transform Debug Script ===\n');

// Test 1: Basic whitespace normalization
console.log('Test 1: Basic whitespace (150 regular spaces)');
const html1 = '<p>Before' + ' '.repeat(150) + 'After</p>';
const result1 = htmlToMarkdown(html1);
console.log('  Input length:', html1.length);
console.log('  Output:', JSON.stringify(result1));
console.log('  Has double spaces:', / {2,}/.test(result1));
console.log('  PASS:', result1 === 'Before After' && !/ {2,}/.test(result1));

// Test 2: Non-breaking spaces (what emails actually use)
console.log('\nTest 2: 150 &nbsp; entities');
const html2 = '<p>Word' + '&nbsp;'.repeat(150) + 'another</p>';
const result2 = htmlToMarkdown(html2);
console.log('  Input length:', html2.length);
console.log('  Output:', JSON.stringify(result2));
console.log('  Has double spaces:', / {2,}/.test(result2));
console.log('  PASS:', result2 === 'Word another' && !/ {2,}/.test(result2));

// Test 3: Real email pattern
console.log('\nTest 3: Real email structure');
const html3 = `<div>A new model I'm excited about</div>
<div>${'&nbsp;'.repeat(150)}</div>
<div>Forwarded this email?</div>`;
const result3 = htmlToMarkdown(html3);
console.log('  Output:', JSON.stringify(result3));
console.log('  Has double spaces:', / {2,}/.test(result3));
console.log('  PASS:', !/ {2,}/.test(result3));

// Test 4: Inline nbsp
console.log('\nTest 4: Inline 100 nbsp between spans');
const html4 = '<span>A</span>' + '&nbsp;'.repeat(100) + '<span>B</span>';
const result4 = htmlToMarkdown(html4);
console.log('  Output:', JSON.stringify(result4));
console.log('  Has double spaces:', / {2,}/.test(result4));
console.log('  PASS:', result4 === 'A B' && !/ {2,}/.test(result4));

// Test 5: NBSP characters directly (U+00A0)
console.log('\nTest 5: Direct NBSP characters (U+00A0)');
const html5 = '<p>X' + '\u00A0'.repeat(50) + 'Y</p>';
const result5 = htmlToMarkdown(html5);
console.log('  Output:', JSON.stringify(result5));
console.log('  Has NBSP:', /\u00A0/.test(result5));
console.log('  Has double spaces:', / {2,}/.test(result5));
console.log('  PASS:', result5 === 'X Y' && !/ {2,}/.test(result5) && !/\u00A0/.test(result5));

// Test 6: Zero-width characters
console.log('\nTest 6: Zero-width characters');
const html6 = '<p>A\u200B\u200C\u200D\u200E\u200F\u034FB</p>';
const result6 = htmlToMarkdown(html6);
console.log('  Output:', JSON.stringify(result6));
console.log('  PASS:', result6 === 'AB');

// Test 7: Unicode wide spaces (Em Space, En Space, etc.)
console.log('\nTest 7: 150 Em Spaces (U+2003) - THE LIKELY CULPRIT');
const html7 = '<p>Before' + '\u2003'.repeat(150) + 'After</p>';
const result7 = htmlToMarkdown(html7);
console.log('  Input has 150 Em Spaces');
console.log('  Output:', JSON.stringify(result7));
console.log('  Has double spaces:', / {2,}/.test(result7));
console.log('  PASS:', result7 === 'Before After' && !/ {2,}/.test(result7));

// Test 8: Mixed Unicode spaces
console.log('\nTest 8: Mixed Unicode spaces (NBSP, En, Em, Thin, Hair, Ideographic)');
const html8 = '<p>A\u00A0\u2002\u2003\u2009\u200A\u3000B</p>';
const result8 = htmlToMarkdown(html8);
console.log('  Output:', JSON.stringify(result8));
console.log('  PASS:', result8 === 'A B');

// Summary
console.log('\n=== Summary ===');
const allPassed =
  result1 === 'Before After' &&
  result2 === 'Word another' &&
  !/ {2,}/.test(result3) &&
  result4 === 'A B' &&
  result5 === 'X Y' &&
  result6 === 'AB' &&
  result7 === 'Before After' &&
  result8 === 'A B';

if (allPassed) {
  console.log('✅ All tests PASSED - HTML transformation is working correctly');
  console.log('\nIf you still see whitespace issues in production:');
  console.log('1. Make sure --simplify-html flag is enabled');
  console.log('2. Check the logs for "shouldSimplifyHtml() = true"');
  console.log('3. Check that body.contentType is "html" (case-insensitive)');
  console.log('4. Verify the MCP server was restarted after rebuild');
} else {
  console.log('❌ Some tests FAILED - there may be a build issue');
  console.log('Try: npm run build && npm link');
}
