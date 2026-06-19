import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Plus, Sparkles, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { parseActivities } from '../lib/gemini';
import type { ActivityLog, Category, DailyLogs } from '../types';
// unused cn removed

export default function LogToday() {
  const [logs, setLogs] = useLocalStorage<DailyLogs>('ecosense_logs', {});
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const [description, setDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState<ActivityLog[]>(logs[todayStr] || []);
  const [showManual, setShowManual] = useState(false);
  const [toast, setToast] = useState('');

  // Manual entry state
  const [mCategory, setMCategory] = useState<Category>('Transport');
  const [mActivity, setMActivity] = useState('');
  const [mKg, setMKg] = useState('');

  const handleParse = async () => {
    if (!description.trim()) return;
    setIsParsing(true);
    setError('');
    try {
      const parsed = await parseActivities(description);
      if (!Array.isArray(parsed)) throw new Error('Invalid response format');
      
      const newActivities = parsed.map((item: Record<string, string | number>) => ({
        id: Math.random().toString(36).substr(2, 9),
        activity: String(item.activity),
        category: String(item.category) as Category,
        kg: Number(item.kg) || 0
      }));

      setActivities(prev => [...prev, ...newActivities]);
      setDescription('');
    } catch (err) {
      console.error(err);
      setError('Failed to parse activities. Please try again or check your API key.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mActivity.trim() || !mKg) return;
    
    const newActivity: ActivityLog = {
      id: crypto.randomUUID(),
      activity: mActivity,
      category: mCategory,
      kg: Number(mKg)
    };
    
    setActivities(prev => [...prev, newActivity]);
    setMActivity('');
    setMKg('');
    setShowManual(false);
  };

  const handleDelete = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = () => {
    setLogs(prev => ({
      ...prev,
      [todayStr]: activities
    }));
    setToast('Saved successfully!');
    setTimeout(() => setToast(''), 3000);
  };

  const totalKg = activities.reduce((sum, a) => sum + a.kg, 0);

  const getCategoryEmoji = (cat: Category) => {
    switch(cat) {
      case 'Transport': return '🚗';
      case 'Food': return '🍽';
      case 'Electricity': return '⚡';
      case 'Other': return '♻️';
      default: return '📝';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Log Today's Activities</h1>
        
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your day in plain English... e.g. 'Rode my bike to college, had chicken biryani for lunch, used AC for 5 hours, ordered something online'"
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-gray-700"
          />
          
          <button
            onClick={handleParse}
            disabled={isParsing || !description.trim()}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isParsing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Parse with AI</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {activities.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">Today's Log</h3>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50 rounded-xl hover:border-gray-200 transition-colors">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                    {getCategoryEmoji(activity.category)}
                  </div>
                  <div className="truncate pr-4">
                    <p className="font-medium text-gray-900 truncate">{activity.activity}</p>
                    <p className="text-xs text-gray-500">{activity.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                    {activity.kg.toFixed(2)} kg
                  </div>
                  <button 
                    onClick={() => handleDelete(activity.id)}
                    aria-label="Delete activity"
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-gray-500">Today's total:</span>
            <span className="font-bold text-xl text-gray-900">{totalKg.toFixed(2)} kg CO2</span>
          </div>

          <button
            onClick={handleSave}
            className="w-full mt-4 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors relative overflow-hidden"
          >
            {toast ? (
              <span className="animate-in slide-in-from-bottom-2">{toast}</span>
            ) : (
              <span>Save Today's Log</span>
            )}
          </button>
        </div>
      )}

      {/* Manual Add Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setShowManual(!showManual)}
          className="w-full p-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-gray-400" />
            <span>Add manually</span>
          </div>
          {showManual ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        
        {showManual && (
          <form onSubmit={handleManualAdd} className="p-6 border-t border-gray-100 space-y-4 bg-gray-50/50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                value={mCategory}
                onChange={(e) => setMCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Transport">Transport</option>
                <option value="Food">Food</option>
                <option value="Electricity">Electricity</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input 
                type="text" 
                value={mActivity}
                onChange={(e) => setMActivity(e.target.value)}
                placeholder="e.g. Bus to market"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated kg CO2</label>
              <input 
                type="number" 
                step="0.01"
                value={mKg}
                onChange={(e) => setMKg(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Add Activity
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
