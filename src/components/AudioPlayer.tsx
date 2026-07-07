import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  onPlayCountExceeded?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, onPlayCountExceeded }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setPlayCount(0);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (playCount >= 2) {
        if (onPlayCountExceeded) onPlayCountExceeded();
        return;
      }
      audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 0;
    setCurrentTime(current);
    setDuration(dur);
    setProgress(dur > 0 ? (current / dur) * 100 : 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setPlayCount(prev => {
      const next = prev + 1;
      if (next >= 2 && onPlayCountExceeded) {
        onPlayCountExceeded();
      }
      return next;
    });
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300">
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded}
        preload="auto"
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePlay}
            disabled={playCount >= 2 && !isPlaying}
            className={`p-3.5 rounded-full flex items-center justify-center transition-all ${
              playCount >= 2 && !isPlaying
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isPlaying
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200'
                : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 text-white shadow-md shadow-blue-200'
            }`}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white translate-x-0.5" />}
          </button>
          
          <div>
            <span className="text-sm font-semibold text-slate-800">Listening Comprehension Audio</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Volume2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">
                Played {playCount}/2 times
              </span>
            </div>
          </div>
        </div>
        
        {playCount >= 2 && (
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Play Limit Reached</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 w-full">
        <span className="text-xs font-semibold text-slate-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden relative">
          <div 
            className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 font-mono w-10">{formatTime(duration)}</span>
      </div>
    </div>
  );
};
export default AudioPlayer;
