/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, BookOpen, CircleDollarSign, ShieldAlert, Heart, HelpCircle, 
  Plus, Calendar as CalendarIcon, Clock, CheckCircle2, TrendingUp, Sparkles, AlertTriangle, Play, CalendarPlus, BarChart3, PieChartIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { Task } from '../types';
import { formatTimeRemaining } from '../utils/mockData';

interface DashboardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onPrioritizeAI: () => Promise<void>;
  onPredictRiskAI: (task: Task) => Promise<void>;
  isPrioritizing: boolean;
  selectedTaskForRisk: string | null;
  predictingRiskId: string | null;
  onSelectRescueTask: (task: Task) => void;
  onSyncTaskToCalendar?: (task: Task) => Promise<void>;
  googleToken?: string | null;
}

export default function Dashboard({
  tasks,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onPrioritizeAI,
  onPredictRiskAI,
  isPrioritizing,
  selectedTaskForRisk,
  predictingRiskId,
  onSelectRescueTask,
  onSyncTaskToCalendar,
  googleToken
}: DashboardProps) {
  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const hh = String(tomorrow.getHours()).padStart(2, '0');
    const min = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [deadline, setDeadline] = useState(getTomorrowString);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [estimatedEffort, setEstimatedEffort] = useState(2);
  const [description, setDescription] = useState('');
  
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Overdue' | 'Completed'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Stats calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
  
  // Calculate a mock smart Productivity score
  const productivityScore = totalTasks > 0 
    ? Math.round(((completedTasks + (pendingTasks * 0.2)) / totalTasks) * 100)
    : 0;

  // Filter tasks based on settings
  const filteredTasks = tasks.filter(t => {
    if (filter === 'Pending' && t.status !== 'Pending') return false;
    if (filter === 'Overdue' && t.status !== 'Overdue') return false;
    if (filter === 'Completed' && t.status !== 'Completed') return false;
    
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    return true;
  });

  // Sort tasks: Urgent AI score first, then Critical category
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const scoreA = a.aiPriorityScore || (a.priority === 'Critical' ? 90 : a.priority === 'High' ? 70 : a.priority === 'Medium' ? 40 : 15);
    const scoreB = b.aiPriorityScore || (b.priority === 'Critical' ? 90 : b.priority === 'High' ? 70 : b.priority === 'Medium' ? 40 : 15);
    return scoreB - scoreA;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Work': return <Briefcase className="w-4 h-4 text-sky-600" />;
      case 'Study': return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'Finance': return <CircleDollarSign className="w-4 h-4 text-amber-600" />;
      case 'Health': return <Heart className="w-4 h-4 text-rose-600" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPriorityColor = (pr: string) => {
    switch (pr) {
      case 'Critical': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'High': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Medium': return 'bg-sky-50 text-sky-700 border border-sky-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title,
      category,
      deadline,
      priority,
      status: 'Pending',
      estimatedEffort: Number(estimatedEffort),
      description
    });
    // Reset state
    setTitle('');
    setCategory('Work');
    setDeadline(getTomorrowString());
    setPriority('Medium');
    setEstimatedEffort(2);
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <div id="smart-dashboard" className="space-y-6">
      
      {/* 🚀 Header Actions & AI Prioritize trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold font-sans tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            Adaptive Task Priority Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze with Gemini blockages, proximity metrics, and effort parameters to reorder your workflow dynamically.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-ai-prioritize"
            onClick={onPrioritizeAI}
            disabled={isPrioritizing || tasks.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl border border-indigo-600/40 transition-all flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isPrioritizing ? 'animate-spin' : ''}`} />
            {isPrioritizing ? 'AI Prioritizing...' : 'Run Smart AI Prioritizer'}
          </button>
          
          <button
            id="btn-show-add-task"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-3xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* 📊 Analytics Bento Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-3xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">Total Backlog</span>
            <div className="text-xl font-bold font-sans text-slate-900 dark:text-slate-100">{totalTasks}</div>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-3xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555">Secure Done</span>
            <div className="text-xl font-bold font-sans text-emerald-650">{completedTasks}</div>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-650 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-3xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-500 animate-pulse" /> Overdue
            </span>
            <div className="text-xl font-bold font-sans text-rose-650">{overdueTasks}</div>
          </div>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-rose-650 border border-rose-100 dark:border-rose-900/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between shadow-3xs">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-550 dark:text-indigo-400">Productivity Index</span>
            <div className="text-xl font-bold font-sans text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5">
              {productivityScore}%
              <span className="text-[10px] font-normal text-slate-405 dark:text-slate-500">lvl</span>
            </div>
          </div>
          <div className="p-2 bg-indigo-100/65 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/30">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* 📊 REAL TIME PRODUCTIVITY ANALYTICS WITH RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COMPLETED VS PENDING BY PRIORITY */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-3xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Task Completion by Priority</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Live breakdown of Done vs Pending items</p>
            </div>
          </div>

          <div className="h-56 w-full">
            {tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Add tasks to visualize priority completion rates.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={['Low', 'Medium', 'High', 'Critical'].map(pr => ({
                    name: pr,
                    Completed: tasks.filter(t => t.priority === pr && t.status === 'Completed').length,
                    Pending: tasks.filter(t => t.priority === pr && t.status !== 'Completed').length,
                  }))} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }} 
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed Tasks" />
                  <Bar dataKey="Pending" fill="#6366f1" radius={[4, 4, 0, 0]} name="Pending Tasks" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* WORKLOAD DISTRIBUTION BY CATEGORY */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-3xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1 px-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-lg">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">Estimated Effort Allocations</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Cumulative estimated workload in hours per category</p>
            </div>
          </div>

          <div className="h-56 w-full">
            {tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                No active tasks to compute category workloads.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={Array.from(new Set(tasks.map(t => t.category))).map(cat => ({
                    name: cat,
                    Hours: tasks.filter(t => t.category === cat).reduce((sum, current) => sum + (current.estimatedEffort || 0), 0)
                  }))} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} unit="hr" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                    }} 
                  />
                  <Area type="monotone" dataKey="Hours" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" name="Effort (Hours)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* 📑 Add Task Form Drawer */}
      {showAddForm && (
        <form
          id="add-task-form"
          onSubmit={handleSubmit}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all duration-200"
        >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">New Task Parameters</h3>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="text-xs font-mono text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
              >
                Close [esc]
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Draft CS Lecture Notes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Work">💼 Work</option>
                  <option value="Study">📚 Study</option>
                  <option value="Finance">💵 Finance</option>
                  <option value="Health">❤️ Health</option>
                  <option value="Other">🌀 Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deadline Target</label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Priority Level</label>
                <div className="flex gap-2">
                  {(['Low', 'Medium', 'High', 'Critical'] as const).map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setPriority(pr)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        priority === pr 
                          ? 'border-indigo-550 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-705 dark:text-indigo-300' 
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-450'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Estimated Effort (Hours): <span className="text-indigo-600 dark:text-indigo-400 font-bold">{estimatedEffort}h</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={estimatedEffort}
                  onChange={(e) => setEstimatedEffort(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Notes / Scope details</label>
              <textarea
                placeholder="Details of assignments, links, criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-850 dark:text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Submit Task Parameters
              </button>
            </div>
          </form>
        )}

      {/* 🧭 Filters & Categories segment */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          {(['All', 'Pending', 'Overdue', 'Completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                filter === st 
                  ? 'bg-slate-900 dark:bg-slate-150 text-white dark:text-slate-900 border-slate-950 dark:border-white font-bold animate-pulse-once' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 shadow-3xs'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-slate-450 dark:text-slate-500 font-mono">Category:</span>
          {['All', 'Work', 'Study', 'Finance', 'Health'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40 text-indigo-705 dark:text-indigo-300 font-semibold' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* 📋 Tasks Grid / Stack */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-3xs">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching task elements</h4>
            <p className="text-xs text-slate-400 mt-1">Try changing filters or add a new parameter block.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sortedTasks.map((task) => {
              const isCrit = task.priority === 'Critical' || task.status === 'Overdue';
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  id={`task-node-${task.id}`}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    task.status === 'Completed'
                      ? 'bg-slate-100/55 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/60 opacity-60'
                      : isCrit
                      ? 'bg-rose-50/25 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/40 hover:bg-rose-50/40 dark:hover:bg-rose-950/15 hover:border-rose-300 dark:hover:border-rose-800 shadow-3xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-850 hover:border-slate-300 shadow-3xs'
                  }`}
                >
                  
                  {/* Left segment - Checkbox, Info & Meta */}
                  <div className="flex items-start gap-3.5 flex-1 max-w-2xl">
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      className={`mt-1 h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                        task.status === 'Completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-indigo-500'
                      }`}
                    >
                      {task.status === 'Completed' && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Category label */}
                        <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200/60 dark:border-slate-850">
                          {getCategoryIcon(task.category)}
                          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{task.category}</span>
                        </span>

                        {/* Priority Badge */}
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>

                        {/* AI priority score indicator */}
                        {task.aiPriorityScore !== undefined && (
                          <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-650 dark:text-indigo-400 animate-pulse" />
                            AI Pri: {task.aiPriorityScore}/100
                          </span>
                        )}

                        {/* Overdue/Urgent Warnings */}
                        {task.status === 'Overdue' && (
                          <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/40 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-650" />
                            OVERDUE
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100 mt-1 ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Display calculations of AI priorities and factors */}
                      {task.aiPriorityReason && (
                        <div className="mt-2.5 p-3 bg-indigo-50/45 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-300">
                          <span className="font-bold font-mono text-indigo-805 dark:text-indigo-400">Gemini Diagnostic:</span> {task.aiPriorityReason}
                          {task.aiKeyFactors && task.aiKeyFactors.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {task.aiKeyFactors.map((f, idx) => (
                                <span key={idx} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                                  #{f}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Render Risk prediction if analyzed */}
                      {task.riskProbability !== undefined && (
                        <div className="mt-2 p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 text-xs space-y-1 text-slate-800 dark:text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-rose-700 dark:text-rose-450 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              Deadline Miss Risk: {task.riskProbability}%
                            </span>
                          </div>
                          <p className="text-slate-655 dark:text-slate-400 text-[11px] leading-relaxed">{task.riskExplanation}</p>
                          {task.riskSuggestions && task.riskSuggestions.length > 0 && (
                            <div className="pt-2 border-t border-rose-100 dark:border-rose-900/30 space-y-1">
                              <span className="text-rose-800 dark:text-rose-400 text-[10px] font-bold">Rescue Tactics:</span>
                              {task.riskSuggestions.map((s, idx) => (
                                <p key={idx} className="text-slate-755 dark:text-slate-405 text-[10px] leading-relaxed pl-2 border-l-2 border-rose-300 dark:border-rose-700">
                                  • {s}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right segment - Deadlines & Urgent Rescue Actions */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3 min-w-[12rem] bg-slate-50 dark:bg-slate-950/40 md:bg-transparent p-3 md:p-0 rounded-xl">
                    <div className="space-y-1">
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-450 flex items-center gap-1 font-semibold">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        Due: {new Date(task.deadline).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                      </div>
                      <div className={`text-xs font-mono font-extrabold flex items-center gap-1 ${
                        task.status === 'Completed'
                          ? 'text-emerald-600'
                          : isCrit
                          ? 'text-rose-600 dark:text-rose-405 animate-pulse'
                          : 'text-amber-600'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {task.status === 'Completed' ? 'Finished' : formatTimeRemaining(task.deadline)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Effort: <span className="text-slate-700 dark:text-slate-300 font-bold">{task.estimatedEffort}h</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {/* Risk analysis trigger */}
                      {task.status !== 'Completed' && (
                        <button
                          id={`btn-predict-risk-${task.id}`}
                          onClick={() => onPredictRiskAI(task)}
                          disabled={predictingRiskId === task.id}
                          className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-700 hover:border-rose-200/50 text-slate-700 dark:text-slate-350 hover:text-rose-700 rounded-lg text-xs transition-colors font-semibold cursor-pointer"
                        >
                          {predictingRiskId === task.id ? 'Analyzing...' : 'Predict Risk'}
                        </button>
                      )}

                      {/* Google Calendar export trigger */}
                      {task.status !== 'Completed' && onSyncTaskToCalendar && (
                        <button
                          id={`btn-calendar-sync-${task.id}`}
                          onClick={() => onSyncTaskToCalendar(task)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-900/40 text-indigo-705 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Schedule this deadline explicitly to Google Calendar"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Sync Cal</span>
                        </button>
                      )}

                      {/* Rescue Mode deployment */}
                      {task.status !== 'Completed' && (
                        <button
                          id={`btn-rescue-deploy-${task.id}`}
                          onClick={() => onSelectRescueTask(task)}
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm shadow-rose-950/10 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          Rescue
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="px-2 py-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-xs font-semibold cursor-pointer"
                        title="Delete Task Details"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
