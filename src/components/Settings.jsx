import React, { useState } from 'react';

const Settings = ({ voices, onSettingsChange, onClose }) => {
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
      </div>
    </div>
  );
};

export default Settings;