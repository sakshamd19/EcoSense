import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, TreePine } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateImpactStory } from '../lib/gemini';
import type { UserProfile } from '../types';

export default function Simulator() {
  const [profile] = useLocalStorage<UserProfile | null>('ecosense_profile', null);
  
  const currentAnnualKg = useMemo(() => {
    return profile ? profile.baselineDailyKg * 365 : 0;
  }, [profile]);

  // Initial values based on profile or defaults
  const initialCarDays = profile && ['Car', '2-Wheeler', 'Auto'].includes(profile.commuteMode) ? 5 : 0;
  const initialTransitDays = profile && ['Metro', 'Bus'].includes(profile.commuteMode) ? 5 : 0;
  
  let initialVegMeals = 14;
  if (profile?.dietType === 'Vegan') initialVegMeals = 21;
  else if (profile?.dietType === 'Vegetarian') initialVegMeals = 21;
  else if (profile?.dietType === 'Mixed') initialVegMeals = 14;
  else if (profile?.dietType === 'Non-Vegetarian') initialVegMeals = 7;

  // Sliders state
  const [carDays, setCarDays] = useState(initialCarDays);
  const [transitDays, setTransitDays] = useState(initialTransitDays);
  const [vegMeals, setVegMeals] = useState(initialVegMeals);
  const [electricityKwh, setElectricityKwh] = useState(profile?.electricityKwh || 150);
  const [onlineOrders, setOnlineOrders] = useState(8);
  const [clothingItems, setClothingItems] = useState(2);

  // Gemini state
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Simulation logic
  const simulatedAnnualKg = useMemo(() => {
    if (!profile) return 0;
    
    // Transport
    let transportFactor = 0;
    if (profile.commuteMode === 'Car') transportFactor = 0.171;
    else if (profile.commuteMode === '2-Wheeler') transportFactor = 0.110;
    else if (profile.commuteMode === 'Auto') transportFactor = 0.070;
    else transportFactor = 0.171; // Default to car if they use transit usually but simulate driving
    
    const transitFactor = 0.032; // Metro average
    const dist = profile.commuteDistance || 15; // default 15km one way if WFH
    
    const simTransport = ((carDays * dist * 2 * transportFactor) + (transitDays * dist * 2 * transitFactor)) * 52;

    // Food
    const nonVegMeals = 21 - vegMeals;
    // 1.7 avg for veg/vegan, 2.5 for meat
    const simFood = ((vegMeals / 21) * 1.7 * 365) + ((nonVegMeals / 21) * 2.5 * 365);

    // Electricity
    const simElectricity = electricityKwh * 12 * 0.716;

    // Shopping
    const simShopping = (onlineOrders * 0.5 * 12) + (clothingItems * 10 * 12);

    return simTransport + simFood + simElectricity + simShopping;
  }, [profile, carDays, transitDays, vegMeals, electricityKwh, onlineOrders, clothingItems]);

  const savings = currentAnnualKg - simulatedAnnualKg;
  const chartData = [
    { name: 'Current', kg: Math.round(currentAnnualKg) },
    { name: 'Simulated', kg: Math.round(simulatedAnnualKg) }
  ];

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    try {
      const response = await generateImpactStory(currentAnnualKg, simulatedAnnualKg);
      setStory(response);
    } catch (error) {
      console.error(error);
      setStory("Couldn't generate your story right now. Make sure your API key is set in your Profile.");
    } finally {
      setIsGenerating(false);
    }
  };

  const commuteLabel = profile && ['Car', '2-Wheeler', 'Auto'].includes(profile.commuteMode) ? `${profile.commuteMode} days per week` : 'Driving days per week';

  if (!profile) return null;

  return (
    <div className="space-y-6 pb-6 animate-in fade-in">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold text-gray-900">How much could you save?</h2>
        <p className="text-gray-500 mt-1">Drag the sliders to model lifestyle changes. Projections use India-specific emission factors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="pb-4 border-b border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Your estimated annual footprint</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(currentAnnualKg).toLocaleString()} kg CO2</div>
          </div>

          <div className="space-y-6">
            <SliderControl label={commuteLabel} value={carDays} setValue={setCarDays} max={7} />
            <SliderControl label="Public transport days per week" value={transitDays} setValue={setTransitDays} max={7} />
            <SliderControl label="Vegetarian/vegan meals per week" value={vegMeals} setValue={setVegMeals} max={21} suffix=" / 21" />
            <SliderControl label="Monthly electricity usage (kWh)" value={electricityKwh} setValue={setElectricityKwh} max={400} />
            <SliderControl label="Online orders per month" value={onlineOrders} setValue={setOnlineOrders} max={30} />
            <SliderControl label="New clothing items per month" value={clothingItems} setValue={setClothingItems} max={10} />
          </div>
        </div>

        {/* Projection Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Simulation Result</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <div className="text-sm text-gray-500 mb-1">Projected annual footprint</div>
                <div className="text-4xl font-black text-gray-900">{Math.round(simulatedAnnualKg).toLocaleString()} <span className="text-xl text-gray-500 font-normal">kg</span></div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col justify-center">
                <div className="text-sm text-emerald-700 font-medium mb-1">You'd save</div>
                <div className="text-2xl font-bold text-emerald-600">{savings > 0 ? '+' : ''}{Math.round(savings).toLocaleString()} kg/year</div>
              </div>
            </div>

            {savings > 0 && (
              <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl mb-8">
                <TreePine className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  That's equivalent to planting <span className="font-bold text-gray-900">{Math.round(savings / 21)} trees</span> which grow for 10 years!
                </p>
              </div>
            )}

            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 14 }} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} formatter={(val: any) => [`${val} kg`, 'Annual CO2']} />
                  <Bar dataKey="kg" radius={[0, 8, 8, 0]} barSize={32}>
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#9CA3AF' : (savings > 0 ? '#10B981' : '#EF4444')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gemini Story */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-indigo-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                AI Impact Story
              </h3>
            </div>
            
            {story ? (
              <div className="space-y-4 text-indigo-900/80 leading-relaxed">
                {story.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
                <button 
                  onClick={handleGenerateStory}
                  disabled={isGenerating}
                  className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {isGenerating ? 'Regenerating...' : 'Regenerate based on new sliders'}
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-indigo-700/70 mb-4">See how your changes translate to the real world in a personalised story.</p>
                <button
                  onClick={handleGenerateStory}
                  disabled={isGenerating}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isGenerating ? 'Writing your story...' : 'Generate My Impact Story'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, setValue, max, suffix = '' }: any) {
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm font-bold text-gray-900">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
}
