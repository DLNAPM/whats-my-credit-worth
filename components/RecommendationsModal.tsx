
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import jsPDF from 'jspdf';
import type { MonthlyData, RecommendationItem } from '../types';
import { getLocalRecommendations } from '../utils/recommendationEngine';
import Button from './ui/Button';
import { SparklesIcon, AlertTriangleIcon, CheckIcon, InfoIcon, DownloadIcon } from './ui/Icons';
import { formatMonthYear, formatCurrency, calculateMonthlyIncome, calculateTotal, calculateTotalBalance, calculateNetWorth, calculateDTI, calculateTotalLimit, calculateUtilization } from '../utils/helpers';
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
  const { isPremium } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setRecommendations(getLocalRecommendations(data));
      setAdvisorMode('local');
      setError(null);
    }
  }, [isOpen, data]);

  const handleAiDeepDive = () => {
    if (isPremium) fetchAiDeepDive();
    else setIsMembershipOpen(true);
  };

  const handleDownloadPdf = () => {
    if (!isPremium) setIsMembershipOpen(true);
    else generatePdf();
  };

  const generatePdf = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.text(`WMCW Advisor Report - ${formatMonthYear(monthYear)}`, 10, 10);
      recommendations?.forEach((r, i) => doc.text(`${r.title}: ${r.description}`, 10, 20 + (i * 10)));
      doc.save(`WMCW-Advisor-${monthYear}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  const fetchAiDeepDive = async () => {
    setIsAiLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Perform personal wealth analysis for ${formatMonthYear(monthYear)}. Net Worth: ${formatCurrency(calculateNetWorth(data))}. Utilization: ${calculateUtilization(calculateTotalBalance(data.creditCards), calculateTotalLimit(data.creditCards)).toFixed(1)}%`;
      const schema = { type: Type.OBJECT, properties: { recommendations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, category: { type: Type.STRING }, actionItem: { type: Type.STRING } }, required: ['title', 'description', 'category', 'actionItem'] } } }, required: ['recommendations'] };
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
      setRecommendations(JSON.parse(response.text || '{}').recommendations);
      setAdvisorMode('ai');
    } catch (err) {
      setError("AI Analysis failed. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-purple-100 animate-fade-in">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
          <div className="flex items-center gap-3"><div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600"><SparklesIcon /></div><div><h2 className="text-xl font-bold">Financial Insights & Recommendations</h2></div></div>
          <button onClick={onClose} className="text-gray-400 p-2 text-2xl font-light">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex items-center gap-2">
               <div className={`w-2.5 h-2.5 rounded-full ${advisorMode === 'ai' ? 'bg-purple-500 animate-pulse' : 'bg-green-500'}`}></div>
               <span className="font-semibold">{advisorMode === 'ai' ? 'Gemini 3 Pro Deep Dive*' : 'Local Rule Engine'}</span>
             </div>
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex items-center justify-between">
               {!isAiLoading && advisorMode === 'local' && <Button onClick={handleAiDeepDive} size="small" className="bg-purple-600 text-white">Unlock AI Insights*</Button>}
             </div>
          </div>
          <div className="space-y-4">{recommendations?.map((rec, i) => <div key={i} className="p-5 rounded-2xl bg-white dark:bg-gray-800 border group"><h3 className="text-lg font-bold mb-2">{rec.title}</h3><p className="text-sm text-gray-600 mb-4">{rec.description}</p></div>)}</div>
        </div>

        <div className="p-6 border-t bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <div className="text-[10px] font-bold text-gray-400 uppercase">* Premium Feature</div>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">Dismiss</Button>
                <Button onClick={handleDownloadPdf} variant="secondary" disabled={isExporting}><DownloadIcon /> PDF Report*</Button>
                {advisorMode === 'local' && <Button onClick={handleAiDeepDive} disabled={isAiLoading}><SparklesIcon /> AI Deep Dive*</Button>}
            </div>
        </div>
      </div>
      <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
    </div>
  );
};

export default RecommendationsModal;
