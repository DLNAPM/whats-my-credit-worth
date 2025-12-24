
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MonthlyData, RecommendationItem } from '../types';
import { getLocalRecommendations } from '../utils/recommendationEngine';
import Button from './ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckIcon, InfoIcon, DownloadIcon } from './ui/Icons';
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
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advisorMode, setAdvisorMode] = useState<'local' | 'ai'>('local');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecommendations(getLocalRecommendations(data));
      setAdvisorMode('local');
      setError(null);
    }
  }, [isOpen, monthYear, data]);

  const handleDownloadPdf = async () => {
    if (!recommendations) return;
    setIsExporting(true);

    try {
      // Create a hidden template for the PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.padding = '40px';
      container.style.background = 'white';
      container.style.color = '#111827';
      container.style.fontFamily = 'sans-serif';
      container.style.position = 'absolute';
      container.style.left = '-9999px';

      const content = `
        <div style="border-bottom: 2px solid #0D47A1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="font-size: 32px; font-weight: bold; color: #0D47A1;">💰 WMCW</span>
            <div style="font-size: 14px; color: #6B7280; margin-top: 4px;">What's My Credit Worth</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold;">Financial Strategy Report</div>
            <div style="font-size: 14px; color: #6B7280;">${formatMonthYear(monthYear)}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px;">
          ${recommendations.map(rec => `
            <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; background: #F9FAFB;">
              <div style="font-size: 10px; font-weight: bold; color: #4F46E5; text-transform: uppercase; margin-bottom: 8px;">${rec.category}</div>
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #111827;">${rec.title}</div>
              <div style="font-size: 13px; color: #4B5563; margin-bottom: 15px; line-height: 1.5;">${rec.description}</div>
              <div style="background: white; border: 1px dashed #D1D5DB; padding: 10px; border-radius: 8px;">
                <div style="font-size: 9px; color: #9CA3AF; text-transform: uppercase; font-weight: bold;">Recommended Action</div>
                <div style="font-size: 13px; font-weight: bold; color: #0D47A1;">${rec.actionItem}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: auto; padding-top: 40px; border-top: 1px solid #E5E7EB;">
          <div style="font-size: 11px; color: #6B7280; text-align: center; font-style: italic; line-height: 1.6;">
            <strong>Disclaimer:</strong> The contents of this report are for informational and educational purposes only and do not constitute professional financial advice. 
            The results presented are automated recommendations based on provided data. You should consult with a <strong>CPA or Certified Financial Expert</strong> 
            before making permanent financial decisions. WMCW is not responsible for any financial losses or actions taken based on these insights.
          </div>
        </div>
      `;

      container.innerHTML = content;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`WMCW-Advisor-Report-${monthYear}.pdf`);
      
      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchAiDeepDive = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
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

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.recommendations) {
        setRecommendations(parsed.recommendations);
        setAdvisorMode('ai');
      }
    } catch (err: any) {
      console.error("Gemini Error:", err);
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

          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold mb-2 italic">Legal Disclaimer</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
              The contents of this report are for informational purposes only. The results are automated recommendations based on your financial snapshot. You should consult with a <strong>CPA or Certified Financial Expert</strong> before making permanent financial decisions. WMCW and its AI Advisor do not assume liability for financial actions taken based on these outputs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-[10px] text-gray-400 font-medium">
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-500 uppercase">Billing Required for AI</a>
            </div>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">Dismiss</Button>
                {recommendations && recommendations.length > 0 && (
                  <Button onClick={handleDownloadPdf} variant="secondary" disabled={isExporting}>
                    {isExporting ? 'Generating...' : <><DownloadIcon /> PDF Report</>}
                  </Button>
                )}
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
                    Restore Basic
                  </Button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsModal;
