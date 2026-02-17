
import React, { useMemo } from 'react';
import { JonConfig } from '../types';

interface AiAvatarProps {
  isSpeaking: boolean;
  config: JonConfig;
  size?: 'sm' | 'md' | 'lg';
}

const AiAvatar: React.FC<AiAvatarProps> = ({ isSpeaking, config, size = 'md' }) => {
  const emotionClass = useMemo(() => {
    if (config.coolnessFactor > 80) return 'expr-cool';
    if (config.emotionalIntensity > 80) return 'expr-excited';
    if (config.emotionalIntensity > 50) return 'expr-emotional';
    return '';
  }, [config.coolnessFactor, config.emotionalIntensity]);

  const sizeClass = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';

  return (
    <div className={`relative ${sizeClass} rounded-lg flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'speaking-orb scale-110 shadow-indigo-500/50' : 'bg-[#6366f1] shadow-lg'} ${emotionClass}`}>
      <div className="flex space-x-1.5 items-center">
        <div className={`eye ${!isSpeaking ? 'eye-blink' : 'eye-talking'}`}></div>
        <div className={`eye ${!isSpeaking ? 'eye-blink' : 'eye-talking'}`}></div>
      </div>
      {isSpeaking && (
        <div className="absolute -bottom-1 w-1/2 h-1 bg-white/40 rounded-full blur-[2px] animate-pulse"></div>
      )}
    </div>
  );
};

export default AiAvatar;
