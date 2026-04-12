import { Mistral } from "@mistralai/mistralai";

const getClient = (apiKey) => new Mistral({ apiKey });

export const fetchVoices = async (apiKey) => {
  const client = getClient(apiKey);
  const result = await client.audio.voices.list({ limit: 50, offset: 0 });
  
  const allVoices = result.items ?? [];
  
  // Отфильтровываем голоса: оставляем только те, у которых заполнено поле user_id или userId
  return allVoices.filter(voice => voice.userId);
};

export const generateSpeechStreaming = async (apiKey, input, voiceId) => {
  const client = getClient(apiKey);
  
  const stream = await client.audio.speech.complete({
    model: "voxtral-mini-tts-2603",
    input: input,
    voiceId: voiceId,
    responseFormat: "mp3", // Using mp3 for broad browser support
    stream: true,
  });

  const audioChunks = [];

  for await (const event of stream) {
    if (event.event === "speech.audio.delta") {
      const base64Data = event.data.audioData;
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioChunks.push(bytes);
    } else if (event.event === "speech.audio.done") {
      console.log("Stream done. Usage:", event.data.usage);
    }
  }

  // Concatenate all Uint8Array chunks into one
  const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of audioChunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return new Blob([result], { type: 'audio/mpeg' });
};

export const simplifyTextParagraph = async (apiKey, paragraph) => {
  const client = getClient(apiKey);
  
  const response = await client.chat.complete({
    model: "mistral-medium-latest",
    messages: [
      {
        role: "system",
        content: "Simplify the following text to make it easier to read and understand (approximately level A2). CRITICAL: You must return the simplified text in the Italian language. Reply ONLY with the simplified text, without any quotes, formatting, explanations, or introductory phrases."
      },
      {
        role: "user",
        content: paragraph
      }
    ]
  });

  return response.choices[0].message.content;
};

export const generateTitle = async (apiKey, text) => {
  // Берем только начало текста, чтобы не гонять весь лонгрид
  const excerpt = text.substring(0, 500); 
  const prompt = `Generate a very short title (2 to 5 words) for the following text. Reply ONLY with the title, without quotes or explanations. Text: ${excerpt}`;

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest', 
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3 // Низкая температура для более предсказуемого результата
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate title');
  }

  const data = await response.json();
  // Убираем случайные кавычки, если модель их все-таки добавит
  return data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
};