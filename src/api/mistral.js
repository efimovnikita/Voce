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
        content: "Sei un assistente che semplifica il testo italiano per facilitarne l'ascolto e la comprensione. Riscrivi il seguente paragrafo utilizzando un vocabolario e una grammatica semplici (livello A2/B1), mantenendo il significato principale. Non aggiungere frasi introduttive, restituisci solo il testo semplificato."
      },
      {
        role: "user",
        content: paragraph
      }
    ]
  });

  return response.choices[0].message.content;
};
