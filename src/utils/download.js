import localforage from 'localforage';
import { splitIntoChunks, splitBySentences } from './chunking';
import { generateSpeechStreaming, simplifyTextParagraph, detectLanguage } from '../api/mistral';

export const fetchAudioWithRetry = async (apiKey, text, voiceId, maxRetries = 5) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await generateSpeechStreaming(apiKey, text, voiceId);
    } catch (error) {
      attempt++;
      console.warn(`[Audio Fetch] Ошибка загрузки чанка (попытка ${attempt}/${maxRetries}):`, error);

      if (attempt >= maxRetries) {
        throw new Error(`Не удалось загрузить часть аудио после ${maxRetries} попыток.`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const downloadArticle = async ({
  article,
  isSimplifyMode,
  apiKey,
  voiceId,
  languageLevel,
  onProgress, // (status, progress) => void
  onUpdateTrack // (updatedTrack) => void
}) => {
  try {
    let textToRead = '';
    const currentList = await localforage.getItem('mistral_playlist') || [];
    const trackIndex = currentList.findIndex(t => t.id === article.id);
    const modeStr = isSimplifyMode ? 'simplified' : 'original';

    // 1. ПРОВЕРКА: Если уже скачано, пропускаем
    if (isSimplifyMode && article.isOfflineSimplifiedReady) {
        onProgress('Already downloaded', 100);
        return;
    } else if (!isSimplifyMode && article.isOfflineReady) {
        onProgress('Already downloaded', 100);
        return;
    }

    if (isSimplifyMode) {
      if (article.simplifiedText) {
        textToRead = article.simplifiedText;
      } else {
        const paragraphs = splitBySentences(article.originalText, 5);
        
        onProgress('Detecting language...', 0);
        const excerptForDetection = paragraphs[0] || article.originalText.substring(0, 500);
        const detectedLanguage = await detectLanguage(apiKey, excerptForDetection);
        
        let generatedSimplifiedText = '';

        for (let i = 0; i < paragraphs.length; i++) {
          const progress = Math.round((i / paragraphs.length) * 20); // Первый этап (упрощение) - 20% общего прогресса
          onProgress(`Simplifying: part ${i + 1} of ${paragraphs.length}...`, progress);
          const simplified = await simplifyTextParagraph(apiKey, paragraphs[i], detectedLanguage, languageLevel);
          generatedSimplifiedText += simplified + '\n\n';
        }
        textToRead = generatedSimplifiedText;

        // Сохраняем упрощенный текст
        if (trackIndex !== -1) {
          currentList[trackIndex].simplifiedText = textToRead;
          await localforage.setItem('mistral_playlist', currentList);
          onUpdateTrack(currentList[trackIndex]);
        }
      }
    } else {
      textToRead = article.originalText;
    }

    const chunks = splitIntoChunks(textToRead);

    for (let i = 0; i < chunks.length; i++) {
      const baseProgress = isSimplifyMode ? 20 : 0;
      const progressRange = isSimplifyMode ? 80 : 100;
      const progress = baseProgress + Math.round((i / chunks.length) * progressRange);
      
      onProgress(`Downloading part ${i + 1} of ${chunks.length}...`, progress);
      const audioBlob = await fetchAudioWithRetry(apiKey, chunks[i], voiceId);

      const cacheKey = `offline_audio_${article.id}_${modeStr}_${i}`;
      await localforage.setItem(cacheKey, audioBlob);
    }

    // Финальное обновление статуса в БД
    const finalPlaylist = await localforage.getItem('mistral_playlist') || [];
    const finalIndex = finalPlaylist.findIndex(t => t.id === article.id);
    if (finalIndex !== -1) {
      if (isSimplifyMode) {
        finalPlaylist[finalIndex].isOfflineSimplifiedReady = true;
      } else {
        finalPlaylist[finalIndex].isOfflineReady = true;
      }
      await localforage.setItem('mistral_playlist', finalPlaylist);
      onUpdateTrack(finalPlaylist[finalIndex]);
    }

    onProgress('Complete!', 100);
  } catch (error) {
    onProgress(`Error: ${error.message}`, -1); // -1 signal error
    throw error;
  }
};
