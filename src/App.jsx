import React, { useState, useEffect, useCallback, useRef } from 'react'
// Импортируем хук для работы с обновлениями PWA
import { useRegisterSW } from 'virtual:pwa-register/react'
import localforage from 'localforage'

import Settings from './components/Settings'
import Player from './components/Player'
import { fetchVoices, generateSpeechStreaming, simplifyTextParagraph, generateTitle } from './api/mistral'
import { splitIntoChunks, splitBySentences } from './utils/chunking'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [trigger, setTrigger] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSimplifyMode, setIsSimplifyMode] = useState(() => {
      const savedMode = localStorage.getItem('mistral_simplify_mode');
      return savedMode === 'true'; // Вернет false (оригинал) по умолчанию
    });
  const [dailyListeningTime, setDailyListeningTime] = useState(0);

  const audioRef = useRef(new Audio());
  const chunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);
  // Новый ref для хранения предзагруженных URL
  const preloadedUrlsRef = useRef({});
  const playbackRateRef = useRef(1);

  // Инициализация контроля обновлений PWA
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered');
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  // Загрузка времени или сброс при наступлении нового дня
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const savedDate = localStorage.getItem('voce_listening_date');
    const savedTime = localStorage.getItem('voce_listening_time');

    if (savedDate === today) {
      setDailyListeningTime(parseInt(savedTime || '0', 10));
    } else {
      // Наступил новый день (или первый запуск)
      localStorage.setItem('voce_listening_date', today);
      localStorage.setItem('voce_listening_time', '0');
      setDailyListeningTime(0);
    }
  }, []);

  // Сам таймер
  useEffect(() => {
    let interval;
    // Считаем время только когда реально идет воспроизведение
    if (isPlaying && !isLoading) {
      interval = setInterval(() => {
        setDailyListeningTime(prev => {
          const newTime = prev + 1;
          // Сохраняем каждую секунду, чтобы не потерять прогресс при перезагрузке страницы
          localStorage.setItem('voce_listening_time', newTime.toString());
          return newTime;
        });
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
        setStatus('Loading voices...');
        const fetchedVoices = await fetchVoices(apiKey);
        setVoices(fetchedVoices);
        setStatus('Ready');
      } catch (error) {
        setStatus(`Error: ${error.message}`);
      }
    } else {
      setStatus('Please enter Mistral API Key in Settings');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('text') || params.get('title') || params.get('url');

    if (text) {
      let finalString = text;
      try {
        finalString = decodeURIComponent(text);
      } catch (e) {
        finalString = text;
      }

      // Асинхронная функция обработки нового текста
      const processNewSharedText = async () => {
        const newTrack = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          originalText: finalString,
          title: "Generating title...", // Временный заголовок на английском
          isTitleGenerated: false
        };

        // Сохраняем в БД в начало списка
        const currentList = await localforage.getItem('mistral_playlist') || [];
        const updatedList = [newTrack, ...currentList];
        await localforage.setItem('mistral_playlist', updatedList);

        // Обновляем UI
        setPlaylist(updatedList);
        setCurrentTrackIndex(0); // Переключаемся на новый трек
        setStatus('Ready to play'); // Пользователь должен сам нажать Play

        // Запускаем фоновую генерацию заголовка
        const apiKey = localStorage.getItem('mistral_api_key');
        if (apiKey) {
          try {
            const generatedTitle = await generateTitle(apiKey, finalString);

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
            // Можно оставить "Generating title..." или заменить на "Untitled Document" при ошибке
          }
        }
      };

      processNewSharedText();

      // ОЧЕНЬ ВАЖНО: Очищаем URL, чтобы при обновлении страницы (pull-to-refresh)
      // текст не добавился в базу повторно!
      window.history.replaceState({}, document.title, window.location.pathname);
    }
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

  // Функция-обертка для загрузки аудио с механизмом повторных попыток
  const fetchAudioWithRetry = async (apiKey, text, voiceId, maxRetries = 5) => {
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

        // Задержка перед следующей попыткой: 1 сек, 2 сек, 3 сек...
        // Это помогает при временных проблемах с сетью или лимитах API
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  // Функция для фоновой предзагрузки аудио
  const preloadChunk = async (index) => {
    if (index >= chunksRef.current.length || preloadedUrlsRef.current[index]) return;

    const currentTrack = playlist[currentTrackIndex];
    if (!currentTrack) return;

    try {
      const modeStr = isSimplifyMode ? 'simplified' : 'original';
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
      const audioBlob = await fetchAudioWithRetry(apiKey, text, voiceId);
      preloadedUrlsRef.current[index] = URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error(`Failed to preload chunk ${index}:`, error);
    }
  };

  const playNextChunk = async () => {
    const currentIndex = currentChunkIndexRef.current;
    const currentTrack = playlist[currentTrackIndex];

    if (currentIndex >= chunksRef.current.length) {
      setIsPlaying(false);
      setStatus('Finished reading');
      Object.values(preloadedUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
      preloadedUrlsRef.current = {};
      return;
    }

    try {
      let audioUrl = preloadedUrlsRef.current[currentIndex];

      if (!audioUrl) {
        setIsLoading(true);

        // 1. Ищем в кэше перед воспроизведением
        const modeStr = isSimplifyMode ? 'simplified' : 'original';
        const cacheKey = `offline_audio_${currentTrack.id}_${modeStr}_${currentIndex}`;
        const cachedBlob = await localforage.getItem(cacheKey);

        if (cachedBlob) {
          audioUrl = URL.createObjectURL(cachedBlob);
          console.log(`[Оффлайн] Воспроизведение чанка ${currentIndex} из памяти`);
        } else {
          // 2. Если в кэше нет - нужен интернет и ключи API
          const apiKey = localStorage.getItem('mistral_api_key');
          const voiceId = localStorage.getItem('mistral_voice_id');

          if (!apiKey || !voiceId) {
            setStatus(!apiKey ? 'Missing API Key' : 'Please select a voice in Settings');
            setIsPlaying(false);
            setIsLoading(false);
            return;
          }

          setStatus(`Generating audio for part ${currentIndex + 1}...`);
          const text = chunksRef.current[currentIndex];
          const audioBlob = await fetchAudioWithRetry(apiKey, text, voiceId);
          audioUrl = URL.createObjectURL(audioBlob);
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

      preloadChunk(currentIndex + 1);

      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentChunkIndexRef.current++;
        playNextChunk();
      };
    } catch (error) {
      setIsLoading(false);
      setStatus(`Playback error: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const processAndPlay = async () => {
    const currentTrack = playlist[currentTrackIndex];
    const currentText = currentTrack?.originalText;

    if (!currentText) return;

    Object.values(preloadedUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    preloadedUrlsRef.current = {};

    if (isSimplifyMode) {
      // ЕСЛИ УЖЕ ЕСТЬ СОХРАНЕННЫЙ УПРОЩЕННЫЙ ТЕКСТ (оффлайн режим)
      if (currentTrack.simplifiedText) {
          chunksRef.current = splitIntoChunks(currentTrack.simplifiedText);
          currentChunkIndexRef.current = 0;
          playNextChunk();
          return; // Выходим, в интернет идти не нужно
      }

      // Если текста нет - генерируем (нужен интернет)
      setIsLoading(true);
      const apiKey = localStorage.getItem('mistral_api_key');

      if (!apiKey) {
        setStatus('Missing API Key');
        setIsLoading(false);
        return;
      }

      try {
        const paragraphs = splitBySentences(currentText, 5);
        let simplifiedText = '';

        for (let i = 0; i < paragraphs.length; i++) {
          setStatus(`Semplificazione paragrafo ${i + 1} di ${paragraphs.length}...`);
          const simplified = await simplifyTextParagraph(apiKey, paragraphs[i]);
          simplifiedText += simplified + '\n\n';
        }

        // Сохраняем сгенерированный текст в базу
        const currentList = await localforage.getItem('mistral_playlist') || [];
        const trackIndex = currentList.findIndex(t => t.id === currentTrack.id);
        if (trackIndex !== -1) {
          currentList[trackIndex].simplifiedText = simplifiedText;
          await localforage.setItem('mistral_playlist', currentList);
          setPlaylist(currentList);
        }

        chunksRef.current = splitIntoChunks(simplifiedText);
        currentChunkIndexRef.current = 0;
        playNextChunk();
      } catch (error) {
        setIsLoading(false);
        setStatus(`Errore di semplificazione: ${error.message}`);
      }
    } else {
      chunksRef.current = splitIntoChunks(currentText);
      currentChunkIndexRef.current = 0;
      playNextChunk();
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

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
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
      let textToRead = '';
      const currentList = await localforage.getItem('mistral_playlist') || [];
      const trackIndex = currentList.findIndex(t => t.id === currentTrack.id);

      if (isSimplifyMode) {
        // === РЕЖИМ УПРОЩЕНИЯ ===
        if (currentTrack.simplifiedText) {
            // Если уже упрощали ранее, берем готовое
            textToRead = currentTrack.simplifiedText;
        } else {
            // Если нет, генерируем упрощенный текст
            const paragraphs = splitBySentences(currentTrack.originalText, 5);
            let generatedSimplifiedText = '';

            for (let i = 0; i < paragraphs.length; i++) {
              setStatus(`Simplifying part ${i + 1} of ${paragraphs.length}...`);
              const simplified = await simplifyTextParagraph(apiKey, paragraphs[i]);
              generatedSimplifiedText += simplified + '\n\n';
            }
            textToRead = generatedSimplifiedText;

            // Сохраняем упрощенный текст в базу, чтобы оффлайн-плеер знал, что читать
            if (trackIndex !== -1) {
              currentList[trackIndex].simplifiedText = textToRead;
              await localforage.setItem('mistral_playlist', currentList);
              setPlaylist(currentList);
            }
        }
      } else {
        // === ОРИГИНАЛЬНЫЙ РЕЖИМ ===
        textToRead = currentTrack.originalText;
      }

      // Разбиваем нужный текст на чанки
      const chunks = splitIntoChunks(textToRead);
      const modeStr = isSimplifyMode ? 'simplified' : 'original';

      for (let i = 0; i < chunks.length; i++) {
        setStatus(`Downloading ${modeStr} part ${i + 1} of ${chunks.length}...`);
        const audioBlob = await fetchAudioWithRetry(apiKey, chunks[i], voiceId);

        // Сохраняем с пометкой режима (original или simplified)
        const cacheKey = `offline_audio_${currentTrack.id}_${modeStr}_${i}`;
        await localforage.setItem(cacheKey, audioBlob);
      }

      if (trackIndex !== -1) {
        if (isSimplifyMode) {
            currentList[trackIndex].isOfflineSimplifiedReady = true;
        } else {
            currentList[trackIndex].isOfflineReady = true;
        }
        await localforage.setItem('mistral_playlist', currentList);
        setPlaylist(currentList);
      }

      setStatus(`Download complete (${modeStr})!`);
    } catch (error) {
      console.error('Download error:', error);
      setStatus(`Download error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeToggle = () => {
      const newMode = !isSimplifyMode;
      setIsSimplifyMode(newMode);
      localStorage.setItem('mistral_simplify_mode', newMode);
    };

  return (
    <div className="min-h-screen pb-[env(safe-area-inset-bottom)] bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Топ-бар с независимым позиционированием элементов */}
      <header className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">

        {/* Статус: прикреплен слева и сверху, занимает всю ширину экрана кроме зоны кнопки настроек */}
        <div className="absolute top-6 left-6 right-16 pointer-events-auto">
          <p className={`text-sm font-medium leading-relaxed drop-shadow-sm ${status.includes('Error') || status.includes('error') ? 'text-red-400' : 'text-blue-400'}`}>
            {status}
          </p>
        </div>

        {playlist.length > 0 && (
          <div className="absolute top-12 left-6 right-16 pointer-events-auto overflow-hidden flex items-center space-x-2">
              <p className="text-xs text-slate-500 font-light truncate opacity-80 max-w-[80%]">
                {playlist[currentTrackIndex].title}
              </p>

              {/* Кнопка скачивания для оффлайн */}
              <button
                onClick={handleDownloadOffline}
                className="text-slate-500 hover:text-blue-400 transition-colors focus:outline-none p-1"
                title="Скачать аудио для оффлайн"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
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
        <div className="absolute top-18 right-6 pointer-events-auto z-20">
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

            {/* Текст "Originale" */}
            <span
              className={`relative z-10 w-1/2 text-center text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                !isSimplifyMode ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Original
            </span>

            {/* Текст "Simplificato" */}
            <span
              className={`relative z-10 w-1/2 text-center text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                isSimplifyMode ? 'text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Simplified
            </span>
          </button>
        </div>

      </header>

      <main className="w-full max-w-sm px-6">
        <Player
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={handlePlayPause}
          onRewind={handleRewind}
          playbackRate={playbackRate}
          onSpeedChange={handleSpeedChange}

          hasPrevious={currentTrackIndex > 0}
          hasNext={currentTrackIndex < playlist.length - 1}
          onPrevious={() => {
            setCurrentTrackIndex(prev => prev - 1);

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

            // Принудительно сбрасываем старый аудио-источник
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.removeAttribute('src');
              audioRef.current.load();
            }

            setIsPlaying(false);
            setStatus('Ready to play');
          }}
        />

        {/* Футер с ламповым таймером */}
        <footer className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-auto z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex flex-col items-center space-y-1 opacity-80 hover:opacity-100 transition-opacity duration-300">
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
              Tempo di ascolto
            </span>
            <div
              className="px-4 py-1.5 bg-slate-900/90 border border-slate-800/50 rounded-lg shadow-inner select-none"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                color: '#ff6b00',
                textShadow: '0 0 2px #ff6b00, 0 0 8px #ff4500, 0 0 20px #ea580c'
              }}
            >
              <span className="text-xl sm:text-2xl font-bold tracking-[0.1em]">
                {formatTimeDigital(dailyListeningTime)}
              </span>
            </div>
          </div>
        </footer>
      </main>

      {/* Модальное окно настроек */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
              <Settings
                voices={voices}
                onSettingsChange={handleSettingsChange}
                onClose={() => setIsSettingsOpen(false)}
                onClearHistory={handleClearHistory} // <-- ДОБАВЛЯЕМ ЭТУ СТРОКУ
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

            <h3 className="text-xl font-bold text-white mb-2">Новая версия!</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Доступно свежее обновление приложения. Обновитесь сейчас, чтобы применить изменения.
            </p>

            <div className="flex space-x-3 w-full">
              <button
                onClick={() => setNeedRefresh(false)}
                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold transition-colors focus:outline-none"
              >
                Позже
              </button>
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 focus:outline-none"
              >
                Обновить
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default App
