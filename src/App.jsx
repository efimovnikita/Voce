import React, { useState } from 'react'
import Settings from './components/Settings'
import Player from './components/Player'

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  const mockVoices = [
    { id: 'mistral-onyx', name: 'Onyx' },
    { id: 'mistral-viking', name: 'Viking' },
  ];

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRewind = () => {
    console.log('Rewind clicked');
    setProgress(Math.max(0, progress - 10));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-blue-600">Mistral Speaker</h1>
        <p className="text-gray-600 mt-2">Core UI Components Preview</p>
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
          <Settings voices={mockVoices} />
        </section>
      </main>

      <footer className="text-sm text-gray-500">
        Phase 2 Verification View
      </footer>
    </div>
  )
}

export default App
