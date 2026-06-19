import { useState, useMemo } from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateWeeklyCoachLetter } from '../lib/gemini';
import { DAILY_BUDGET_KG } from '../types';
import type { UserProfile, DailyLogs } from '../types';
import { cn } from '../lib/utils';

export default function AICoach() {
  const [profile] = useLocalStorage<UserProfile | null>('ecosense_profile', null);
  const [logs] = useLocalStorage<DailyLogs>('ecosense_logs', {});
  
  const [letter, setLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Get last 7 days data
  const weekData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const dailyLogs = logs[dStr] || [];
      
      const totalKg = dailyLogs.reduce((sum, a) => sum + a.kg, 0);
      
      let topSource = null;
      if (dailyLogs.length > 0) {
        topSource = dailyLogs.reduce((max, a) => a.kg > max.kg ? a : max, dailyLogs[0]);
      }

      data.push({
        dateStr: dStr,
        dayName: format(d, 'EEEE'),
        totalKg,
        topSource,
        hasLogs: dailyLogs.length > 0
      });
    }
    return data.reverse(); // most recent first for the table
  }, [logs]);

  const hasAnyLogs = weekData.some(d => d.hasLogs);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Build summary text for Gemini
      let summary = `User Name: ${profile?.name || 'Friend'}\n`;
      summary += `Daily Budget: ${DAILY_BUDGET_KG.toFixed(1)} kg\n\n`;
      
      weekData.forEach(d => {
        if (d.hasLogs) {
          summary += `${d.dayName}: ${d.totalKg.toFixed(1)} kg (Top source: ${d.topSource?.category} - ${d.topSource?.activity})\n`;
        } else {
          summary += `${d.dayName}: No data logged\n`;
        }
      });

      const response = await generateWeeklyCoachLetter(summary);
      setLetter(response);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to generate coach letter. Please check your Gemini API Key in the Profile tab.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly AI Coach</h1>
          <p className="text-gray-500 mt-1">Review your last 7 days and get personalized advice.</p>
        </div>
      </div>

      {!hasAnyLogs ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No logs this week yet</h3>
          <p className="text-gray-500 mb-6">Try logging a few days first so your coach has data to analyze.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center md:justify-start">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing your week...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>{letter ? 'Regenerate My Report' : 'Generate My Weekly Report'}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          )}

          {letter && (
            <div className="bg-[#FFFDF5] p-6 sm:p-8 rounded-2xl shadow-sm border border-emerald-100/50 border-l-[6px] border-l-emerald-500">
              <div className="space-y-4 text-gray-800 leading-relaxed font-serif tracking-wide text-lg">
                {letter.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              <div className="mt-8 pt-4 border-t border-emerald-100/50 text-emerald-800/60 font-serif italic text-sm">
                — EcoSense AI Coach
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Weekly Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-sm text-gray-500 bg-gray-50/50">
                    <th className="p-4 font-medium">Day</th>
                    <th className="p-4 font-medium">kg CO2</th>
                    <th className="p-4 font-medium">vs Budget</th>
                    <th className="p-4 font-medium hidden sm:table-cell">Top Source</th>
                  </tr>
                </thead>
                <tbody>
                  {weekData.map((d) => {
                    if (!d.hasLogs) {
                      return (
                        <tr key={d.dateStr} className="border-b border-gray-50 last:border-0">
                          <td className="p-4 font-medium text-gray-900">{d.dayName}</td>
                          <td className="p-4 text-gray-400">-</td>
                          <td className="p-4 text-gray-400">-</td>
                          <td className="p-4 text-gray-400 hidden sm:table-cell">-</td>
                        </tr>
                      );
                    }

                    const isUnder = d.totalKg <= DAILY_BUDGET_KG;
                    
                    return (
                      <tr 
                        key={d.dateStr} 
                        className={cn(
                          "border-b border-gray-50 last:border-0",
                          isUnder ? "bg-emerald-50/30" : "bg-red-50/30"
                        )}
                      >
                        <td className="p-4 font-medium text-gray-900">
                          {d.dayName}
                          <div className="text-xs text-gray-500 font-normal sm:hidden mt-1 truncate max-w-[120px]">
                            {d.topSource?.activity}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-900">{d.totalKg.toFixed(1)}</td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold",
                            isUnder ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}>
                            {isUnder ? 'Under' : 'Over'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600 hidden sm:table-cell truncate max-w-[200px]">
                          {d.topSource ? (
                            <span title={d.topSource.activity}>{d.topSource.activity}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
