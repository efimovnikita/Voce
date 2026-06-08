import React, { useState, useEffect, useCallback, useRef } from 'react'
// Импортируем хук для работы с обновлениями PWA
import { useRegisterSW } from 'virtual:pwa-register/react'
import localforage from 'localforage'

import Settings from './components/Settings'
import Player from './components/Player'
import BulkDownloadPanel from './components/BulkDownloadPanel'
import { fetchVoices, simplifyTextParagraph, generateTitle, detectLanguage } from './api/mistral'
import { fetchAndParseArticle } from './api/article'
import { isYoutubeUrl, getYoutubeVideoId, fetchYoutubeTranscript } from './api/youtube'
import { translateText } from './api/translate'
import { splitIntoChunks, splitBySentences } from './utils/chunking'
import { downloadArticle, fetchAudioWithRetry } from './utils/download'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [trigger, setTrigger] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSimplifyMode, setIsSimplifyMode] = useState(() => {
      const savedMode = localStorage.getItem('mistral_simplify_mode');
      return savedMode === 'true'; // Вернет false (оригинал) по умолчанию
    });
  const [languageLevel, setLanguageLevel] = useState(() => {
      return localStorage.getItem('mistral_language_level') || 'A2';
    });
  const [isAutoplay, setIsAutoplay] = useState(() => {
    return localStorage.getItem('mistral_autoplay') === 'true';
  });
  const [dailyListeningTime, setDailyListeningTime] = useState(0);
  const [weeklyListeningTime, setWeeklyListeningTime] = useState(0);
  const [listeningTimeMode, setListeningTimeMode] = useState('today'); // 'today' or 'week'
  const [sharedContentPending, setSharedContentPending] = useState(null);

  const audioRef = useRef(new Audio());
  const chunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);
  // Новый ref для хранения предзагруженных URL
  const preloadedUrlsRef = useRef({});
  const playbackRateRef = useRef(1);
  const isSimplifyModeRef = useRef(isSimplifyMode);

  // Синхронизируем ref с актуальным стейтом
  useEffect(() => {
    isSimplifyModeRef.current = isSimplifyMode;
  }, [isSimplifyMode]);

  // Инициализация контроля обновлений PWA
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(Unused) {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  // Загрузка времени или сброс при наступлении нового дня
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stats = JSON.parse(localStorage.getItem('voce_listening_stats') || '{}');
    
    // Миграция со старых ключей, если они есть
    const oldDate = localStorage.getItem('voce_listening_date');
    const oldTime = localStorage.getItem('voce_listening_time');
    
    let currentStats = { ...stats };
    let hasMigration = false;

    if (oldDate && oldTime) {
      // Пытаемся понять, какой это день в формате ISO. 
      // Если oldDate совпадает с текущим toLocaleDateString(), значит это сегодня.
      if (oldDate === new Date().toLocaleDateString()) {
        if (!currentStats[today]) {
          currentStats[today] = parseInt(oldTime, 10);
          hasMigration = true;
        }
      }
      
      localStorage.removeItem('voce_listening_date');
      localStorage.removeItem('voce_listening_time');
    }

    if (hasMigration) {
      localStorage.setItem('voce_listening_stats', JSON.stringify(currentStats));
    }

    setDailyListeningTime(currentStats[today] || 0);

    // Расчет недельного времени (текущая календарная неделя с понедельника)
    const calculateWeekly = (statsObj) => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
      // Находим понедельник текущей недели
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(new Date(now).setDate(diff));
      monday.setHours(0, 0, 0, 0);

      let sum = 0;
      for (const [dateStr, time] of Object.entries(statsObj)) {
        const date = new Date(dateStr);
        if (date >= monday) {
          sum += time;
        }
      }
      return sum;
    };

    setWeeklyListeningTime(calculateWeekly(currentStats));
  }, []);

  // Сам таймер
  useEffect(() => {
    let interval;
    // Считаем время только когда реально идет воспроизведение
    if (isPlaying && !isLoading) {
      interval = setInterval(() => {
        const today = new Date().toISOString().split('T')[0];
        
        setDailyListeningTime(prev => {
          const newTime = prev + 1;
          
          // Обновляем статистику в localStorage
          const stats = JSON.parse(localStorage.getItem('voce_listening_stats') || '{}');
          stats[today] = newTime;
          localStorage.setItem('voce_listening_stats', JSON.stringify(stats));
          
          return newTime;
        });

        setWeeklyListeningTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isLoading]);

  const formatTimeDigital = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    // Дополняем нулями до двух знаков (01, 02...)
    const pad = (num) => num.toString().padStart(2, '0');

    // Всегда возвращаем формат ЧЧ:ММ:СС
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const loadVoices = useCallback(async () => {
    const apiKey = localStorage.getItem('mistral_api_key');
    if (apiKey) {
      try {
        // Показываем загрузку только если мы в нейтральном состоянии или уже загружаем
        setStatus(prev => (prev === 'Ready' || prev.startsWith('Please enter') || prev === 'Loading voices...') ? 'Loading voices...' : prev);
        const fetchedVoices = await fetchVoices(apiKey);
        setVoices(fetchedVoices);
        // Возвращаем Ready только если статус не был изменен чем-то более важным (ошибкой или загрузкой статьи)
        setStatus(prev => (prev === 'Loading voices...') ? 'Ready' : prev);
      } catch (error) {
        setStatus(`Error: ${error.message}`);
      }
    } else {
      setStatus(prev => prev.startsWith('Error:') ? prev : 'Please enter Mistral API Key in Settings');
    }
  }, []);

  const handleProcessContent = useCallback(async (content, targetLang = null) => {
    let textToProcess = content.trim();
    let initialTitle = "Generating title...";
    let isTitleGenerated = false;

    // Более надежная проверка на URL (регулярное выражение)
    const urlRegex = /^(http|https):\/\/[^\s$.?#].[^\s]*$/i;
    const isUrl = urlRegex.test(textToProcess);

    if (isUrl) {
      if (isYoutubeUrl(textToProcess)) {
        const youtubeApiKey = localStorage.getItem('youtube_transcript_api_key');
        if (!youtubeApiKey) {
          setStatus('Error: YouTube API Key missing. Go to Settings.');
          return;
        }
        const videoId = getYoutubeVideoId(textToProcess);
        if (!videoId) {
          setStatus('Error: Could not extract YouTube Video ID.');
          return;
        }

        try {
          setStatus('Fetching YouTube transcript...');
          const proxyUrl = localStorage.getItem('cors_proxy_url');
          textToProcess = await fetchYoutubeTranscript(videoId, youtubeApiKey, proxyUrl);
          setStatus('Transcript fetched');
        } catch (error) {
          console.error('YouTube transcript fetch error:', error);
          setStatus(`Error: YouTube fetch failed. ${error.message}`);
          return;
        }
      } else {
        const proxyUrl = localStorage.getItem('cors_proxy_url');
        if (!proxyUrl) {
          setStatus('Error: CORS Proxy URL missing. Go to Settings.');
          return; // Прекращаем работу
        }

        try {
          setStatus('Extracting article content...');
          const article = await fetchAndParseArticle(textToProcess, proxyUrl);
          textToProcess = article.textContent;
          initialTitle = article.title;
          isTitleGenerated = true;
          setStatus('Article extracted');
        } catch (error) {
          console.error('Article extraction error:', error);
          setStatus(`Error: Extraction failed. ${error.message}`);
          return; 
        }
      }
    }

    // --- Language Detection and Title Generation ---
    const originalTextForTitle = textToProcess; // Сохраняем оригинал для заголовка
    let detectedLanguage = 'English'; // Default
    
    const apiKey = localStorage.getItem('mistral_api_key');
    if (apiKey && !isTitleGenerated) {
      try {
        setStatus('Detecting language for title...');
        const excerptForDetection = originalTextForTitle.substring(0, 500);
        detectedLanguage = await detectLanguage(apiKey, excerptForDetection);
        setStatus('Language detected');
      } catch (error) {
        console.error('Language detection error:', error);
        // Не страшно, просто будет английский заголовок
      }
    }

    // --- Translation Logic ---
    if (targetLang && targetLang !== 'original') {
      const translateApiKey = localStorage.getItem('google_translate_api_key');
      
      if (translateApiKey) {
        try {
          const langNames = { en: 'English', it: 'Italian', es: 'Spanish', pt: 'Portuguese' };
          setStatus(`Translating to ${langNames[targetLang] || targetLang}...`);
          textToProcess = await translateText(textToProcess, targetLang, translateApiKey);
          setStatus('Translation complete');
        } catch (error) {
          console.error('Translation error:', error);
          setStatus(`Error: Translation failed. ${error.message}`);
          return; 
        }
      } else {
        setStatus('Error: Google Translate API Key missing.');
        return;
      }
    }

    const newTrack = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      originalText: textToProcess,
      title: initialTitle,
      isTitleGenerated: isTitleGenerated,
      mode: isSimplifyModeRef.current ? 'simplified' : 'original'
    };

    // Сохраняем в БД в начало списка
    const currentList = await localforage.getItem('mistral_playlist') || [];
    const updatedList = [newTrack, ...currentList];
    await localforage.setItem('mistral_playlist', updatedList);

    // Обновляем UI
    setPlaylist(updatedList);
    setCurrentTrackIndex(0); // Переключаемся на новый трек
    if (!isUrl) setStatus('Ready to play'); // Для URL статус может быть другим

    // Запускаем фоновую генерацию заголовка (только если еще не сгенерирован)
    if (!isTitleGenerated) {
      if (apiKey) {
        try {
          // Используем оригинал и определенный язык
          const generatedTitle = await generateTitle(apiKey, originalTextForTitle, detectedLanguage);

          // Заново берем список из БД (на случай, если пользователь успел добавить еще один текст)
          const latestList = await localforage.getItem('mistral_playlist') || [];
          const trackIndex = latestList.findIndex(t => t.id === newTrack.id);

          if (trackIndex !== -1) {
            latestList[trackIndex].title = generatedTitle;
            latestList[trackIndex].isTitleGenerated = true;
            await localforage.setItem('mistral_playlist', latestList);
            setPlaylist(latestList); // Обновляем UI с красивым заголовком
          }
        } catch (error) {
          console.error('Title generation error:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('text') || params.get('title') || params.get('url');

    if (text) {
      let decodedText = text;
      try {
        decodedText = decodeURIComponent(text);
      } catch (UnusedError) {
        decodedText = text;
      }
      
      // Показываем модальное окно выбора языка
      setSharedContentPending(decodedText);
      
      // Очищаем URL немедленно
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices, trigger]);

  useEffect(() => {
      const loadPlaylist = async () => {
        const savedPlaylist = await localforage.getItem('mistral_playlist') || [];
        setPlaylist(savedPlaylist);
      };
      loadPlaylist();
    }, []);

  // Синхронизируем режим (Original/Simplified) при переключении треков
  useEffect(() => {
    if (playlist.length > 0 && playlist[currentTrackIndex]) {
      const trackMode = playlist[currentTrackIndex].mode;
      if (trackMode) {
        setIsSimplifyMode(trackMode === 'simplified');
      }
    }
  }, [currentTrackIndex, playlist]);

  const checkAndUpdateOfflineStatus = async (trackId, modeStr, totalChunksCount) => {
    try {
      for (let i = 0; i < totalChunksCount; i++) {
        const cacheKey = `offline_audio_${trackId}_${modeStr}_${i}`;
        const cachedBlob = await localforage.getItem(cacheKey);
        if (!cachedBlob) return;
      }

      setPlaylist(prev => {
        const idx = prev.findIndex(t => t.id === trackId);
        if (idx !== -1) {
          const updated = [...prev];
          const isSimplified = modeStr === 'simplified';
          if (isSimplified) {
            if (updated[idx].isOfflineSimplifiedReady) return prev;
            updated[idx] = { ...updated[idx], isOfflineSimplifiedReady: true };
          } else {
            if (updated[idx].isOfflineReady) return prev;
            updated[idx] = { ...updated[idx], isOfflineReady: true };
          }
          localforage.setItem('mistral_playlist', updated);
          return updated;
        }
        return prev;
      });
    } catch (err) {
      console.error('Failed to check and update offline status:', err);
    }
  };

  // Функция для фоновой предзагрузки аудио
  const preloadChunk = async (index, trackIndex) => {
    if (index >= chunksRef.current.length || preloadedUrlsRef.current[index]) return;

    const currentTrack = playlist[trackIndex];
    if (!currentTrack) return;

    try {
      const effectiveSimplifyMode = currentTrack.mode ? (currentTrack.mode === 'simplified') : isSimplifyMode;
      const modeStr = effectiveSimplifyMode ? 'simplified' : 'original';
      const cacheKey = `offline_audio_${currentTrack.id}_${modeStr}_${index}`;
      const cachedBlob = await localforage.getItem(cacheKey);

      if (cachedBlob) {
        preloadedUrlsRef.current[index] = URL.createObjectURL(cachedBlob);
        console.log(`[Оффлайн] Чанк ${index} предзагружен из памяти`);
        return; // Если нашли в кэше, в сеть не идем!
      }

      // 2. Если в кэше нет — качаем из сети (оригинальная логика)
      const apiKey = localStorage.getItem('mistral_api_key');
      const voiceId = localStorage.getItem('mistral_voice_id');
      if (!apiKey || !voiceId) return;

      const text = chunksRef.current[index];
      if (!text) return;

      const audioBlob = await fetchAudioWithRetry(apiKey, text, voiceId);
      await localforage.setItem(cacheKey, audioBlob);
      preloadedUrlsRef.current[index] = URL.createObjectURL(audioBlob);

      checkAndUpdateOfflineStatus(currentTrack.id, modeStr, chunksRef.current.length);
    } catch (error) {
      console.error(`Failed to preload chunk ${index}:`, error);
    }
  };

  const playNextChunk = async (trackIndex = currentTrackIndex) => {
    const currentIndex = currentChunkIndexRef.current;
    const currentTrack = playlist[trackIndex];
    
    // Синхронизируем UI
    setCurrentChunkIndex(currentIndex);

    if (currentIndex >= chunksRef.current.length) {
      setIsPlaying(false);
      setStatus('Finished reading');
      Object.values(preloadedUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
      preloadedUrlsRef.current = {};

      // Помечаем статью как прослушанную
      const trackId = currentTrack.id;
      setPlaylist(prev => {
        const idx = prev.findIndex(t => t.id === trackId);
        if (idx !== -1 && !prev[idx].isListened) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], isListened: true };
          localforage.setItem('mistral_playlist', updated);
          return updated;
        }
        return prev;
      });

      // === Autoplay Logic ===
      if (isAutoplay && trackIndex < playlist.length - 1) {
        const nextIndex = trackIndex + 1;
        setCurrentTrackIndex(nextIndex);
        setStatus('Autoplay: loading next track...');
        processAndPlay(nextIndex);
      }
      return;
    }

    try {
      let audioUrl = preloadedUrlsRef.current[currentIndex];

      if (!audioUrl) {
        setIsLoading(true);

        // 1. Ищем в кэше перед воспроизведением
        const effectiveSimplifyMode = currentTrack.mode ? (currentTrack.mode === 'simplified') : isSimplifyMode;
        const modeStr = effectiveSimplifyMode ? 'simplified' : 'original';
        const cacheKey = `offline_audio_${currentTrack.id}_${modeStr}_${currentIndex}`;
        const cachedBlob = await localforage.getItem(cacheKey);

        if (cachedBlob) {
          audioUrl = URL.createObjectURL(cachedBlob);
          console.log(`[Оффлайн] Воспроизведение чанка ${currentIndex} из памяти`);
        } else {
          // 2. Если в кэше нет - пробуем скачать (нужен интернет)
          const apiKey = localStorage.getItem('mistral_api_key');
          const voiceId = localStorage.getItem('mistral_voice_id');

          if (apiKey && voiceId) {
            try {
              setStatus(`Generating audio for part ${currentIndex + 1}...`);
              const text = chunksRef.current[currentIndex];
              const audioBlob = await fetchAudioWithRetry(apiKey, text, voiceId);
              await localforage.setItem(cacheKey, audioBlob);
              audioUrl = URL.createObjectURL(audioBlob);
              checkAndUpdateOfflineStatus(currentTrack.id, modeStr, chunksRef.current.length);
            } catch (err) {
              console.warn(`[Playback] Failed to fetch chunk ${currentIndex}, skipping...`, err);
              // Если скачать не удалось (нет интернета или ошибка API), просто идем к следующему
              currentChunkIndexRef.current++;
              setIsLoading(false);
              return playNextChunk(trackIndex);
            }
          } else {
            // Нет ключей - пропускаем чанк
            console.warn(`[Playback] No API key to fetch missing chunk ${currentIndex}, skipping...`);
            currentChunkIndexRef.current++;
            setIsLoading(false);
            return playNextChunk(trackIndex);
          }
        }
        setIsLoading(false);
      } else {
        delete preloadedUrlsRef.current[currentIndex];
      }

      setStatus(`Reading part ${currentIndex + 1} of ${chunksRef.current.length}...`);

      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackRateRef.current;
      audioRef.current.defaultPlaybackRate = playbackRateRef.current;

      await audioRef.current.play();
      setIsPlaying(true);

      preloadChunk(currentIndex + 1, trackIndex);

      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentChunkIndexRef.current++;
        playNextChunk(trackIndex);
      };
    } catch (error) {
      setIsLoading(false);
      setStatus(`Playback error: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const processAndPlay = async (targetIndex = null) => {
    const indexToPlay = targetIndex !== null ? targetIndex : currentTrackIndex;
    const currentTrack = playlist[indexToPlay];
    const currentText = currentTrack?.originalText;

    if (!currentText) return;

    // Используем сохраненный режим статьи, если он есть, иначе текущий стейт
    const effectiveSimplifyMode = currentTrack.mode ? (currentTrack.mode === 'simplified') : isSimplifyMode;

    Object.values(preloadedUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    preloadedUrlsRef.current = {};

    if (effectiveSimplifyMode) {
      if (currentTrack.simplifiedText) {
          chunksRef.current = splitIntoChunks(currentTrack.simplifiedText);
          currentChunkIndexRef.current = 0;
          playNextChunk(indexToPlay);
          return;
      }

      setIsLoading(true);
      const apiKey = localStorage.getItem('mistral_api_key');

      if (!apiKey) {
        setStatus('Missing API Key');
        setIsLoading(false);
        return;
      }

      try {
        const paragraphs = splitBySentences(currentText, 5);
        
        setStatus('Detecting language...');
        const excerptForDetection = paragraphs[0] || currentText.substring(0, 500);
        const detectedLanguage = await detectLanguage(apiKey, excerptForDetection);
        
        let simplifiedText = '';

        for (let i = 0; i < paragraphs.length; i++) {
          setStatus(`Simplifying in ${detectedLanguage}: part ${i + 1} of ${paragraphs.length}...`);
          // Передаем определенный язык и уровень в функцию
          const simplified = await simplifyTextParagraph(apiKey, paragraphs[i], detectedLanguage, languageLevel);
          simplifiedText += simplified + '\n\n';
        }

        const currentList = await localforage.getItem('mistral_playlist') || [];
        const trackIndex = currentList.findIndex(t => t.id === currentTrack.id);
        if (trackIndex !== -1) {
          currentList[trackIndex].simplifiedText = simplifiedText;
          await localforage.setItem('mistral_playlist', currentList);
          setPlaylist(currentList);
        }

        chunksRef.current = splitIntoChunks(simplifiedText);
        currentChunkIndexRef.current = 0;
        playNextChunk(indexToPlay);
      } catch (error) {
        setIsLoading(false);
        setStatus(`Simplification error: ${error.message}`);
      }
    } else {
      chunksRef.current = splitIntoChunks(currentText);
      currentChunkIndexRef.current = 0;
      playNextChunk(indexToPlay);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src && !audioRef.current.ended && audioRef.current.readyState > 0) {
        // Продолжаем воспроизведение с паузы
        audioRef.current.play();
        setIsPlaying(true);
      } else if (playlist.length > 0 && playlist[currentTrackIndex]) {
        // 4. Проверяем, есть ли трек в плейлисте (вместо проверки sharedText)
        processAndPlay();
      } else {
        setStatus('No text to play. Share something to this app!');
      }
    }
  };

  const handleClearHistory = async () => {
    // Обновили текст подтверждения, чтобы было понятно, что удаляется и аудио
    const confirmDelete = window.confirm("Are you sure you want to delete all saved texts and offline audio?");

    if (confirmDelete) {
      setIsLoading(true);
      setStatus('Clearing history and audio files...');

      try {
        // 1. Проходим по всей базе и удаляем все скачанные аудио чанки
        const keys = await localforage.keys();
        const audioKeys = keys.filter(key => key.startsWith('offline_audio_'));

        for (const key of audioKeys) {
          await localforage.removeItem(key);
        }
        console.log(`Deleted ${audioKeys.length} offline audio chunks.`);

        // 2. Удаляем сам плейлист из базы
        await localforage.removeItem('mistral_playlist');

        // 3. Сбрасываем стейты в React
        setPlaylist([]);
        setCurrentTrackIndex(0);
        setCurrentChunkIndex(0);

        // 4. Останавливаем плеер, если он играл
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        setStatus('History and offline audio cleared');
      } catch (error) {
        console.error('Error clearing history:', error);
        setStatus('Error clearing history');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePreviousChunk = () => {
    if (currentChunkIndexRef.current > 0) {
      currentChunkIndexRef.current--;
      
      // Останавливаем текущее воспроизведение
      if (audioRef.current) {
        audioRef.current.pause();
        const oldSrc = audioRef.current.src;
        if (oldSrc && oldSrc.startsWith('blob:')) {
          URL.revokeObjectURL(oldSrc);
        }
        audioRef.current.src = '';
      }
      
      playNextChunk();
    }
  };

  const handleNextChunk = () => {
    if (currentChunkIndexRef.current < chunksRef.current.length - 1) {
      currentChunkIndexRef.current++;

      // Останавливаем текущее воспроизведение
      if (audioRef.current) {
        audioRef.current.pause();
        const oldSrc = audioRef.current.src;
        if (oldSrc && oldSrc.startsWith('blob:')) {
          URL.revokeObjectURL(oldSrc);
        }
        audioRef.current.src = '';
      }

      playNextChunk();
    }
  };

  const handleSpeedChange = () => {
    setPlaybackRate(prevRate => {
      let nextRate;
      if (prevRate === 1) nextRate = 1.25;
      else if (prevRate === 1.25) nextRate = 1.5;
      else if (prevRate === 1.5) nextRate = 0.8;
      else nextRate = 1;

      if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
      }
      // Синхронизируем актуальную скорость с рефом
      playbackRateRef.current = nextRate;

      return nextRate;
    });
  };

  const handleSettingsChange = () => {
    setTrigger(prev => prev + 1);
    setIsAutoplay(localStorage.getItem('mistral_autoplay') === 'true');
  };

  const handleDownloadOffline = async () => {
    const currentTrack = playlist[currentTrackIndex];
    if (!currentTrack) return;

    const apiKey = localStorage.getItem('mistral_api_key');
    const voiceId = localStorage.getItem('mistral_voice_id');

    if (!apiKey || !voiceId) {
      setStatus('Missing API Key or Voice in Settings');
      return;
    }

    setIsLoading(true);
    setStatus(isSimplifyMode ? 'Preparing simplified text and audio...' : 'Preparing to download audio...');

    try {
      await downloadArticle({
        article: currentTrack,
        isSimplifyMode,
        apiKey,
        voiceId,
        languageLevel,
        onProgress: (statusText, progress) => {
          if (progress === -1) {
            setStatus(`Download error: ${statusText}`);
          } else {
            setStatus(statusText);
          }
        },
        onUpdateTrack: (updatedTrack) => {
          setPlaylist(prev => {
            const idx = prev.findIndex(t => t.id === updatedTrack.id);
            if (idx !== -1) {
              const newList = [...prev];
              newList[idx] = updatedTrack;
              return newList;
            }
            return prev;
          });
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      setStatus(`Download error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeToggle = async () => {
    const newMode = !isSimplifyMode;
    setIsSimplifyMode(newMode);
    localStorage.setItem('mistral_simplify_mode', newMode);

    // Сохраняем режим для текущей статьи в плейлисте
    if (playlist.length > 0 && playlist[currentTrackIndex]) {
      const updatedPlaylist = [...playlist];
      updatedPlaylist[currentTrackIndex] = {
        ...updatedPlaylist[currentTrackIndex],
        mode: newMode ? 'simplified' : 'original'
      };
      setPlaylist(updatedPlaylist);
      await localforage.setItem('mistral_playlist', updatedPlaylist);
    }
  };

  const handleCopyChunks = async () => {
    const currentTrack = playlist[currentTrackIndex];
    if (!currentTrack) return;

    let textToProcess = '';
    if (isSimplifyMode) {
      if (!currentTrack.simplifiedText) {
        setStatus('Simplified text not generated yet');
        return;
      }
      textToProcess = currentTrack.simplifiedText;
    } else {
      textToProcess = currentTrack.originalText;
    }

    if (!textToProcess) return;

    try {
      const chunks = splitIntoChunks(textToProcess);
      const separatedText = chunks.join('\n---\n');
      await navigator.clipboard.writeText(separatedText);
      setStatus('Chunks copied to clipboard!');
      // Возвращаем статус в Ready через 2 секунды
      setTimeout(() => setStatus('Ready'), 2000);
    } catch (err) {
      console.error('Failed to copy chunks:', err);
      setStatus('Failed to copy to clipboard');
    }
  };

  const handleClearAudioCache = async () => {
    const currentTrack = playlist[currentTrackIndex];
    if (!currentTrack) return;

    const confirmClear = window.confirm(`Are you sure you want to clear audio cache for "${currentTrack.title}"?`);
    if (!confirmClear) return;

    setIsLoading(true);
    setStatus('Clearing audio cache...');

    try {
      const trackId = currentTrack.id;

      // 1. Stop playback and reset current track's playback state
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlaying(false);
      
      // Revoke and clear any preloaded URLs
      Object.values(preloadedUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
      preloadedUrlsRef.current = {};
      
      currentChunkIndexRef.current = 0;
      setCurrentChunkIndex(0);

      // 2. Delete related audio files from localforage
      const keys = await localforage.keys();
      const audioKeys = keys.filter(key => key.startsWith(`offline_audio_${trackId}_`));

      for (const key of audioKeys) {
        await localforage.removeItem(key);
      }
      console.log(`Cleared ${audioKeys.length} offline audio chunks for track ${trackId}`);

      // 3. Reset offline readiness in the playlist
      const updatedPlaylist = playlist.map(t => {
        if (t.id === trackId) {
          return {
            ...t,
            isOfflineReady: false,
            isOfflineSimplifiedReady: false
          };
        }
        return t;
      });
      await localforage.setItem('mistral_playlist', updatedPlaylist);
      setPlaylist(updatedPlaylist);

      setStatus('Audio cache cleared');
    } catch (error) {
      console.error('Error clearing audio cache:', error);
      setStatus('Error clearing audio cache');
    } finally {
      setIsLoading(false);
      setIsActionMenuOpen(false);
    }
  };

  const handleDeleteCurrentTrack = async () => {
    const currentTrack = playlist[currentTrackIndex];
    if (!currentTrack) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${currentTrack.title}"?`);
    if (!confirmDelete) return;

    setIsLoading(true);
    setStatus('Deleting article and audio files...');

    try {
      // 1. Удаляем связанные аудио файлы из localforage
      const trackId = currentTrack.id;
      const keys = await localforage.keys();
      const audioKeys = keys.filter(key => key.startsWith(`offline_audio_${trackId}_`));

      for (const key of audioKeys) {
        await localforage.removeItem(key);
      }
      console.log(`Deleted ${audioKeys.length} offline audio chunks for track ${trackId}`);

      // 2. Обновляем плейлист
      const updatedPlaylist = playlist.filter(t => t.id !== trackId);
      await localforage.setItem('mistral_playlist', updatedPlaylist);
      setPlaylist(updatedPlaylist);

      // 3. Управляем индексами и состоянием плеера
      if (updatedPlaylist.length === 0) {
        setCurrentTrackIndex(0);
        setCurrentChunkIndex(0);
        if (audioRef.current) audioRef.current.pause();
        setIsPlaying(false);
        setStatus('Playlist empty');
      } else {
        // Если удалили последний элемент, сдвигаемся назад
        if (currentTrackIndex >= updatedPlaylist.length) {
          setCurrentTrackIndex(updatedPlaylist.length - 1);
        }
        // В любом случае сбрасываем чанк и останавливаем плеер (для чистоты)
        currentChunkIndexRef.current = 0;
        setCurrentChunkIndex(0);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        setIsPlaying(false);
        setStatus('Article deleted');
      }
    } catch (error) {
      console.error('Error deleting track:', error);
      setStatus('Error deleting article');
    } finally {
      setIsLoading(false);
      setIsActionMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen pb-[env(safe-area-inset-bottom)] bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Топ-бар с независимым позиционированием элементов */}
      <header className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">

        {/* Статус: прикреплен слева и сверху, занимает всю ширину экрана кроме зоны кнопки настроек */}
        <div className="absolute top-6 left-6 right-16 pointer-events-auto">
          <p className={`text-[11px] sm:text-xs font-medium overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden whitespace-nowrap drop-shadow-sm ${status.includes('Error') || status.includes('error') ? 'text-red-400' : 'text-blue-400'}`}>
            {status}
          </p>
        </div>

        {playlist.length > 0 && (
          <div className="absolute top-12 left-6 right-16 pointer-events-auto flex items-center space-x-2">
              <p className={`text-xs truncate max-w-[80%] transition-all duration-500 ${
                playlist[currentTrackIndex]?.isListened 
                  ? 'text-slate-500 font-light opacity-50' 
                  : 'text-slate-200 font-medium opacity-100'
              }`}>
                {playlist[currentTrackIndex].title}
              </p>

              {/* Кнопка меню действий */}
              <div className="relative">
                <button
                  onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                  className="text-slate-500 hover:text-blue-400 transition-colors focus:outline-none p-1"
                  title="Actions"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              {/* Выпадающее меню: теперь позиционируется относительно общего контейнера топ-бара */}
              {isActionMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsActionMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden py-1">
                    <button
                      onClick={() => {
                        handleDownloadOffline();
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Audio
                    </button>
                    <button
                      onClick={() => {
                        handleCopyChunks();
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Chunks
                    </button>
                    <button
                      onClick={() => {
                        handleClearAudioCache();
                        setIsActionMenuOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" />
                      </svg>
                      Clear Audio Cache
                    </button>
                    <div className="h-px bg-slate-700 my-1"></div>
                    <button
                      onClick={handleDeleteCurrentTrack}
                      className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Article
                    </button>
                  </div>
                </>
              )}
          </div>
        )}

        {/* Кнопка настроек: жестко привязана к правому верхнему углу */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors focus:outline-none pointer-events-auto z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Слайдер: жестко зафиксирован справа, под кнопкой настроек */}
        <div className="absolute top-20 right-6 pointer-events-auto z-20">
          <button
            onClick={handleModeToggle}
            className="relative flex items-center w-48 h-9 rounded-full bg-slate-800 border border-slate-700 p-1 cursor-pointer focus:outline-none shadow-inner"
          >
            {/* Анимированный ползунок фона */}
            <div
              className={`absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-blue-500 rounded-full transition-transform duration-300 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)] ${
                isSimplifyMode ? 'translate-x-full' : 'translate-x-0'
              }`}
            ></div>

            {/* Текст "Original" с индикатором */}
            <span
              className={`relative z-10 w-1/2 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                !isSimplifyMode ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Original
              {playlist[currentTrackIndex]?.isOfflineReady && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></span>
              )}
            </span>

            {/* Текст "Simplified" с индикатором */}
            <span
              className={`relative z-10 w-1/2 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                isSimplifyMode ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Simplified
              {playlist[currentTrackIndex]?.isOfflineSimplifiedReady && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"></span>
              )}
            </span>
          </button>
        </div>

      </header>

      <main className="w-full max-w-sm px-6">
        <Player
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={handlePlayPause}
          playbackRate={playbackRate}
          onSpeedChange={handleSpeedChange}

          hasPrevious={currentTrackIndex > 0}
          hasNext={currentTrackIndex < playlist.length - 1}
          onPrevious={() => {
            setCurrentTrackIndex(prev => prev - 1);
            currentChunkIndexRef.current = 0;
            setCurrentChunkIndex(0);

            // Принудительно сбрасываем старый аудио-источник
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.removeAttribute('src');
              audioRef.current.load();
            }

            setIsPlaying(false);
            setStatus('Ready to play');
          }}
          onNext={() => {
            setCurrentTrackIndex(prev => prev + 1);
            currentChunkIndexRef.current = 0;
            setCurrentChunkIndex(0);

            // Принудительно сбрасываем старый аудио-источник
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.removeAttribute('src');
              audioRef.current.load();
            }

            setIsPlaying(false);
            setStatus('Ready to play');
          }}
          onPreviousChunk={handlePreviousChunk}
          onNextChunk={handleNextChunk}
          hasPreviousChunk={currentChunkIndex > 0}
          hasNextChunk={currentChunkIndex < chunksRef.current.length - 1}
        />

        {/* Футер с ламповым таймером */}
        <footer className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-auto z-10 pb-[env(safe-area-inset-bottom)]">
          <div 
            onClick={() => setListeningTimeMode(prev => prev === 'today' ? 'week' : 'today')}
            className="flex flex-col items-center space-y-1 opacity-80 hover:opacity-100 transition-opacity duration-300 cursor-pointer group"
          >
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium group-hover:text-blue-400 transition-colors">
              {listeningTimeMode === 'today' ? 'Tempo di oggi' : 'Tempo della settimana'}
            </span>
            <div
              className="px-4 py-1.5 bg-slate-900/90 border border-slate-800/50 rounded-lg shadow-inner select-none transition-all group-active:scale-95"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                color: '#ff6b00',
                textShadow: '0 0 2px #ff6b00, 0 0 8px #ff4500, 0 0 20px #ea580c'
              }}
            >
              <span className="text-xl sm:text-2xl font-bold tracking-[0.1em]">
                {formatTimeDigital(listeningTimeMode === 'today' ? dailyListeningTime : weeklyListeningTime)}
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Модальное окно выбора языка перевода */}
      {sharedContentPending && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-[280px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 flex flex-col items-center">
            <h3 className="text-base font-bold text-slate-200 mb-5">Translate to which language?</h3>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  handleProcessContent(sharedContentPending, 'it');
                  setSharedContentPending(null);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                IT
              </button>
              <button
                onClick={() => {
                  handleProcessContent(sharedContentPending, 'en');
                  setSharedContentPending(null);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                EN
              </button>
              <button
                onClick={() => {
                  handleProcessContent(sharedContentPending, 'es');
                  setSharedContentPending(null);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                ES
              </button>
              <button
                onClick={() => {
                  handleProcessContent(sharedContentPending, 'pt');
                  setSharedContentPending(null);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                PT
              </button>
              <button
                onClick={() => {
                  handleProcessContent(sharedContentPending, 'original');
                  setSharedContentPending(null);
                }}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-2xl font-medium text-sm transition-colors active:scale-95"
              >
                Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <Settings
                voices={voices}
                onSettingsChange={handleSettingsChange}
                onClose={() => setIsSettingsOpen(false)}
                onClearHistory={handleClearHistory}
                onBulkDownload={() => setIsBulkDownloadOpen(true)}
                languageLevel={languageLevel}
                onLanguageLevelChange={setLanguageLevel}
              />
            </div>
          </div>
        )}

      {/* Модальное окно массовой загрузки */}
      {isBulkDownloadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <BulkDownloadPanel
              playlist={playlist}
              isSimplifyMode={isSimplifyMode}
              apiKey={localStorage.getItem('mistral_api_key')}
              voiceId={localStorage.getItem('mistral_voice_id')}
              languageLevel={languageLevel}
              onClose={() => setIsBulkDownloadOpen(false)}
              onUpdatePlaylist={setPlaylist}
            />
          </div>
        </div>
      )}

      {/* Модальное окно обновления PWA */}
      {needRefresh && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl w-full max-w-xs overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.15)] p-6 flex flex-col items-center text-center">

            {/* Иконка обновления */}
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-5">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">New Version!</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              A fresh update is available. Update now to apply the changes.
            </p>

            <div className="flex space-x-3 w-full">
              <button
                onClick={() => setNeedRefresh(false)}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-colors focus:outline-none"
              >
                Later
              </button>
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 focus:outline-none"
              >
                Update
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default App
