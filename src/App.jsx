import React, { useState, useEffect, useCallback, useRef } from 'react'
// Импортируем хук для работы с обновлениями PWA
import { useRegisterSW } from 'virtual:pwa-register/react'

import Settings from './components/Settings'
import Player from './components/Player'
import { fetchVoices, generateSpeechStreaming } from './api/mistral'
import { splitIntoChunks } from './utils/chunking'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [trigger, setTrigger] = useState(0);
  const [sharedText, setSharedText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef(new Audio());
  const chunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);
  // Новый ref для хранения предзагруженных URL
  const preloadedUrlsRef = useRef({});

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
      setSharedText(decodeURIComponent(text));
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices, trigger]);

  // Функция для фоновой предзагрузки аудио
  const preloadChunk = async (index) => {
    // Если индекс выходит за пределы, или чанк уже предзагружен — ничего не делаем
    if (index >= chunksRef.current.length || preloadedUrlsRef.current[index]) return;

    const apiKey = localStorage.getItem('mistral_api_key');
    const voiceId = localStorage.getItem('mistral_voice_id');

    if (!apiKey || !voiceId) return;

    try {
      const text = chunksRef.current[index];
      const audioBlob = await generateSpeechStreaming(apiKey, text, voiceId);
      const audioUrl = URL.createObjectURL(audioBlob);
      // Сохраняем ссылку на готовое аудио в ref
      preloadedUrlsRef.current[index] = audioUrl;
    } catch (error) {
      console.error(`Failed to preload chunk ${index}:`, error);
    }
  };

  const playNextChunk = async () => {
    const apiKey = localStorage.getItem('mistral_api_key');
    const voiceId = localStorage.getItem('mistral_voice_id');

    if (!apiKey || !voiceId) {
      setStatus(!apiKey ? 'Missing API Key' : 'Please select a voice in Settings');
      setIsPlaying(false);
      return;
    }

    const currentIndex = currentChunkIndexRef.current;

    if (currentIndex >= chunksRef.current.length) {
      setIsPlaying(false);
      setStatus('Finished reading');
      Object.values(preloadedUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
      preloadedUrlsRef.current = {};
      return;
    }

    try {
      let audioUrl = preloadedUrlsRef.current[currentIndex];

      // Если аудио еще не предзагружено, показываем статус генерации и лоадер
      if (!audioUrl) {
        setStatus(`Generating audio for part ${currentIndex + 1}...`);
        setIsLoading(true); // Включаем спиннер
        
        const text = chunksRef.current[currentIndex];
        const audioBlob = await generateSpeechStreaming(apiKey, text, voiceId);
        audioUrl = URL.createObjectURL(audioBlob);
        
        setIsLoading(false); // Выключаем спиннер после успешной загрузки
      } else {
        delete preloadedUrlsRef.current[currentIndex];
      }

      // Меняем статус на "Чтение" ТОЛЬКО когда аудио уже готово к воспроизведению
      setStatus(`Reading part ${currentIndex + 1} of ${chunksRef.current.length}...`);

      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackRate;

      await audioRef.current.play();
      setIsPlaying(true);

      preloadChunk(currentIndex + 1);

      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentChunkIndexRef.current++;
        playNextChunk();
      };
    } catch (error) {
      setIsLoading(false); // Не забываем выключить спиннер при ошибке
      setStatus(`Playback error: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src && !audioRef.current.ended && audioRef.current.readyState > 0) {
        audioRef.current.play();
        setIsPlaying(true);
      } else if (sharedText) {
        // Очищаем предыдущие предзагрузки перед новым текстом
        Object.values(preloadedUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
        preloadedUrlsRef.current = {};

        chunksRef.current = splitIntoChunks(sharedText);
        currentChunkIndexRef.current = 0;
        playNextChunk();
      } else {
        setStatus('No text to play. Share something to this app!');
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
      const nextRate = prevRate === 1 ? 1.25 : prevRate === 1.25 ? 1.5 : 1;
      if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
      }
      return nextRate;
    });
  };

  const handleSettingsChange = () => {
    setTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Топ-бар */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="text-sm font-medium text-slate-300">
          <span className={status.includes('Error') || status.includes('error') ? 'text-red-400' : 'text-blue-400'}>
            {status}
          </span>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <main className="w-full max-w-sm px-6">
        <Player
          isPlaying={isPlaying}
          isLoading={isLoading} // Передаем новое состояние в плеер
          onPlayPause={handlePlayPause}
          onRewind={handleRewind}
          playbackRate={playbackRate}
          onSpeedChange={handleSpeedChange}
        />
      </main>

      {/* Модальное окно настроек */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <Settings
              voices={voices}
              onSettingsChange={handleSettingsChange}
              onClose={() => setIsSettingsOpen(false)}
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
