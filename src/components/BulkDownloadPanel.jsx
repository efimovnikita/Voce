import React, { useState, useEffect, useRef } from 'react';
import { downloadArticle } from '../utils/download';

const BulkDownloadPanel = ({ playlist, isSimplifyMode, apiKey, voiceId, languageLevel, onClose, onUpdatePlaylist }) => {
  const [progressMap, setProgressMap] = useState({}); // { trackId: { progress, status, error } }
  const [isFinished, setIsFinished] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const runBulkDownload = async () => {
      for (const track of playlist) {
        // Проверяем, нужно ли скачивать
        const isReady = isSimplifyMode ? track.isOfflineSimplifiedReady : track.isOfflineReady;
        if (isReady) {
          setProgressMap(prev => ({
            ...prev,
            [track.id]: { progress: 100, status: 'Already downloaded', error: false }
          }));
          continue;
        }

        setCurrentId(track.id);
        setProgressMap(prev => ({
          ...prev,
          [track.id]: { progress: 0, status: 'Starting...', error: false }
        }));

        try {
          await downloadArticle({
            article: track,
            isSimplifyMode,
            apiKey,
            voiceId,
            languageLevel,
            onProgress: (status, progress) => {
              const isError = progress === -1;
              setProgressMap(prev => ({
                ...prev,
                [track.id]: { 
                  status, 
                  progress: isError ? (prev[track.id]?.progress || 0) : progress, 
                  error: isError 
                }
              }));
            },
            onUpdateTrack: (updatedTrack) => {
              onUpdatePlaylist(prev => {
                const idx = prev.findIndex(t => t.id === updatedTrack.id);
                if (idx !== -1) {
                  const newList = [...prev];
                  newList[idx] = updatedTrack;
                  return newList;
                }
                return prev;
              });
            }
          });
        } catch (error) {
          console.error(`Error downloading track ${track.id}:`, error);
          // Ошибка уже обработана в onProgress, просто продолжаем к следующей статье
        }
      }
      setCurrentId(null);
      setIsFinished(true);
    };

    runBulkDownload();
  }, [playlist, isSimplifyMode, apiKey, voiceId, languageLevel, onUpdatePlaylist]);

  return (
    <div className="flex flex-col bg-slate-50 h-full max-h-[80vh] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Bulk Download</h2>
          <p className="text-xs text-slate-500">
            {isSimplifyMode ? 'Simplified' : 'Original'} Mode
          </p>
        </div>
        <button 
          onClick={onClose}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
            isFinished ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          {isFinished ? 'Done' : 'Cancel'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {playlist.map((track) => {
          const state = progressMap[track.id] || { progress: 0, status: 'Waiting...', error: false };
          const isDownloading = currentId === track.id;
          
          return (
            <div 
              key={track.id} 
              className={`p-3 rounded-xl border transition-all ${
                isDownloading ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2 gap-3">
                <h3 className={`text-sm font-bold truncate flex-1 ${state.error ? 'text-red-600' : 'text-slate-800'}`}>
                  {track.title}
                </h3>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  state.error ? 'bg-red-50 text-red-600' : 
                  state.progress === 100 ? 'bg-emerald-50 text-emerald-600' :
                  isDownloading ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                }`}>
                  {state.error ? 'ERROR' : `${state.progress}%`}
                </span>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    state.error ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              
              <p className={`text-[10px] truncate ${state.error ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                {state.status}
              </p>
            </div>
          );
        })}
      </div>

      {!isFinished && (
        <div className="p-4 bg-blue-50 border-t border-blue-100 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-xs font-medium text-blue-700 ml-2">Downloading in progress...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDownloadPanel;
