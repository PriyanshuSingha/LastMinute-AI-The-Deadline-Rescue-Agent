/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, MessageSquare, Volume2, VolumeX, Sparkles, AlertCircle, Bot, User } from 'lucide-react';
import { Task, AIVoiceResponse } from '../types';

interface VoiceAssistantProps {
  tasks: Task[];
  onVoiceQuery: (query: string) => Promise<AIVoiceResponse>;
  isResponding: boolean;
  onFocusTaskNode: (taskId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  actionItem?: string;
  affectedTaskId?: string;
  timestamp: Date;
}

export default function VoiceAssistant({
  tasks,
  onVoiceQuery,
  isResponding,
  onFocusTaskNode
}: VoiceAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Affirmative. I am your Deadline Rescue Agent. Ask me for strategies (e.g., 'What should I do next?', 'Which task is most urgent?', or 'Can I finish everything today?'). I will synthesize answers verbally if you enable Narrator.",
      timestamp: new Date()
    }
  ]);
  const [speakOutput, setSpeakOutput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat feed
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isResponding]);

  // Web Speech API - Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech recognition is not fully supported in this browser container. Please type your query in the input bar below.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Web Speech API - Synthesis (Narrating text answer)
  const speakText = (text: string) => {
    if (!speakOutput) return;
    try {
      window.speechSynthesis.cancel(); // clear queue
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 0.95;
      const voices = window.speechSynthesis.getVoices();
      // Try to find a nice neutral professional sounding english voice
      const bestVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
      if (bestVoice) u.voice = bestVoice;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("Speech synthesis blocked by browser parameters:", e);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    // 1. Append User Bubble
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    try {
      // 2. Fetch API answer
      const response = await onVoiceQuery(text);
      
      // 3. Append Bot Bubble
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'bot',
        text: response.answer,
        actionItem: response.actionSuggested,
        affectedTaskId: response.affectedTaskId,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);

      // 4. Play vocal trigger
      speakText(response.answer + " " + (response.actionSuggested || ''));

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        sender: 'bot',
        text: "Apologies. My analytical neural link returned a timeout. Ensure your Secrets panel contains a valid key.",
        timestamp: new Date()
      }]);
    }
  };

  const handleFastQuery = (q: string) => {
    handleSendMessage(q);
  };

  return (
    <div id="voice-companion-area" className="flex flex-col h-[28rem] bg-white rounded-2xl border border-slate-200/80 shadow-3xs">
      
      {/* Feed Title bar */}
      <div className="p-4 bg-slate-50/50 rounded-t-2xl border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Vocal Productivity Assistant</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Narrator audio toggle */}
          <button
            onClick={() => setSpeakOutput(!speakOutput)}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              speakOutput 
                ? 'border-indigo-300 bg-indigo-50 text-indigo-750 font-bold' 
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
            }`}
            title="Toggle Spoken Narrator Feed"
          >
            {speakOutput ? (
              <>
                <Volume2 className="w-3.5 h-3.5" /> Speak: On
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" /> Speak: Off
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message scroll list */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
        {messages.map((m) => {
          const isBot = m.sender === 'bot';
          return (
            <div 
              key={m.id}
              className={`flex gap-2.5 max-w-[85%] ${isBot ? 'self-start' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Profile Avatar icon */}
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                isBot 
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble box */}
              <div className={`p-3 rounded-xl text-xs space-y-1.5 font-sans ${
                isBot
                  ? 'bg-slate-50 border border-slate-200 text-slate-700'
                  : 'bg-indigo-600 border border-indigo-550 text-white'
              }`}>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                
                {/* Specific recommended fast steps */}
                {m.actionItem && isBot && (
                  <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 text-indigo-700 font-mono text-[11px] leading-tight flex items-center justify-between gap-2 mt-1">
                    <span>⚡ CTA: {m.actionItem}</span>
                    {m.affectedTaskId && (
                      <button
                        onClick={() => onFocusTaskNode(m.affectedTaskId!)}
                        className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-[9px] text-white font-bold cursor-pointer"
                      >
                        Highlight
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {isResponding && (
          <div className="flex gap-2.5 max-w-[80%]">
            <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-200 text-slate-450 flex items-center gap-1.5">
              <span>Agent compiling response</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Fast queries buttons */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          "What should I do next?",
          "Which task is most urgent?",
          "Can I finish everything today?",
          "Assess academic bottlenecks"
        ].map((q) => (
          <button
            key={q}
            onClick={() => handleFastQuery(q)}
            disabled={isResponding}
            className="px-2.5 py-1 bg-white border border-slate-200 text-[10px] text-slate-650 hover:bg-slate-50 hover:border-slate-300 transition-all rounded px-2 cursor-pointer disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Bottom typing input bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
        className="p-3.5 border-t border-slate-100 bg-slate-50/40 rounded-b-2xl flex items-center gap-3.5"
      >
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
            isListening 
              ? 'bg-rose-600 border-rose-500 text-white animate-pulse' 
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
          }`}
          title="Toggle vocal Speech-To-Text dictation"
        >
          {isListening ? <Mic className="w-4 h-4 text-white animate-pulse" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? "Listening... Speak clearly" : "Speak or ask for strategies..."}
          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
          disabled={isResponding}
        />

        <button
          type="submit"
          className="p-2.5 bg-indigo-600 hover:bg-indigo-750 rounded-xl text-white transition-colors cursor-pointer"
          disabled={!inputText.trim() || isResponding}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
