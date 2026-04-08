import React, { useState, useEffect } from 'react';

const Settings = ({ voices }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('mistral_api_key') || '');
  const [voiceId, setVoiceId] = useState(localStorage.getItem('mistral_voice_id') || '');

  const handleApiKeyChange = (e) => {
    const value = e.target.value;
    setApiKey(value);
    localStorage.setItem('mistral_api_key', value);
  };

  const handleVoiceChange = (e) => {
    const value = e.target.value;
    setVoiceId(value);
    localStorage.setItem('mistral_voice_id', value);
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800">Settings</h2>
      
      <div className="flex flex-col space-y-1">
        <label htmlFor="api-key" className="text-sm font-medium text-gray-700">
          Mistral API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your Mistral API key"
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-col space-y-1">
        <label htmlFor="voice-select" className="text-sm font-medium text-gray-700">
          Select Voice
        </label>
        <select
          id="voice-select"
          value={voiceId}
          onChange={handleVoiceChange}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
