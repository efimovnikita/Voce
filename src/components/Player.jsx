import React from 'react';

// Добавили isLoading в пропсы
const Player = ({ isPlaying, isLoading, onPlayPause, onRewind, playbackRate, onSpeedChange }) => {
  return (
    <div className="flex flex-col items-center w-full space-y-12">
      
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
        {[...Array(16)].map((_, i) => {
          const duration = 0.8 + Math.random() * 0.5;
          const delay = Math.random() * -2;
          
          return (
            <div 
              key={i}
              className={`w-2 rounded-full transition-all duration-500 ${(!isPlaying || isLoading) ? 'bg-slate-800 h-2 opacity-50' : 'bg-blue-500 opacity-100'}`}
              style={{ 
                // Анимация работает только если играет и НЕ загружается
                animation: (isPlaying && !isLoading) ? `smoothEq ${duration}s ease-in-out ${delay}s infinite alternate` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Кнопки управления */}
      <div className="flex items-center justify-center space-x-10 mt-4">
        
        <button
          onClick={onRewind}
          disabled={isLoading} // Блокируем при загрузке
          aria-label="Rewind 10 seconds"
          className={`flex items-center justify-center w-14 h-14 transition-colors focus:outline-none ${isLoading ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {/* ... SVG перемотки ... */}
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
        </button>

        {/* Центральная кнопка Play/Pause/Loading */}
        <button
          onClick={onPlayPause}
          disabled={isLoading} // Запрещаем нажимать во время запроса
          aria-label={isLoading ? 'Loading' : (isPlaying ? 'Pause' : 'Play')}
          className={`
            relative flex items-center justify-center w-20 h-20 rounded-full focus:outline-none transition-all duration-500
            ${isLoading 
              ? 'bg-slate-800 border border-slate-700 cursor-wait' 
              : isPlaying 
                ? 'bg-slate-800 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                : 'bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105'
            }
          `}
        >
          {isLoading ? (
            // Иконка загрузки (Спиннер)
            <svg className="animate-spin w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isPlaying ? (
            // Иконка Паузы
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          ) : (
            // Иконка Play
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={onSpeedChange}
          disabled={isLoading}
          aria-label="Change playback speed"
          className={`flex items-center justify-center w-14 h-14 transition-colors focus:outline-none font-bold text-lg select-none ${isLoading ? 'text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {playbackRate}x
        </button>
        
      </div>
    </div>
  );
};

export default Player;