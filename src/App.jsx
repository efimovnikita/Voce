import React, { useState, useEffect, useCallback, useRef } from 'react'
import Settings from './components/Settings'
import Player from './components/Player'
import Modal from './components/Modal'
import { fetchVoices, generateSpeechStreaming } from './api/mistral'
import { splitIntoChunks } from './utils/chunking'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [trigger, setTrigger] = useState(0);
  const [sharedText, setSharedText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const audioRef = useRef(new Audio());
  const chunksRef = useRef([]);
  const currentChunkIndexRef = useRef(0);

  const loadVoices = useCallback(async () => {
    const apiKey = localStorage.getItem('mistral_api_key');
    if (apiKey) {
      try {
        setStatus('Loading voices...');
        console.log('Fetching voices...');
        const fetchedVoices = await fetchVoices(apiKey);
        console.log('Voices fetched:', fetchedVoices.length);
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
      const decoded = decodeURIComponent(text);
      console.log('Shared text received:', decoded.substring(0, 50) + '...');
      setSharedText(decoded);
    }
  }, []);

  useEffect(() => {
    loadVoices();
  }, [loadVoices, trigger]);

  const playNextChunk = async ().
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
      console.log('All chunks played.');
      setIsPlaying(false);
      setProgress(100);
      setStatus('Finished reading');
      return;
    }

    try {
      setStatus(`Generating audio for part ${currentChunkIndexRef.current + 1} of ${chunksRef.current.length}...`);
      const text = chunksRef.current[currentChunkIndexRef.current];
      console.log(`Requesting streaming speech for chunk ${currentChunkIndexRef.current + 1}...`);
      
      const audioBlob = await generateSpeechStreaming(apiKey, text, voiceId);
      console.log('Audio blob collected from stream:', audioBlob.size, 'bytes');
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current.src = audioUrl;
      
      console.log('Attempting to play audio...');
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        console.log('Playback started.');
      } catch (playError) {
        console.error('Audio play() failed:', playError);
        throw playError;
      }
      
      const totalChunks = chunksRef.current.length;
      setProgress(((currentChunkIndexRef.current) / totalChunks) * 100);
      
      audioRef.current.onended = () => {
        console.log(`Chunk ${currentChunkIndexRef.current + 1} ended.`);
        URL.revokeObjectURL(audioUrl);
        currentChunkIndexRef.current++;
        playNextChunk();
      };
    } catch (error) {
      console.error('Playback process error:', error);
      setStatus(`Playback error: ${error.message}`);
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    console.log('Play/Pause clicked. current isPlaying:', isPlaying);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src && !audioRef.current.ended && audioRef.current.readyState > 0) {
        audioRef.current.play().catch(e => console.error('Resume failed:', e));
        setIsPlaying(true);
      } else if (sharedText) {
        chunksRef.current = splitIntoChunks(sharedText);
        console.log(`Starting playback. Total chunks: ${chunksRef.current.length}`);
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
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-lg mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Voce</h1>
          <p className="text-gray-400 text-sm font-medium">
            Status: <span className={status.startsWith('Error') || status.includes('error') ? 'text-red-400' : 'text-blue-400'}>{status}</span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {sharedText && (
            <button 
              onClick={handleReset}
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
          <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </button>
        </div>
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
          <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-gray-300 space-y-3">
            <h3 className="font-bold flex items-center text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to use
            </h3>
            <ol className="text-sm space-y-2 list-decimal list-inside opacity-80">
              <li>Open **Settings** (gear icon) and enter your **Mistral API Key**.</li>
              <li>Select a **voice** from the list.</li>
              <li>Open any text or article in your browser.</li>
              <li>Use the system **"Share"** menu and select **Voce**.</li>
              <li>Relax and listen!</li>
            </ol>
          </section>
        )}
      </main>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <Settings voices={voices} onSettingsChange={() => {
          handleSettingsChange();
          setIsSettingsOpen(false);
        }} />
      </Modal>

      <footer className="mt-auto pt-12 pb-4 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
        Powered by Mistral AI • PWA Enabled
      </footer>
    </div>
  )
}

export default App
