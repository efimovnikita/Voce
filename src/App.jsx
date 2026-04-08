import React, { useState, useEffect, useCallback } from 'react'
import Settings from './components/Settings'
import Player from './components/Player'
import { fetchVoices } from './api/mistral'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [trigger, setTrigger] = useState(0);

  const loadVoices = useCallback(async () => {
    const apiKey = localStorage.getItem('mistral_api_key');
    if (apiKey) {
      try {
        setStatus('Loading voices...');
        const fetchedVoices = await fetchVoices(apiKey);
        setVoices(fetchedVoices);
        setStatus('Ready');
      } catch (error) {
        console.error('Failed to fetch voices:', error);
        setStatus(`Error: ${error.message}`);
      }
    } else {
      setStatus('Please enter Mistral API Key in Settings');
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices, trigger]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRewind = () => {
    console.log('Rewind clicked');
  };

  const handleSettingsChange = () => {
    setTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-blue-600">Mistral Speaker</h1>
        <p className="text-gray-600 mt-2">Status: <span className="font-semibold text-blue-500">{status}</span></p>
      </header>

      <main className="w-full max-w-lg space-y-8">
        <section>
          <Player 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onRewind={handleRewind}
            progress={progress}
            text="Mistral Speaker — это легковесное Progressive Web App (PWA), предназначенное для озвучивания текста (Text-to-Speech) с использованием Mistral AI API."
          />
        </section>

        <section>
          <Settings voices={voices} onSettingsChange={handleSettingsChange} />
        </section>
      </main>

      <footer className="text-sm text-gray-500">
        Phase 3 Verification View
      </footer>
    </div>
  )
}

export default App
