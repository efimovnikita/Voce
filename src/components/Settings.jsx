import React, { useState } from 'react';

// Добавлен пропс onClearHistory
const Settings = ({ voices, onSettingsChange, onClose, onClearHistory }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('mistral_api_key') || '');
  const [voiceId, setVoiceId] = useState(localStorage.getItem('mistral_voice_id') || '');

  const handleApiKeyChange = (e) => {
    const value = e.target.value;
    setApiKey(value);
    localStorage.setItem('mistral_api_key', value);
    if (onSettingsChange) onSettingsChange();
  };

  const handleVoiceChange = (e) => {
    const value = e.target.value;
    setVoiceId(value);
    localStorage.setItem('mistral_voice_id', value);
    if (onSettingsChange) onSettingsChange();
  };

  return (
    <div className="flex flex-col bg-slate-50">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-slate-800">Settings</h2>
        <button 
          onClick={onClose}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          Done
        </button>
      </div>
      
      <div className="p-6 space-y-5">
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="api-key" className="text-sm font-medium text-slate-700">
            Mistral API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Enter your Mistral API key"
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label htmlFor="voice-select" className="text-sm font-medium text-slate-700">
            Select Voice
          </label>
          <select
            id="voice-select"
            value={voiceId}
            onChange={handleVoiceChange}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            <option value="">Select a voice</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        {/* --- Новая кнопка очистки кэша --- */}
        <div className="pt-4 mt-2 border-t border-slate-200">
          <button
            onClick={() => {
              if (onClearHistory) onClearHistory();
              onClose(); // Закрываем окно настроек после нажатия
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg font-medium transition-colors focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Clear History & Cache</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;