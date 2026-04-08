import React, { useState, useEffect, useCallback, useRef } from 'react'
import Settings from './components/Settings'
import Player from './components/Player'
import { fetchVoices, generateSpeech } from './api/mistral'
import { splitIntoChunks } from './utils/chunking'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [trigger, setTrigger] = useState(0);
  const [sharedText, setSharedText] = useState('');
  
  const audioRef = useRef(new Audio());
  const chunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);

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

  // Handle incoming shared text from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('text') || params.get('title') || params.get('url');
    if (text) {
      setSharedText(text);
      // If we have text, we might want to start playing automatically if API key exists
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices, trigger]);

  const playNextChunk = async () => {
    const apiKey = localStorage.getItem('mistral_api_key');
    const voiceId = localStorage.getItem('mistral_voice_id');
    
    if (!apiKey || !voiceId || currentChunkIndexRef.current >= chunksRef.current.length) {
      setIsPlaying(false);
      setProgress(100);
      return;
    }

    try {
      setStatus(`Generating audio for part ${currentChunkIndexRef.current + 1}...`);
      const text = chunksRef.current[currentChunkIndexRef.current];
      const audioBlob = await generateSpeech(apiKey, text, voiceId);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      
      const totalChunks = chunksRef.current.length;
      setProgress(((currentChunkIndexRef.current) / totalChunks) * 100);
      
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentChunkIndexRef.current++;
        playNextChunk();
      };
    } catch (error) {
      console.error('Playback error:', error);
      setStatus(`Playback error: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src && !audioRef.current.ended) {
        audioRef.current.play();
        setIsPlaying(true);
      } else if (sharedText) {
        // Start from beginning or resume
        chunksRef.current = splitIntoChunks(sharedText);
        currentChunkIndexRef.current = 0;
        playNextChunk();
      }
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
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
            text={sharedText || "No text shared yet."}
          />
        </section>

        <section>
          <Settings voices={voices} onSettingsChange={handleSettingsChange} />
        </section>
      </main>

      <footer className="text-sm text-gray-500">
        Mistral Speaker PWA
      </footer>
    </div>
  )
}

export default App
