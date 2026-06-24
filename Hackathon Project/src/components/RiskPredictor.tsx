/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, AlertTriangle, HelpCircle, ArrowRight, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { Task, AIRiskResult } from '../types';

interface RiskPredictorProps {
  tasks: Task[];
  onPredictRisk: (task: Task) => Promise<void>;
  isAnalyzing: boolean;
  selectedTaskId: string | null;
  riskResult: AIRiskResult | null;
}

export default function RiskPredictor({
  tasks,
  onPredictRisk,
  isAnalyzing,
  selectedTaskId,
  riskResult
}: RiskPredictorProps) {
  const [currentSelectedId, setCurrentSelectedId] = useState<string>(selectedTaskId || '');
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');

  const activeTask = tasks.find(t => t.id === currentSelectedId);

  const handlePredict = () => {
    if (!activeTask) return;
    onPredictRisk(activeTask);
  };

  // SVG color helpers for risk indicator dial
  const getRiskColor = (prob: number) => {
    if (prob >= 75) return 'text-rose-500';
    if (prob >= 40) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div id="deadline-risk-prediction" className="space-y-6">
      
      {/* Risk predictor intro banner */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="text-rose-500 w-5 h-5 animate-pulse" />
          Proactive Deadline Risk Prediction
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Unlike static calendars, LastMinute AI calculates the realistic probability of missing a milestone by auditing efforts, hours left, sleeping slots, and historical habit completions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Selector Panel */}
        <div className="lg:col-span-5 p-5 bg-white rounded-2xl border border-slate-200/80 space-y-4 shadow-3xs">
          <label className="block text-xs font-bold text-slate-700">Select Task to Audit</label>
          <select
            value={currentSelectedId}
            onChange={(e) => {
              setCurrentSelectedId(e.target.value);
            }}
            className="w-full px-3 py-2.5 bg-slate-55 border border-slate-200 rounded-xl text-slate-800 text-xs focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- Choose a Pending Task --</option>
            {pendingTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.priority})
              </option>
            ))}
          </select>

          {activeTask ? (
            <div className="p-4 bg-slate-50/40 rounded-xl border border-slate-200 space-y-3 shadow-3xs">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-widest font-bold">{activeTask.category}</span>
                <span className="text-xs font-mono text-slate-500">Effort: {activeTask.estimatedEffort}h</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">{activeTask.title}</h4>
              <p className="text-xs text-slate-550 leading-relaxed">{activeTask.description || 'No notes compiled for this task.'}</p>
              
              <button
                id="btn-run-risk-audit"
                onClick={handlePredict}
                disabled={isAnalyzing}
                className="w-full mt-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 hover:border-rose-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Running Risk Audit...' : 'Execute AI Risk Assessment'}
              </button>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50/40 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs shadow-3xs">
              Select an active task above to spin up the forensic risk calculator.
            </div>
          )}
        </div>

        {/* Audit Results Panel */}
        <div className="lg:col-span-7 p-5 bg-white rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-3xs">
          
          {riskResult ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100 pb-4">
                
                {/* Visual Gauge dial */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#f1f5f9"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={riskResult.probability >= 70 ? '#e11d48' : riskResult.probability >= 40 ? '#d97706' : '#059669'}
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * riskResult.probability) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold font-mono text-slate-800">{riskResult.probability}%</span>
                    <span className="text-[9px] uppercase font-semibold text-slate-400">Risk level</span>
                  </div>
                </div>

                {/* Narrative Assessment */}
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-slate-500 font-mono">Gemini Failure Likelihood Prediction</span>
                  </div>
                  <p className="text-xs text-slate-650 italic leading-relaxed">
                    "{riskResult.explanation}"
                  </p>
                </div>

              </div>

              {/* Contributory Triggers */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500">Risk Bottlenecks & Triggers</span>
                <div className="grid grid-cols-1 gap-2">
                  {riskResult.factors.map((fact, i) => (
                    <div key={i} className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2 shadow-3xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <span>{fact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Corrective strategies suggestions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-705 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Direct Mitigations To Secure Delivery
                </span>
                <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100 space-y-2">
                  {riskResult.customRescueStrategies.map((strat, i) => (
                    <div key={i} className="text-xs text-slate-700 flex gap-2">
                      <span className="font-mono text-indigo-600 font-bold">{i+1}.</span>
                      <p>{strat}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            // Default blank state illustrating common risk indicators
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <ShieldAlert className="w-12 h-12 text-slate-300" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700">Auditing Desk Is Idle</h4>
                <p className="text-xs text-slate-400 max-w-sm font-semibold">
                  Select an items checklist from your timeline on the left and submit an audit query to let Gemini diagnose failure pathways.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center py-2">
                <span className="text-[10px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-550 font-medium">Circadian sleep compression</span>
                <span className="text-[10px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-550 font-medium">Focus-block gaps</span>
                <span className="text-[10px] bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-550 font-medium">Pre-deadline friction index</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
