import React, { useState, useEffect, useCallback, useRef } from 'react'
import Settings from './components/Settings'
import Player from './components/Player'
import { fetchVoices, generateSpeechStreaming } from './api/mistral'
import { splitIntoChunks } from './utils/chunking'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [trigger, setTrigger] = useState(0);
  const [sharedText, setSharedText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
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
    
    if (!apiKey || !voiceId) {
      setStatus(!apiKey ? 'Missing API Key' : 'Please select a voice in Settings');
      setIsPlaying(false);
      return;
    }

    if (currentChunkIndexRef.current >= chunksRef.current.length) {
      setIsPlaying(false);
      setStatus('Finished reading');
      return;
    }

    try {
      setStatus(`Reading part ${currentChunkIndexRef.current + 1} of ${chunksRef.current.length}...`);
      const text = chunksRef.current[currentChunkIndexRef.current];
      
      const audioBlob = await generateSpeechStreaming(apiKey, text, voiceId);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      
      // Применяем текущую скорость к новому аудио-чанку
      audioRef.current.playbackRate = playbackRate;
      
      await audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentChunkIndexRef.current++;
        playNextChunk();
      };
    } catch (error) {
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

  const handleSpeedChange = () => {
    setPlaybackRate(prevRate => {
      // Логика цикла: 1 -> 1.25 -> 1.5 -> 1
      const nextRate = prevRate === 1 ? 1.25 : prevRate === 1.25 ? 1.5 : 1;
      
      // Если аудио сейчас загружено, применяем скорость на лету
      if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
      }
      
      return nextRate;
    });
  };

  const handleSettingsChange = () => {
    setTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Топ-бар со статусом и кнопкой настроек */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="text-sm font-medium text-slate-300">
          <span className={status.includes('Error') || status.includes('error') ? 'text-red-400' : 'text-blue-400'}>
            {status}
          </span>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <main className="w-full max-w-sm px-6">
        <Player 
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onRewind={handleRewind}
          playbackRate={playbackRate}
          onSpeedChange={handleSpeedChange}
        />
      </main>

      {/* Модальное окно настроек */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <Settings 
              voices={voices} 
              onSettingsChange={handleSettingsChange} 
              onClose={() => setIsSettingsOpen(false)} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App