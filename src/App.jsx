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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('text') || params.get('title') || params.get('url');
    if (text) {
      setSharedText(decodeURIComponent(text));
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices, trigger]);

  const playNextChunk = async () => {
    const apiKey = localStorage.getItem('mistral_api_key');
    const voiceId = localStorage.getItem('mistral_voice_id');
    
    if (!apiKey) {
      setStatus('Missing API Key');
      setIsPlaying(false);
      return;
    }

    if (!voiceId) {
      setStatus('Please select a voice in Settings');
      setIsPlaying(false);
      return;
    }

    if (currentChunkIndexRef.current >= chunksRef.current.length) {
      setIsPlaying(false);
      setProgress(100);
      setStatus('Finished reading');
      return;
    }

    try {
      setStatus(`Generating audio for part ${currentChunkIndexRef.current + 1} of ${chunksRef.current.length}...`);
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
      if (audioRef.current.src && !audioRef.current.ended && audioRef.current.readyState > 0) {
        audioRef.current.play();
        setIsPlaying(true);
      } else if (sharedText) {
        chunksRef.current = splitIntoChunks(sharedText);
        currentChunkIndexRef.current = 0;
        playNextChunk();
      } else {
        setStatus('No text to play. Share something to this app!');
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

  const handleReset = () => {
    audioRef.current.pause();
    audioRef.current.src = "";
    setIsPlaying(false);
    setProgress(0);
    setSharedText("");
    setStatus("Ready");
    window.history.replaceState({}, document.title, "/");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mistral Speaker</h1>
          <p className="text-slate-500 text-sm font-medium">
            Status: <span className={status.startsWith('Error') ? 'text-red-500' : 'text-blue-600'}>{status}</span>
          </p>
        </div>
        {sharedText && (
          <button 
            onClick={handleReset}
            className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        )}
      </header>

      <main className="w-full max-w-lg space-y-8">
        <section>
          <Player 
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onRewind={handleRewind}
            progress={progress}
            text={sharedText}
          />
        </section>

        {!sharedText && (
          <section className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-800 space-y-3">
            <h3 className="font-bold flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to use
            </h3>
            <ol className="text-sm space-y-2 list-decimal list-inside opacity-90">
              <li>Enter your **Mistral API Key** below.</li>
              <li>Select a **voice** from the list.</li>
              <li>Open any text or article in your browser.</li>
              <li>Use the system **"Share"** menu and select **Voce**.</li>
              <li>Relax and listen!</li>
            </ol>
          </section>
        )}

        <section>
          <Settings voices={voices} onSettingsChange={handleSettingsChange} />
        </section>
      </main>

      <footer className="mt-auto pt-12 pb-4 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
        Powered by Mistral AI • PWA Enabled
      </footer>
    </div>
  )
}

export default App
