import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  // First try to get it from localStorage (User Profile)
  const profileStr = localStorage.getItem('ecosense_profile');
  if (profileStr) {
    try {
      const profile = JSON.parse(profileStr);
      if (profile.geminiApiKey) {
        return new GoogleGenerativeAI(profile.geminiApiKey);
      }
    } catch {
      // Ignore
    }
  }

  // Fallback to env var
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    return new GoogleGenerativeAI(envKey);
  }

  throw new Error("Gemini API Key not found. Please add it in your Profile.");
};

export async function parseActivities(text: string) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Fast and cheap for this task

  const prompt = `You are a carbon footprint calculator. The user will describe activities from their day. Extract each activity and estimate its CO2 emissions in kg using these India-specific factors:

TRANSPORT (per km unless noted):
- Petrol car: 0.171 kg/km
- Petrol 2-wheeler: 0.110 kg/km  
- CNG auto-rickshaw: 0.070 kg/km
- Electric metro/train: 0.032 kg/km
- Diesel bus: 0.050 kg/km
- Walking/cycling: 0 kg/km

FOOD (per meal unless noted):
- Vegan meal: 0.5 kg
- Vegetarian meal: 0.7 kg
- Egg/dairy meal: 0.9 kg
- Non-veg meal (chicken/fish): 1.2 kg
- Red meat meal: 2.5 kg

ELECTRICITY (India grid = 0.716 kgCO2/kWh):
- AC use: 1.5 kWh/hour -> 1.07 kg/hour
- Fan: 0.075 kWh/hour -> 0.054 kg/hour
- Laptop: 0.065 kWh/hour -> 0.047 kg/hour
- TV: 0.1 kWh/hour -> 0.072 kg/hour
- Washing machine (one load): 0.5 kWh -> 0.358 kg

SHOPPING/OTHER:
- Online delivery order: 0.5 kg (packaging + last-mile)
- New clothing item: 5-15 kg (use 10 kg as default)
- Plastic bag: 0.01 kg

If the user mentions a distance, use the appropriate factor. If no distance is mentioned for transport, estimate reasonably (e.g. "went to college" = 5 km one-way). 

Respond ONLY with a valid JSON array. No markdown, no explanation, no preamble. Format:
[
  {"activity": "Metro to college (10 km)", "category": "Transport", "kg": 0.32},
  {"activity": "Chicken biryani lunch", "category": "Food", "kg": 1.2},
  {"activity": "AC for 4 hours", "category": "Electricity", "kg": 4.28}
]
Categories must be exactly one of: Transport, Food, Electricity, Other

User's day description:
"${text}"
`;

  try {
    const result = await model.generateContent(prompt);
    let textResult = result.response.text();
    
    // Strip markdown formatting if any
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(textResult);
  } catch (error) {
    console.error("Error parsing activities:", error);
    throw error;
  }
}

export async function generateImpactStory(currentAnnualKg: number, simulatedAnnualKg: number) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are an environmental coach. The user has modelled some lifestyle changes using a carbon simulator. Given their current annual footprint and simulated annual footprint, write a 3-paragraph response (no headers, flowing prose):
Para 1: Acknowledge the specific changes they modelled and the total CO2 savings.
Para 2: Make the number tangible - compare to something relatable in an Indian context (driving on NH48, flights Mumbai-Delhi, power a household for X months).
Para 3: One concrete next step they haven't modelled yet that would compound their progress.
Keep it warm, specific, and under 150 words total. No bullet points.

Current Annual Footprint: ${Math.round(currentAnnualKg)} kg CO2
Simulated Annual Footprint: ${Math.round(simulatedAnnualKg)} kg CO2
Total Savings: ${Math.round(currentAnnualKg - simulatedAnnualKg)} kg CO2
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating impact story:", error);
    throw error;
  }
}

export async function generateWeeklyCoachLetter(weekDataSummary: string) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a personal carbon coach reviewing someone's week. You have their 7-day log of CO2 emissions (in kg) broken down by category. Write a coaching letter in 4 short paragraphs (no headers):

Para 1: Open with one specific positive from their week - the lowest-emission day or a consistent pattern.
Para 2: Identify their single biggest emission source with the exact kg figure. Be direct but constructive.
Para 3: Give one hyper-specific action for next week - include a number (e.g. "Swapping your Wednesday car commute for the metro would save ~1.8 kg this week alone").
Para 4: Close with a forward-looking sentence about their monthly budget progress.

Tone: Like a smart friend who knows the data, not a lecture. Under 200 words. Address the user by name if provided in the data.

7-day data:
${weekDataSummary}
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating coach letter:", error);
    throw error;
  }
}
