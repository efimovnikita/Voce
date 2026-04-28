import localforage from 'localforage';
import { splitIntoChunks, splitBySentences } from './chunking';
import { generateSpeechStreaming, simplifyTextParagraph, detectLanguage } from '../api/mistral';

export const fetchAudioWithRetry = async (apiKey, text, voiceId, maxRetries = 5) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await generateSpeechStreaming(apiKey, text, voiceId);
    } catch (error) {
      // Если это ошибка цензуры, выбрасываем её сразу, не тратя время на ретраи
      if (error.message.includes('safety filters')) {
        throw error;
      }

      attempt++;
      console.warn(`[Audio Fetch] Ошибка загрузки чанка (попытка ${attempt}/${maxRetries}):`, error);

      if (attempt >= maxRetries) {
        // Пробрасываем оригинальную ошибку вместо создания новой общей
        throw error;
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
    let failedChunks = 0;
    let blockedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
      const baseProgress = isSimplifyMode ? 20 : 0;
      const progressRange = isSimplifyMode ? 80 : 100;
      const progress = baseProgress + Math.round((i / chunks.length) * progressRange);
      
      const cacheKey = `offline_audio_${article.id}_${modeStr}_${i}`;
      
      try {
        // Проверяем, не скачан ли уже этот чанк
        const existingBlob = await localforage.getItem(cacheKey);
        if (existingBlob) {
          console.log(`[Download] Chunk ${i} already exists, skipping.`);
          continue;
        }

        onProgress(`Downloading part ${i + 1} of ${chunks.length}...`, progress);
        const audioBlob = await fetchAudioWithRetry(apiKey, chunks[i], voiceId);
        await localforage.setItem(cacheKey, audioBlob);
      } catch (error) {
        console.error(`[Download] Failed to download chunk ${i}:`, error);
        if (error.message.includes('safety filters')) {
          blockedChunks++;
        } else {
          failedChunks++;
        }
        // Не прерываем цикл, продолжаем со следующим чанком
      }
    }

    // Финальное обновление статуса в БД только если все чанки скачаны
    if (failedChunks === 0 && blockedChunks === 0) {
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
    } else {
      if (blockedChunks > 0) {
        onProgress(`Blocked: ${blockedChunks} (Safety). Errors: ${failedChunks}.`, 100);
      } else {
        onProgress(`Errors: ${failedChunks} chunks. Click download to retry.`, 100);
      }
    }
  } catch (error) {
    onProgress(`Error: ${error.message}`, -1); // -1 signal error
    throw error;
  }
};
