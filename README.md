# EcoSense — Personal Carbon Intelligence

EcoSense is a comprehensive, AI-powered web application designed to help individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights. It was built for **PromptWars Virtual by Google for Developers × Hack2Skill (Challenge 3: Carbon Footprint)**.

## 🎯 Problem Statement
> *Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.*

## ✨ Features

EcoSense serves as a unified personal carbon footprint tool combining a daily activity log, a monthly carbon budget tracker, and a lifestyle simulator—all powered by Google's Gemini AI.

- **📊 Dashboard:** A centralized view featuring a Carbon Budget Gauge (tracking progress against India's 1.5°C pathway fair-share target of 191 kg CO2/month), a 7-day trend chart, a category breakdown donut, and a consecutive daily green streak counter.
- **📝 Log Today (Powered by Gemini):** Simply type out your day in plain English (e.g., "Rode my bike to college, had chicken biryani for lunch..."). Gemini AI parses your natural language input, calculates India-specific CO2 emissions, and categorizes the activities instantly.
- **🎛️ What-If Simulator:** Interactive sliders let you model lifestyle changes (e.g., taking the metro instead of driving, or eating more vegan meals). See real-time projections and let Gemini generate an **AI Impact Story**, making the data tangible and providing concrete next steps.
- **🤖 AI Coach:** Generates a custom weekly coaching letter reviewing your last 7 days. Your AI coach praises good patterns, directly addresses high-emission sources, and gives hyper-specific actionable advice for the week ahead.
- **⚙️ Complete Personalization:** Customizable onboarding flow tailored to your commute, diet, and electricity usage, calculating a personalized baseline carbon footprint.

## 🛠️ Technology Stack
- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide React (icons)
- **Data Visualization:** Recharts
- **State Management:** Custom React hooks syncing with `localStorage` (No backend required)
- **AI Integration:** `@google/generative-ai` SDK (Gemini 1.5 Flash)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
You will also need a **Google Gemini API Key**. You can provide this in the App's onboarding screen, or set it as an environment variable.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd Hack2Skill
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. (Optional) Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

### Deployment
To build the application for production, simply run:
```bash
npm run build
```
The output will be in the `dist` folder, which can be deployed to static hosting services like Vercel, Netlify, or Firebase Hosting.

## 📝 Calculation Logic & References
EcoSense relies on highly tailored, India-specific emission factors for accurate tracking:
- **Transport:** Factors sourced from MoRTH (e.g., Petrol car: 0.171 kg/km, Metro: 0.032 kg/km).
- **Food:** Weighted per meal averages based on the India GHG Platform (e.g., Vegan meal: 0.5 kg, Non-veg meal: 1.2 kg).
- **Electricity:** Based on the India CEA CO2 Baseline Database (Grid factor = 0.716 kgCO2/kWh).

## 🔒 Privacy First
EcoSense respects user privacy. All activity logs and personal profile details are securely stored locally in your browser's `localStorage`. No personal data is stored on external servers.
