
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { MonthlyData, CreditCard, Loan } from '../types';
import { formatCurrency, calculateUtilization, calculateTotalBalance, calculateTotalLimit, calculateNetWorth, formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { SparklesIcon, SimulationIcon, AlertTriangleIcon, InfoIcon, ChevronRightIcon } from './ui/Icons';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSimulatedCards(JSON.parse(JSON.stringify(data.creditCards)));
      setSimulatedLoans(JSON.parse(JSON.stringify(data.loans)));
      setPrediction(null);
      setError(null);
    }
  }, [isOpen, data]);

  const handleBalanceChange = (id: string, newBalance: number, type: 'card' | 'loan') => {
    if (type === 'card') {
      setSimulatedCards(prev => prev.map(c => c.id === id ? { ...c, balance: newBalance } : c));
    } else {
      setSimulatedLoans(prev => prev.map(l => l.id === id ? { ...l, balance: newBalance } : l));
    }
  };

  const simulatedUtilization = useMemo(() => {
    const balance = calculateTotalBalance(simulatedCards);
    const limit = calculateTotalLimit(simulatedCards);
    return calculateUtilization(balance, limit);
  }, [simulatedCards]);

  const simulatedNetWorth = useMemo(() => {
    const totalAssets = data.assets.reduce((sum, a) => sum + a.value, 0);
    const totalLiabilities = calculateTotalBalance(simulatedCards) + calculateTotalBalance(simulatedLoans);
    return totalAssets - totalLiabilities;
  }, [simulatedCards, simulatedLoans, data.assets]);

  const runSimulation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const currentCards = data.creditCards.map(c => `${c.name}: ${formatCurrency(c.balance)}/${formatCurrency(c.limit)}`).join(', ');
      const simCards = simulatedCards.map(c => `${c.name}: ${formatCurrency(c.balance)}/${formatCurrency(c.limit)}`).join(', ');
      const currentLoans = data.loans.map(l => `${l.name}: ${formatCurrency(l.balance)}`).join(', ');
      const simLoans = simulatedLoans.map(l => `${l.name}: ${formatCurrency(l.balance)}`).join(', ');

      const prompt = `Act as a FICO 8 Credit Score Simulator.
      Current Profile for ${formatMonthYear(monthYear)}:
      - Experian: ${data.creditScores.experian.score8}
      - Equifax: ${data.creditScores.equifax.score8}
      - TransUnion: ${data.creditScores.transunion.score8}
      - Current Cards: ${currentCards}
      - Current Loans: ${currentLoans}
      
      SIMULATED CHANGES:
      - New Cards State: ${simCards}
      - New Loans State: ${simLoans}
      
      Predict the new FICO 8 scores for all three bureaus. 
      Consider aggregate utilization, individual card utilization (over 30% or 70% thresholds), and total debt-to-limit ratio.
      Cross-referencing historical scoring trends, provide a realistic prediction.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          experian: { type: Type.INTEGER },
          equifax: { type: Type.INTEGER },
          transunion: { type: Type.INTEGER },
          reasoning: { type: Type.STRING }
        },
        required: ['experian', 'equifax', 'transunion', 'reasoning']
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
    } catch (err: any) {
      console.error("Simulation Error:", err);
      setError("Failed to run AI simulation. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800 animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/80 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary text-white rounded-xl">
              <SimulationIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold">Credit Impact Simulator</h2>
              <p className="text-sm text-gray-500">Adjust your balances to predict future FICO® scores</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 text-2xl font-light transition-transform hover:rotate-90">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
          
          {/* Controls Side */}
          <div className="flex-1 space-y-10">
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-brand-primary rounded-full"></div>
                Credit Card Balances
              </h3>
              <div className="space-y-8">
                {simulatedCards.map(card => (
                  <div key={card.id} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-gray-700 dark:text-gray-300">{card.name}</span>
                      <span className="font-mono text-brand-primary">{formatCurrency(card.balance)} <span className="text-gray-400">/ {formatCurrency(card.limit)}</span></span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={card.limit}
                      step="50"
                      value={card.balance}
                      onChange={(e) => handleBalanceChange(card.id, Number(e.target.value), 'card')}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-secondary mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-brand-secondary rounded-full"></div>
                Mortgages & Loans
              </h3>
              <div className="space-y-8">
                {simulatedLoans.map(loan => (
                  <div key={loan.id} className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-gray-700 dark:text-gray-300">{loan.name}</span>
                      <span className="font-mono text-brand-secondary">{formatCurrency(loan.balance)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max={loan.limit || loan.balance * 2}
                      step="100"
                      value={loan.balance}
                      onChange={(e) => handleBalanceChange(loan.id, Number(e.target.value), 'loan')}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-secondary"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Results Side */}
          <div className="w-full lg:w-96 space-y-6">
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Simulated Outlook</h4>
              <div className="space-y-4 w-full">
                <div className="flex justify-between items-center px-2">
                   <span className="text-sm font-medium">Utilization</span>
                   <span className={`text-lg font-bold ${simulatedUtilization > 30 ? 'text-negative' : 'text-positive'}`}>
                     {simulatedUtilization.toFixed(1)}%
                   </span>
                </div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-sm font-medium">Net Worth</span>
                   <span className="text-lg font-bold text-brand-primary">
                     {formatCurrency(simulatedNetWorth)}
                   </span>
                </div>
              </div>
              <Button 
                onClick={runSimulation} 
                disabled={isLoading}
                className="w-full mt-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white rounded-2xl shadow-lg border-none transform transition-transform active:scale-95"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Simulating...
                  </div>
                ) : (
                  <><SparklesIcon /> Run AI Simulation</>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangleIcon /> {error}
              </div>
            )}

            {prediction && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-primary to-indigo-700 text-white shadow-xl">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-4">Predicted FICO® 8 Scores</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/10 p-2 rounded-xl">
                      <p className="text-[10px] opacity-70 uppercase">Experian</p>
                      <p className="text-2xl font-bold">{prediction.experian}</p>
                      <p className={`text-[10px] font-bold ${prediction.experian > data.creditScores.experian.score8 ? 'text-green-300' : 'text-red-300'}`}>
                        {prediction.experian > data.creditScores.experian.score8 ? '+' : ''}{prediction.experian - data.creditScores.experian.score8}
                      </p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl">
                      <p className="text-[10px] opacity-70 uppercase">Equifax</p>
                      <p className="text-2xl font-bold">{prediction.equifax}</p>
                      <p className={`text-[10px] font-bold ${prediction.equifax > data.creditScores.equifax.score8 ? 'text-green-300' : 'text-red-300'}`}>
                        {prediction.equifax > data.creditScores.equifax.score8 ? '+' : ''}{prediction.equifax - data.creditScores.equifax.score8}
                      </p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl">
                      <p className="text-[10px] opacity-70 uppercase">T-Union</p>
                      <p className="text-2xl font-bold">{prediction.transunion}</p>
                      <p className={`text-[10px] font-bold ${prediction.transunion > data.creditScores.transunion.score8 ? 'text-green-300' : 'text-red-300'}`}>
                        {prediction.transunion > data.creditScores.transunion.score8 ? '+' : ''}{prediction.transunion - data.creditScores.transunion.score8}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-gray-800 border border-brand-primary/20 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 text-brand-primary opacity-10 group-hover:opacity-100 transition-opacity">
                    <SparklesIcon />
                  </div>
                  <h5 className="text-xs font-bold text-gray-400 uppercase mb-3">AI Reasoning</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                    "{prediction.reasoning}"
                  </p>
                </div>
              </div>
            )}

            {!prediction && !isLoading && (
              <div className="p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                    <SimulationIcon />
                 </div>
                 <p className="text-sm text-gray-500">
                   Adjust the debt sliders and click "Run" to see how your scores might shift.
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <InfoIcon className="text-gray-400 w-4 h-4" />
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">
            Simulated results are educational only and not guaranteed scores.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimulationModal;
