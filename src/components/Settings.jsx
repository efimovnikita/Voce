import React, { useState, useEffect } from 'react';

const Settings = ({ voices, onSettingsChange }) => {
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white border-b border-gray-600 pb-2">Settings</h2>
      
      <div className="flex flex-col space-y-2">
        <label htmlFor="api-key" className="text-sm font-medium text-gray-300">
          Mistral API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your Mistral API key"
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="voice-select" className="text-sm font-medium text-gray-300">
          Select Voice
        </label>
        <select
          id="voice-select"
          value={voiceId}
          onChange={handleVoiceChange}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  );
};

export default Settings;
