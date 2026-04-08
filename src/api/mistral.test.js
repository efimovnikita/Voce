import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVoices, generateSpeech } from './mistral';
import { Mistral } from "@mistralai/mistralai";

const mockList = vi.fn();
const mockComplete = vi.fn();

vi.mock("@mistralai/mistralai", () => {
  return {
    Mistral: vi.fn().mockImplementation(function() {
      return {
        audio: {
          voices: {
            list: mockList
          },
          speech: {
            complete: mockComplete
          }
        }
      };
    })
  };
});

describe('Mistral API Client (SDK)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchVoices returns list of voices using SDK', async () => {
    const mockVoicesResponse = {
      items: [
        { id: 'voice1', name: 'Voice 1' },
        { id: 'voice2', name: 'Voice 2' }
      ]
    };
    
    mockList.mockResolvedValue(mockVoicesResponse);

    const voices = await fetchVoices('test-api-key');
    expect(voices).toEqual(mockVoicesResponse.items);
    expect(Mistral).toHaveBeenCalled();
  });

  it('generateSpeech returns blob using SDK', async () => {
    const mockAudioData = new Uint8Array([1, 2, 3]);
    
    mockComplete.mockResolvedValue({ audioData: mockAudioData });

    const result = await generateSpeech('test-api-key', 'Hello', 'voice1');
    expect(result).toBeInstanceOf(Blob);
    expect(mockComplete).toHaveBeenCalled();
  });
});
