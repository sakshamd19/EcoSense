import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis 
} from 'recharts';
import { format, subDays, startOfMonth, isAfter, isSameMonth } from 'date-fns';
import { Flame } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DAILY_BUDGET_KG, MONTHLY_BUDGET_KG } from '../types';
import type { DailyLogs, UserProfile } from '../types';

const COLORS = {
  Green: '#10B981',
  Amber: '#F59E0B',
  Red: '#EF4444',
  Transport: '#3B82F6',
  Food: '#10B981',
  Electricity: '#EAB308',
  Other: '#8B5CF6'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [] = useLocalStorage<UserProfile | null>('ecosense_profile', null);
  const [logs] = useLocalStorage<DailyLogs>('ecosense_logs', {});

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const thisMonthStart = startOfMonth(new Date());

  // Compute monthly total
  const monthlyData = useMemo(() => {
    let total = 0;
    const categoryTotals = { Transport: 0, Food: 0, Electricity: 0, Other: 0 };
    
    Object.entries(logs).forEach(([dateStr, activities]) => {
      if (!isAfter(new Date(dateStr), subDays(thisMonthStart, 1)) || !isSameMonth(new Date(dateStr), new Date())) return;
      activities.forEach(a => {
        total += a.kg;
        categoryTotals[a.category] += a.kg;
      });
    });

    return { total, categoryTotals };
  }, [logs, thisMonthStart]);

  // Compute today's total
  const todayTotal = useMemo(() => {
    return (logs[todayStr] || []).reduce((sum, a) => sum + a.kg, 0);
  }, [logs, todayStr]);

  const todayTopSource = useMemo(() => {
    if (!logs[todayStr] || logs[todayStr].length === 0) return null;
    return logs[todayStr].reduce((max, a) => a.kg > max.kg ? a : max, logs[todayStr][0]);
  }, [logs, todayStr]);

  // 7-day trend
  const trendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dStr = format(d, 'yyyy-MM-dd');
      const kg = (logs[dStr] || []).reduce((sum, a) => sum + a.kg, 0);
      data.push({
        day: format(d, 'EEE'),
        kg: Number(kg.toFixed(2))
      });
    }
    return data;
  }, [logs]);

  // Streak counter
  const streakCount = useMemo(() => {
    let count = 0;
    // Start checking from yesterday, then today if today is done, but let's just check backwards from today
    for (let i = 0; i < 365; i++) {
      const dStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dailyLog = logs[dStr];
      if (dailyLog) {
        const kg = dailyLog.reduce((sum, a) => sum + a.kg, 0);
        if (kg < DAILY_BUDGET_KG) {
          count++;
        } else {
          break; // Streak broken
        }
      } else if (i === 0) {
        // if no log today, it doesn't break the streak yet
        continue;
      } else {
        break; // Missing day breaks streak
      }
    }
    return count;
  }, [logs]);

  // Derived values
  const monthlyUsedPercent = Math.min((monthlyData.total / MONTHLY_BUDGET_KG) * 100, 100);
  const gaugeColor = monthlyUsedPercent < 60 ? COLORS.Green : monthlyUsedPercent < 85 ? COLORS.Amber : COLORS.Red;
  
  const todayUsedPercent = Math.min((todayTotal / DAILY_BUDGET_KG) * 100, 100);
  const todayColor = todayUsedPercent < 60 ? 'bg-emerald-500' : todayUsedPercent < 85 ? 'bg-amber-500' : 'bg-red-500';

  const donutData = Object.entries(monthlyData.categoryTotals)
    .filter(([_, v]) => v > 0)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - new Date().getDate();

  return (
    <div className="space-y-6 pb-6 animate-in fade-in">
      
      {/* Carbon Budget Gauge */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Monthly Carbon Budget</h2>
        <div className="h-48 w-full max-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={1}>
            <RadialBarChart 
              cx="50%" cy="80%" 
              innerRadius="70%" outerRadius="100%" 
              barSize={20} 
              data={[{ name: 'Budget', value: monthlyUsedPercent, fill: gaugeColor }]} 
              startAngle={180} endAngle={0}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={10} />
              <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold" fill="#111827">
                {monthlyData.total.toFixed(1)} <tspan fontSize="16" fill="#6B7280" fontWeight="normal">kg</tspan>
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 w-full mt-4 border-t pt-4 text-center">
          <div>
            <div className="text-sm text-gray-500">Used</div>
            <div className="font-bold text-gray-900">{monthlyData.total.toFixed(1)} kg</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Remaining</div>
            <div className="font-bold text-gray-900">{Math.max(0, MONTHLY_BUDGET_KG - monthlyData.total).toFixed(1)} kg</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Days left</div>
            <div className="font-bold text-gray-900">{daysLeft}</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          Monthly budget: 191 kg (India 1.5°C pathway)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Status</h3>
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-bold">{todayTotal.toFixed(2)} <span className="text-lg text-gray-500 font-normal">kg</span></span>
              <span className="text-sm text-gray-500">/ {DAILY_BUDGET_KG.toFixed(1)} kg limit</span>
            </div>
            
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${todayColor}`} 
                style={{ width: `${todayUsedPercent}%` }}
              />
            </div>
          </div>

          {!logs[todayStr] || logs[todayStr].length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-sm mb-3">Nothing logged yet today</p>
              <button 
                onClick={() => navigate('/log')}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors text-sm"
              >
                Log Today
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-600 font-medium mb-1">Top Emission Source</div>
                <div className="text-sm text-gray-900 font-medium">{todayTopSource?.activity}</div>
              </div>
              <div className="text-emerald-700 font-bold">{todayTopSource?.kg.toFixed(2)} kg</div>
            </div>
          )}
        </div>

        {/* 7-Day Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${value} kg`, 'Emissions']}
                />
                <ReferenceLine y={DAILY_BUDGET_KG} stroke="#9CA3AF" strokeDasharray="3 3" />
                <Line 
                  type="monotone" 
                  dataKey="kg" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Breakdown</h3>
          {donutData.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value} kg`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {donutData.map(entry => (
                  <div key={entry.name} className="flex items-center text-sm">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || COLORS.Other }} />
                    <span className="text-gray-600 mr-1">{entry.name}</span>
                    <span className="font-semibold">{entry.value} kg</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No data for this month yet.
            </div>
          )}
        </div>

        {/* Streak Counter */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
            <Flame className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <Flame className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            {streakCount > 0 ? (
              <>
                <h3 className="text-4xl font-black mb-2">{streakCount}-Day</h3>
                <p className="text-emerald-100 font-medium text-lg">Green Streak! 🔥</p>
                <p className="text-sm text-emerald-100/80 mt-4">You stayed under your daily budget.</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-2">No active streak</h3>
                <p className="text-emerald-100 text-sm mt-2 max-w-[200px]">
                  Stay under your daily budget of {DAILY_BUDGET_KG.toFixed(1)} kg to start your streak today!
                </p>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
