
import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FinancialData } from '../../types';
import { formatMonthYear, getCurrentMonthYear } from '../../utils/helpers';

interface CreditScoreChartProps {
  data: FinancialData;
}

const SCORES_CONFIG = [
  { key: 'experian', name: 'Experian FICO 8', color: '#0D47A1' },
  { key: 'equifax', name: 'Equifax FICO 8', color: '#C62828' },
  { key: 'transunion', name: 'TransUnion FICO 8', color: '#2E7D32' },
  { key: 'mrCooper', name: 'Mr. Cooper FICO 4', color: '#F59E0B', strokeDasharray: '4 4' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl">
        <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">{formatMonthYear(label)}</p>
        <div className="space-y-1">
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center gap-2 text-xs font-medium">
               <div style={{ backgroundColor: p.color }} className="w-2 h-2 rounded-full"></div>
               <span className="text-gray-600 dark:text-gray-300">{p.name}:</span>
               <span className="text-gray-900 dark:text-white font-bold">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CreditScoreChart: React.FC<CreditScoreChartProps> = ({ data }) => {
  const [visibleScores, setVisibleScores] = useState<Record<string, boolean>>({
    experian: true,
    equifax: true,
    transunion: true,
    mrCooper: true,
  });

  const chartData = useMemo(() => {
    const currentMonth = getCurrentMonthYear();
    
    return Object.keys(data)
      .filter((monthYear) => monthYear.localeCompare(currentMonth) <= 0) // Filter out future dates
      .map((monthYear) => {
        const scores = data[monthYear]?.creditScores;
        return {
          monthYear,
          experian: scores?.experian?.score8 || 0,
          equifax: scores?.equifax?.score8 || 0,
          transunion: scores?.transunion?.score8 || 0,
          mrCooper: scores?.mrCooper || 0,
        };
      })
      .filter(d => d.experian > 0 || d.equifax > 0 || d.transunion > 0 || d.mrCooper > 0) // Only show months with at least one score
      .sort((a, b) => b.monthYear.localeCompare(a.monthYear)) // Sort descending to get most recent
      .slice(0, 15) // Keep only the top 15 most recent months
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear)); // Sort ascending again for the chart timeline
  }, [data]);

  const toggleScore = (key: string) => {
    setVisibleScores(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if(chartData.length < 2) {
      return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">Not enough data to display chart.</div>
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-wrap justify-center gap-2 mb-2 px-2">
        {SCORES_CONFIG.map(score => (
          <button
            key={score.key}
            onClick={() => toggleScore(score.key)}
            className={`px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-full border transition-all flex items-center gap-1.5 ${
              visibleScores[score.key] 
                ? 'bg-white dark:bg-gray-800 shadow-sm opacity-100 ring-1 ring-offset-0' 
                : 'bg-gray-100 dark:bg-gray-700 opacity-60 grayscale border-transparent'
            }`}
            style={{ 
              borderColor: visibleScores[score.key] ? score.color : 'transparent',
              '--tw-ring-color': visibleScores[score.key] ? score.color : 'transparent' 
            } as React.CSSProperties}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: score.color }}></span>
            <span style={{ color: visibleScores[score.key] ? score.color : 'inherit' }} className="text-gray-600 dark:text-gray-400">
              {score.name.replace(' FICO', '')}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
            <XAxis
              dataKey="monthYear"
              tickFormatter={(tick) => formatMonthYear(tick, 'short')}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              domain={[300, 850]}
              tick={{ fill: '#6B7280', fontSize: 11 }}
              width={35}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {SCORES_CONFIG.map(score => (
              visibleScores[score.key] && (
                <Line
                  key={score.key}
                  type="monotone"
                  name={score.name}
                  dataKey={score.key}
                  stroke={score.color}
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  dot={{ r: 0 }}
                  strokeDasharray={score.strokeDasharray}
                  animationDuration={300}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CreditScoreChart;
