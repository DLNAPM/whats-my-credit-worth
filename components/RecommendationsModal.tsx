
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
    let apiKey = '';
    try {
      apiKey = process.env.API_KEY || '';
    } catch {}

    if (!apiKey && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // GUIDELINE: Proceed after triggering dialog
      }
    }

    setIsAiLoading(true);
    setError(null);

    try {
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

      const prompt = `Perform a high-end personal wealth analysis for ${formatMonthYear(monthYear)}:
        - Net Worth: ${formatCurrency(netWorth)}
        - Income: ${formatCurrency(totalIncome)}
        - Debt: ${formatCurrency(totalDebt)}
        - CC Utilization: ${utilization.toFixed(1)}%
        - DTI: ${dti.toFixed(1)}%
        - Scores: ${scores}
        
        Provide 4 creative, sophisticated, and actionable strategies. Focus on wealth velocity and credit optimization.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.recommendations) {
        setRecommendations(parsed.recommendations);
        setAdvisorMode('ai');
      }
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setError("Unable to reach the AI Deep Dive engine. This may be due to an API key issue or connectivity.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-100 dark:border-purple-900/30 animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-white dark:from-brand-primary/10 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${advisorMode === 'ai' ? 'bg-purple-100 dark:bg-purple-900/40' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
              {advisorMode === 'ai' ? <SparklesIcon /> : <InfoIcon />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {advisorMode === 'ai' ? 'AI Advisor Deep Dive' : 'Local Insight Engine'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {advisorMode === 'ai' ? 'Nuanced Generative Analysis' : 'Rules-Based Financial Logic'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangleIcon />
              <div className="text-xs text-red-800 dark:text-red-200 font-medium leading-relaxed">
                {error}
                <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
              </div>
            </div>
          )}

          {isAiLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-12 h-12 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-lg font-semibold animate-pulse text-purple-700">Synthesizing deep-dive insights...</p>
              <p className="text-sm text-gray-500 max-w-xs text-center">Comparing your footprint against global wealth management benchmarks.</p>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Showing <strong>{recommendations.length} tailored strategies</strong> for {formatMonthYear(monthYear)}.
                </p>
                {advisorMode === 'local' && (
                  <button 
                    onClick={fetchAiDeepDive}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold shadow transition-all"
                  >
                    <SparklesIcon /> UPGRADE TO AI
                  </button>
                )}
              </div>

              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm hover:border-brand-primary/30 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm ${
                      rec.category === 'Debt Reduction' ? 'bg-red-50 text-red-600 border border-red-100' :
                      rec.category === 'Investment' ? 'bg-green-50 text-green-600 border border-green-100' :
                      rec.category === 'Life Insurance & Protection' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {rec.category}
                    </span>
                  </div>
                  <h4 className="font-bold mb-1 text-gray-900 dark:text-white group-hover:text-brand-primary transition-colors">{rec.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{rec.description}</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-positive bg-green-50/50 dark:bg-green-900/10 p-2 rounded-lg border border-green-100 dark:border-green-900/20">
                    <CheckIcon /> <span>ACTION: {rec.actionItem}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          {advisorMode === 'ai' && (
            /* Fix: Changed logical OR to block statement to avoid 'void' truthiness test error */
            <Button onClick={() => {
              setRecommendations(getLocalRecommendations(data));
              setAdvisorMode('local');
            }} variant="secondary" size="small">
              Switch to Local Mode
            </Button>
          )}
          <Button onClick={onClose} variant="secondary" size="small">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;