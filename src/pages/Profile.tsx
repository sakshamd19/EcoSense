import { useState, useEffect } from 'react';
// unused
import { Save, AlertTriangle, Key } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DAILY_BUDGET_KG, MONTHLY_BUDGET_KG } from '../types';
import type { UserProfile, CommuteMode, DietType } from '../types';

export default function Profile() {
  const [profile, setProfile] = useLocalStorage<UserProfile | null>('ecosense_profile', null);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    // Recalculate baseline
    let transportDaily = 0;
    const dist = Number(formData.commuteDistance) || 0;
    switch(formData.commuteMode) {
      case 'Car': transportDaily = dist * 2 * 0.171; break;
      case '2-Wheeler': transportDaily = dist * 2 * 0.110; break;
      case 'Auto': transportDaily = dist * 2 * 0.070; break;
      case 'Metro': transportDaily = dist * 2 * 0.032; break;
      case 'Bus': transportDaily = dist * 2 * 0.050; break;
      case 'WFH': transportDaily = 0; break;
    }

    let foodDaily = 0;
    switch(formData.dietType) {
      case 'Vegan': foodDaily = 1.1; break;
      case 'Vegetarian': foodDaily = 1.7; break;
      case 'Mixed': foodDaily = 2.1; break;
      case 'Non-Vegetarian': foodDaily = 2.5; break;
    }

    const elecDaily = ((Number(formData.electricityKwh) || 150) / 30) * 0.716;
    const baselineDailyKg = transportDaily + foodDaily + elecDaily;

    const updatedProfile = {
      ...formData,
      baselineDailyKg,
      lastUpdated: new Date().toISOString()
    } as UserProfile;

    setProfile(updatedProfile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    window.localStorage.removeItem('ecosense_profile');
    window.localStorage.removeItem('ecosense_logs');
    window.localStorage.removeItem('ecosense_budget');
    window.location.href = '/onboarding';
  };

  if (!profile) return null;

  const annualFootprint = (profile.baselineDailyKg * 365).toFixed(0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile & Settings</h2>
          <p className="text-gray-500 mt-1">Manage your carbon baseline and app preferences.</p>
        </div>
        <div className="text-sm text-gray-400">
          Last updated: {profile.lastUpdated ? new Date(profile.lastUpdated).toLocaleDateString() : 'Never'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Computed Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-emerald-500 p-6 rounded-2xl shadow-sm text-white">
            <h3 className="font-bold opacity-90 mb-4 text-emerald-50">Your Target</h3>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-black">{MONTHLY_BUDGET_KG} <span className="text-lg font-normal opacity-80">kg</span></div>
                <div className="text-sm opacity-80">Monthly Budget</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{DAILY_BUDGET_KG.toFixed(1)} <span className="text-base font-normal opacity-80">kg</span></div>
                <div className="text-sm opacity-80">Daily Budget</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-400/50 text-xs opacity-80">
              Based on India's 1.5°C pathway fair-share targets.
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Estimated Baseline</h3>
            <div className="text-3xl font-black text-gray-900 mb-1">{annualFootprint} <span className="text-lg font-normal text-gray-500">kg/year</span></div>
            <div className="text-sm text-gray-500 mb-4">Or {profile.baselineDailyKg.toFixed(1)} kg per day</div>
            <div className="text-xs text-gray-400">
              This is computed from your commute, diet, and electricity settings.
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Personal Details</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City (Optional)</label>
                <input 
                  type="text" 
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 pt-4">Lifestyle Factors</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Commute</label>
                <select 
                  value={formData.commuteMode || ''}
                  onChange={(e) => handleChange('commuteMode', e.target.value as CommuteMode)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Car">Car (Petrol)</option>
                  <option value="2-Wheeler">2-Wheeler (Petrol)</option>
                  <option value="Auto">Auto-Rickshaw (CNG)</option>
                  <option value="Metro">Metro/Train</option>
                  <option value="Bus">Bus</option>
                  <option value="WFH">Work From Home</option>
                </select>
              </div>
              
              {formData.commuteMode !== 'WFH' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commute Distance (one-way km)</label>
                  <input 
                    type="number" 
                    value={formData.commuteDistance || ''}
                    onChange={(e) => handleChange('commuteDistance', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
                <select 
                  value={formData.dietType || ''}
                  onChange={(e) => handleChange('dietType', e.target.value as DietType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Vegan">Vegan</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Mixed">Mixed (Occasional non-veg)</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Electricity (kWh)</label>
                <input 
                  type="number" 
                  value={formData.electricityKwh || ''}
                  onChange={(e) => handleChange('electricityKwh', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 pt-4">API Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Key className="w-4 h-4 mr-1 text-gray-400" />
                Gemini API Key
              </label>
              <input 
                type="password" 
                value={formData.geminiApiKey || ''}
                onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Stored locally in your browser.</p>
            </div>

            <div className="pt-4 flex items-center space-x-4">
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaved ? 'Saved!' : 'Save & Recalculate'}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Danger Zone
            </h3>
            <p className="text-red-700 text-sm mb-4">
              This will permanently delete your profile and all logged activities from this device.
            </p>
            
            {showConfirmReset ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                >
                  Yes, wipe my data
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm"
              >
                Reset All Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
