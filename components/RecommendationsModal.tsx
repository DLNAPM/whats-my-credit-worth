
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MonthlyData, RecommendationItem } from '../types';
import { getLocalRecommendations } from '../utils/recommendationEngine';
import Button from './ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckIcon, InfoIcon } from './ui/Icons';
import { formatMonthYear, formatCurrency, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateNetWorth, calculateDTI, calculateTotalLimit, calculateUtilization } from '../utils/helpers';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData;
  monthYear: string;
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advisorMode, setAdvisorMode] = useState<'local' | 'ai'>('local');

  useEffect(() => {
    if (isOpen) {
      // Default to Local Engine for immediate, reliable results
      setRecommendations(getLocalRecommendations(data));
      setAdvisorMode('local');
      setError(null);
    }
  }, [isOpen, monthYear, data]);

  const fetchAiDeepDive = async () => {
    // Check for API key selection if using AI Studio environment
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Assuming key selection successful as per guidelines
      }
    }

    setIsAiLoading(true);
    setError(null);

    try {
      // Create a fresh instance of GoogleGenAI to ensure the latest API key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const netWorth = calculateNetWorth(data);
      const totalIncome = calculateMonthlyIncome(data.income.jobs);
      const totalBills = calculateTotal(data.monthlyBills);
      const cardBalance = calculateTotalBalance(data.creditCards);
      const cardLimit = calculateTotalLimit(data.creditCards);
      const utilization = calculateUtilization(cardBalance, cardLimit);
      const totalDebt = cardBalance + calculateTotalBalance(data.loans);
      const dti = calculateDTI(totalBills, totalIncome);
      const scores = `Experian: ${data.creditScores.experian.score8}, Equifax: ${data.creditScores.equifax.score8}, TransUnion: ${data.creditScores.transunion.score8}`;

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
                category: { 
                  type: Type.STRING,
                  enum: ['Debt Reduction', 'Investment', 'Life Insurance & Protection', 'Strategic Move']
                },
                actionItem: { type: Type.STRING }
              },
              required: ['title', 'description', 'category', 'actionItem']
            }
          }
        },
        required: ['recommendations']
      };

      const prompt = `Perform a high-level personal wealth and credit worth analysis for ${formatMonthYear(monthYear)}:
        - Net Worth: ${formatCurrency(netWorth)}
        - Monthly Gross Income: ${formatCurrency(totalIncome)}
        - Total Monthly Bills: ${formatCurrency(totalBills)}
        - Total Liabilities: ${formatCurrency(totalDebt)}
        - CC Utilization: ${utilization.toFixed(1)}%
        - DTI: ${dti.toFixed(1)}%
        - Scores: ${scores}
        
        INSTRUCTIONS:
        1. Provide 4 creative, sophisticated, and actionable strategies focused on net worth growth and credit optimization.
        2. ASSET VELOCITY RULE: If the user has a significant monthly income surplus (Income > Bills), you MUST include a specific recommendation regarding the STOCK MARKET or INDEX FUNDS.
        3. Explain the benefits of stock market participation: compound growth, dividend reinvestment, and capital preservation against inflation.
        4. If debt is high, prioritize reduction strategies alongside wealth building.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      // Extract text directly from response.text property
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.recommendations) {
        setRecommendations(parsed.recommendations);
        setAdvisorMode('ai');
      }
    } catch (err: any) {
      console.error("Gemini Error:", err);
      // If the API key is invalid or not found, prompt the user to re-select
      if (err?.message?.includes("Requested entity was not found") && window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      setError("Unable to reach the AI Deep Dive engine. Please verify your API configuration.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-100 dark:border-purple-900/30 animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <SparklesIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Financial Insights & Recommendations</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Personalized strategies for {formatMonthYear(monthYear)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 text-2xl font-light">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-xl flex items-start gap-3 text-sm">
              <AlertTriangleIcon />
              <div>
                <p className="font-bold">Advisor Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
               <p className="text-xs font-bold text-gray-400 uppercase mb-1 font-mono tracking-tighter">Current Engine</p>
               <div className="flex items-center gap-2">
                 <div className={`w-2.5 h-2.5 rounded-full ${advisorMode === 'ai' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse' : 'bg-green-500'}`}></div>
                 <span className="font-semibold text-gray-700 dark:text-gray-200">
                   {advisorMode === 'ai' ? 'Gemini 3 Pro Deep Dive' : 'Local Rule Engine'}
                 </span>
               </div>
             </div>
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
               <div>
                 <p className="text-xs font-bold text-gray-400 uppercase mb-1 font-mono tracking-tighter">AI Status</p>
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {isAiLoading ? 'Analyzing...' : advisorMode === 'ai' ? 'Analysis Complete' : 'Ready for Analysis'}
                 </p>
               </div>
               {!isAiLoading && advisorMode === 'local' && (
                 <Button onClick={fetchAiDeepDive} size="small" className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-sm">
                   Unlock AI Insights
                 </Button>
               )}
             </div>
          </div>

          <div className="space-y-4">
            {recommendations?.map((rec, index) => (
              <div 
                key={index} 
                className="group p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-900/50 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    rec.category === 'Debt Reduction' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                    rec.category === 'Investment' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                    rec.category === 'Life Insurance & Protection' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                    'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                  }`}>
                    {rec.category}
                  </span>
                  {advisorMode === 'ai' && <div className="text-purple-500"><SparklesIcon /></div>}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{rec.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{rec.description}</p>
                <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                   <div className="text-positive mt-0.5"><CheckIcon /></div>
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5 font-mono tracking-tighter">Recommended Action</p>
                     <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{rec.actionItem}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {advisorMode === 'local' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-800/50">
                <div className="text-blue-500 mt-0.5"><InfoIcon /></div>
                <div>
                   <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Upgrade to AI Deep Dive</p>
                   <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 leading-relaxed">
                     Our local engine uses standard financial heuristics. Unlock the AI Advisor to get custom strategies based on current financial modeling and advanced credit optimization.
                   </p>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-[10px] text-gray-400 font-medium">
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-500">BILLING ENABLED PROJECT</a> IS REQUIRED FOR GEMINI 3 PRO ADVISOR
            </div>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">Dismiss</Button>
                {advisorMode === 'local' ? (
                  <Button onClick={fetchAiDeepDive} disabled={isAiLoading}>
                    {isAiLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <SparklesIcon /> AI Deep Dive
                      </div>
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => { setRecommendations(getLocalRecommendations(data)); setAdvisorMode('local'); }} variant="secondary">
                    Restore Basic View
                  </Button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
