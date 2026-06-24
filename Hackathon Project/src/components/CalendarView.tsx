/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Info, ShieldAlert } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  onSelectRescueTask: (task: Task) => void;
}

export default function CalendarView({
  tasks,
  onSelectRescueTask
}: CalendarViewProps) {
  // Calendar aligned specifically to June 2026 (target date is June 22, 2026)
  const currentYear = 2026;
  const currentMonthNum = 5; // 0-indexed (June is 5)
  
  // Total days in June: 30 days
  // June 1, 2026 was a Monday
  const DAYS_IN_MONTH = 30;
  const START_DAY_OFFSET = 1; // 1 = Monday. (Sunday is 0, Mon is 1...)

  const [selectedDay, setSelectedDay] = useState<number | null>(22); // Default to June 22 (today)

  // Map tasks specifically to particular days of June 2026
  const getTasksForDay = (day: number) => {
    return tasks.filter(t => {
      const dt = new Date(t.deadline);
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonthNum && dt.getDate() === day;
    });
  };

  const daysGrid: (number | null)[] = [];
  // Fill initial padding days (empty slots in calendar row representing previous month)
  for (let i = 0; i < START_DAY_OFFSET; i++) {
    daysGrid.push(null);
  }
  // Fill June days
  for (let d = 1; d <= DAYS_IN_MONTH; d++) {
    daysGrid.push(d);
  }

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div id="calendar-integration-dashboard" className="space-y-6">
      
      {/* Calendar Header Intro */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-lg font-bold font-sans text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-500 animate-pulse" />
          Interactive Deadline Grid
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-405 mt-1">
          Displays absolute school program, billing, work, and presentation deadlines on a monthly unified timeline matching synchronized system dates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Area: Calendar Monthly Grid */}
        <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-3xs">
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold font-mono text-slate-800 dark:text-slate-205">JUNE 2026</h3>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Fixed Simulated Window</div>
          </div>

          {/* Symmetrical Calendar Layout Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {/* Weekdays names */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd) => (
              <div key={wd} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1 uppercase">{wd}</div>
            ))}

            {/* Monthly day tiles */}
            {daysGrid.map((day, ix) => {
              if (day === null) {
                return <div key={`empty-${ix}`} className="p-3 bg-transparent" />;
              }

              const dayTasks = getTasksForDay(day);
              const isToday = day === 22;
              const hasTasks = dayTasks.length > 0;
              const isSelected = selectedDay === day;

              // Check if any task on this day is overdue / critical
              const hasCrit = dayTasks.some(t => t.priority === 'Critical' || t.status === 'Overdue');

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`p-2.5 rounded-xl border text-center relative cursor-pointer min-h-[4rem] transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-bold'
                      : isToday
                      ? 'border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-semibold'
                      : 'border-slate-150 dark:border-slate-800 hover:border-slate-250 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {/* Day Date labels */}
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold ${isToday ? 'bg-indigo-600 text-white px-1.5 py-0.2 rounded font-mono' : ''}`}>
                      {day}
                    </span>
                    {hasCrit && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                    )}
                  </div>

                  {/* Tiny Task Indicators */}
                  {hasTasks && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                      {dayTasks.map((t, idx) => (
                        <div 
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full ${
                            t.status === 'Completed'
                              ? 'bg-emerald-500'
                              : t.priority === 'Critical' || t.status === 'Overdue'
                              ? 'bg-rose-550'
                              : 'bg-indigo-500'
                          }`}
                          title={t.title}
                        />
                      ))}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* Right Area: Selected Day Agenda listing */}
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between h-fit shadow-3xs">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center justify-between gap-1.5">
              <span>Timeline Agenda for June {selectedDay}, 2026</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{selectedDayTasks.length} elements</span>
            </h3>

            {selectedDayTasks.length === 0 ? (
              <div className="py-12 text-center space-y-2 text-slate-400 text-xs shadow-3xs bg-slate-50/40 dark:bg-slate-950/25 rounded-xl border border-slate-100 dark:border-slate-800">
                <Info className="w-6 h-6 mx-auto text-slate-350" />
                <p>No absolute deadlines scheduled on June {selectedDay}.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayTasks.map((t) => {
                  const isCrit = t.priority === 'Critical' || t.status === 'Overdue';
                  return (
                    <div 
                      key={t.id}
                      className={`p-3 rounded-xl border text-xs space-y-2 relative ${
                        t.status === 'Completed'
                          ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60'
                          : isCrit
                          ? 'bg-rose-50/30 dark:bg-rose-955/20 border-rose-200/60 dark:border-rose-900/40 text-slate-800 dark:text-slate-100'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-205 shadow-3xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase text-slate-550 dark:text-slate-405 font-bold">{t.category}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded border ${
                          t.priority === 'Critical' 
                            ? 'bg-rose-50 dark:bg-rose-955/40 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-405'
                        }`}>
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-850 dark:text-slate-150 truncate">{t.title}</h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-0.5 font-mono text-indigo-755 dark:text-indigo-400 font-bold">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          Effort: {t.estimatedEffort}h
                        </span>
                        
                        {t.status !== 'Completed' && (
                          <button
                            onClick={() => onSelectRescueTask(t)}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded text-[9px] cursor-pointer animate-pulse-once"
                          >
                            Rescue NOW
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5 leading-normal">
            Highlighted indicators: Overdue represents in <span className="text-rose-600 font-bold">Red</span>, completed tracks indices are <span className="text-emerald-650 font-bold">Green</span>.
          </div>

        </div>

      </div>

    </div>
  );
}
