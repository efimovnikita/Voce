import React from 'react';

const Player = ({ isPlaying, onPlayPause, onRewind, progress, text }) => {
  return (
    <div className="flex flex-col w-full p-6 space-y-6 bg-white rounded-xl shadow-lg">
      {/* Waveform Placeholder */}
      <div 
        data-testid="waveform"
        className="flex items-center justify-center w-full h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
      >
        <div className="flex items-end space-x-1 h-12">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className={`w-2 bg-blue-500 rounded-full animate-pulse`}
              style={{ 
                height: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Text Preview */}
      <div className="max-h-32 overflow-y-auto p-4 bg-gray-50 rounded-lg text-gray-700 text-sm leading-relaxed">
        {text || 'No text shared yet.'}
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress}>
        <div 
          className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-8">
        <button
          onClick={onRewind}
          aria-label="Rewind 10 seconds"
          className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
        </button>

        <button
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="p-6 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          {isPlaying ? (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default Player;
