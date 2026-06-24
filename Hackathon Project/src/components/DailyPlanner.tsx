/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, Clock, Compass, CheckCircle, ChevronDown, Award } from 'lucide-react';
import { Task, AIScheduleSlot } from '../types';

interface DailyPlannerProps {
  tasks: Task[];
  onGeneratePlanner: (selectedTaskIds: string[]) => Promise<void>;
  schedule: AIScheduleSlot[];
  isGenerating: boolean;
  onSyncTaskToCalendar?: (task: Task) => Promise<void>;
}

const DEFAULT_SCHEDULE: AIScheduleSlot[] = [
  {
    timeSlot: "08:30 AM - 09:00 AM",
    taskTitle: "Mental Architecture Prep",
    actionItem: "Digital fasting. Review today's highest priority milestone first before reading social feeds.",
    difficulty: "Easy",
    focusTip: "Put your smartphone in another room during this 30-minute kickoff."
  },
  {
    timeSlot: "09:00 AM - 10:30 AM",
    taskTitle: "Quarterly Client Pitch Deck Pitch Design",
    actionItem: "Design core executive summaries and outline the Q3 pricing structure model.",
    difficulty: "Hard",
    focusTip: "Start with zero-distraction browser tabs. Do not draft slides sequentially; draft core results first."
  },
  {
    timeSlot: "11:00 AM - 12:30 PM",
    taskTitle: "CS301 Major Term Paper Draft Submission",
    actionItem: "Flesh out the literature review sequence of 3 key distributed databases.",
    difficulty: "Hard",
    focusTip: "Don't refine grammar right now. Stream raw conceptual arguments onto the paper first."
  },
  {
    timeSlot: "01:30 PM - 02:00 PM",
    taskTitle: "DMV Car Insurance & DMV Portal",
    actionItem: "Sync renewal rates with standard DMV credit cards.",
    difficulty: "Easy",
    focusTip: "Execute this low-energy task during your post-lunch dip."
  },
  {
    timeSlot: "03:00 PM - 04:30 PM",
    taskTitle: "Redox Organic Chemistry Lab Report",
    actionItem: "Draft the balancing chemical equation sheets for Redox formulas.",
    difficulty: "Medium",
    focusTip: "Open reference textbook specifically to laboratory safety section before starting."
  }
];

export default function DailyPlanner({
  tasks,
  onGeneratePlanner,
  schedule,
  isGenerating
}: DailyPlannerProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const activeTasks = tasks.filter(t => t.status !== 'Completed');

  const handleToggleSelect = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId) 
        : [...prev, taskId]
    );
  };

  const currentSchedule = schedule && schedule.length > 0 ? schedule : DEFAULT_SCHEDULE;

  const handleGenerate = () => {
    // If none are selected explicitly, pass all active tasks as context
    const targets = selectedTasks.length > 0 
      ? selectedTasks 
      : activeTasks.map(t => t.id);
    onGeneratePlanner(targets);
  };

  return (
    <div id="ai-daily-planner" className="space-y-6">
      
      {/* 🚀 AI Planner Header */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans tracking-tight">AI Flow Scheduler</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select high-impact items to let Gemini build a customized circadian timeline featuring optimal focus segments.
          </p>
        </div>

        <button
          id="btn-generate-schedule"
          onClick={handleGenerate}
          disabled={isGenerating || activeTasks.length === 0}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Drafting Timeline...' : 'Synthesize Day Schedule'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic Selector */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 h-fit shadow-3xs">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Agenda Selector
          </h3>
          <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            Toggle specific tasks to prioritize for today's grid. If none are toggled, Gemini considers your entire backlog.
          </p>

          <div className="space-y-2 max-h-[16rem] overflow-y-auto pr-1">
            {activeTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No active tasks backlogged</p>
            ) : (
              activeTasks.map(t => (
                <div 
                  key={t.id}
                  onClick={() => handleToggleSelect(t.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedTasks.includes(t.id)
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-305 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-0.5 truncate flex-1 pr-2">
                    <div className="font-bold truncate text-slate-800 dark:text-slate-200">{t.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-550">Effort: {t.estimatedEffort}h • Priority: {t.priority}</div>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    selectedTasks.includes(t.id) ? 'border-indigo-505 bg-indigo-600' : 'border-slate-250 dark:border-slate-700'
                  }`}>
                    {selectedTasks.includes(t.id) && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Timeline Visualization */}
        <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-3xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
               Circadian Productivity Block
            </h3>
            <span className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-0.5 rounded-full">
              Reference Date: 2026-06-22
            </span>
          </div>

          <div className="relative border-l-2 border-indigo-100 dark:border-indigo-950/60 ml-2 md:ml-4 pl-6 md:pl-8 space-y-6">
            {currentSchedule.map((slot, index) => {
              const isHard = slot.difficulty === 'Hard';
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] md:-left-[39px] top-1.5 h-4 w-4 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center transition-transform group-hover:scale-125">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  </div>

                  <div className="p-4 bg-slate-50/45 dark:bg-slate-955/20 rounded-xl border border-slate-150 dark:border-slate-800/80 hover:bg-slate-50/70 dark:hover:bg-slate-955/40 hover:border-slate-250 dark:hover:border-slate-700 transition-all space-y-2">
                    
                    {/* Time Slot & Difficulty */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded">
                        {slot.timeSlot}
                      </span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        slot.difficulty === 'Hard'
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30'
                          : slot.difficulty === 'Medium'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30'
                          : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30'
                      }`}>
                        {slot.difficulty} Effort
                      </span>
                    </div>

                    {/* Task Allocated */}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      {slot.taskTitle}
                    </h4>

                    {/* Action breakdown */}
                    <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed">
                      <span className="text-slate-450 dark:text-slate-500 font-bold">Core Action:</span> {slot.actionItem}
                    </p>

                    {/* Focus Tip */}
                    {slot.focusTip && (
                      <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-l-2 border-indigo-500 dark:border-indigo-600 rounded-r-lg text-[11px] text-indigo-800 dark:text-indigo-300 font-medium">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200">Coach Focus Strategy:</span> {slot.focusTip}
                      </div>
                    )}

                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
