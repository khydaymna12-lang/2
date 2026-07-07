import React, { useEffect, useState } from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording }) => {
  const [bars, setBars] = useState<number[]>(Array(18).fill(4));

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setBars(
          Array(18)
            .fill(0)
            .map(() => Math.floor(Math.random() * 24) + 6)
        );
      }, 100);
    } else {
      setBars(Array(18).fill(4));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  return (
    <div className="flex items-center justify-center gap-1 h-12 py-2">
      {bars.map((height, idx) => (
        <div
          key={idx}
          className={`w-1 rounded-full transition-all duration-150 ${
            isRecording ? 'bg-rose-500 shadow-sm shadow-rose-200' : 'bg-slate-300'
          }`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
};
export default AudioWaveform;
