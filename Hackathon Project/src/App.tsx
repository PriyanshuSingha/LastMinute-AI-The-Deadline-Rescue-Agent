/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Flame, ShieldAlert, Brain, Calendar as CalendarIcon, 
  MessageSquare, LayoutDashboard, Target, Bot, AlertTriangle, X, Volume2, Zap,
  Sun, Moon, LogOut, CalendarRange, Medal, BarChart3
} from 'lucide-react';

import { Task, Habit, Goal, AIScheduleSlot, AIRescuePlan, AICoachReport, AIVoiceResponse } from './types';
import { 
  DEFAULT_TASKS, DEFAULT_HABITS, DEFAULT_GOALS, 
  CURRENT_TIME_STR, CURRENT_TIME_MS 
} from './utils/mockData';

// Firebase Imports
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  saveTasksToFirestore, 
  saveHabitsToFirestore, 
  saveGoalsToFirestore, 
  fetchUserDataFromFirestore 
} from './lib/firebase';

// Sub-components
import Dashboard from './components/Dashboard';
import DailyPlanner from './components/DailyPlanner';
import RiskPredictor from './components/RiskPredictor';
import RescueMode from './components/RescueMode';
import CoachReport from './components/CoachReport';
import VoiceAssistant from './components/VoiceAssistant';
import HabitsGoals from './components/HabitsGoals';
import CalendarView from './components/CalendarView';

type AppTab = 'Dashboard' | 'Planner' | 'Habits' | 'Calendar' | 'Coach' | 'Rescue';

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return window.localStorage ? window.localStorage.getItem(key) : null;
    } catch (e) {
      console.warn("Storage access blocked:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("Storage save blocked:", e);
    }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('Dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = safeStorage.getItem('lastminute_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    // Default to light or check media query defensibly
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // Toggle dark class when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      safeStorage.setItem('lastminute_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      safeStorage.setItem('lastminute_dark_mode', 'false');
    }
  }, [darkMode]);
  
  // AI states
  const [schedule, setSchedule ] = useState<AIScheduleSlot[]>([]);
  const [rescuePlan, setRescuePlan] = useState<AIRescuePlan | null>(null);
  const [activeRescueTask, setActiveRescueTask] = useState<Task | null>(null);
  const [coachReport, setCoachReport] = useState<AICoachReport | null>(null);
  const [selectedTaskForRisk, setSelectedTaskForRisk] = useState<string | null>(null);
  const [riskResult, setRiskResult] = useState<any | null>(null);

  // Loadings
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [isGeneratingRescuePlan, setIsGeneratingRescuePlan] = useState(false);
  const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);
  const [predictingRiskId, setPredictingRiskId] = useState<string | null>(null);
  const [isVoiceAssistantResponding, setIsVoiceAssistantResponding] = useState(false);

  // Global Info/Alarm logs
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showVoiceFloating, setShowVoiceFloating] = useState(false);

  // Authentication & Google Workspace SDK integration states
  const [user, setUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Mount listeners for Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setGoogleToken(token);
      },
      () => {
        setUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch Cloud Firestore states dynamically when user changes
  useEffect(() => {
    if (user?.uid) {
      fetchUserDataFromFirestore(user.uid).then((cloudData) => {
        if (cloudData) {
          if (cloudData.tasks && cloudData.tasks.length > 0) setTasks(cloudData.tasks);
          if (cloudData.habits && cloudData.habits.length > 0) setHabits(cloudData.habits);
          if (cloudData.goals && cloudData.goals.length > 0) setGoals(cloudData.goals);
        }
      });
    }
  }, [user]);

  // Auth Operations
  const handleDemoLogin = () => {
    const demoUser = {
      uid: 'demo-user-focuser-123',
      displayName: 'Demo Focuser',
      email: 'demo@example.com',
      photoURL: null
    };
    setUser(demoUser);
    setGoogleToken('demo-mock-token-456');
    setAlertMessage("Successfully signed into the local simulated Cloud Sandbox! Feel free to sync calendars, save habits, and utilize active backlogs.");
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAlertMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setGoogleToken(result.accessToken);
        // Bulk push local details up to ensure seamless transition
        if (tasks.length > 0) {
          await saveTasksToFirestore(result.user.uid, tasks);
        }
        if (habits.length > 0) {
          await saveHabitsToFirestore(result.user.uid, habits);
        }
        if (goals.length > 0) {
          await saveGoalsToFirestore(result.user.uid, goals);
        }
      }
    } catch (err: any) {
      console.error("Authorization failed:", err);
      const errMsg = String(err?.message || err?.code || err?.stack || err || '').toLowerCase();
      const isPopupRestricted = 
        errMsg.includes('popup-closed-by-user') || 
        errMsg.includes('popup_closed_by_user') || 
        errMsg.includes('popup-blocked') || 
        errMsg.includes('popup_blocked') || 
        errMsg.includes('cancelled-popup-request') || 
        errMsg.includes('cancelled_popup_request') ||
        errMsg.includes('pending promise') ||
        errMsg.includes('internal assertion');

      if (isPopupRestricted) {
        setAlertMessage(
          "Google Sign-In popup was blocked, closed, or interrupted. Since the application resides inside an iframe workspace preview, browsers can restrict authorization popups. To resolve this: 1) Click the 'Open in New Tab' icon on the top-right to sign in smoothly, or 2) Click the 'Demo Account' button in the header to immediately log in without popups!"
        );
      } else {
        setAlertMessage(`Sign in failed or was cancelled: ${err?.message || "Verify your internet and popup permissions, then try again."}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setGoogleToken(null);
      setAlertMessage("Successfully signed out. Falling back to secure local sandbox.");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  // Google Calendar Syner
  const handleSyncTaskToCalendar = async (task: Task) => {
    if (!googleToken) {
      const confirmAuth = window.confirm("Scheduling to Google Calendar requires account authentication with Calendar permissions. Connect now?");
      if (confirmAuth) {
        await handleLogin();
      }
      return;
    }

    try {
      // Explicit user confirmation dialogue for mutations as required
      const confirmAction = window.confirm(`Confirm export: Add task "${task.title}" to Google Calendar at its target deadline?`);
      if (!confirmAction) return;

      const deadlineTime = new Date(task.deadline);
      const endTimeISO = deadlineTime.toISOString();
      const startTimeISO = new Date(deadlineTime.getTime() - (task.estimatedEffort || 1) * 60 * 60 * 1000).toISOString();

      const calendarEvent = {
        summary: `🔔 [LastMinute] ${task.title}`,
        description: `${task.description || ''}\n\nPriority: ${task.priority}\nCategory: ${task.category}\nScheduled with LastMinute AI.`,
        start: {
          dateTime: startTimeISO,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        },
        end: {
          dateTime: endTimeISO,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        }
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEvent)
      });

      if (response.ok) {
        alert(`Successfully synchronized "${task.title}" to Google Calendar!`);
      } else {
        const errDetails = await response.json();
        console.warn("Calendar API returned error details:", errDetails);
        alert(`Calendar sync rejected: ${errDetails?.error?.message || response.statusText}`);
      }
    } catch (err: any) {
      console.warn("Could not dispatch to calendar:", err);
      alert(`Calendar dispatch crashed: ${err.message}`);
    }
  };

  // Initialize and load state from localStorage
  useEffect(() => {
    const cachedTasks = safeStorage.getItem('lastminute_tasks');
    const cachedHabits = safeStorage.getItem('lastminute_habits');
    const cachedGoals = safeStorage.getItem('lastminute_goals');

    if (cachedTasks) {
      setTasks(JSON.parse(cachedTasks));
    } else {
      setTasks(DEFAULT_TASKS);
      safeStorage.setItem('lastminute_tasks', JSON.stringify(DEFAULT_TASKS));
    }

    if (cachedHabits) {
      setHabits(JSON.parse(cachedHabits));
    } else {
      setHabits(DEFAULT_HABITS);
      safeStorage.setItem('lastminute_habits', JSON.stringify(DEFAULT_HABITS));
    }

    if (cachedGoals) {
      setGoals(JSON.parse(cachedGoals));
    } else {
      setGoals(DEFAULT_GOALS);
      safeStorage.setItem('lastminute_goals', JSON.stringify(DEFAULT_GOALS));
    }
  }, []);

  // Sync state to localstorage and Firestore
  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    safeStorage.setItem('lastminute_tasks', JSON.stringify(updated));
    if (user?.uid) {
      saveTasksToFirestore(user.uid, updated);
    }
  };

  const saveHabits = (updated: Habit[]) => {
    setHabits(updated);
    safeStorage.setItem('lastminute_habits', JSON.stringify(updated));
    if (user?.uid) {
      saveHabitsToFirestore(user.uid, updated);
    }
  };

  const saveGoals = (updated: Goal[]) => {
    setGoals(updated);
    safeStorage.setItem('lastminute_goals', JSON.stringify(updated));
    if (user?.uid) {
      saveGoalsToFirestore(user.uid, updated);
    }
  };

  // Task Mutators
  const handleAddTask = (newTask: Omit<Task, 'id'>) => {
    const task: Task = {
      ...newTask,
      id: `task-${Date.now()}`
    };
    const updated = [...tasks, task];
    saveTasks(updated);
  };

  const handleToggleComplete = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
    if (activeRescueTask?.id === id) {
      setActiveRescueTask(null);
      setRescuePlan(null);
    }
  };

  // Habits Mutators
  const handleAddHabit = (newHb: Omit<Habit, 'id' | 'streak' | 'history'>) => {
    const habit: Habit = {
      ...newHb,
      id: `habit-${Date.now()}`,
      streak: 0,
      history: {}
    };
    const updated = [...habits, habit];
    saveHabits(updated);
  };

  const handleToggleHabit = (id: string, date: string) => {
    const updated = habits.map(h => {
      if (h.id === id) {
        const currentCheck = h.history[date] === true;
        const historyCopy = { ...h.history, [date]: !currentCheck };
        const streakModifier = !currentCheck ? 1 : -1;
        const newStreak = Math.max(0, h.streak + streakModifier);
        return {
          ...h,
          streak: newStreak,
          lastCompletedDate: !currentCheck ? date : h.lastCompletedDate,
          history: historyCopy
        };
      }
      return h;
    });
    saveHabits(updated);
  };

  // Goals Mutators
  const handleAddGoal = (newGl: Omit<Goal, 'id'>) => {
    const goal: Goal = {
      ...newGl,
      id: `goal-${Date.now()}`
    };
    const updated = [...goals, goal];
    saveGoals(updated);
  };

  const handleUpdateGoalProgress = (id: string, progress: number) => {
    const updated = goals.map(g => g.id === id ? { ...g, progress } : g);
    saveGoals(updated);
  };

  // API Call: AI Prioritizer Action
  const handlePrioritizeAI = async () => {
    setIsPrioritizing(true);
    setAlertMessage(null);
    try {
      const response = await fetch('/api/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });
      
      const data = await response.json();
      if (data.prioritizedTasks && Array.isArray(data.prioritizedTasks)) {
        const updated = tasks.map(t => {
          const match = data.prioritizedTasks.find((item: any) => item.id === t.id);
          if (match) {
            return {
              ...t,
              aiPriorityScore: match.aiPriorityScore,
              aiPriorityReason: match.aiPriorityReason,
              aiKeyFactors: match.keyFactors
            };
          }
          return t;
        });
        saveTasks(updated);
      } else if (data.error) {
        setAlertMessage(`AI Prioritization notice: ${data.error}`);
      }
    } catch (err: any) {
      setAlertMessage("Gemini connection pending. Check your API key under Settings > Secrets.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  // API Call: AI Scheduler
  const handleGeneratePlanner = async (selectedIds: string[]) => {
    setIsGeneratingPlanner(true);
    setAlertMessage(null);
    const targetTasks = tasks.filter(t => selectedIds.includes(t.id));
    try {
      const response = await fetch('/api/daily-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: targetTasks, date: '2026-06-22' }),
      });
      const data = await response.json();
      if (data.schedule && Array.isArray(data.schedule)) {
        setSchedule(data.schedule);
      } else if (data.error) {
        setAlertMessage(`AI Scheduler error: ${data.error}`);
      }
    } catch (err) {
      setAlertMessage("Scheduler synthesis pending connection parameters.");
    } finally {
      setIsGeneratingPlanner(false);
    }
  };

  // API Call: Risk Assessment
  const handlePredictRisk = async (targetTask: Task) => {
    setPredictingRiskId(targetTask.id);
    setSelectedTaskForRisk(targetTask.id);
    setAlertMessage(null);
    try {
      const response = await fetch('/api/risk-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: targetTask }),
      });
      const data = await response.json();
      if (data.probability !== undefined) {
        setRiskResult(data);
        const updated = tasks.map(t => {
          if (t.id === targetTask.id) {
            return {
              ...t,
              riskProbability: data.probability,
              riskExplanation: data.explanation,
              riskSuggestions: data.customRescueStrategies
            };
          }
          return t;
        });
        saveTasks(updated);
      } else if (data.error) {
        setAlertMessage(`AI Risk Prediction notice: ${data.error}`);
      }
    } catch (err) {
      setAlertMessage("Risk calculation deferred pending endpoint setup.");
    } finally {
      setPredictingRiskId(null);
    }
  };

  // API Call: Rescue steps workflow generator
  const handleGenerateRescuePlan = async (targetTask: Task, timeLeftHours: number) => {
    setIsGeneratingRescuePlan(true);
    setAlertMessage(null);
    try {
      const response = await fetch('/api/rescue-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: targetTask, timeLeftHours }),
      });
      const data = await response.json();
      if (data.crashSteps && Array.isArray(data.crashSteps)) {
        setRescuePlan(data);
      } else if (data.error) {
        setAlertMessage(`Rescue Planning notice: ${data.error}`);
      }
    } catch (err) {
      setAlertMessage("Rescue blueprint formulation error. Re-checking key maps.");
    } finally {
      setIsGeneratingRescuePlan(false);
    }
  };

  // API Call: Accountability coach reports compilation
  const handleTriggerCoach = async () => {
    setIsGeneratingCoach(true);
    setAlertMessage(null);
    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, habits, goals }),
      });
      const data = await response.json();
      if (data.assessmentHeadline) {
        setCoachReport(data);
      } else if (data.error) {
        setAlertMessage(`Accountability Coach notice: ${data.error}`);
      }
    } catch (e) {
      setAlertMessage("Diagnostics deferred. Verify API Secrets.");
    } finally {
      setIsGeneratingCoach(false);
    }
  };

  // API Call: Voice assistant speech response
  const handleVoiceAssistantQuery = async (query: string): Promise<AIVoiceResponse> => {
    setIsVoiceAssistantResponding(true);
    try {
      const response = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, tasks }),
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        answer: "Apologies. My analytical link timed out. Add your API key in the Settings > Secrets panel of Google AI Studio.",
        actionSuggested: "File your annual standard taxes first!"
      };
    } finally {
      setIsVoiceAssistantResponding(false);
    }
  };

  const handleSelectRescueTask = (targetTask: Task) => {
    setActiveRescueTask(targetTask);
    setRescuePlan(null); // clear old plan to let load trigger
    setActiveTab('Rescue');
  };

  const handleFocusTaskNode = (taskId: string) => {
    setActiveTab('Dashboard');
    setShowVoiceFloating(false);
    setTimeout(() => {
      const element = document.getElementById(`task-node-${taskId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
        }, 3000);
      }
    }, 200);
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const overdueCount = tasks.filter(t => t.status === 'Overdue').length;
  const productivityScore = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col lg:flex-row transition-colors duration-300">
      
      {/* 🚀 Sleek Professional Left Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex-col flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold relative overflow-hidden group">
              <Zap className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform" />
            </div>
            <div>
              <h1 className="text-md font-bold font-sans tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                LastMinute AI 
                <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30 px-1.5 py-0.2 rounded font-bold">
                  v2.5
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">The Deadline Rescue Agent</p>
            </div>
          </div>
        </div>
 
        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {[
            { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'Planner', label: 'Daily Planner', icon: Sparkles },
            { id: 'Habits', label: 'Atomic Habits', icon: Flame },
            { id: 'Calendar', label: 'Deadline Calendar', icon: CalendarIcon },
            { id: 'Coach', label: 'AI Performance Coach', icon: Brain },
            { id: 'Rescue', label: '🚨 Emergency Rescue', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AppTab)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-450 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
 
        {/* Sidebar Dynamic Productivity score status block */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-3xs">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Productivity Score</span>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-black font-sans text-slate-800 dark:text-slate-100">{productivityScore}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
                {productivityScore > 50 ? '↑ Optimal' : '↓ Attention'}
              </span>
            </div>
            {/* Real Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${productivityScore}%` }} />
            </div>
          </div>
        </div>

        {/* Theme Switcher block */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold flex items-center justify-between text-slate-750 dark:text-slate-250 cursor-pointer shadow-3xs transition-all"
          >
            <div className="flex items-center gap-2">
              {darkMode ? <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[9px] font-mono uppercase text-slate-400 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700">Sync</span>
          </button>
        </div>
      </aside>
 
      {/* 🚀 Right Main Area with Content Grid */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-4">
            <h2 className="text-[15px] font-bold text-slate-850 dark:text-slate-100">Welcome Back</h2>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 text-[10px] font-extrabold uppercase rounded-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                {tasks.filter(t => t.status !== 'Completed').length} Pending Tasks
              </span>
              {overdueCount > 0 && (
                <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 text-[10px] font-extrabold uppercase rounded-lg">
                  {overdueCount} Overdue
                </span>
              )}
            </div>
          </div>
 
          <div className="flex items-center gap-4">
            {/* Quick Toggle in Header */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
              title="Toggle Theme Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Ask Assistant trigger */}
            <button
              onClick={() => setShowVoiceFloating(!showVoiceFloating)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 animate-pulse" />
              <span>Ask Gemini</span>
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <img
                  src={user.photoURL || undefined}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-xl border border-indigo-200 dark:border-indigo-900 shadow-3xs object-cover"
                />
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDemoLogin}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-3xs transition-all cursor-pointer flex items-center gap-1"
                  title="Bypass popup checks and log in instantly with simulated cloud features"
                >
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span>Demo Mode</span>
                </button>
                <button
                  onClick={handleLogin}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.78 0 3.37.61 4.62 1.8l3.46-3.46C17.99 1.19 15.24.5 12 .5 7.37.5 3.37 3.19 1.42 7.11l3.99 3.09C6.37 7.15 8.97 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-1.99 3.42-4.91 3.42-8.69z" />
                    <path fill="#FBBC05" d="M5.41 14.39c-.24-.71-.38-1.48-.38-2.27s.14-1.56.38-2.27L1.42 6.76C.52 8.54 0 10.51 0 12.5s.52 3.96 1.42 5.74l3.99-3.85z" />
                    <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.03 0-5.63-2.11-6.59-5.16L1.42 16.74c1.95 3.92 5.95 6.76 10.58 6.76z" />
                  </svg>
                  <span>Sign in</span>
                </button>
              </div>
            )}
          </div>
        </header>
 
        {/* Mobile Navigation Header (Only visible below lg breakpoint) */}
        <div className="lg:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-16 z-20 px-4 py-2 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none transition-colors">
          {(['Dashboard', 'Planner', 'Habits', 'Calendar', 'Coach', 'Rescue'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {tab === 'Rescue' ? '🚨 Rescue' : tab === 'Coach' ? '🧠 Coach' : tab}
              </button>
            );
          })}
        </div>

        {/* Outer scrolling content grid container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* 🚨 Critical Alerts Hub (Warnings if no Secrets or endpoint blockages) */}
          {alertMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 relative shadow-xs"
            >
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 animate-pulse shrink-0" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-800 font-mono">System Notice</h4>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed pr-8">
                  {alertMessage}
                </p>
              </div>
              <button
                onClick={() => setAlertMessage(null)}
                className="absolute right-3 top-3 text-amber-400 hover:text-amber-600"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* 💫 Core workspace dispatcher router */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'Dashboard' && (
                <Dashboard
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  onPrioritizeAI={handlePrioritizeAI}
                  onPredictRiskAI={handlePredictRisk}
                  isPrioritizing={isPrioritizing}
                  selectedTaskForRisk={selectedTaskForRisk}
                  predictingRiskId={predictingRiskId}
                  onSelectRescueTask={handleSelectRescueTask}
                  onSyncTaskToCalendar={handleSyncTaskToCalendar}
                  googleToken={googleToken}
                />
              )}

              {activeTab === 'Planner' && (
                <DailyPlanner
                  tasks={tasks}
                  onGeneratePlanner={handleGeneratePlanner}
                  schedule={schedule}
                  isGenerating={isGeneratingPlanner}
                  onSyncTaskToCalendar={handleSyncTaskToCalendar}
                />
              )}

              {activeTab === 'Habits' && (
                <HabitsGoals
                  habits={habits}
                  goals={goals}
                  onAddHabit={handleAddHabit}
                  onAddGoal={handleAddGoal}
                  onToggleHabit={handleToggleHabit}
                  onUpdateGoalProgress={handleUpdateGoalProgress}
                  currentUser={user}
                />
              )}

              {activeTab === 'Calendar' && (
                <CalendarView
                  tasks={tasks}
                  onSelectRescueTask={handleSelectRescueTask}
                />
              )}

              {activeTab === 'Coach' && (
                <CoachReport
                  tasks={tasks}
                  habits={habits}
                  goals={goals}
                  onTriggerCoach={handleTriggerCoach}
                  report={coachReport}
                  isGenerating={isGeneratingCoach}
                />
              )}

              {activeTab === 'Rescue' && (
                <RescueMode
                  task={activeRescueTask}
                  onGeneratePlan={handleGenerateRescuePlan}
                  rescuePlan={rescuePlan}
                  isGenerating={isGeneratingRescuePlan}
                  onTaskCompleted={(id) => {
                    handleToggleComplete(id);
                    setActiveRescueTask(null);
                    setRescuePlan(null);
                    setActiveTab('Dashboard');
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

        </main>
      </div>

      {/* Collapsible / floating side assistant drawer */}
      <AnimatePresence>
        {showVoiceFloating && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Survival Assistant Unit</span>
                <button
                  onClick={() => setShowVoiceFloating(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-4 min-h-0">
                <VoiceAssistant
                  tasks={tasks}
                  onVoiceQuery={handleVoiceAssistantQuery}
                  isResponding={isVoiceAssistantResponding}
                  onFocusTaskNode={handleFocusTaskNode}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
