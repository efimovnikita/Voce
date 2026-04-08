import { Mistral } from "@mistralai/mistralai";

const getClient = (apiKey) => new Mistral({ apiKey });

export const fetchVoices = async (apiKey) => {
  const client = getClient(apiKey);
  const result = await client.audio.voices.list({ limit: 50, offset: 0 });
  return result.items ?? [];
};

export const generateSpeech = async (apiKey, input, voiceId) => {
  const client = getClient(apiKey);
  const response = await client.audio.speech.complete({
    model: "voxtral-mini-tts-2603",
    input: input,
    voiceId: voiceId,
    responseFormat: "mp3",
  });

  // response.audioData is likely a Buffer or Uint8Array
  return new Blob([response.audioData], { type: 'audio/mpeg' });
};
