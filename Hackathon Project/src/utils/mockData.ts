/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Goal, Habit } from '../types';

export const CURRENT_TIME_STR = "2026-06-22T22:04:55-07:00";
export const CURRENT_TIME_MS = new Date(CURRENT_TIME_STR).getTime();

export const DEFAULT_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Quarterly Client Pitch Deck Pitch Design",
    category: "Work",
    deadline: "2026-06-22T23:59:00-07:00", // Tonight - 2 hours left!
    priority: "Critical",
    status: "Pending",
    estimatedEffort: 3.5,
    description: "Finalize visual slides, slide animations, and the financial forecast summary for the Q3 enterprise pitch. Pitch meeting is tomorrow at 8 AM.",
    aiPriorityScore: 98,
    aiPriorityReason: "Absolute emergency. Deadline is tonight and estimated effort exceeds time remaining. High probability of under-delivery without extreme focus.",
    aiKeyFactors: ["Severe time deficit", "High-stakes presentation", "Direct client visibility"],
    riskProbability: 88,
    riskExplanation: "With only ~2 hours remaining and 3.5 hours of estimated work, completing the deck normally is mathematically impossible unless non-essential slides are sliced.",
    riskSuggestions: [
      "Drop the detailed appendix slides and focus purely on the 5 core value propositions.",
      "Activate Rescue Mode checklist to stream slides directly into draft templates.",
      "Ask teammate Dan to review slides 1-4 while you focus on the pricing matrix."
    ]
  },
  {
    id: "task-2",
    title: "CS301 Major Term Paper Draft Submission",
    category: "Study",
    deadline: "2026-06-23T09:00:00-07:00", // Tomorrow morning - 11 hours left
    priority: "High",
    status: "Pending",
    estimatedEffort: 5,
    description: "Write the 10-page literature review section and compile bibliography for the Distributed Systems semester assignment.",
    aiPriorityScore: 85,
    aiPriorityReason: "Due in the morning. Deep cognitive work required. High impact on grade core parameters.",
    aiKeyFactors: ["Academic Grade weight", "High focus burden", "Tight morning schedule"],
    riskProbability: 60,
    riskExplanation: "Remaining time looks sufficient on paper, but sleeping hours will reduce your active window. Distraction risk is extreme due to length.",
    riskSuggestions: [
      "Write 3 summary blocks instead of full prose to lock in the passing criteria first.",
      "Block social media for 4 hours.",
      "Work in highly structured 45-minute Pomodoro sprints."
    ]
  },
  {
    id: "task-3",
    title: "Annual Tax Return Filing Form 1040",
    category: "Finance",
    deadline: "2026-06-20T17:00:00-07:00", // Overdue by 2 days
    priority: "Critical",
    status: "Overdue",
    estimatedEffort: 4,
    description: "Submit tax calculations, upload schedule C, check standard deductions, and authorize payment portal transfer.",
    aiPriorityScore: 95,
    aiPriorityReason: "Already overdue by 48 hours. Daily late penalties are compounding. Must be submitted immediately.",
    aiKeyFactors: ["Legal penalty risk", "Already overdue status", "Moderate effort of compilation"],
    riskProbability: 100,
    riskExplanation: "Overdue status. Immediate submission required to mitigate penalties.",
    riskSuggestions: [
      "Use basic default calculations instead of spending time optimization on minor deductions.",
      "Upload raw W2/Schedule C sheets first.",
      "Don't postpone for another day; file a rapid extension forms request if fully stuck."
    ]
  },
  {
    id: "task-4",
    title: "Renew Sports Car Insurance and Registration",
    category: "Finance",
    deadline: "2026-06-28T23:59:00-07:00", // 6 days left
    priority: "Medium",
    status: "Pending",
    estimatedEffort: 1,
    description: "Review automated renewal premiums from Geico, update the billing address, and pay via state DMV portal.",
    aiPriorityScore: 40,
    aiPriorityReason: "Ample room before deadline. Requires low focus and effort.",
    aiKeyFactors: ["Low complexity", "Distant deadline", "Linear completion flow"]
  },
  {
    id: "task-5",
    title: "Cardio Gym Workout Routine (3 Miles)",
    category: "Health",
    deadline: "2026-06-22T18:00:00-07:00", // Completed earlier today
    priority: "Low",
    status: "Completed",
    estimatedEffort: 1,
    description: "Complete HIIT cardio block and basic heavy structural squats to keep active.",
    aiPriorityScore: 10,
    aiPriorityReason: "Already completed successfully earlier today."
  },
  {
    id: "task-6",
    title: "Redox Organic Chemistry Lab Report",
    category: "Study",
    deadline: "2026-06-25T14:00:00-07:00", // 3 days left
    priority: "Medium",
    status: "Pending",
    estimatedEffort: 3,
    description: "Analyze the chemical reactions, write down balancing equations, and finalize the laboratory safety review notes."
  }
];

export const DEFAULT_HABITS: Habit[] = [
  {
    id: "habit-1",
    title: "60-Min Deep Work Focus Block",
    frequency: "Daily",
    streak: 5,
    lastCompletedDate: "2026-06-21",
    history: {
      "2026-06-17": true,
      "2026-06-18": true,
      "2026-06-19": true,
      "2026-06-20": true,
      "2026-06-21": true,
      "2026-06-22": false
    }
  },
  {
    id: "habit-2",
    title: "No-Snooze Morning Wakeup",
    frequency: "Daily",
    streak: 3,
    lastCompletedDate: "2026-06-22",
    history: {
      "2026-06-19": false,
      "2026-06-20": true,
      "2026-06-21": true,
      "2026-06-22": true
    }
  },
  {
    id: "habit-3",
    title: "Weekly Financial Ledger Balancing",
    frequency: "Weekly",
    streak: 12,
    lastCompletedDate: "2026-06-18",
    history: {
      "2026-06-04": true,
      "2026-06-11": true,
      "2026-06-18": true
    }
  }
];

export const DEFAULT_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "Maintain 4.0 GPA Semester Score",
    targetDate: "2026-07-15",
    progress: 85,
    category: "Academic"
  },
  {
    id: "goal-2",
    title: "Build $10k Emergency Cash Ledger",
    targetDate: "2026-12-31",
    progress: 60,
    category: "Savings"
  },
  {
    id: "goal-3",
    title: "Run a Half Marathon",
    targetDate: "2026-10-01",
    progress: 40,
    category: "Fitness"
  }
];

/**
 * Calculates remaining hours from system current time to target date
 */
export function getHoursRemaining(targetDateStr: string): number {
  const targetMs = new Date(targetDateStr).getTime();
  const diffMs = targetMs - CURRENT_TIME_MS;
  return diffMs / (1000 * 60 * 60);
}

/**
 * Friendly remaining time breakdown text
 */
export function formatTimeRemaining(targetDateStr: string): string {
  const hours = getHoursRemaining(targetDateStr);
  if (hours < 0) {
    const overdueHours = Math.abs(hours);
    if (overdueHours < 1) return `Overdue by ${Math.round(overdueHours * 60)}m`;
    if (overdueHours < 24) return `Overdue by ${Math.floor(overdueHours)}h`;
    return `Overdue by ${Math.floor(overdueHours / 24)}d ${Math.floor(overdueHours % 24)}h`;
  }
  
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m left`;
  }
  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${mins}m left`;
  }
  const days = Math.floor(hours / 24);
  const leftHours = Math.floor(hours % 24);
  return `${days}d ${leftHours}h left`;
}
