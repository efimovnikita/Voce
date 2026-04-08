import React from 'react';

const Player = ({ isPlaying, onPlayPause, onRewind, progress }) => {
  return (
    <div className="flex flex-col items-center w-full space-y-12">
      
      {/* Декоративная гистограмма с плавной анимацией */}
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
          // Генерируем случайную задержку и продолжительность для каждого столбика
          const duration = 0.8 + Math.random() * 0.5;
          const delay = Math.random() * -2;
          
          return (
            <div 
              key={i}
              className={`w-2 rounded-full bg-blue-500 transition-all duration-500 ${!isPlaying ? 'h-2 opacity-50' : 'opacity-100'}`}
              style={{ 
                animation: isPlaying ? `smoothEq ${duration}s ease-in-out ${delay}s infinite alternate` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Прогресс-бар текущей позиции */}
      <div className="w-full">
        <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Кнопки управления (Play/Rewind) */}
      <div className="flex items-center justify-center space-x-10">
        <button
          onClick={onRewind}
          aria-label="Rewind 10 seconds"
          className="p-3 text-slate-400 hover:text-white transition-colors focus:outline-none"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="p-5 bg-blue-600 text-white rounded-full hover:bg-blue-500 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-all focus:outline-none"
        >
          {isPlaying ? (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
    </div>
  );
};

export default Player;