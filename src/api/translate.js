/**
 * Переводит текст с использованием Google Cloud Translation API.
 * 
 * @param {string} text - Текст для перевода.
 * @param {string} targetLanguage - Целевой язык (например, 'en' или 'it').
 * @param {string} apiKey - API ключ Google Cloud.
 * @returns {Promise<string>} - Переведенный текст.
 */
export async function translateText(text, targetLanguage, apiKey) {
  if (!text || !targetLanguage || !apiKey) {
    throw new Error('Missing required parameters for translation');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        format: 'text' // Используем 'text', чтобы избежать лишнего HTML экранирования для обычного текста
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Translation API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.translations && data.data.translations.length > 0) {
      return data.data.translations[0].translatedText;
    } else {
      throw new Error('Invalid response format from Translation API');
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}
