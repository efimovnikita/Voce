import React, { useState } from 'react';

const Settings = ({ voices, onSettingsChange, onClose, onClearHistory, onBulkDownload, languageLevel, onLanguageLevelChange }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('mistral_api_key') || '');
  const [proxyUrl, setProxyUrl] = useState(localStorage.getItem('cors_proxy_url') || '');
  const [youtubeApiKey, setYoutubeApiKey] = useState(localStorage.getItem('youtube_transcript_api_key') || '');
  const [voiceId, setVoiceId] = useState(localStorage.getItem('mistral_voice_id') || '');
  const [currentLanguageLevel, setCurrentLanguageLevel] = useState(languageLevel || 'A2');
  const [autoplay, setAutoplay] = useState(localStorage.getItem('mistral_autoplay') === 'true');

  const handleApiKeyChange = (e) => {
    const value = e.target.value;
    setApiKey(value);
    localStorage.setItem('mistral_api_key', value);
    if (onSettingsChange) onSettingsChange();
  };

  const handleProxyUrlChange = (e) => {
    const value = e.target.value;
    setProxyUrl(value);
    localStorage.setItem('cors_proxy_url', value);
    if (onSettingsChange) onSettingsChange();
  };

  const handleYoutubeApiKeyChange = (e) => {
    const value = e.target.value;
    setYoutubeApiKey(value);
    localStorage.setItem('youtube_transcript_api_key', value);
    if (onSettingsChange) onSettingsChange();
  };

  const handleVoiceChange = (e) => {
    const value = e.target.value;
    setVoiceId(value);
    localStorage.setItem('mistral_voice_id', value);
    if (onSettingsChange) onSettingsChange();
  };

  const handleLanguageLevelChange = (e) => {
    const value = e.target.value;
    setCurrentLanguageLevel(value);
    localStorage.setItem('mistral_language_level', value);
    if (onLanguageLevelChange) onLanguageLevelChange(value);
    if (onSettingsChange) onSettingsChange();
  };

  const handleAutoplayChange = (e) => {
    const value = e.target.checked;
    setAutoplay(value);
    localStorage.setItem('mistral_autoplay', value);
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
          <label htmlFor="proxy-url" className="text-sm font-medium text-slate-700">
            CORS Proxy URL (Serverless Function)
          </label>
          <input
            id="proxy-url"
            type="text"
            value={proxyUrl}
            onChange={handleProxyUrlChange}
            placeholder="https://your-function-url.a.run.app"
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex flex-col space-y-1.5">
          <label htmlFor="youtube-api-key" className="text-sm font-medium text-slate-700">
            YouTube Transcript API Key
          </label>
          <input
            id="youtube-api-key"
            type="password"
            value={youtubeApiKey}
            onChange={handleYoutubeApiKeyChange}
            placeholder="Enter YouTube Transcript API key"
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

        <div className="flex flex-col space-y-1.5">
          <label htmlFor="language-level" className="text-sm font-medium text-slate-700">
            Language Level for Simplification
          </label>
          <select
            id="language-level"
            value={currentLanguageLevel}
            onChange={handleLanguageLevelChange}
            className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          >
            <option value="A2">A2 (Basic)</option>
            <option value="B1">B1 (Intermediate)</option>
          </select>
        </div>

        {/* --- Autoplay Toggle --- */}
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">Autoplay</span>
            <span className="text-xs text-slate-500">Play next track automatically</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoplay}
              onChange={handleAutoplayChange}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* --- Новая кнопка массовой загрузки --- */}
        <div className="pt-2 border-t border-slate-200">
          <button
            onClick={() => {
              if (onBulkDownload) onBulkDownload();
              onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-lg font-medium transition-colors focus:outline-none mb-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download All Articles</span>
          </button>
        </div>

        {/* --- Кнопка очистки кэша --- */}
        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              if (onClearHistory) onClearHistory();
              onClose(); 
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