/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Trophy, Brain, Flame, Activity, Hourglass, HelpCircle, 
  CheckSquare, Send, Users, Shield, Compass, UserCheck, Zap, Terminal, Plus, Trash2, CheckCircle2
} from 'lucide-react';
import { Task, Habit, Goal, AICoachReport } from '../types';

interface CoachReportProps {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  onTriggerCoach: () => Promise<void>;
  report: AICoachReport | null;
  isGenerating: boolean;
}

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  }
};

const DEFAULT_REPORT: AICoachReport = {
  assessmentHeadline: "Workload bottleneck active. Risk profile heavily concentrated within next 24 hours.",
  overallAnalytics: "Your total pending and overdue backlog stands at several active items. With major deadlines concentrated tomorrow, you suffer from potential sleep compression vulnerability. Distraction risks are extreme during evening hours.",
  procrastinationRiskRating: "Extreme",
  recommendedFocusHours: "5.5 Hours of High-Density Focus recommended today",
  hourlyTactics: [
    "Digital Cleansing Ritual: Place all communication slates in silent storage rails for the first 90 minutes.",
    "Decoy Milestones: Write down your paper draft deadline as 4 AM instead of 9 AM to lock down comfortable sleeping margins.",
    "The 5-Minute Kickoff: Open your text document now and promise yourself to write exactly one sentence. Action always unlocks motivation."
  ],
  psychologicalProcrastinationTrigger: "The Perfectionist Paralysis (Paralyzed by fear of drafting sub-optimal work before refining)"
};

type PersonalityType = 'Zen Master' | 'Sgt. Motivation' | 'Hacker Peer';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface PartnerCheckpoint {
  id: string;
  text: string;
  done: boolean;
}

export default function CoachReport({
  tasks,
  habits,
  goals,
  onTriggerCoach,
  report,
  isGenerating
}: CoachReportProps) {
  const currentReport = report || DEFAULT_REPORT;
  const [subTab, setSubTab] = useState<'diagnostic' | 'partner'>('diagnostic');

  // --- AI Accountability Partner States ---
  const [personality, setPersonality] = useState<PersonalityType>(() => {
    return (safeStorage.getItem('partner_personality') as PersonalityType) || 'Hacker Peer';
  });
  const [commitment, setCommitment] = useState<string>(() => {
    return safeStorage.getItem('partner_commitment') || '';
  });
  const [isPactActive, setIsPactActive] = useState<boolean>(() => {
    return safeStorage.getItem('partner_pact_active') === 'true';
  });
  
  const [chatHistory, setChatHistory] = useState<Message[]>(() => {
    const saved = safeStorage.getItem('partner_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'init',
        role: 'assistant',
        content: `Hey! I am your AI Accountability Partner. Declare your primary hourly focus commitment above, and let's pull off some massive progress together today!`
      }
    ];
  });
  
  const [newCheckpoints, setNewCheckpoints] = useState<PartnerCheckpoint[]>(() => {
    const saved = safeStorage.getItem('partner_checkpoints');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: '1', text: 'Set a quiet Timer for 30 minutes', done: false },
      { id: '2', text: 'Close web browsing tabs irrelevant to task', done: false }
    ];
  });

  const [userInput, setUserInput] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [newCheckpointText, setNewCheckpointText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync states to storage
  useEffect(() => {
    safeStorage.setItem('partner_personality', personality);
  }, [personality]);

  useEffect(() => {
    safeStorage.setItem('partner_commitment', commitment);
  }, [commitment]);

  useEffect(() => {
    safeStorage.setItem('partner_pact_active', isPactActive ? 'true' : 'false');
  }, [isPactActive]);

  useEffect(() => {
    safeStorage.setItem('partner_chat_history', JSON.stringify(chatHistory));
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    safeStorage.setItem('partner_checkpoints', JSON.stringify(newCheckpoints));
  }, [newCheckpoints]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Switch partner greeting when personality shifts
  const handlePersonalityChange = (selected: PersonalityType) => {
    setPersonality(selected);
    let intro = '';
    if (selected === 'Zen Master') {
      intro = "Greetings, peaceful soul. I am your Zen Guardian. Let us slow down our minds, anchor into the present space, and approach your commitment with absolute flow.";
    } else if (selected === 'Sgt. Motivation') {
      intro = "ATTENTION! Sgt. Motivation is on the platform! Procrastination is the enemy of glory! Let's lock in your commitment and smash these targets face-on!";
    } else {
      intro = "Hey bro! Hacker-Peer here. Ready to double down on some serious development speed today? Declare what you are coding or working on, and let's get it done!";
    }

    setChatHistory([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: intro
      }
    ]);
  };

  const handleTogglePact = () => {
    if (!commitment.trim()) {
      alert("Please write down what you are pledging to dedicate your focus on first!");
      return;
    }
    setIsPactActive(!isPactActive);
  };

  // Reset focus session entirely
  const handleResetSession = () => {
    const confirmReset = window.confirm("Reset your active commitment pact, chat log, and checkpoints?");
    if (!confirmReset) return;

    setCommitment('');
    setIsPactActive(false);
    setChatHistory([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Ready for a brand new pledge. Choose your partner profile below and declare your commitment!`
      }
    ]);
    setNewCheckpoints([
      { id: '1', text: 'Set a quiet Timer for 30 minutes', done: false },
      { id: '2', text: 'Close web browsing tabs irrelevant to task', done: false }
    ]);
    safeStorage.setItem('partner_commitment', '');
    safeStorage.setItem('partner_pact_active', 'false');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const textMsg = textToSend || userInput;
    if (!textMsg.trim() || loadingReply) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textMsg
    };

    setChatHistory(prev => [...prev, userMsg]);
    if (!textToSend) {
      setUserInput('');
    }
    setLoadingReply(true);

    try {
      const response = await fetch('/api/accountability-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatHistory, userMsg].slice(-8), // Send sliding window back
          commitment: commitment,
          personality: personality,
          tasks: tasks
        })
      });

      if (response.ok) {
        const result = await response.json();
        setChatHistory(prev => [
          ...prev, 
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.reply || "I am right here with you tracking our pledge."
          }
        ]);
      } else {
        throw new Error("Chat api request rejected");
      }
    } catch (err) {
      setChatHistory(prev => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          role: 'assistant',
          content: "Sorry about that! My motivational link is temporarily running through high server fog. Let's make progress anyway!"
        }
      ]);
    } finally {
      setLoadingReply(false);
    }
  };

  // Add local child checkpoint
  const handleAddCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpointText.trim()) return;

    const added: PartnerCheckpoint = {
      id: Date.now().toString(),
      text: newCheckpointText,
      done: false
    };

    setNewCheckpoints(prev => [...prev, added]);
    setNewCheckpointText('');
  };

  const handleToggleCheckpoint = (id: string) => {
    setNewCheckpoints(prev => prev.map(cp => {
      if (cp.id === id) {
        return { ...cp, done: !cp.done };
      }
      return cp;
    }));
  };

  const handleDeleteCheckpoint = (id: string) => {
    setNewCheckpoints(prev => prev.filter(cp => cp.id !== id));
  };

  return (
    <div id="ai-productivity-coach-center" className="space-y-6">
      
      {/* Dynamic Sub-tab navigation menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setSubTab('diagnostic')}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-tight transition-all relative flex items-center gap-1.5 cursor-pointer ${
            subTab === 'diagnostic' 
              ? 'text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Performance Diagnostic
        </button>
        <button
          onClick={() => setSubTab('partner')}
          className={`px-5 py-3 text-xs font-bold font-mono tracking-tight transition-all relative flex items-center gap-1.5 cursor-pointer ${
            subTab === 'partner' 
              ? 'text-indigo-650 dark:text-indigo-400 border-b-2 border-indigo-600' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
          id="tab-accountability-partner"
        >
          <Users className="w-3.5 h-3.5 animate-pulse text-indigo-505" />
          AI Accountability Partner
          <span className="text-[8px] bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-extrabold px-1 rounded uppercase tracking-widest font-sans">New</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'diagnostic' ? (
          <motion.div
            key="diagnostic"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Banner Intro */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-mono">
                  <Brain className="text-indigo-600 w-5 h-5 animate-pulse" />
                  AI Performance Psychologist Diagnostic
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Gemini audits procrastination patterns across backlogs, habit streaks, and goal progress to design psychological interventions.
                </p>
              </div>

              <button
                id="btn-run-coach-diagnostic"
                onClick={onTriggerCoach}
                disabled={isGenerating}
                className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Analyzing Profiles...' : 'Run Coach Diagnostic'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: General Profile Metrics & Triggers */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Procrastination Risk Level Card */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs text-center space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">Workload Threat Index</span>
                  <div className={`text-xl font-sans font-black uppercase ${
                    currentReport.procrastinationRiskRating === 'Extreme'
                      ? 'text-rose-600 dark:text-rose-400'
                      : currentReport.procrastinationRiskRating === 'Moderate'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-650'
                  }`}>
                    {currentReport.procrastinationRiskRating} Threat
                  </div>
                  
                  {/* Risk bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        currentReport.procrastinationRiskRating === 'Extreme'
                          ? 'bg-rose-500 w-11/12'
                          : currentReport.procrastinationRiskRating === 'Moderate'
                          ? 'bg-amber-500 w-1/2'
                          : 'bg-emerald-500 w-1/4'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Evaluated using standard cognitive load limits relative to target date density.
                  </p>
                </div>

                {/* Psychological Trigger classification card */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs text-center space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500">Your Behavioral Archetype</span>
                  <div className="text-xs font-bold text-indigo-705 dark:text-indigo-450 font-mono">
                    {currentReport.psychologicalProcrastinationTrigger}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-800">
                    Understanding your core hesitation pattern lets you bypass active friction without draining mental energy.
                  </p>
                </div>

                {/* Streaks summary log */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-1.5">Streak Analytics</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deep Work Streak:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">5 Days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sleep Schedule Balance:</span>
                      <span className="font-bold text-emerald-650 dark:text-emerald-450">Excellent</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Long-term Goal Progress:</span>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">~62% Completed</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Side: Narrative assessment & recommended rituals */}
              <div className="lg:col-span-8 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/85 dark:border-slate-800 space-y-6 shadow-3xs">
                
                {/* Assessment Narrative */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-mono uppercase">
                    <Hourglass className="w-4 h-4 text-indigo-650" />
                    Workload Forensic Diagnosis
                  </h3>
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-202 dark:border-slate-800 text-xs text-slate-300">
                    <p className="font-bold text-indigo-755 dark:text-indigo-300">"{currentReport.assessmentHeadline}"</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans mt-2">
                      {currentReport.overallAnalytics}
                    </p>
                  </div>
                </div>

                {/* Recommended hours meter */}
                <div className="p-4.5 bg-indigo-50/45 dark:bg-indigo-950/15 rounded-xl border-l-4 border-indigo-600 flex items-center gap-3 border-y border-r border-indigo-100/60 dark:border-indigo-900/30 shadow-3xs">
                  <div className="text-xl">⚡</div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-705 dark:text-indigo-300">{currentReport.recommendedFocusHours}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">Aim to group these hours into ninety-minute undisturbed chunks to sustain focus cycles.</p>
                  </div>
                </div>

                {/* Behavioral Rituals checklist */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-mono uppercase">
                    <CheckSquare className="w-4 h-4 text-indigo-650" />
                    Custom Cognitive Rituals To Open Tasks
                  </h3>
                  <div className="space-y-2">
                    {currentReport.hourlyTactics.map((tac, ind) => (
                      <div key={ind} className="p-3 bg-slate-50/40 hover:bg-slate-50/80 dark:bg-slate-950/20 transition-all rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3 shadow-3xs">
                        <div className="flex items-center justify-center h-5 w-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 font-bold font-mono text-[10px] text-indigo-700 dark:text-indigo-300 text-center flex-shrink-0">
                          {ind + 1}
                        </div>
                        <p className="leading-relaxed">{tac}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="partner"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Area: Setup Commitment & Partner Select */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Profile Select */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                    <Users className="w-4 h-4 text-indigo-650 dark:text-indigo-400" />
                    Partner Archetype
                  </h3>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">Mental Sync</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['Hacker Peer', 'Zen Master', 'Sgt. Motivation'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePersonalityChange(p)}
                      className={`p-2.5 rounded-xl border text-[10px] font-bold font-sans transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        personality === p
                          ? 'bg-indigo-50/70 border-indigo-300 text-indigo-750 dark:bg-indigo-950/45 dark:border-indigo-900 dark:text-indigo-300 shadow-3xs ring-2 ring-indigo-650/10'
                          : 'bg-slate-50/45 dark:bg-slate-950/10 border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="text-base">
                        {p === 'Zen Master' ? '🧘' : p === 'Sgt. Motivation' ? '🪖' : '💻'}
                      </span>
                      <span className="truncate w-full">{p}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-850 rounded-xl">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    {personality === 'Zen Master' && "Peaceful companion. Relieves deadline panic with calm breath exercises, mindfulness cues, and structured step boundaries."}
                    {personality === 'Sgt. Motivation' && "Tough accountability supervisor. Demand continuous updates, call out decoy tasks, and locks down completion timelines."}
                    {personality === 'Hacker Peer' && "Co-working peer pull energy buddy. Humorous programmer perspective, casual checks, and continuous motivational boosts."}
                  </p>
                </div>
              </div>

              {/* Commitment Lock-in (LOCKED PACT) */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    The Focus Covenant
                  </h3>
                  {isPactActive && (
                    <span className="text-[8px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-extrabold animate-pulse">Pact Active</span>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Solemnly pledge exactly what goal you commit to progress in absolute silence over the next 60 minutes.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="text"
                      disabled={isPactActive}
                      value={commitment}
                      onChange={(e) => setCommitment(e.target.value)}
                      placeholder="E.g., Complete writing slide draft paragraphs..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/55 dark:bg-slate-950/30 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleTogglePact}
                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider font-mono rounded-xl cursor-pointer shadow-3xs transition-all ${
                          isPactActive
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-455'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isPactActive ? 'Break Focus Pact' : 'Seal Focus Pact 🛡️'}
                      </button>

                      {isPactActive && (
                        <button
                          onClick={handleResetSession}
                          className="px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-400 hover:text-rose-550 transition-colors"
                          title="Reset focus covenant and chat logs completely"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isPactActive && (
                  <div className="p-3 bg-emerald-50/20 dark:bg-emerald-955/5 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[10px] text-emerald-800 dark:text-emerald-400 leading-normal flex items-start gap-2">
                    <span className="text-xs">🛡️</span>
                    <p>
                      Your focus line is locked. I will regularly ask for task status. Click quick feedback options in chat right now!
                    </p>
                  </div>
                )}
              </div>

              {/* Partner Interactive Checklist */}
              <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                    <CheckSquare className="w-4 h-4 text-indigo-650" />
                    Pact Checkpoints
                  </h3>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {newCheckpoints.filter(c => c.done).length}/{newCheckpoints.length} done
                  </span>
                </div>

                <form onSubmit={handleAddCheckpoint} className="flex gap-2">
                  <input
                    type="text"
                    value={newCheckpointText}
                    onChange={(e) => setNewCheckpointText(e.target.value)}
                    placeholder="Add step (e.g., set focus clock)"
                    className="flex-1 text-[10px] p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="p-1 px-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {newCheckpoints.length === 0 ? (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center py-2">
                      No milestones registered. Add one above!
                    </div>
                  ) : (
                    newCheckpoints.map((cp) => (
                      <div 
                        key={cp.id}
                        className={`p-2 rounded-lg border text-[10px] flex items-center justify-between transition-colors ${
                          cp.done 
                            ? 'bg-slate-50/60 dark:bg-slate-950/20 border-slate-200/40 text-slate-405 dark:text-slate-500 line-through' 
                            : 'bg-white dark:bg-slate-850 dark:border-slate-800 text-slate-705 dark:text-slate-200'
                        }`}
                      >
                        <div 
                          onClick={() => handleToggleCheckpoint(cp.id)}
                          className="flex items-center gap-2 cursor-pointer flex-1 select-none pr-3"
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${cp.done ? 'text-emerald-500 fill-emerald-50' : 'text-slate-300'}`} />
                          <span className="break-all">{cp.text}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCheckpoint(cp.id)}
                          className="text-slate-350 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Area: Main Live Interactive Board Chat Panel */}
            <div className="lg:col-span-7 flex flex-col justify-between h-[510px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-3xs overflow-hidden">
              
              {/* Chat Header */}
              <div className="p-3.5 bg-slate-50/70 dark:bg-slate-950/25 border-b border-slate-200 dark:border-slate-805 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6.5 h-6.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {personality === 'Zen Master' ? '🧘' : personality === 'Sgt. Motivation' ? '🪖' : '💻'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-850 dark:text-slate-100">
                      {personality === 'Zen Master' && "Sage Osho - Zen Stream"}
                      {personality === 'Sgt. Motivation' && "Gunnery Coach Brody"}
                      {personality === 'Hacker Peer' && "Jordan - Coding Buddy"}
                    </h3>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1 leading-none mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Active accountability counselor
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <Terminal className="w-3 h-3 text-indigo-500" />
                  <span>v3.5 Live</span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 dark:bg-slate-950/20">
                {chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`p-3 max-w-[85%] rounded-2xl text-[11px] leading-relaxed relative ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-3xs'
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-800/60'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {loadingReply && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-400 rounded-2xl rounded-bl-none text-[10px] italic flex items-center gap-1.5 border border-slate-200/40 dark:border-slate-800/40">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span>{personality} is formulating check-in diagnostic feedback...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Suggester Options */}
              <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/10">
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 max-w-full">
                  {[
                    "I got slightly distracted.",
                    "No delays. I am crushing it! 🚀",
                    "I feel overwhelmed by this hour step.",
                    "Give me a 2 minute breathing cue."
                  ].map((preset) => (
                    <button
                      key={preset}
                      disabled={loadingReply}
                      onClick={() => handleSendMessage(preset)}
                      className="px-2.5 py-1 text-[9px] bg-white dark:bg-slate-850 text-slate-500 hover:text-indigo-650 hover:border-indigo-200 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:border-indigo-900 border border-slate-100 dark:border-slate-800/80 rounded-lg whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Send Input Bar */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2.5 bg-white dark:bg-slate-900">
                <input
                  type="text"
                  value={userInput}
                  disabled={loadingReply}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Ask for feedback or report status update..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || loadingReply}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
