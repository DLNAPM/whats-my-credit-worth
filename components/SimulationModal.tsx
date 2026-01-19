
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MonthlyData, CreditCard, Loan } from '../types';
import { formatCurrency, calculateUtilization, calculateTotalBalance, calculateTotalLimit, calculateNetWorth, formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { SparklesIcon, SimulationIcon, AlertTriangleIcon, InfoIcon, DownloadIcon, GoldAsterisk, CheckIcon } from './ui/Icons';
import { useAuth } from '../contexts/AuthContext';
import MembershipModal from './MembershipModal';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthlyData;
  monthYear: string;
}

interface PredictedScore {
  experian: number;
  equifax: number;
  transunion: number;
  reasoning: string;
  recommendations: string[];
}

const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose, data, monthYear }) => {
  const [simulatedCards, setSimulatedCards] = useState<CreditCard[]>([]);
  const [simulatedLoans, setSimulatedLoans] = useState<Loan[]>([]);
  const [prediction, setPrediction] = useState<PredictedScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const { isPremium } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setSimulatedCards(JSON.parse(JSON.stringify(data.creditCards)));
      setSimulatedLoans(JSON.parse(JSON.stringify(data.loans)));
      setPrediction(null);
      setError(null);
    }
  }, [isOpen, data]);

  const handleBalanceChange = (id: string, newBalance: number, type: 'card' | 'loan') => {
    if (type === 'card') setSimulatedCards(prev => prev.map(c => c.id === id ? { ...c, balance: newBalance } : c));
    else setSimulatedLoans(prev => prev.map(l => l.id === id ? { ...l, balance: newBalance } : l));
  };

  const simulatedUtilization = useMemo(() => calculateUtilization(calculateTotalBalance(simulatedCards), calculateTotalLimit(simulatedCards)), [simulatedCards]);

  const runSimulation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as a FICO 8 Credit Expert. Analyze this simulated scenario and predict the impact on the user's credit scores.
        Current Data: ${JSON.stringify(data)}
        Simulated Changes:
        - Credit Cards: ${simulatedCards.map(c => `${c.name}: ${formatCurrency(c.balance)}/${formatCurrency(c.limit)}`).join(', ')}
        - Loans: ${simulatedLoans.map(l => `${l.name}: ${formatCurrency(l.balance)}`).join(', ')}
        - Simulated Utilization: ${simulatedUtilization.toFixed(1)}%

        Provide a detailed reasoning for the score change and exactly 3 actionable recommendations for the best financial outcome.
      `;

      const schema = {
        type: Type.OBJECT,
        properties: {
          experian: { type: Type.INTEGER },
          equifax: { type: Type.INTEGER },
          transunion: { type: Type.INTEGER },
          reasoning: { type: Type.STRING, description: "Clear explanation of why the scores changed." },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 3 actionable recommendations for best outcome."
          }
        },
        required: ['experian', 'equifax', 'transunion', 'reasoning', 'recommendations']
      };

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      const parsed = JSON.parse(result.text || '{}');
      setPrediction(parsed);
    } catch (err) {
      console.error(err);
      setError("Simulation failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (!isPremium) setIsMembershipOpen(true);
    else handleDownloadPdf();
  };

  const handlePrint = () => {
    if (!isPremium) setIsMembershipOpen(true);
    else window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`WMCW Simulation Report - ${formatMonthYear(monthYear)}`, 10, 20);
      
      doc.setFontSize(12);
      doc.text(`Predicted Scores:`, 10, 35);
      doc.text(`Experian: ${prediction?.experian}`, 15, 42);
      doc.text(`Equifax: ${prediction?.equifax}`, 15, 49);
      doc.text(`TransUnion: ${prediction?.transunion}`, 15, 56);

      doc.text(`Analysis:`, 10, 70);
      const splitReason = doc.splitTextToSize(prediction?.reasoning || '', 180);
      doc.text(splitReason, 10, 77);

      doc.text(`Strategic Recommendations:`, 10, 110);
      prediction?.recommendations.forEach((rec, i) => {
        const splitRec = doc.splitTextToSize(`- ${rec}`, 175);
        doc.text(splitRec, 15, 117 + (i * 15));
      });

      doc.save(`WMCW-Simulation-${monthYear}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary text-white rounded-xl">
              <SimulationIcon />
            </div>
            <h2 className="text-xl font-bold">Credit Impact Simulator</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 p-2 text-2xl font-light hover:rotate-90 transition-transform">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col lg:flex-row gap-10">
          {/* Controls Section */}
          <div className="flex-1 space-y-10">
            <section>
              <h3 className="text-sm font-bold uppercase text-brand-primary mb-6 flex items-center gap-2">
                <CheckIcon className="w-4 h-4" /> Credit Cards
              </h3>
              <div className="space-y-8">
                {simulatedCards.map(c => (
                  <div key={c.id} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{c.name}</span>
                      <span className="font-mono text-brand-primary font-bold">{formatCurrency(c.balance)} <span className="text-gray-400 font-normal">/ {formatCurrency(c.limit)}</span></span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={c.limit} 
                      step="50" 
                      value={c.balance} 
                      onChange={e => handleBalanceChange(c.id, Number(e.target.value), 'card')} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary" 
                    />
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h3 className="text-sm font-bold uppercase text-brand-secondary mb-6 flex items-center gap-2">
                <CheckIcon className="w-4 h-4" /> Mortgages & Loans
              </h3>
              <div className="space-y-8">
                {simulatedLoans.map(l => (
                  <div key={l.id} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">{l.name}</span>
                      <span className="font-mono text-brand-secondary font-bold">{formatCurrency(l.balance)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={l.limit || l.balance * 2} 
                      step="100" 
                      value={l.balance} 
                      onChange={e => handleBalanceChange(l.id, Number(e.target.value), 'loan')} 
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-secondary" 
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Results Section */}
          <div className="w-full lg:w-[400px] space-y-6">
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col items-center shadow-inner">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Simulated Outlook</h4>
              
              <div className="w-full space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Utilization</span>
                  <span className={`text-xl font-black ${simulatedUtilization > 30 ? 'text-negative' : 'text-positive'}`}>
                    {simulatedUtilization.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${simulatedUtilization > 30 ? 'bg-negative' : 'bg-positive'}`}
                    style={{ width: `${Math.min(simulatedUtilization, 100)}%` }}
                  ></div>
                </div>
              </div>

              <Button 
                onClick={runSimulation} 
                disabled={isLoading} 
                className="w-full mt-8 py-4 bg-brand-primary text-white rounded-2xl shadow-lg hover:bg-brand-secondary transition-all active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing Impact...
                  </div>
                ) : (
                  <><SparklesIcon /> Run AI Impact Analysis</>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm flex items-center gap-3 animate-fade-in">
                <AlertTriangleIcon className="flex-shrink-0" />
                {error}
              </div>
            )}

            {prediction && (
              <div className="space-y-6 animate-fade-in pb-4">
                {/* Score Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-primary to-indigo-700 text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <SparklesIcon className="w-20 h-20" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase opacity-70 mb-4 tracking-widest">Predicted FICO® 8 Scores</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { name: 'Experian', score: prediction.experian },
                      { name: 'Equifax', score: prediction.equifax },
                      { name: 'TransUnion', score: prediction.transunion }
                    ].map((b) => (
                      <div key={b.name} className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10">
                        <p className="text-[10px] opacity-70 uppercase mb-1">{b.name}</p>
                        <p className="text-2xl font-bold">{b.score}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis Block */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h5 className="text-xs font-bold text-brand-primary uppercase mb-2 flex items-center gap-1.5">
                      <InfoIcon className="w-3.5 h-3.5" /> Reason for Change
                    </h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{prediction.reasoning}"
                    </p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                    <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-3 flex items-center gap-1.5">
                      <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" /> Strategic Recommendations
                    </h5>
                    <ul className="space-y-3">
                      {prediction.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <div className="mt-1 w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                          <span className="font-medium">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleExportPdf} disabled={isExporting} variant="secondary" className="flex-1 py-3 text-sm">
                    <DownloadIcon /> Export Report <GoldAsterisk />
                  </Button>
                  <Button onClick={handlePrint} variant="secondary" className="py-3 px-6 text-sm">
                    Print <GoldAsterisk />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t flex items-center justify-center gap-3">
          <InfoIcon className="text-gray-400 w-4 h-4" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">
            Advanced Analysis features marked with <GoldAsterisk /> Require a Premium Subscription
          </p>
        </div>
      </div>
      <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
    </div>
  );
};

export default SimulationModal;
