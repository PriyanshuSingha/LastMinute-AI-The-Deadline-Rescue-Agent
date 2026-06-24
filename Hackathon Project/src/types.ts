/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  title: string;
  category: string; // 'Work', 'Study', 'Finance', 'Personal', 'Other'
  deadline: string; // ISO string 2026-06-22T22:04:55-07:00 or similar
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'Completed' | 'Overdue';
  estimatedEffort: number; // in hours
  description: string;
  
  // AI generated parameters
  aiPriorityScore?: number; // 0 - 100
  aiPriorityReason?: string;
  aiKeyFactors?: string[];
  
  riskProbability?: number; // 0 - 100
  riskExplanation?: string;
  riskSuggestions?: string[];
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  progress: number; // 0 - 100
  category: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'Daily' | 'Weekly';
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  history: { [date: string]: boolean }; // YYYY-MM-DD map
}

export interface AIPrioritizeItem {
  id: string;
  aiPriorityScore: number;
  aiPriorityReason: string;
  keyFactors: string[];
}

export interface AIScheduleSlot {
  timeSlot: string; // e.g. "09:00 AM - 10:30 AM"
  taskTitle: string;
  actionItem: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  focusTip: string;
}

export interface AIRiskResult {
  probability: number;
  explanation: string;
  factors: string[];
  customRescueStrategies: string[];
}

export interface RescueStep {
  sequence: number;
  durationMinutes: number;
  name: string;
  description: string;
  criticalPath: boolean;
}

export interface AIRescuePlan {
  urgencyScore: number; // 0-100
  crashSteps: RescueStep[];
  motivationStatement: string;
  aiCognitiveReframe?: string; // Cognitive psychology reframe for hyper-procrastination
}

export interface AICoachReport {
  assessmentHeadline: string;
  overallAnalytics: string;
  procrastinationRiskRating: 'Low' | 'Moderate' | 'Extreme';
  recommendedFocusHours: string;
  hourlyTactics: string[];
  psychologicalProcrastinationTrigger: string;
}

export interface AIVoiceResponse {
  answer: string;
  actionSuggested: string;
  affectedTaskId?: string;
}
