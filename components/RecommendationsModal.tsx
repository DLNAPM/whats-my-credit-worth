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
    if (isOpen && !recommendations) {
      fetchRecommendations();
    }
  }, [isOpen]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Prepare data for the prompt
      const netWorth = calculateNetWorth(data);
      const income = calculateMonthlyIncome(data.income.jobs);
      const totalDebt = calculateTotalBalance(data.creditCards) + calculateTotalBalance(data.loans);
      
      const scores = Object.entries(data.creditScores)
         .map(([key, val]) => {
             const score = typeof val === 'object' && val !== null && 'score8' in val ? val.score8 : val;
             return `${key}: ${score}`;
         })
         .join(', ');

      const financialProfile = `
        Month: ${monthYear}
        Net Worth: ${formatCurrency(netWorth)}
        Monthly Income: ${formatCurrency(income)}
        Total Debt: ${formatCurrency(totalDebt)}
        Credit Scores: ${scores}
        Assets: ${data.assets.map(a => `${a.name} ($${a.value})`).join(', ')}
        Liabilities: ${[...data.creditCards, ...data.loans].map(l => `${l.name} ($${l.balance})`).join(', ')}
      `;

      // 2. Initialize GenAI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // 3. Define Schema
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
                        category: { type: Type.STRING, description: "One of: 'Credit Cards', 'Loans', 'Savings', 'Investments', 'General'" },
                        actionItem: { type: Type.STRING, description: "A specific, short actionable step." }
                    }
                }
            }
        }
      };

      // 4. Call Model
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Act as a financial expert. Analyze the following financial profile and provide 4-5 tailored recommendations.
        
        Focus on:
        1. Loans or Credit Cards that match this profile (e.g., balance transfer, rewards, debt consolidation, credit building).
        2. Savings Account and Investment strategies to increase net worth (e.g., HYSA, index funds, debt payoff avalanche/snowball).
        
        Profile:
        ${financialProfile}
        
        Return the result as JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.7
        }
      });

      const responseText = response.text;
      if (responseText) {
          const parsed = JSON.parse(responseText);
          setRecommendations(parsed.recommendations);
      } else {
          setError("No recommendations generated.");
      }

    } catch (err: any) {
      console.error("Error generating recommendations:", err);
      setError("Failed to generate recommendations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-purple-50 dark:bg-gray-800 rounded-t-lg">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <SparklesIcon />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Financial Recommendations</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tailored advice based on your {monthYear} snapshot</p>
              </div>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
             <span className="text-2xl">&times;</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
               <p className="text-purple-600 font-medium animate-pulse">Analyzing your finances...</p>
             </div>
           ) : error ? (
             <div className="text-center py-10">
               <div className="text-red-500 mb-2">
                 <InfoIcon />
               </div>
               <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Oops!</h3>
               <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
               <Button onClick={fetchRecommendations}>Try Again</Button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations?.map((rec, index) => (
                    <Card key={index} title={
                        <div className="flex items-center justify-between">
                            <span>{rec.title}</span>
                            <span className="text-xs font-bold uppercase tracking-wide bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                {rec.category}
                            </span>
                        </div>
                    } className="transform transition-all hover:scale-[1.01] hover:shadow-lg border border-purple-100 dark:border-gray-700">
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {rec.description}
                            </p>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800/30">
                                <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-1 flex items-center gap-1">
                                    <SparklesIcon /> Action Item
                                </h4>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                    {rec.actionItem}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
             </div>
           )}
           
           {!loading && !error && (
             <div className="mt-8 text-center text-xs text-gray-400 max-w-2xl mx-auto">
                Disclaimer: These recommendations are generated by AI for informational purposes only and do not constitute professional financial advice. 
                Please consult with a qualified financial advisor before making significant financial decisions.
             </div>
           )}
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Button onClick={onClose} variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;