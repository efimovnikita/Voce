import React, { useEffect, useRef, useState } from 'react';

function Player({ audioUrl, textFragment }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Функции управления PWA-плеером
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  // Интеграция с нативным Media Session API
  useEffect(() => {
    if ('mediaSession' in navigator) {
      // 1. Метаданные для экрана блокировки (без ползунка времени)
      navigator.mediaSession.metadata = new MediaMetadata({
        // Берем первые 40 символов текущего текста для заголовка
        title: textFragment ? `${textFragment.substring(0, 40)}...` : 'Mistral Speaker',
        artist: 'Чтение текста',
        album: 'Сгенерировано ИИ',
        artwork: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      // 2. Обработчики для системных кнопок ОС
      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current.pause();
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(audioRef.current.currentTime - skipTime, 0);
        }
      });
    }

    // Очистка при размонтировании
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
      }
    };
  }, [textFragment]); // Обновляем метаданные при переходе к следующему чанку

  // Синхронизация состояний (если плеер остановлен сторонним событием или системной кнопкой)
  const handlePlay = () => {
    setIsPlaying(true);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  };

  const handlePause = () => {
    setIsPlaying(false);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  };

  return (
    <div className="player-wrapper">
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={() => setIsPlaying(false)} // Здесь позже можно добавить логику переключения чанков
        autoPlay 
      />
      
      {/* UI Элементы управления (стилизуются по вашему гайдлайну) */}
      <div className="controls flex gap-4 justify-center items-center mt-4">
        <button 
          onClick={skipBackward} 
          className="px-4 py-2 bg-gray-200 rounded-lg text-gray-800 font-medium"
          aria-label="Назад на 10 секунд"
        >
          -10s
        </button>
        <button 
          onClick={togglePlay} 
          className="px-6 py-3 bg-blue-600 rounded-lg text-white font-bold"
          aria-label={isPlaying ? 'Пауза' : 'Воспроизведение'}
        >
          {isPlaying ? 'Пауза' : 'Play'}
        </button>
      </div>
    </div>
  );
}

export default Player;