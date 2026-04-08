const BASE_URL = 'https://api.mistral.ai/v1/audio';

export const fetchVoices = async (apiKey) => {
  const response = await fetch(`${BASE_URL}/speech/voices`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(response.statusText || 'Failed to fetch voices');
  }

  const data = await response.json();
  return data.data;
};

export const generateSpeech = async (apiKey, input, voiceId) => {
  const response = await fetch(`${BASE_URL}/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      model: 'mistral-tts',
      input: input,
      voice: voiceId
    })
  });

  if (!response.ok) {
    throw new Error(response.statusText || 'Failed to generate speech');
  }

  return await response.blob();
};
