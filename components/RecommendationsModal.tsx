
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
  const [needsKey, setNeedsKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setRecommendations(null);
        setError(null);
        setNeedsKey(false);
        checkKeyStatus();
    }
  }, [monthYear, isOpen]);

  const checkKeyStatus = async () => {
    const aistudio = (window as any).aistudio;
    
    // Defensive check for AI Studio environment
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        // If we are in AI Studio and no key is selected AND no environment key exists
        if (!hasKey && !process.env.API_KEY) {
          setNeedsKey(true);
          return;
        }
      } catch (err) {
        console.warn("Could not verify AI Studio key status:", err);
      }
    }
    
    // Proceed to attempt recommendation fetch
    fetchRecommendations();
  };

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setNeedsKey(false);
        // guidelines: assume success after opening dialog and retry
        fetchRecommendations();
      } catch (err) {
        console.error("Failed to open key selection:", err);
        setError("Could not open the API key selection dialog.");
      }
    } else {
      setError("The API key selection helper is not available in this environment.");
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use process.env.API_KEY directly as required by guidelines
      const apiKey = process.env.API_KEY;
      
      // If key is missing and we aren't in AI Studio (e.g. on Render.com)
      if (!apiKey && !(window as any).aistudio) {
          throw new Error("API_KEY_NOT_FOUND");
      }

      // Initialize AI client - guidelines: fresh instance per call
      const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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

      // Complex Text Tasks: gemini-3-pro-preview
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{
            parts: [{
                text: `You are a world-class senior financial advisor. Analyze the following financial snapshot for ${monthYear} and provide 4-5 high-impact, tailored recommendations.
        
                Analysis Focus:
                1. Debt Optimization: Strategies for high-interest balances.
                2. Wealth Growth: Savings/investment advice based on income and net worth.
                3. Credit Score Analysis: Insights based on bureau differences.
                
                Profile Data:
                ${financialProfile}
                
                Return a strict JSON response following the specified schema.`
            }]
        }],
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            thinkingConfig: { thinkingBudget: 24000 } // Ample budget for deep financial reasoning
        }
      });

      const text = response.text;
      if (text) {
          const parsed = JSON.parse(text);
          if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
              setRecommendations(parsed.recommendations);
          } else {
              throw new Error("UNEXPECTED_FORMAT");
          }
      } else {
          throw new Error("EMPTY_RESPONSE");
      }

    } catch (err: any) {
      console.error("AI Advisor Error:", err);
      
      const isConfigError = err.message === "API_KEY_NOT_FOUND" || 
                           err.message?.toLowerCase().includes('api key') || 
                           err.message?.includes('403') || 
                           err.message?.includes('401');

      if (isConfigError) {
          if ((window as any).aistudio) {
              setNeedsKey(true);
          } else {
              setError("API configuration is missing. If you're hosting on Render.com, ensure the 'API_KEY' environment variable is correctly set in your project settings and that it is available to the client bundle.");
          }
          return;
      }

      setError("The AI advisor is temporarily unavailable. Please try again in a few moments.");
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Advisor</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Insights for {monthYear}</p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 text-3xl leading-none">
             &times;
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
           {needsKey ? (
             <div className="text-center py-12 px-4 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-6 animate-pulse">
                    <SparklesIcon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Connect Your API Key</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    To use the AI Financial Advisor, you must select a Gemini API key from a paid project.
                </p>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 text-left">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Next Steps:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-3 list-disc pl-5">
                        <li>Click <strong>Connect API Key</strong> below.</li>
                        <li>Select a project with billing enabled.</li>
                        <li>Learn about <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-primary underline font-medium">Gemini billing requirements</a>.</li>
                    </ul>
                </div>
                <div className="flex flex-col gap-3">
                    <Button onClick={handleConnectKey} className="w-full py-4 text-lg">
                        <SparklesIcon /> Connect API Key
                    </Button>
                    <Button onClick={onClose} variant="secondary">Cancel</Button>
                </div>
             </div>
           ) : loading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-5">
               <div className="relative">
                 <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-purple-600"></div>
                 <div className="absolute inset-0 flex items-center justify-center text-purple-600">
                    <SparklesIcon />
                 </div>
               </div>
               <div className="text-center">
                 <p className="text-purple-600 dark:text-purple-400 font-bold text-lg animate-pulse">Thinking about your finances...</p>
                 <p className="text-xs text-gray-500 mt-2">Running detailed analysis of your assets and credit health.</p>
               </div>
             </div>
           ) : error ? (
             <div className="text-center py-12 px-4 max-w-lg mx-auto">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-6">
                 <InfoIcon />
               </div>
               <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Service Connection Issue</h3>
               <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{error}</p>
               <div className="flex justify-center gap-4">
                 <Button onClick={onClose} variant="secondary">Close</Button>
                 <Button onClick={() => { setError(null); fetchRecommendations(); }}>Retry Analysis</Button>
               </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations?.map((rec, index) => (
                    <Card key={index} title={
                        <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-gray-900 dark:text-gray-100">{rec.title}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-100 dark:bg-purple-900/40 px-2.5 py-1 rounded-full text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                {rec.category}
                            </span>
                        </div>
                    } className="border border-purple-100 dark:border-gray-800 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {rec.description}
                            </p>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30">
                                <h4 className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase mb-2 flex items-center gap-2">
                                    <SparklesIcon /> Actionable Goal
                                </h4>
                                <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                                    {rec.actionItem}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
             </div>
           )}
        </div>

        <div className="p-5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center px-8 gap-4">
            <span className="text-[10px] text-gray-400 font-medium italic text-center sm:text-left leading-tight max-w-md">
                Disclaimer: Analysis is generated by AI and is for educational purposes only. Financial decisions should be reviewed by a licensed advisor.
            </span>
            <Button onClick={onClose} variant="secondary">Close Advisor</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
