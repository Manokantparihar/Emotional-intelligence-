
import React from 'react';
import { JonConfig } from '../types';
import AiAvatar from './AiAvatar';

interface HeaderProps {
  onOpenSettings: () => void;
  onStartLive: () => void;
  botName: string;
  isSpeaking: boolean;
  config: JonConfig;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings, botName, isSpeaking, config }) => {
  return (
    <header className="sticky top-0 z-20 w-full h-14 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-md px-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
         <AiAvatar isSpeaking={isSpeaking} config={config} size="sm" />
         <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-200">{botName}</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold">PRO</span>
         </div>
      </div>
      
      <div className="flex items-center space-x-2">
         <button onClick={onOpenSettings} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
         </button>
      </div>
    </header>
  );
};

export default Header;
