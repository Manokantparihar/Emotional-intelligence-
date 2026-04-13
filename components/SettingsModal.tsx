
import React from 'react';
import { JonConfig } from '../types';

const getBotName = (config: JonConfig) => {
  if (config.language === 'Hindi') {
    return config.voiceGender === 'male' ? 'Jon' : 'Jaya';
  }
  return config.voiceGender === 'male' ? 'Jon' : 'Joni';
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: JonConfig;
  onChange: (config: JonConfig) => void;
}

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese', 'Italian', 'Portuguese'
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onChange }) => {
  if (!isOpen) return null;

  const botName = getBotName(config);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            {botName}'s Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Emotional Intensity Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                Emotional Intensity
              </label>
              <span className="text-lg font-bold text-indigo-400">{config.emotionalIntensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.emotionalIntensity}
              onChange={(e) => onChange({ ...config, emotionalIntensity: parseInt(e.target.value) })}
              className="w-full h-2 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>STOIC</span>
              <span>PASSIONATE</span>
            </div>
          </div>

          {/* Coolness Factor Slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                Coolness Factor
              </label>
              <span className="text-lg font-bold text-emerald-400">{config.coolnessFactor}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.coolnessFactor}
              onChange={(e) => onChange({ ...config, coolnessFactor: parseInt(e.target.value) })}
              className="w-full h-2 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>CHILL</span>
              <span>RADICAL</span>
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              Native Language
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => onChange({ ...config, language: lang })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    config.language === lang
                      ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {lang === 'Hindi' ? 'हिन्दी (Hindi)' : lang}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Gender Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
              Persona Identity
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onChange({ ...config, voiceGender: 'male' })}
                className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all space-y-2 ${
                  config.voiceGender === 'male'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-inner'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <div className="text-center">
                  <div className="text-sm font-bold">Jon</div>
                  <div className="text-[10px] opacity-60">Male Persona</div>
                </div>
              </button>
              <button
                onClick={() => onChange({ ...config, voiceGender: 'female' })}
                className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all space-y-2 ${
                  config.voiceGender === 'female'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-inner'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <div className="text-center">
                  <div className="text-sm font-bold">{config.language === 'Hindi' ? 'Jaya' : 'Joni'}</div>
                  <div className="text-[10px] opacity-60">Female Persona</div>
                </div>
              </button>
            </div>
          </div>

          {/* Speech Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-200 uppercase tracking-widest">
                Voice Output
              </label>
              <p className="text-[10px] text-slate-400">Hear {botName} speak the responses</p>
            </div>
            <button
              onClick={() => onChange({ ...config, isSpeechEnabled: !config.isSpeechEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${config.isSpeechEnabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.isSpeechEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          {/* Volume Control */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-emerald-300 uppercase tracking-widest">
                Volume
              </label>
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.414-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                <span className="text-lg font-bold text-white">{config.volume}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.volume}
              onChange={(e) => onChange({ ...config, volume: parseInt(e.target.value) })}
              className="w-full h-2 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl font-bold text-white shadow-lg hover:from-indigo-400 hover:to-purple-400 transition-all active:scale-95"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;
