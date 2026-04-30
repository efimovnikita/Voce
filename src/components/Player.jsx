import React, { useMemo } from 'react';

const Player = ({
  isPlaying,
  isLoading,
  onPlayPause,
  playbackRate,
  onSpeedChange,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onPreviousChunk,
  onNextChunk,
  hasPreviousChunk,
  hasNextChunk
}) => {

  // Запоминаем случайные значения один раз при загрузке компонента
  const eqBars = useMemo(() => {
    return [...Array(16)].map(() => ({
      duration: 0.8 + Math.random() * 0.5,
      delay: Math.random() * -2
    }));
  }, []);

  return (
    <div className="flex flex-col items-center w-full space-y-10">

      {/* Декоративная гистограмма */}
      <div className="flex items-center justify-center w-full h-24 space-x-1.5">
        <style>
          {`
            @keyframes smoothEq {
              0% { height: 15%; }
              50% { height: 100%; }
              100% { height: 15%; }
            }
          `}
        </style>
        {/* Используем наш сохраненный массив eqBars вместо [...Array(16)] */}
        {eqBars.map((bar, i) => (
          <div
            key={i}
            className={`w-2 rounded-full transition-all duration-500 ${(!isPlaying || isLoading) ? 'bg-slate-800 h-2 opacity-50' : 'bg-blue-500 opacity-100'}`}
            style={{
              animation: (isPlaying && !isLoading)
                ? `smoothEq ${bar.duration}s ease-in-out ${bar.delay}s infinite alternate`
                : 'none',
            }}
          />
        ))}
      </div>

      {/* Кнопки управления */}
      <div className="flex flex-col items-center w-full mt-4 space-y-6">
        
        {/* Основной ряд управления */}
        <div className="flex items-center justify-center space-x-3 sm:space-x-4 w-full">
          {/* Кнопка "Предыдущий трек" */}
          <button
            onClick={onPrevious}
            disabled={isLoading || !hasPrevious}
            aria-label="Previous track"
            className={`flex items-center justify-center w-10 h-10 transition-colors focus:outline-none ${(isLoading || !hasPrevious) ? 'text-slate-700 cursor-not-allowed opacity-50' : 'text-slate-400 hover:text-white'}`}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm12 12V6l-8.5 6 8.5 6z" />
            </svg>
          </button>

          {/* Кнопка "Предыдущая часть" */}
          <button
            onClick={onPreviousChunk}
            disabled={isLoading || !hasPreviousChunk}
            aria-label="Previous part"
            className={`flex items-center justify-center w-10 h-10 transition-colors focus:outline-none ${(isLoading || !hasPreviousChunk) ? 'text-slate-700 cursor-not-allowed opacity-50' : 'text-slate-400 hover:text-white'}`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>

          {/* Центральная кнопка Play/Pause/Loading */}
          <button
            onClick={onPlayPause}
            disabled={isLoading}
            aria-label={isLoading ? 'Loading' : (isPlaying ? 'Pause' : 'Play')}
            className={`
              relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full focus:outline-none transition-all duration-500 shrink-0
              ${isLoading
                ? 'bg-slate-800 border border-slate-700 cursor-wait'
                : isPlaying
                  ? 'bg-slate-800 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                  : 'bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105'
              }
            `}
          >
            {isLoading ? (
              <svg className="animate-spin w-10 h-10 sm:w-12 sm:h-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : isPlaying ? (
              <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM6.5 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Кнопка "Следующая часть" */}
          <button
            onClick={onNextChunk}
            disabled={isLoading || !hasNextChunk}
            aria-label="Next part"
            className={`flex items-center justify-center w-10 h-10 transition-colors focus:outline-none ${(isLoading || !hasNextChunk) ? 'text-slate-700 cursor-not-allowed opacity-50' : 'text-slate-400 hover:text-white'}`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </button>

          {/* Кнопка "Следующий трек" */}
          <button
            onClick={onNext}
            disabled={isLoading || !hasNext}
            aria-label="Next track"
            className={`flex items-center justify-center w-10 h-10 transition-colors focus:outline-none ${(isLoading || !hasNext) ? 'text-slate-700 cursor-not-allowed opacity-50' : 'text-slate-400 hover:text-white'}`}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Кнопка скорости (вынесена в отдельный ряд под кнопкой плей) */}
        <button
          onClick={onSpeedChange}
          disabled={isLoading}
          aria-label="Change playback speed"
          className={`flex items-center justify-center px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 transition-colors focus:outline-none font-bold text-xs sm:text-sm select-none ${isLoading ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
        >
          {playbackRate}x
        </button>

      </div>
    </div>
  );
};

export default Player;
