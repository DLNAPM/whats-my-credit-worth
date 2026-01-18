
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MonthlyData, CreditCard, Loan } from '../types';
import { formatCurrency, calculateUtilization, calculateTotalBalance, calculateTotalLimit, calculateNetWorth, formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { SparklesIcon, SimulationIcon, AlertTriangleIcon, InfoIcon, DownloadIcon } from './ui/Icons';
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
      const prompt = `FICO 8 Simulation: Cards: ${simulatedCards.map(c => `${c.name}:${c.balance}`).join(', ')}. Loans: ${simulatedLoans.map(l => `${l.name}:${l.balance}`).join(', ')}`;
      const schema = { type: Type.OBJECT, properties: { experian: { type: Type.INTEGER }, equifax: { type: Type.INTEGER }, transunion: { type: Type.INTEGER }, reasoning: { type: Type.STRING } }, required: ['experian', 'equifax', 'transunion', 'reasoning'] };
      const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
      setPrediction(JSON.parse(result.text || '{}'));
    } catch (err) {
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
      doc.text(`WMCW Simulation Report - ${formatMonthYear(monthYear)}`, 10, 10);
      doc.text(`Reasoning: ${prediction?.reasoning}`, 10, 20);
      doc.save(`WMCW-Simulation-${monthYear}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3"><div className="p-2 bg-brand-primary text-white rounded-xl"><SimulationIcon /></div><h2 className="text-xl font-bold">Credit Impact Simulator</h2></div>
          <button onClick={onClose} className="text-gray-400 p-2 text-2xl font-light hover:rotate-90 transition-transform">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-10">
            <section><h3 className="text-sm font-bold uppercase text-brand-primary mb-6">Credit Cards</h3><div className="space-y-8">{simulatedCards.map(c => <div key={c.id} className="space-y-3"><div className="flex justify-between text-sm"><span>{c.name}</span><span className="font-mono">{formatCurrency(c.balance)}</span></div><input type="range" min="0" max={c.limit} step="50" value={c.balance} onChange={e => handleBalanceChange(c.id, Number(e.target.value), 'card')} className="w-full accent-brand-primary" /></div>)}</div></section>
            <section><h3 className="text-sm font-bold uppercase text-brand-secondary mb-6">Loans</h3><div className="space-y-8">{simulatedLoans.map(l => <div key={l.id} className="space-y-3"><div className="flex justify-between text-sm"><span>{l.name}</span><span className="font-mono">{formatCurrency(l.balance)}</span></div><input type="range" min="0" max={l.limit || l.balance * 2} step="100" value={l.balance} onChange={e => handleBalanceChange(l.id, Number(e.target.value), 'loan')} className="w-full accent-brand-secondary" /></div>)}</div></section>
          </div>

          <div className="w-full lg:w-96 space-y-6">
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border flex flex-col items-center shadow-inner">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Simulated Outlook</h4>
              <div className="space-y-4 w-full">
                <div className="flex justify-between items-center px-2"><span>Utilization</span><span className={`text-lg font-bold ${simulatedUtilization > 30 ? 'text-negative' : 'text-positive'}`}>{simulatedUtilization.toFixed(1)}%</span></div>
              </div>
              <Button onClick={runSimulation} disabled={isLoading} className="w-full mt-8 py-4 bg-brand-primary text-white rounded-2xl shadow-lg"><SparklesIcon /> Run AI Simulation</Button>
            </div>

            {prediction && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-primary to-indigo-700 text-white shadow-xl relative overflow-hidden">
                  <h4 className="text-[10px] font-bold uppercase opacity-70 mb-4">Predicted FICO® 8 Scores</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">{['Experian', 'Equifax', 'TransUnion'].map((b, i) => <div key={b} className="bg-white/10 p-2 rounded-xl backdrop-blur-sm"><p className="text-[10px] opacity-70 uppercase">{b}</p><p className="text-2xl font-bold">{i === 0 ? prediction.experian : i === 1 ? prediction.equifax : prediction.transunion}</p></div>)}</div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleExportPdf} disabled={isExporting} variant="secondary" className="flex-1 py-3 text-sm"><DownloadIcon /> Export PDF Report*</Button>
                  <Button onClick={handlePrint} variant="secondary" className="py-3 px-6 text-sm">Print*</Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t flex items-center gap-3"><InfoIcon className="text-gray-400" /><p className="text-[10px] font-bold text-gray-500 uppercase">* Premium Feature - Requires Membership</p></div>
      </div>
      <MembershipModal isOpen={isMembershipOpen} onClose={() => setIsMembershipOpen(false)} />
    </div>
  );
};

export default SimulationModal;
