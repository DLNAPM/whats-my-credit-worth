
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MonthlyData, CreditCard, Loan } from '../types';
import { formatCurrency, calculateUtilization, calculateTotalBalance, calculateTotalLimit, calculateNetWorth, formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { SparklesIcon, SimulationIcon, AlertTriangleIcon, InfoIcon, DownloadIcon, CheckIcon } from './ui/Icons';

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

  const currentUtilization = useMemo(() => {
    const balance = calculateTotalBalance(data.creditCards);
    const limit = calculateTotalLimit(data.creditCards);
    return calculateUtilization(balance, limit);
  }, [data.creditCards]);

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

  const handleDownloadPdf = async () => {
    if (!prediction) return;
    setIsExporting(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const container = document.createElement('div');
      container.style.width = '800px';
      container.style.padding = '40px';
      container.style.background = 'white';
      container.style.color = '#111827';
      container.style.fontFamily = 'sans-serif';
      container.style.position = 'absolute';
      container.style.left = '-9999px';

      const renderDebtRows = () => {
        let rows = '';
        // Cards
        data.creditCards.forEach((card, i) => {
          const sim = simulatedCards.find(c => c.id === card.id);
          const diff = (sim?.balance || 0) - card.balance;
          rows += `
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 12px 0; font-size: 12px;">${card.name} (CC)</td>
              <td style="padding: 12px 0; font-size: 12px; text-align: right;">${formatCurrency(card.balance)}</td>
              <td style="padding: 12px 0; font-size: 12px; text-align: right;">${formatCurrency(sim?.balance || 0)}</td>
              <td style="padding: 12px 0; font-size: 12px; text-align: right; color: ${diff < 0 ? '#059669' : diff > 0 ? '#DC2626' : '#6B7280'}; font-weight: bold;">
                ${diff > 0 ? '+' : ''}${formatCurrency(diff)}
              </td>
            </tr>
          `;
        });
        // Loans
        data.loans.forEach((loan, i) => {
          const sim = simulatedLoans.find(l => l.id === loan.id);
          const diff = (sim?.balance || 0) - loan.balance;
          rows += `
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 12px 0; font-size: 12px;">${loan.name} (Loan)</td>
              <td style="padding: 12px 0; font-size: 12px; text-align: right;">${formatCurrency(loan.balance)}</td>
              <td style="padding: 12px 0; font-size: 12px; text-align: right;">${formatCurrency(sim?.balance || 0)}</td>
              <td style="padding: 12px 0; font-size: 12px; text-align: right; color: ${diff < 0 ? '#059669' : diff > 0 ? '#DC2626' : '#6B7280'}; font-weight: bold;">
                ${diff > 0 ? '+' : ''}${formatCurrency(diff)}
              </td>
            </tr>
          `;
        });
        return rows;
      };

      const content = `
        <div style="padding: 20px;">
          <div style="border-bottom: 3px solid #0D47A1; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 28px; font-weight: bold; color: #0D47A1;">💰 WMCW SIMULATOR</span>
              <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">What's My Credit Worth - Debt Strategy Report</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: bold; color: #111827;">${formatMonthYear(monthYear)}</div>
              <div style="font-size: 11px; color: #9CA3AF;">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #4B5563; margin-bottom: 15px;">Predicted Score Impact</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
              <div style="background: #EEF2FF; border-radius: 12px; padding: 15px; text-align: center; border: 1px solid #E0E7FF;">
                <div style="font-size: 10px; font-weight: bold; color: #4338CA; text-transform: uppercase; margin-bottom: 5px;">Experian</div>
                <div style="font-size: 24px; font-weight: 800; color: #1E1B4B;">${prediction.experian}</div>
                <div style="font-size: 11px; font-weight: bold; color: ${prediction.experian >= data.creditScores.experian.score8 ? '#059669' : '#DC2626'};">
                  ${prediction.experian >= data.creditScores.experian.score8 ? '+' : ''}${prediction.experian - data.creditScores.experian.score8} pts
                </div>
              </div>
              <div style="background: #EEF2FF; border-radius: 12px; padding: 15px; text-align: center; border: 1px solid #E0E7FF;">
                <div style="font-size: 10px; font-weight: bold; color: #4338CA; text-transform: uppercase; margin-bottom: 5px;">Equifax</div>
                <div style="font-size: 24px; font-weight: 800; color: #1E1B4B;">${prediction.equifax}</div>
                <div style="font-size: 11px; font-weight: bold; color: ${prediction.equifax >= data.creditScores.equifax.score8 ? '#059669' : '#DC2626'};">
                  ${prediction.equifax >= data.creditScores.equifax.score8 ? '+' : ''}${prediction.equifax - data.creditScores.equifax.score8} pts
                </div>
              </div>
              <div style="background: #EEF2FF; border-radius: 12px; padding: 15px; text-align: center; border: 1px solid #E0E7FF;">
                <div style="font-size: 10px; font-weight: bold; color: #4338CA; text-transform: uppercase; margin-bottom: 5px;">TransUnion</div>
                <div style="font-size: 24px; font-weight: 800; color: #1E1B4B;">${prediction.transunion}</div>
                <div style="font-size: 11px; font-weight: bold; color: ${prediction.transunion >= data.creditScores.transunion.score8 ? '#059669' : '#DC2626'};">
                  ${prediction.transunion >= data.creditScores.transunion.score8 ? '+' : ''}${prediction.transunion - data.creditScores.transunion.score8} pts
                </div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 30px; background: #F9FAFB; border-radius: 12px; border: 1px solid #F3F4F6; padding: 20px;">
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #4B5563; margin-bottom: 10px;">AI Strategy Analysis</h3>
            <p style="font-size: 13px; line-height: 1.6; color: #374151; font-style: italic;">
              "${prediction.reasoning}"
            </p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #4B5563; margin-bottom: 15px;">Debt Adjustment Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #E5E7EB; text-align: left;">
                  <th style="padding: 10px 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase;">Account</th>
                  <th style="padding: 10px 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; text-align: right;">Starting</th>
                  <th style="padding: 10px 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; text-align: right;">Simulated</th>
                  <th style="padding: 10px 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; text-align: right;">Change</th>
                </tr>
              </thead>
              <tbody>
                ${renderDebtRows()}
              </tbody>
            </table>
          </div>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 15px;">
              <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">New Utilization</div>
              <div style="font-size: 18px; font-weight: bold; color: ${simulatedUtilization > 30 ? '#DC2626' : '#059669'};">${simulatedUtilization.toFixed(1)}%</div>
              <div style="font-size: 10px; color: #6B7280;">Previous: ${currentUtilization.toFixed(1)}%</div>
            </div>
            <div style="border: 1px solid #E5E7EB; border-radius: 12px; padding: 15px;">
              <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Projected Net Worth</div>
              <div style="font-size: 18px; font-weight: bold; color: #0D47A1;">${formatCurrency(simulatedNetWorth)}</div>
              <div style="font-size: 10px; color: #6B7280;">Total Wealth Impact Accounted</div>
            </div>
          </div>

          <div style="margin-top: 50px; border-top: 1px solid #F3F4F6; padding-top: 20px;">
            <p style="font-size: 9px; color: #9CA3AF; text-align: center; line-height: 1.5; font-style: italic;">
              <strong>Disclaimer:</strong> This simulation is for educational purposes only. Credit scoring models are proprietary and dynamic. These results do not guarantee a specific score change. Consult with a qualified financial professional before making significant credit decisions.
            </p>
          </div>
        </div>
      `;

      container.innerHTML = content;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`WMCW-Simulation-Report-${monthYear}.pdf`);
      
      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
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
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center shadow-inner">
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
                <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-primary to-indigo-700 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><SimulationIcon /></div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-4">Predicted FICO® 8 Scores</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <p className="text-[10px] opacity-70 uppercase">Experian</p>
                      <p className="text-2xl font-bold">{prediction.experian}</p>
                      <p className={`text-[10px] font-bold ${prediction.experian >= data.creditScores.experian.score8 ? 'text-green-300' : 'text-red-300'}`}>
                        {prediction.experian >= data.creditScores.experian.score8 ? '+' : ''}{prediction.experian - data.creditScores.experian.score8}
                      </p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <p className="text-[10px] opacity-70 uppercase">Equifax</p>
                      <p className="text-2xl font-bold">{prediction.equifax}</p>
                      <p className={`text-[10px] font-bold ${prediction.equifax >= data.creditScores.equifax.score8 ? 'text-green-300' : 'text-red-300'}`}>
                        {prediction.equifax >= data.creditScores.equifax.score8 ? '+' : ''}{prediction.equifax - data.creditScores.equifax.score8}
                      </p>
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                      <p className="text-[10px] opacity-70 uppercase">T-Union</p>
                      <p className="text-2xl font-bold">{prediction.transunion}</p>
                      <p className={`text-[10px] font-bold ${prediction.transunion >= data.creditScores.transunion.score8 ? 'text-green-300' : 'text-red-300'}`}>
                        {prediction.transunion >= data.creditScores.transunion.score8 ? '+' : ''}{prediction.transunion - data.creditScores.transunion.score8}
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

                <div className="flex gap-3">
                  <Button 
                    onClick={handleDownloadPdf} 
                    disabled={isExporting}
                    variant="secondary"
                    className="flex-1 py-3 text-sm"
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><DownloadIcon /> Report PDF</>
                    )}
                  </Button>
                  <Button 
                    onClick={() => window.print()} 
                    variant="secondary"
                    className="py-3 px-6 text-sm"
                  >
                    Print
                  </Button>
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
