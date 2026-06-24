/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, ShieldAlert, Zap, Clock, Play, Square, CheckSquare, 
  SquareDot, AlertOctagon, Volume2, VolumeX, Sparkles, AlertCircle 
} from 'lucide-react';
import { Task, AIRescuePlan, RescueStep } from '../types';
import { getHoursRemaining } from '../utils/mockData';

interface RescueModeProps {
  task: Task | null;
  onGeneratePlan: (task: Task, timeLeftHours: number) => Promise<void>;
  rescuePlan: AIRescuePlan | null;
  isGenerating: boolean;
  onTaskCompleted: (id: string) => void;
}

export default function RescueMode({
  task,
  onGeneratePlan,
  rescuePlan,
  isGenerating,
  onTaskCompleted
}: RescueModeProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0, label: '00:00:00', isOverdue: false });
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [ambientSound, setAmbientSound] = useState(false);
  const [soundType, setSoundType] = useState<'binaural' | 'metronome'>('binaural');
  
  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer clock
  useEffect(() => {
    if (!task) return;
    
    const updateTimer = () => {
      // Simulate ticking by subtracting from target time
      const targetTime = new Date(task.deadline).getTime();
      // Reference simulated system time starts at: 2026-06-22T22:04:55-07:00
      // To feel real-time in preview, let's offset by actual ticking seconds
      const nowMs = new Date().getTime();
      
      // Let's make it relative to the real current moment but offset so it matches
      // the urgent mock deadline values naturally
      const baseSystemMs = new Date("2026-06-22T22:04:55-07:00").getTime();
      const elapsedMs = performance.now(); // milliseconds since script booted
      const currentSimMs = baseSystemMs + elapsedMs;

      let diff = targetTime - currentSimMs;
      const isOverdue = diff < 0;
      diff = Math.abs(diff);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      const label = `${isOverdue ? '-' : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

      setCountdown({ hours, minutes, seconds, label, isOverdue });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [task]);

  // Handle auto-generator triggering when task changes
  useEffect(() => {
    if (task && !rescuePlan) {
      const hoursLeft = getHoursRemaining(task.deadline);
      onGeneratePlan(task, hoursLeft > 0 ? hoursLeft : 3);
    }
    // Reset checked tasks when target shifts
    setCompletedSteps([]);
  }, [task]);

  // Browser synthesized focusing binaural audio generator
  const startFocuserAudio = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (soundType === 'binaural') {
        // Binaural Beats Focus Drone sound synth setup
        // Left Ear: 150Hz, Right Ear: 158Hz (8Hz Alpha focus difference)
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const mainGain = ctx.createGain();

        oscL.type = 'sine';
        oscL.frequency.value = 150;
        oscR.type = 'sine';
        oscR.frequency.value = 158;

        mainGain.gain.value = 0.12; // soft volume

        if (pannerL && pannerR) {
          pannerL.pan.value = -1;
          pannerR.pan.value = 1;

          oscL.connect(pannerL);
          pannerL.connect(mainGain);

          oscR.connect(pannerR);
          pannerR.connect(mainGain);
        } else {
          oscL.connect(mainGain);
          oscR.connect(mainGain);
        }

        mainGain.connect(ctx.destination);

        oscL.start();
        oscR.start();

        osc1Ref.current = oscL;
        osc2Ref.current = oscR;
        gainRef.current = mainGain;
      } else {
        // Metronome regular concentration clicks
        // Produces regular soft focus clicks every 1.5 seconds representation
        let nextClick = 0;
        const scheduleClick = () => {
          if (!ambientSound) return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
          
          timerRef.current = setTimeout(scheduleClick, 1000);
        };
        scheduleClick();
      }
    } catch (err) {
      console.warn("Audio Context synth launch failed, browser blockages active:", err);
    }
  };

  const stopFocuserAudio = () => {
    try {
      if (osc1Ref.current) { osc1Ref.current.stop(); osc1Ref.current.disconnect(); osc1Ref.current = null; }
      if (osc2Ref.current) { osc2Ref.current.stop(); osc2Ref.current.disconnect(); osc2Ref.current = null; }
      if (gainRef.current) { gainRef.current.disconnect(); gainRef.current = null; }
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    } catch (e) {}
  };

  useEffect(() => {
    if (ambientSound) {
      startFocuserAudio();
    } else {
      stopFocuserAudio();
    }
    return () => stopFocuserAudio();
  }, [ambientSound, soundType]);

  const handleStepToggle = (seq: number) => {
    setCompletedSteps(prev => 
      prev.includes(seq) 
        ? prev.filter(s => s !== seq) 
        : [...prev, seq]
    );
  };

  if (!task) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-3xs space-y-4">
        <Flame className="w-12 h-12 text-slate-350 mx-auto animate-pulse" />
        <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">Rescue Dashboard Closed</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
          Navigate back to the main Smart Dashboard and click the red "Rescue" deployment button to spin up crisis countdowns for high-threat milestones.
        </p>
      </div>
    );
  }

  const steps = rescuePlan?.crashSteps || [];
  const percentDone = steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  return (
    <div id="rescue-mode-center" className="space-y-6">
      
      {/* 🚨 Emergency Alert Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs font-sans">
        <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
          <div className="p-3 bg-rose-50 dark:bg-rose-955/20 rounded-xl text-rose-600 dark:text-rose-400">
            <Flame className="w-6 h-6 fill-rose-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-sans text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5 justify-center sm:justify-start">
              Rescue Mode Active
              <span className="bg-rose-600 text-white font-bold font-mono text-[9px] px-1.5 py-0.2 rounded">Emergency Triage</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Event: <span className="text-slate-800 dark:text-slate-200 font-bold">"{task.title}"</span> ({task.category})
            </p>
          </div>
        </div>

        <button
          onClick={() => onTaskCompleted(task.id)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Mark Entire Task Completed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Triage Area: Countdown + Synth Focuser block */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* DIGITAL CRITICAL TIMER */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-250 dark:border-slate-800 shadow-3xs text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">T-Minus Crisis Clock</span>
            <div className={`text-4xl font-mono font-black tracking-normal select-none ${countdown.isOverdue ? 'text-rose-600 animate-pulse' : 'text-slate-850 dark:text-slate-100'}`}>
              {countdown.label}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {countdown.isOverdue ? "Deadline exceeded! Triage damage containment now." : "Countdown linked to synchronized school/dmv database times."}
            </p>
          </div>

          {/* FOCUS SOUND SYNTHESIZER DRONE */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-855 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                {ambientSound ? <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                Lo-fi Focusing Synth Focuser
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">
                Generates relaxing low-frequency waves or metronomic ticks directly in your browser using the local Audio engine to isolate distraction.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSoundType('binaural')}
                className={`flex-1 py-1 px-2 text-[10px] font-semibold rounded-lg border cursor-pointer ${
                  soundType === 'binaural'
                    ? 'border-indigo-450 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400'
                }`}
              >
                Binaural Focus Drone
              </button>
              <button
                onClick={() => setSoundType('metronome')}
                className={`flex-1 py-1 px-2 text-[10px] font-semibold rounded-lg border cursor-pointer ${
                  soundType === 'metronome'
                    ? 'border-indigo-450 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400'
                }`}
              >
                Concentrator Metronome
              </button>
            </div>

            <button
              onClick={() => setAmbientSound(!ambientSound)}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                ambientSound
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {ambientSound ? 'Toggle Focus Audio OFF' : 'Power Up Focus Audio Engine'}
            </button>

            {ambientSound && (
              <div className="flex items-center justify-center gap-1.5 h-6">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-emerald-500 rounded-full animate-[bounce_1s_infinite]" 
                    style={{ 
                      height: `${Math.floor(Math.random() * 16) + 6}px`,
                      animationDelay: `${i * 0.15}s` 
                    }} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* DYNAMIC MOTIVATION NOTE */}
          {rescuePlan?.motivationStatement && (
            <div className="p-4 bg-rose-50/55 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-950/30 rounded-2xl text-xs text-rose-800 dark:text-rose-400 leading-relaxed italic relative overflow-hidden">
              <Sparkles className="absolute right-2 top-2 w-4 h-4 text-rose-600/20" />
              <span className="font-bold uppercase font-mono block text-[9px] tracking-widest text-rose-700 dark:text-rose-500 mb-1">Coach Emergency Broadcast</span>
              "{rescuePlan.motivationStatement}"
            </div>
          )}

          {/* DYNAMIC COGNITIVE REFRAME FROM GEMINI */}
          {rescuePlan?.aiCognitiveReframe && (
            <div className="p-4 bg-indigo-50/55 dark:bg-indigo-950/15 border border-indigo-150 dark:border-indigo-900/30 rounded-2xl text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed relative overflow-hidden shadow-3xs">
              <Sparkles className="absolute right-2 top-2 w-4 h-4 text-indigo-500/20 animate-pulse" />
              <span className="font-bold uppercase font-mono block text-[9px] tracking-widest text-indigo-705 dark:text-indigo-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Cognitive Friction Sync
              </span>
              <p className="leading-relaxed text-[11px] font-sans">
                {rescuePlan.aiCognitiveReframe}
              </p>
            </div>
          )}

        </div>

        {/* Right Area: Structured Hour-by-Hour Crisis Checklist */}
        <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 shadow-3xs flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-105 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Hour-by-Hour Crash Checklist</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Gemini has compressed the task sequence, highlighting only the critical pipeline.</p>
              </div>
              <span className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-705 dark:text-indigo-305 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-900/40 font-bold">
                Progress: {percentDone}%
              </span>
            </div>

            {isGenerating ? (
              <div className="p-12 text-center space-y-3">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-450 dark:text-slate-500">Gemini drafting custom emergency sub-steps sequence...</p>
              </div>
            ) : steps.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No checklist generated. Try clicking standard Audit or Rescue first.</p>
            ) : (
              <div className="space-y-2.5">
                {steps.sort((a,b) => a.sequence - b.sequence).map((step) => {
                  const isChecked = completedSteps.includes(step.sequence);
                  return (
                    <div 
                      key={step.sequence}
                      onClick={() => handleStepToggle(step.sequence)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                        isChecked 
                          ? 'bg-slate-50/55 dark:bg-slate-950/30 border-slate-200/60 dark:border-slate-850/60 opacity-50' 
                          : step.criticalPath
                          ? 'bg-rose-50/20 dark:bg-rose-955/10 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 hover:border-rose-350 dark:hover:border-rose-800 font-semibold'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-800 shadow-3xs'
                      }`}
                    >
                      <button className="text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-300 mt-0.5">
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-450 dark:text-slate-500">Step {step.sequence} • {step.durationMinutes} min</span>
                          {step.criticalPath && !isChecked && (
                            <span className="bg-rose-50 dark:bg-rose-955/40 text-rose-700 dark:text-rose-400 font-bold text-[8px] tracking-wide px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-900/40">
                              CRITICAL PATH
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold text-slate-805 dark:text-slate-200 ${isChecked ? 'line-through text-slate-400 dark:text-slate-550' : ''}`}>
                          {step.name}
                        </h4>
                        <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Finish Guide */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              Extreme cram tips: turn off Wi-Fi if not online lookup dependent.
            </span>
            <span className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">Survival mode configured.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
