/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Plus, CheckCircle, Target, Sparkles, PlusCircle } from 'lucide-react';
import { Habit, Goal } from '../types';

interface HabitsGoalsProps {
  habits: Habit[];
  goals: Goal[];
  onAddHabit: (habit: Omit<Habit, 'id' | 'streak' | 'history'>) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onToggleHabit: (id: string, date: string) => void;
  onUpdateGoalProgress: (id: string, progress: number) => void;
  currentUser?: any;
}

export default function HabitsGoals({
  habits,
  goals,
  onAddHabit,
  onAddGoal,
  onToggleHabit,
  onUpdateGoalProgress,
  currentUser
}: HabitsGoalsProps) {
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  
  // Habit Form state
  const [habitTitle, setHabitTitle] = useState('');
  const [habitFreq, setHabitFreq] = useState<'Daily' | 'Weekly'>('Daily');

  // Goal Form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDate, setGoalDate] = useState('2026-12-31');
  const [goalProgress, setGoalProgress] = useState(20);
  const [goalCat, setGoalCat] = useState('Academic');

  // Use current simulated reference date: 2026-06-22
  const TODAY_STR = "2026-06-22";

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    onAddHabit({
      title: habitTitle,
      frequency: habitFreq
    });
    setHabitTitle('');
    setShowHabitForm(false);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    onAddGoal({
      title: goalTitle,
      targetDate: goalDate,
      progress: Number(goalProgress),
      category: goalCat
    });
    setGoalTitle('');
    setShowGoalForm(false);
  };

  const maxUserStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;

  const initialLeaderboard = [
    { name: "Sophia K.", habit: "No Distraction Study", streak: 19, avatar: "SK", isSelf: false },
    { name: "Alex M.", habit: "30m Heart Fitness", streak: 14, avatar: "AM", isSelf: false },
    { name: currentUser?.displayName || "You (Focuser Mode)", habit: "My Max Habit Streak", streak: maxUserStreak, avatar: currentUser?.photoURL ? null : "😎", isSelf: true },
    { name: "Emily R.", habit: "Mindfulness Breather", streak: 8, avatar: "ER", isSelf: false },
    { name: "Devon P.", habit: "Deep-Work Coding Tracker", streak: 5, avatar: "DP", isSelf: false },
  ];

  const sortedLeaderboard = [...initialLeaderboard].sort((a, b) => b.streak - a.streak).map((player, idx) => ({
    ...player,
    rank: idx + 1
  }));

  return (
    <div id="habits-goals-center" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* 🚀 Active Habits Streak section */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-4 flex flex-col justify-between shadow-3xs">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              Atomic Habit Streaks
            </h3>
            
            <button
              onClick={() => setShowHabitForm(!showHabitForm)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Habit
            </button>
          </div>

          <AnimatePresence>
            {showHabitForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleHabitSubmit}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="text-xs font-bold text-slate-700">Register Streak Habit</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15-Min Focused Journaling"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Frequency:</span>
                    <div className="flex gap-1.5">
                      {['Daily', 'Weekly'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setHabitFreq(f as any)}
                          className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold cursor-pointer ${
                            habitFreq === f ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-250 text-slate-500 hover:border-slate-350'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => setShowHabitForm(false)} 
                    className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-2.5 py-1 text-[10px] bg-indigo-600 rounded font-bold text-white cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-2 max-h-[16rem] overflow-y-auto">
            {habits.map((hb) => {
              const isCheckedToday = hb.history[TODAY_STR] === true;
              return (
                <div 
                  key={hb.id}
                  className="p-3 bg-slate-50/40 rounded-xl border border-slate-200/60 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800">{hb.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase bg-slate-100 text-slate-500 px-1 py-0.2 rounded border border-slate-200">
                        {hb.frequency}
                      </span>
                      <span className="text-[10px] font-mono text-orange-650 font-bold flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-orange-500/10 text-orange-500" />
                        Streak: {hb.streak}d
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleHabit(hb.id, TODAY_STR)}
                    className={`h-8 px-3 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isCheckedToday
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'border-slate-200 bg-white hover:border-indigo-600 hover:text-indigo-600 text-slate-500 shadow-3xs'
                    }`}
                  >
                    <CheckCircle className={`w-3.5 h-3.5 ${isCheckedToday ? 'animate-bounce' : ''}`} />
                    {isCheckedToday ? 'Checked' : 'Check Off'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivational nudge */}
        <div className="text-[10px] font-sans text-slate-500 pt-3 border-t border-slate-100 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Strengthening habit loops builds core protective shield parameters.
        </div>

      </div>

      {/* 🏆 STREAK LEADERBOARD */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 flex flex-col justify-between shadow-3xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-mono">
              <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Leaderboard: Habit Streaks
            </h3>
            <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/45 uppercase font-bold font-mono">Global Lobby</span>
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            Track consecutive checks with "Check Off" buttons across atomic habits to level up. 
          </p>

          <div className="space-y-2.5">
            {sortedLeaderboard.map((player) => (
              <div 
                key={player.name}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  player.isSelf 
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900 ring-2 ring-indigo-600/10 shadow-3xs' 
                    : 'bg-slate-50/45 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-850/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 text-[10px] font-black rounded-lg flex items-center justify-center ${
                    player.rank === 1 
                      ? 'bg-amber-100 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-400 font-black' 
                      : player.rank === 2
                      ? 'bg-slate-200 dark:bg-slate-800 border border-slate-350 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}>
                    #{player.rank}
                  </div>

                  {player.avatar ? (
                    <div className="w-7 h-7 rounded-full bg-indigo-100/50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-200/40 dark:border-indigo-900/40">
                      {player.avatar}
                    </div>
                  ) : currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-indigo-200/40 dark:border-indigo-900/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-200/40 dark:border-orange-900/40">
                      😎
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className={`text-xs font-bold ${player.isSelf ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {player.name.split(' ')[0]} {player.isSelf && <span className="text-[9px] text-indigo-500 font-mono">(Me)</span>}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-sans tracking-tight leading-none truncate max-w-[100px]">
                      {player.habit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 font-mono">
                  <Flame className={`w-3.5 h-3.5 ${player.rank === 1 ? 'text-amber-500 fill-amber-500/10' : 'text-orange-500'}`} />
                  <span className={`text-xs font-black ${player.rank === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-orange-650 dark:text-orange-400'}`}>
                    {player.streak}d
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] font-sans text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          Rank updates in real-time according to your highest habit streak.
        </div>
      </div>

      {/* 🔮 Long Term Goals progress section */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-4 flex flex-col justify-between shadow-3xs">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-550" />
              Strategic Goals & Milestones
            </h3>
            
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Goal
            </button>
          </div>

          <AnimatePresence>
            {showGoalForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleGoalSubmit}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="text-xs font-bold text-slate-700">Set Core Target Goal</div>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. File All Quarterly Tax Units"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 text-[10px]">Target Date</span>
                      <input
                        type="date"
                        value={goalDate}
                        onChange={(e) => setGoalDate(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-slate-500 text-[10px]">Category</span>
                      <select
                        value={goalCat}
                        onChange={(e) => setGoalCat(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs focus:outline-none"
                      >
                        <option value="Academic">Academic</option>
                        <option value="Savings">Savings</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Career">Career</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => setShowGoalForm(false)} 
                    className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-2.5 py-1 text-[10px] bg-indigo-600 rounded font-bold text-white cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-4 max-h-[16rem] overflow-y-auto">
            {goals.map((gl) => (
              <div 
                key={gl.id}
                className="space-y-1.5 bg-slate-50/40 p-3 rounded-xl border border-slate-200/60"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800">{gl.title}</span>
                  <span className="font-mono text-indigo-700 font-bold">{gl.progress}%</span>
                </div>

                {/* Progress bar container */}
                <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-650 to-indigo-755"
                    style={{ width: `${gl.progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>Category: {gl.category}</span>
                  <span>Target: {new Date(gl.targetDate).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</span>
                </div>

                {/* Optional range slider to tweak goal progression on client */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Update Progress:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={gl.progress}
                    onChange={(e) => onUpdateGoalProgress(gl.id, Number(e.target.value))}
                    className="w-24 accent-indigo-600 cursor-pointer h-1.5 bg-slate-100 rounded"
                  />
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Milestone trophy status */}
        <div className="text-[10px] font-sans text-slate-500 pt-3 border-t border-slate-100 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
          Complete goals sequentially to accumulate coaching status points.
        </div>

      </div>

    </div>
  );
}
