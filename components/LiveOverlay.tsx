
import React from 'react';

interface LiveOverlayProps {
  isActive: boolean;
  onStop: () => void;
  botName: string;
  isModelSpeaking: boolean;
  isUserSpeaking: boolean;
  transcript: string;
  config: { voiceGender: 'male' | 'female' };
}

const LiveOverlay: React.FC<LiveOverlayProps> = ({ 
  isActive, 
  onStop, 
  botName, 
  isModelSpeaking, 
  isUserSpeaking, 
  transcript,
  config
}) => {
  if (!isActive) return null;

  // Dynamic colors based on persona and state
  const getBlobGradient = () => {
    if (isUserSpeaking) return 'from-emerald-400 via-teal-500 to-cyan-600';
    if (config.voiceGender === 'male') return 'from-indigo-400 via-purple-500 to-blue-600';
    return 'from-pink-400 via-purple-500 to-indigo-500';
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between bg-[#020617] py-16 animate-in fade-in duration-700">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[160px] opacity-20 transition-all duration-1000 ${
          isModelSpeaking ? 'bg-indigo-500 scale-150' : isUserSpeaking ? 'bg-emerald-500 scale-125' : 'bg-slate-800 scale-100'
        }`}></div>
      </div>

      {/* Header Info */}
      <div className="relative z-10 text-center space-y-2">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em] animate-pulse">
          {isModelSpeaking ? botName : isUserSpeaking ? 'Listening' : 'Connected'}
        </h2>
        <div className="h-1 w-12 bg-slate-800 mx-auto rounded-full overflow-hidden">
          {(isModelSpeaking || isUserSpeaking) && (
            <div className={`h-full bg-gradient-to-r ${getBlobGradient()} animate-[shimmer_2s_infinite]`}></div>
          )}
        </div>
      </div>

      {/* Main Reactive Blob Container */}
      <div className="relative flex items-center justify-center w-full max-w-md aspect-square">
        {/* Outer Ring */}
        <div className={`absolute inset-0 rounded-full border border-white/5 transition-all duration-700 ${
          (isModelSpeaking || isUserSpeaking) ? 'scale-110 opacity-20' : 'scale-90 opacity-0'
        }`}></div>

        {/* The Fluid Blob Layers */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
          {/* Layer 3 - Subtle expansion */}
          <div className={`absolute inset-0 bg-gradient-to-tr ${getBlobGradient()} opacity-10 blur-2xl animate-morph transition-transform duration-700 ${
            isModelSpeaking ? 'scale-150' : isUserSpeaking ? 'scale-125' : 'scale-100'
          }`}></div>
          
          {/* Layer 2 - The morphing shell */}
          <div className={`absolute inset-0 bg-gradient-to-br ${getBlobGradient()} opacity-30 animate-morph transition-all duration-700 ${
            isModelSpeaking ? 'scale-110 animate-morph-fast' : isUserSpeaking ? 'scale-105' : 'scale-95'
          }`}></div>

          {/* Layer 1 - The core */}
          <div className={`relative w-full h-full bg-gradient-to-tr ${getBlobGradient()} shadow-[0_0_80px_rgba(99,102,241,0.3)] flex items-center justify-center animate-morph transition-all duration-500 overflow-hidden border border-white/20 ${
            isModelSpeaking ? 'scale-105 rotate-12' : isUserSpeaking ? 'scale-100 -rotate-12' : 'scale-90 opacity-80'
          }`}>
             {/* Subtle reflection on the core */}
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
             
             {/* Bot Initial (optional, kept very subtle) */}
             <span className="text-white/20 text-4xl font-black select-none">{botName.charAt(0)}</span>
          </div>
        </div>
      </div>

      {/* Transcription area */}
      <div className="relative z-10 w-full max-w-xl px-8 text-center min-h-[80px]">
        <p className={`text-slate-200 text-xl sm:text-2xl font-medium leading-tight transition-all duration-500 ${
          transcript ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'
        }`}>
          {transcript || (isUserSpeaking ? "Go ahead..." : `Ready to talk?`)}
        </p>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center space-x-12">
        {/* End Call Button */}
        <button 
          onClick={onStop}
          className="group flex flex-col items-center space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-500 hover:border-red-400 transition-all duration-500 shadow-2xl hover:shadow-red-500/20 active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
               <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] group-hover:text-red-400 transition-colors tracking-widest">End Call</span>
        </button>
      </div>

      {/* Audio visualization visual candy (bottom bars) */}
      <div className="absolute bottom-0 left-0 w-full h-1 flex items-end">
        {(isModelSpeaking || isUserSpeaking) && Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 bg-gradient-to-t ${getBlobGradient()} transition-all duration-300`} 
            style={{ 
              height: `${Math.random() * (isModelSpeaking ? 100 : 40)}%`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LiveOverlay;
