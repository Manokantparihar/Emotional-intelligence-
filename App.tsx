
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Message, ChatState, JonConfig } from './types';
import { getJonResponse, getJonSpeech, getBotName, generateInChatImage, generateSystemInstruction, getLiveVoiceName, hangupToolDeclaration } from './services/geminiService';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import SettingsModal from './components/SettingsModal';
import LiveOverlay from './components/LiveOverlay';

const STORAGE_KEY = 'jon_ai_persona_v2';

// --- Audio Encoding & Decoding Helpers ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createPCM16Blob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const App: React.FC = () => {
  const [state, setState] = useState<ChatState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          messages: parsed.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
          isTyping: false,
          isSettingsOpen: false,
          isLiveMode: false
        };
      } catch (e) { console.error(e); }
    }
    return {
      messages: [],
      isTyping: false,
      error: null,
      config: {
        emotionalIntensity: 90,
        coolnessFactor: 95,
        isSpeechEnabled: true,
        language: 'English',
        voiceGender: 'male',
        volume: 85
      },
      isSettingsOpen: false,
      isLiveMode: false
    };
  });

  const [input, setInput] = useState('');
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const liveNextStartTimeRef = useRef(0);
  const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ user: '', bot: '' });

  const currentBotName = useMemo(() => getBotName(state.config), [state.config]);
  const isJonCurrentlySpeaking = useMemo(() => isModelSpeaking || state.messages.some(m => m.isSpeaking), [isModelSpeaking, state.messages]);

  const handleGeminiError = useCallback((error: any) => {
    console.error("Gemini Error:", error);
    const message = error?.message?.toLowerCase() || "";
    if (message.includes("429") || message.includes("quota")) {
      return `${currentBotName} says: "Whoa, chill! 🧊 I'm feeling a bit overloaded. Let's wait a minute!"`;
    }
    if (message.includes("401") || message.includes("403")) {
      return `Access Denied! 🛡️ Check your API settings!`;
    }
    if (message.includes("safety") || message.includes("blocked")) {
      return `${currentBotName} is feeling sensitive! 💖 That topic hit an emotional barrier.`;
    }
    return `${currentBotName} hit a snag in the matrix! 🤖`;
  }, [currentBotName]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.messages, state.isTyping]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      config: state.config,
      messages: state.messages.slice(-30)
    }));
  }, [state.config, state.messages]);

  const stopLiveMode = useCallback(() => {
    if (audioContextInRef.current) {
      audioContextInRef.current.close();
      audioContextInRef.current = null;
    }
    liveSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    liveSourcesRef.current.clear();
    liveNextStartTimeRef.current = 0;
    
    // We don't necessarily close the output context to avoid crackling on reuse,
    // but we reset the session promise.
    liveSessionPromiseRef.current = null;
    
    setState(prev => ({ ...prev, isLiveMode: false }));
    setIsModelSpeaking(false);
    setIsUserSpeaking(false);
    setLiveTranscript('');
  }, []);

  const startLiveMode = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Setup Output Audio
      if (!audioContextOutRef.current) {
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        gainNodeRef.current = audioContextOutRef.current.createGain();
        gainNodeRef.current.connect(audioContextOutRef.current.destination);
      }
      gainNodeRef.current!.gain.value = state.config.volume / 100;
      const outCtx = audioContextOutRef.current;
      const outGain = gainNodeRef.current!;

      // Setup Input Audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextInRef.current = inCtx;

      liveNextStartTimeRef.current = 0;
      transcriptionRef.current = { user: '', bot: '' };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log("Live connection opened");
            const source = inCtx.createMediaStreamSource(stream);
            const processor = inCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPCM16Blob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(processor);
            processor.connect(inCtx.destination);
            setState(prev => ({ ...prev, isLiveMode: true, error: null }));
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptionRef.current.user += text;
              setLiveTranscript(transcriptionRef.current.user);
              setIsUserSpeaking(true);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              transcriptionRef.current.bot += text;
              setLiveTranscript(transcriptionRef.current.bot);
            }

            // Handle Audio Data
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsModelSpeaking(true);
              liveNextStartTimeRef.current = Math.max(liveNextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outGain);
              source.onended = () => {
                liveSourcesRef.current.delete(source);
                if (liveSourcesRef.current.size === 0) setIsModelSpeaking(false);
              };
              source.start(liveNextStartTimeRef.current);
              liveNextStartTimeRef.current += audioBuffer.duration;
              liveSourcesRef.current.add(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              liveSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              liveSourcesRef.current.clear();
              liveNextStartTimeRef.current = 0;
              setIsModelSpeaking(false);
            }

            // Handle End of Turn
            if (message.serverContent?.turnComplete) {
              const userFinal = transcriptionRef.current.user;
              const botFinal = transcriptionRef.current.bot;
              if (userFinal || botFinal) {
                const newMsgs: Message[] = [];
                if (userFinal) newMsgs.push({ id: `live-u-${Date.now()}`, role: 'user', text: userFinal, timestamp: new Date() });
                if (botFinal) newMsgs.push({ id: `live-b-${Date.now()}`, role: 'model', text: botFinal, timestamp: new Date() });
                setState(prev => ({ ...prev, messages: [...prev.messages, ...newMsgs] }));
              }
              transcriptionRef.current = { user: '', bot: '' };
              setIsUserSpeaking(false);
            }

            // Handle Tool Calls (e.g. hangup)
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'hangup') {
                  stopLiveMode();
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                  }));
                }
              }
            }
          },
          onerror: (e) => {
            console.error("Live session error:", e);
            setState(prev => ({ ...prev, error: "Voice connection failed." }));
            stopLiveMode();
          },
          onclose: () => {
            console.log("Live session closed");
            stopLiveMode();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: getLiveVoiceName(state.config) } }
          },
          systemInstruction: generateSystemInstruction(state.config),
          tools: [{ functionDeclarations: [hangupToolDeclaration] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      liveSessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, error: handleGeminiError(err) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim(), timestamp: new Date() };
    setState(prev => ({ ...prev, messages: [...prev.messages, userMsg], isTyping: true, error: null }));
    setInput('');

    try {
      const response = await getJonResponse([...state.messages, userMsg], state.config);
      const botMsgId = Date.now().toString();
      const botMsg: Message = { id: botMsgId, role: 'model', text: response.text, timestamp: new Date(), sources: response.sources };
      
      setState(prev => ({ ...prev, messages: [...prev.messages, botMsg], isTyping: false }));

      if (state.config.isSpeechEnabled) {
        setIsModelSpeaking(true);
        const speechData = await getJonSpeech(botMsg.text, state.config);
        if (speechData) {
          if (!audioContextOutRef.current) {
            audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            gainNodeRef.current = audioContextOutRef.current.createGain();
            gainNodeRef.current.connect(audioContextOutRef.current.destination);
          }
          gainNodeRef.current!.gain.value = state.config.volume / 100;
          const buffer = await decodeAudioData(decode(speechData), audioContextOutRef.current, 24000, 1);
          const source = audioContextOutRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(gainNodeRef.current!);
          source.onended = () => setIsModelSpeaking(false);
          source.start(0);
        } else {
          setIsModelSpeaking(false);
        }
      }
    } catch (err) {
      setState(prev => ({ ...prev, isTyping: false, error: handleGeminiError(err) }));
    }
  };

  return (
    <div className="flex h-screen bg-[#0d0d0d]">
      {/* Sidebar */}
      <aside className={`glass-sidebar fixed md:relative z-30 h-full w-64 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>
        <div className="p-4 flex flex-col h-full">
          <button 
            onClick={() => setState(p => ({ ...p, messages: [] }))}
            className="flex items-center space-x-3 w-full p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm font-medium">New Chat</span>
          </button>
          
          <div className="flex-1 overflow-y-auto space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest p-2">Recent Vibes</div>
            <div className="p-2 text-sm text-slate-400 italic">History saved automatically...</div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <button onClick={() => setState(p => ({ ...p, isSettingsOpen: true }))} className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-300">
               <div className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">{currentBotName[0]}</div>
               <span className="text-sm">{currentBotName} Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header 
          onOpenSettings={() => setState(p => ({ ...p, isSettingsOpen: true }))} 
          onStartLive={startLiveMode}
          botName={currentBotName} 
          isSpeaking={isJonCurrentlySpeaking}
          config={state.config}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-4 scroll-smooth">
          <div className="chat-container">
            {state.messages.map(msg => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                botName={currentBotName} 
                config={state.config}
                isAssistantSpeaking={isJonCurrentlySpeaking && msg.role === 'model'}
              />
            ))}
            {state.isTyping && (
              <div className="p-8 flex items-start space-x-4">
                 <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white shrink-0">J</div>
                 <div className="pt-2 flex space-x-1 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent">
          <form onSubmit={handleSubmit} className="chat-container relative">
            <div className="relative group">
               <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit(e))}
                placeholder={`Message ${currentBotName}...`}
                rows={1}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-5 py-4 pr-32 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none shadow-xl"
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <button type="button" onClick={startLiveMode} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors" title="Live Voice">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                </button>
                <button type="submit" disabled={!input.trim() || state.isTyping} className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white rounded-lg transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-2">Jon can make mistakes. Always keep it amazing.</p>
          </form>
        </div>

        {/* Floating Error Toast */}
        {state.error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-500/90 text-white text-sm rounded-full shadow-2xl flex items-center space-x-2 animate-in slide-in-from-top-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             <span>{state.error}</span>
             <button onClick={() => setState(p => ({ ...p, error: null }))} className="hover:opacity-60">×</button>
          </div>
        )}
      </main>

      <SettingsModal 
        isOpen={state.isSettingsOpen} 
        onClose={() => setState(p => ({ ...p, isSettingsOpen: false }))} 
        config={state.config} 
        onChange={c => setState(p => ({ ...p, config: c }))}
      />

      <LiveOverlay 
        isActive={state.isLiveMode} 
        onStop={stopLiveMode} 
        botName={currentBotName}
        isModelSpeaking={isModelSpeaking}
        isUserSpeaking={isUserSpeaking}
        transcript={liveTranscript}
        config={state.config}
      />
    </div>
  );
};

export default App;
