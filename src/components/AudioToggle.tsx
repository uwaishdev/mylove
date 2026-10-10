import React, { useState } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { soundService } from '../services/soundService';

export const AudioToggle: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    const newState = soundService.toggleMusic();
    setIsPlaying(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 backdrop-blur-md border ${
        isPlaying
          ? 'bg-[#ff007f]/20 border-[#ff007f] text-[#ff007f] shadow-[0_0_15px_rgba(255,0,127,0.4)]'
          : 'bg-[#161023]/70 border-[#ff007f]/30 text-pink-200/70 hover:text-pink-100 hover:border-[#ff007f]/60'
      }`}
      title={isPlaying ? 'Mute romantic ambient music' : 'Play romantic ambient music'}
      aria-label="Toggle romantic music"
    >
      {isPlaying ? (
        <>
          <span className="flex items-center gap-0.5">
            <span className="w-1 h-3 bg-[#ff007f] rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-[#ff007f] rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-2 bg-[#ff007f] rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </span>
          <Volume2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Music On</span>
        </>
      ) : (
        <>
          <Music className="w-3.5 h-3.5 text-[#ff007f]" />
          <VolumeX className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Play Melody</span>
        </>
      )}
    </button>
  );
};
