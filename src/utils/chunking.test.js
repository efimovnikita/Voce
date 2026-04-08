import { describe, it, expect } from 'vitest';
import { splitIntoChunks } from './chunking';

describe('Chunking Utility', () => {
  it('splits text by sentences when over limit', () => {
    const text = 'First sentence. Second sentence! Third sentence?';
    const chunks = splitIntoChunks(text, 20);
    expect(chunks).toEqual([
      'First sentence.',
      'Second sentence!',
      'Third sentence?'
    ]);
  });

  it('combines sentences if they fit in one chunk', () => {
    const text = 'Small sentence. Another one.';
    const chunks = splitIntoChunks(text, 100);
    expect(chunks).toEqual(['Small sentence. Another one.']);
  });

  it('splits long sentences by character limit if no punctuation found', () => {
    const longText = 'This is a very long sentence without any punctuation to split it properly so it should be split by character limit eventually';
    const chunks = splitIntoChunks(longText, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(20);
  });

  it('handles empty text', () => {
    expect(splitIntoChunks('', 100)).toEqual([]);
  });
});
