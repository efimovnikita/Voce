import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVoices, generateSpeech } from './mistral';

describe('Mistral API Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('fetchVoices returns list of voices', async () => {
    const mockVoices = {
      data: [
        { id: 'voice1', name: 'Voice 1' },
        { id: 'voice2', name: 'Voice 2' }
      ]
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockVoices
    });

    const voices = await fetchVoices('test-api-key');
    expect(voices).toEqual(mockVoices.data);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.mistral.ai/v1/audio/speech/voices',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        })
      })
    );
  });

  it('generateSpeech returns blob from API', async () => {
    const mockBlob = new Blob(['audio-data'], { type: 'audio/mpeg' });
    
    fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob
    });

    const result = await generateSpeech('test-api-key', 'Hello', 'voice1');
    expect(result).toBeInstanceOf(Blob);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.mistral.ai/v1/audio/speech',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'mistral-tts',
          input: 'Hello',
          voice: 'voice1'
        })
      })
    );
  });

  it('handles API errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized'
    });

    await expect(fetchVoices('invalid-key')).rejects.toThrow('Unauthorized');
  });
});
