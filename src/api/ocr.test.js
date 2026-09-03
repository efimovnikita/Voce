import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTextFromScreenshot, blobToDataUrl } from './ocr';

const mockOcrProcess = vi.fn();

vi.mock('@mistralai/mistralai', () => {
  return {
    Mistral: vi.fn().mockImplementation(function() {
      return {
        ocr: {
          process: mockOcrProcess,
        },
      };
    }),
  };
});

describe('OCR API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws an error if apiKey is missing', async () => {
    await expect(extractTextFromScreenshot('', 'data:image/png;base64,...')).rejects.toThrow(
      'Mistral API Key is required for OCR'
    );
  });

  it('extracts and concatenates markdown from pages using dataUrl string', async () => {
    mockOcrProcess.mockResolvedValue({
      pages: [
        { index: 0, markdown: '# Title\nFirst line.' },
        { index: 1, markdown: 'Second line.' },
      ],
    });

    const result = await extractTextFromScreenshot('test-key', 'data:image/png;base64,abc');

    expect(mockOcrProcess).toHaveBeenCalledWith({
      model: 'mistral-ocr-latest',
      document: {
        type: 'image_url',
        imageUrl: 'data:image/png;base64,abc',
      },
    });

    expect(result).toBe('# Title\nFirst line.\n\nSecond line.');
  });

  it('extracts text when input is a Blob', async () => {
    mockOcrProcess.mockResolvedValue({
      pages: [{ index: 0, markdown: 'Scanned text from screenshot' }],
    });

    const fakeBlob = new Blob(['image content'], { type: 'image/png' });
    const result = await extractTextFromScreenshot('test-key', fakeBlob);

    expect(mockOcrProcess).toHaveBeenCalled();
    expect(result).toBe('Scanned text from screenshot');
  });

  it('returns empty string if no pages in response', async () => {
    mockOcrProcess.mockResolvedValue({ pages: [] });

    const result = await extractTextFromScreenshot('test-key', 'data:image/png;base64,abc');
    expect(result).toBe('');
  });

  it('handles safety filter errors', async () => {
    mockOcrProcess.mockRejectedValue(new Error('Blocked by safety policy'));

    await expect(
      extractTextFromScreenshot('test-key', 'data:image/png;base64,abc')
    ).rejects.toThrow('Content blocked by Mistral safety filters');
  });

  it('handles unauthorized errors', async () => {
    mockOcrProcess.mockRejectedValue(new Error('Unauthorized: Invalid API Key'));

    await expect(
      extractTextFromScreenshot('test-key', 'data:image/png;base64,abc')
    ).rejects.toThrow('Invalid Mistral API Key');
  });
});
