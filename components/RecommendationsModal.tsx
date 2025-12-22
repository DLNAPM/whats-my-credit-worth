
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MonthlyData } from '../types';
import Button from './ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckIcon } from './ui/Icons';
import { formatMonthYear, formatCurrency, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateNetWorth, calculateDTI } from '../utils/helpers';

// Extend window interface for aistudio properties
// Fix: Defining AIStudio interface to match existing global expectations and avoid type collision.
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

interface RecommendationItem {
  title: string;
  description: string;
  category: string;
  actionItem: string;
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    try {
      // Rule: Check for API key selection if the bridge is available
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsKey(true);
          setIsLoading(false);
          return;
        }
      } else if (!process.env.API_KEY) {
        // Fallback: If no bridge and no environment variable, we can't proceed
        setError("API configuration missing. Please ensure an API Key is provided.");
        setIsLoading(false);
        return;
      }

      // Rule: Always use process.env.API_KEY directly and initialize right before call.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const netWorth = calculateNetWorth(data);
      const totalIncome = calculateMonthlyIncome(data.income.jobs);
      const totalBills = calculateTotal(data.monthlyBills);
      const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
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
                category: { type: Type.STRING },
                actionItem: { type: Type.STRING }
              },
              required: ['title', 'description', 'category', 'actionItem']
            }
          }
        },
        required: ['recommendations']
      };

      const prompt = `Analyze this financial snapshot for ${formatMonthYear(monthYear)}:
        Net Worth: ${formatCurrency(netWorth)}, Monthly Income: ${formatCurrency(totalIncome)}, Total Debt: ${formatCurrency(totalDebt)}, Debt-to-Income Ratio: ${dti.toFixed(1)}%, FICO Scores: ${scores}.
        Provide 4 actionable and high-impact financial strategies for this user.`;

      // Rule: Use gemini-3-pro-preview for complex reasoning tasks.
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          // Rule: Max thinking budget for gemini-3-pro-preview is 32768.
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      // Rule: Access .text directly from response property.
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.recommendations) setRecommendations(parsed.recommendations);

    } catch (err: any) {
      console.error("Gemini Error:", err);
      // Rule: Handle case where key selection is required or expired.
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API Key must be set")) {
        if (window.aistudio) {
          setNeedsKey(true);
        } else {
          setError("The API Key provided is invalid or has expired.");
        }
      } else {
        setError("Failed to generate insights. Please check your connection or try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectKey = async () => {
    // Rule: Use window.aistudio.openSelectKey() to prompt user for key selection.
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Rule: Assume success and retry immediately.
      setNeedsKey(false);
      fetchRecommendations();
    }
  };

  useEffect(() => {
    if (isOpen) fetchRecommendations();
  }, [isOpen, monthYear]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-100 dark:border-purple-900/30">
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl"><SparklesIcon /></div>
            <div>
              <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">AI Financial Advisor</h2>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Cloud Analysis Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-grow">
          {needsKey ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center"><SparklesIcon /></div>
              <h3 className="text-lg font-bold">Connect AI Engine</h3>
              <p className="text-sm text-gray-500 max-w-xs">To use the AI Advisor, you must select your own paid Gemini API key from a project with billing enabled.</p>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-purple-600 hover:underline mb-2"
              >
                Learn about Gemini API billing
              </a>
              <Button onClick={handleSelectKey}>Select API Key</Button>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-5">
              <div className="w-12 h-12 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-lg font-semibold animate-pulse">Running reasoning models...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-xl text-center space-y-4">
              <div className="flex justify-center"><AlertTriangleIcon /></div>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <Button onClick={fetchRecommendations} variant="secondary" size="small">Try Again</Button>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 mb-2 block">{rec.category}</span>
                  <h4 className="font-bold mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{rec.description}</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-positive bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                    <CheckIcon /> <span>{rec.actionItem}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="p-4 border-t bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <Button onClick={onClose} variant="secondary" size="small">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
