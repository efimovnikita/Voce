import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchVoices, generateSpeechStreaming } from './mistral';
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

describe('Mistral API Client (SDK Streaming)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchVoices returns list of voices', async () => {
    mockList.mockResolvedValue({ items: [{ id: 'v1', name: 'V1' }] });
    const voices = await fetchVoices('test-key');
    expect(voices[0].id).toBe('v1');
  });

  it('generateSpeechStreaming handles async iterator stream', async () => {
    const mockStream = (async function* () {
      yield { event: 'speech.audio.delta', data: { audioData: btoa('part1') } };
      yield { event: 'speech.audio.delta', data: { audioData: btoa('part2') } };
      yield { event: 'speech.audio.done', data: { usage: {} } };
    })();

    mockComplete.mockResolvedValue(mockStream);

    const blob = await generateSpeechStreaming('test-key', 'Hello', 'v1');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/mpeg');
  });
});
