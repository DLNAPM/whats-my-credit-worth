
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MonthlyData, RecommendationItem } from '../types';
import { getLocalRecommendations } from '../utils/recommendationEngine';
import Button from './ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckIcon, InfoIcon, DownloadIcon, GoldAsterisk } from './ui/Icons';
import { formatMonthYear, formatCurrency, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateNetWorth, calculateDTI, calculateTotalLimit, calculateUtilization } from '../utils/helpers';
import { exportRecommendationsReportToPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import MembershipModal from './MembershipModal';

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
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const { user, isPremium, accountType, businessName, businessType } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setRecommendations(getLocalRecommendations(data, accountType || 'personal', businessName));
      setAdvisorMode('local');
      setError(null);
    }
  }, [isOpen, data, accountType, businessName]);

  const handleAiDeepDive = () => {
    if (isPremium) fetchAiDeepDive();
    else setIsMembershipOpen(true);
  };

  const handleDownloadPdf = () => {
    if (!isPremium) setIsMembershipOpen(true);
    else generatePdf();
  };

  const generatePdf = async () => {
    if (!recommendations || recommendations.length === 0) return;
    setIsExporting(true);
    try {
      await exportRecommendationsReportToPDF({
        recommendations,
        data,
        monthYear,
        accountType: accountType || 'personal',
        businessName: businessName || '',
        businessType: businessType || 'LLC',
        advisorMode,
        userEmail: user?.email || undefined,
        displayName: user?.displayName || undefined
      });
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchAiDeepDive = async () => {
    setIsAiLoading(true);
    setError(null);
    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setError("API Key must be selected. Please click the button below to configure your API key.");
          setIsAiLoading(false);
          return;
        }
      }

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("AI is not configured. Please set the GEMINI_API_KEY environment variable.");
      }
      const ai = new GoogleGenAI({ apiKey });

      const totalIncome = calculateMonthlyIncome(data.income.jobs);
      const totalBills = calculateTotal(data.monthlyBills);
      const netWorth = calculateNetWorth(data);
      const cardBalance = calculateTotalBalance(data.creditCards);
      const cardLimit = calculateTotalLimit(data.creditCards);
      const utilization = calculateUtilization(cardBalance, cardLimit);
      const totalAssets = calculateTotal(data.assets);
      const totalDebt = cardBalance + calculateTotalBalance(data.loans);

      let prompt = '';
      if (accountType === 'business') {
        const entityLabel = businessName ? `${businessName} (${businessType || 'LLC'})` : 'Commercial Enterprise';
        prompt = `You are a Senior Commercial Underwriting & Corporate Financial Advisor analyzing the financial profile for ${entityLabel} for ${formatMonthYear(monthYear)}.
Account Mode: BUSINESS ACCOUNT.
Key Metrics:
- Monthly Revenue / Operating Inflows: ${formatCurrency(totalIncome)}
- Monthly Operating Expenses (OPEX) & Debt Service: ${formatCurrency(totalBills)}
- DSCR (Debt Service Coverage Ratio): ${(totalBills > 0 ? totalIncome / totalBills : 2.5).toFixed(2)}x
- Total Liquid & Capital Assets: ${formatCurrency(totalAssets)}
- Total Commercial Liabilities: ${formatCurrency(totalDebt)}
- Revolving Credit Line Utilization: ${utilization.toFixed(1)}%
- Net Asset Position: ${formatCurrency(netWorth)}

Deliver exactly 4 comprehensive, actionable strategic recommendations using Commercial Underwriting Standards and Business Risk Policies across these exact categories:
1. "Debt Reduction" (Commercial Credit Line & Debt Covenants)
2. "Strategic Move" (DSCR Optimization & SBA / Commercial Expansion Capacity)
3. "Investment" (Working Capital Runway, Treasury Liquidity & Section 179 Reinvestment)
4. "Life Insurance & Protection" (Corporate Veil Mitigation, Key Person & Commercial Liability Separation)`;
      } else {
        prompt = `You are a Senior Wealth Management & Consumer Credit Advisor analyzing personal household finances for ${formatMonthYear(monthYear)}.
Account Mode: PERSONAL ACCOUNT.
Key Metrics:
- Monthly Net Income: ${formatCurrency(totalIncome)}
- Monthly Household Bills & Debt Payments: ${formatCurrency(totalBills)}
- DTI (Debt-to-Income): ${calculateDTI(totalBills, totalIncome).toFixed(1)}%
- Total Liquid & Long-term Assets: ${formatCurrency(totalAssets)}
- Total Consumer Liabilities: ${formatCurrency(totalDebt)}
- Credit Card Utilization: ${utilization.toFixed(1)}%
- Net Worth: ${formatCurrency(netWorth)}

Deliver exactly 4 comprehensive, actionable personal wealth recommendations adhering strictly to Consumer FICO 8/4/2 Standards, Fannie Mae Qualified Mortgage Guidelines (<43% DTI), 6-Month Emergency Reserves, and Estate Protection across these exact categories:
1. "Debt Reduction"
2. "Strategic Move"
3. "Investment"
4. "Life Insurance & Protection"`;
      }

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

      const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash', 
        contents: prompt, 
        config: { 
          responseMimeType: "application/json", 
          responseSchema: schema 
        } 
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        setRecommendations(parsed.recommendations);
        setAdvisorMode('ai');
      } else {
        throw new Error("Invalid response structure from AI model.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "AI Analysis failed. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      fetchAiDeepDive();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-100 dark:border-gray-800 animate-fade-in">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-300">
              <SparklesIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Insights & Recommendations</h2>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                  accountType === 'business'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}>
                  {accountType === 'business' ? '🏢 Business Standards' : '👤 Personal Standards'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {accountType === 'business'
                  ? `Commercial Debt Service & Underwriting Policies ${businessName ? `for ${businessName}` : ''}`
                  : 'Consumer FICO Underwriting & Personal Wealth Standards'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 text-2xl font-light">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded-xl flex flex-col gap-2 border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
              {error.includes("API Key must be selected") && window.aistudio && (
                <div className="mt-2 flex flex-col gap-2 items-start">
                  <p className="text-sm">
                    To use this feature, you need to select a paid API key from a Google Cloud project.
                    For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-semibold">billing documentation</a>.
                  </p>
                  <Button onClick={handleSelectKey} size="small" className="bg-red-600 text-white hover:bg-red-700">
                    Select API Key
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center gap-2.5">
               <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${advisorMode === 'ai' ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`}></div>
               <div>
                 <span className="font-bold text-xs block text-gray-900 dark:text-white">
                   {advisorMode === 'ai' ? 'AI Deep Dive Engine' : 'Deterministic Rule Engine'}
                 </span>
                 <span className="text-[10px] text-gray-500 dark:text-gray-400">
                   {accountType === 'business' ? 'Commercial Policy Model' : 'Consumer Policy Model'}
                 </span>
               </div>
             </div>
             <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
               <span className="text-xs text-gray-500 dark:text-gray-400">
                 {advisorMode === 'ai' ? 'AI Deep Dive Active' : 'Upgrade to AI Insights'}
               </span>
               {!isAiLoading && advisorMode === 'local' && (
                 <Button onClick={handleAiDeepDive} size="small" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-1.5 px-3">
                   Unlock AI Insights <GoldAsterisk />
                 </Button>
               )}
               {isAiLoading && (
                 <span className="text-xs font-bold text-purple-600 dark:text-purple-400 animate-pulse">
                   Analyzing...
                 </span>
               )}
             </div>
          </div>

          <div className="space-y-4">
            {recommendations?.map((rec, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {rec.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{rec.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{rec.description}</p>
                {rec.actionItem && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 text-xs font-medium text-gray-800 dark:text-gray-200 flex items-start gap-2">
                    <span className="text-brand-primary dark:text-blue-400 font-bold">👉</span>
                    <span><strong>Action Item:</strong> {rec.actionItem}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-wrap justify-between items-center gap-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase">Features with <GoldAsterisk /> Require Membership</div>
            <div className="flex gap-2.5">
                <Button onClick={onClose} variant="secondary">Dismiss</Button>
                <Button onClick={handleDownloadPdf} variant="secondary" disabled={isExporting}><DownloadIcon /> PDF Report <GoldAsterisk /></Button>
                {advisorMode === 'local' && <Button onClick={handleAiDeepDive} disabled={isAiLoading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold"><SparklesIcon /> AI Deep Dive <GoldAsterisk /></Button>}
            </div>
        </div>
      </div>
      <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
    </div>
  );
};

export default RecommendationsModal;
