
// Added React to the import list to fix the namespace error
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MonthlyData } from '../types';
import { calculateNetWorth, calculateMonthlyIncome, formatCurrency, calculateTotalBalance } from '../utils/helpers';
import Button from './ui/Button';
import { SparklesIcon, InfoIcon } from './ui/Icons';
import Card from './ui/Card';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData;
  monthYear: string;
}

interface Recommendation {
  title: string;
  description: string;
  category: string;
  actionItem: string;
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when the month changes so we don't show stale advice
    setRecommendations(null);
    setError(null);
  }, [monthYear]);

  useEffect(() => {
    if (isOpen && !recommendations && !loading) {
      fetchRecommendations();
    }
  }, [isOpen, recommendations, loading]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const netWorth = calculateNetWorth(data);
      const income = calculateMonthlyIncome(data.income.jobs);
      const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
      
      const scores = Object.entries(data.creditScores)
         .map(([key, val]) => {
             const score = typeof val === 'object' && val !== null && 'score8' in val ? (val as any).score8 : val;
             return `${key}: ${score}`;
         })
         .join(', ');

      const financialProfile = `
        Target Month: ${monthYear}
        Current Net Worth: ${formatCurrency(netWorth)}
        Total Monthly Income: ${formatCurrency(income)}
        Total Debt Balance: ${formatCurrency(totalDebt)}
        Credit Score Profile: ${scores}
        Asset Breakdown: ${data.assets.map(a => `${a.name} ($${a.value})`).join(', ')}
        Liability Breakdown: ${[...data.creditCards, ...data.loans].map(l => `${l.name} ($${l.balance})`).join(', ')}
      `;

      // Initialize API with the project-level key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const schema = {
        type: Type.OBJECT,
        properties: {
            recommendations: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: { type: Type.STRING, description: "Must be one of: 'Credit Cards', 'Loans', 'Savings', 'Investments', 'General'" },
                        actionItem: { type: Type.STRING, description: "A short, actionable step (max 15 words)." }
                    },
                    required: ['title', 'description', 'category', 'actionItem']
                }
            }
        },
        required: ['recommendations']
      };

      // Using gemini-3-pro-preview for better complex reasoning on financial figures
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{
            parts: [{
                text: `You are a world-class senior financial advisor. Analyze the following financial profile for ${monthYear} and provide 4-5 high-impact, tailored recommendations.
        
                Analysis Goals:
                1. Debt Optimization: Identify if high interest debt can be consolidated or moved to better products.
                2. Wealth Accumulation: Suggest savings or investment strategies based on current assets and income.
                3. Credit Health: Point out specific bureaus where scores are lagging and how to improve.
                
                Financial Profile:
                ${financialProfile}
                
                Your response MUST be valid JSON according to the schema.`
            }]
        }],
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.4 // Lower temperature for more consistent financial logic
        }
      });

      const text = response.text;
      if (text) {
          try {
              const parsed = JSON.parse(text);
              if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
                  setRecommendations(parsed.recommendations);
              } else {
                  throw new Error("Invalid response format: Missing recommendations array");
              }
          } catch (parseErr) {
              console.error("Failed to parse AI response:", text);
              setError("The AI returned an invalid response format. Please try again.");
          }
      } else {
          setError("No recommendations could be generated at this time.");
      }

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      // Check for specific error types if needed, otherwise show generic
      const msg = err.message?.includes('API key') 
        ? "Configuration error: Missing API Key." 
        : "Failed to connect to the AI advisor. Please check your internet connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-t-lg">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600 dark:text-purple-300">
                <SparklesIcon />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Financial Recommendations</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analysis for {monthYear}</p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2">
             <span className="text-3xl leading-none">&times;</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4">
               <div className="relative">
                 <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <SparklesIcon />
                 </div>
               </div>
               <div className="text-center">
                 <p className="text-purple-600 dark:text-purple-400 font-bold animate-pulse text-lg">Processing your financial data...</p>
                 <p className="text-xs text-gray-500 mt-1">Our AI is running complex simulations to find your best path.</p>
               </div>
             </div>
           ) : error ? (
             <div className="text-center py-12 px-4">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                 <InfoIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Analysis Failed</h3>
               <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">{error}</p>
               <div className="flex justify-center gap-4">
                 <Button onClick={onClose} variant="secondary">Cancel</Button>
                 <Button onClick={fetchRecommendations}>Try Again</Button>
               </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations?.map((rec, index) => (
                    <Card key={index} title={
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-gray-900 dark:text-gray-100">{rec.title}</span>
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 rounded-full text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                {rec.category}
                            </span>
                        </div>
                    } className="border border-purple-100 dark:border-gray-800 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {rec.description}
                            </p>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800/30">
                                <h4 className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase mb-1.5 flex items-center gap-1.5">
                                    <SparklesIcon /> Suggested Action
                                </h4>
                                <p className="text-sm font-bold text-purple-900 dark:text-purple-100 leading-snug">
                                    {rec.actionItem}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
             </div>
           )}
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center px-6">
            <span className="text-[10px] text-gray-400 font-medium italic">AI advice is for informational purposes only. Consult with a professional.</span>
            <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
