
import React from 'react';
import { Message, JonConfig } from '../types';
import AiAvatar from './AiAvatar';

interface ChatMessageProps {
  message: Message;
  botName: string;
  config: JonConfig;
  isAssistantSpeaking?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, botName, config, isAssistantSpeaking }) => {
  const isJon = message.role === 'model';
  
  return (
    <div className={`message-row w-full flex space-x-4 md:space-x-6 animate-in fade-in duration-300`}>
      <div className="flex-shrink-0 pt-1">
        {isJon ? (
          <AiAvatar isSpeaking={!!isAssistantSpeaking} config={config} size="sm" />
        ) : (
          <div className="w-8 h-8 rounded bg-emerald-700 shadow-lg flex items-center justify-center text-white text-xs font-bold">
            U
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="font-bold text-sm tracking-tight text-slate-100">
          {isJon ? botName : 'You'}
        </div>
        
        <div className="text-slate-200 text-base leading-relaxed selection:bg-indigo-500/30">
          {message.text}
        </div>

        {message.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/10 max-w-lg shadow-2xl group relative">
            <img src={message.imageUrl} alt="Generated creation" className="w-full h-auto" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-xs font-bold text-white uppercase tracking-widest">Open Full Resolution</span>
            </div>
          </div>
        )}

        {message.sources && (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.sources.map((s, i) => (
              <a 
                key={i} 
                href={s.uri} 
                target="_blank" 
                className="text-[10px] font-medium bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-white/10 transition-colors text-slate-400"
              >
                {s.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
