import { useState } from 'react';
// unused
import { Car, Bike, Train, Bus, MapPin, Monitor, Flame, Utensils, Zap, Building, Key } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { CommuteMode, DietType, UserProfile } from '../types';
import { cn } from '../lib/utils';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setProfile] = useLocalStorage<UserProfile | null>('ecosense_profile', null);

  // Form state
  const [name, setName] = useState('');
  const [commuteMode, setCommuteMode] = useState<CommuteMode | ''>('');
  const [commuteDistance, setCommuteDistance] = useState<number | ''>('');
  const [dietType, setDietType] = useState<DietType | ''>('');
  const [electricityKwh, setElectricityKwh] = useState<number | ''>('');
  const [city, setCity] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const totalSteps = 7; // Added API key as step 7

  const handleNext = () => {
    if (step === 2 && commuteMode === 'WFH') {
      setCommuteDistance(0);
      setStep(4); // Skip distance step
    } else if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step === 4 && commuteMode === 'WFH') {
      setStep(2);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const finishOnboarding = () => {
    // Compute baseline
    let transportDaily = 0;
    const dist = Number(commuteDistance) || 0;
    switch(commuteMode) {
      case 'Car': transportDaily = dist * 2 * 0.171; break;
      case '2-Wheeler': transportDaily = dist * 2 * 0.110; break;
      case 'Auto': transportDaily = dist * 2 * 0.070; break;
      case 'Metro': transportDaily = dist * 2 * 0.032; break;
      case 'Bus': transportDaily = dist * 2 * 0.050; break;
      case 'WFH': transportDaily = 0; break;
    }

    let foodDaily = 0;
    switch(dietType) {
      case 'Vegan': foodDaily = 1.1; break;
      case 'Vegetarian': foodDaily = 1.7; break;
      case 'Mixed': foodDaily = 2.1; break;
      case 'Non-Vegetarian': foodDaily = 2.5; break;
    }

    const elecDaily = ((Number(electricityKwh) || 150) / 30) * 0.716;

    const baselineDailyKg = transportDaily + foodDaily + elecDaily;

    const profile: UserProfile = {
      name,
      commuteMode: commuteMode as CommuteMode,
      commuteDistance: dist,
      dietType: dietType as DietType,
      electricityKwh: Number(electricityKwh) || 150,
      city,
      baselineDailyKg,
      geminiApiKey: geminiApiKey.trim() || undefined,
    };

    setProfile(profile);
    // Use window.location to force full reload to ensure Layout mounts cleanly with profile
    window.location.href = '/';
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return !name.trim();
      case 2: return !commuteMode;
      case 3: return commuteDistance === '' || Number(commuteDistance) < 0;
      case 4: return !dietType;
      case 5: return electricityKwh === '' || Number(electricityKwh) < 0;
      // city and apiKey are optional
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-100 w-full">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-8">
          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to EcoSense</h2>
              <p className="text-gray-500">What should we call you?</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg transition-all"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && !isNextDisabled()) handleNext() }}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-900">How do you usually commute?</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Car', icon: Car, label: 'Car (Petrol)' },
                  { id: '2-Wheeler', icon: Bike, label: '2-Wheeler' },
                  { id: 'Auto', icon: Flame, label: 'Auto (CNG)' },
                  { id: 'Metro', icon: Train, label: 'Metro/Train' },
                  { id: 'Bus', icon: Bus, label: 'Bus' },
                  { id: 'WFH', icon: Monitor, label: 'Work from Home' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setCommuteMode(mode.id as CommuteMode)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border rounded-xl hover:border-emerald-500 transition-all",
                      commuteMode === mode.id ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"
                    )}
                  >
                    <mode.icon className="w-6 h-6 mb-2" />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">How far is your commute?</h2>
              <p className="text-gray-500">One-way distance in kilometers.</p>
              <div className="relative">
                <input
                  type="number"
                  value={commuteDistance}
                  onChange={(e) => setCommuteDistance(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isNextDisabled()) handleNext() }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">km</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-2xl font-bold text-gray-900">What's your typical diet?</h2>
              <div className="space-y-3">
                {[
                  { id: 'Vegan', label: 'Vegan', desc: 'No animal products' },
                  { id: 'Vegetarian', label: 'Vegetarian', desc: 'Plant-based + dairy/eggs' },
                  { id: 'Mixed', label: 'Mixed', desc: 'Occasional meat' },
                  { id: 'Non-Vegetarian', label: 'Non-Vegetarian', desc: 'Regular meat consumption' },
                ].map((diet) => (
                  <button
                    key={diet.id}
                    onClick={() => setDietType(diet.id as DietType)}
                    className={cn(
                      "w-full flex items-center text-left p-4 border rounded-xl hover:border-emerald-500 transition-all",
                      dietType === diet.id ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"
                    )}
                  >
                    <Utensils className="w-5 h-5 mr-4 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{diet.label}</div>
                      <div className="text-sm opacity-80">{diet.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Monthly electricity usage</h2>
              <p className="text-gray-500 text-sm">Check your electricity bill — look for "Units Consumed". Default is 150 kWh if unsure.</p>
              <div className="relative">
                <input
                  type="number"
                  value={electricityKwh}
                  onChange={(e) => setElectricityKwh(e.target.value ? Number(e.target.value) : '')}
                  placeholder="150"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !isNextDisabled()) handleNext() }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">kWh</span>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Where are you based?</h2>
              <p className="text-gray-500">Optional. Helps us personalise your experience.</p>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg transition-all"
                onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mb-6">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Gemini API Key</h2>
              <p className="text-gray-500 text-sm">
                EcoSense is powered by Google Gemini. Please provide your API key. 
                <br/>(Optional if you have set `VITE_GEMINI_API_KEY` in your environment)
              </p>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={cn(
                "px-5 py-2.5 rounded-xl font-medium transition-all",
                step === 1 ? "opacity-0 pointer-events-none" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className={cn(
                "px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-medium shadow-sm hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:hover:bg-emerald-500 flex items-center",
              )}
            >
              {step === totalSteps ? 'Complete' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
