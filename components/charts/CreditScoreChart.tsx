
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialData } from '../../types';
import { formatMonthYear } from '../../utils/helpers';

interface CreditScoreChartProps {
  data: FinancialData;
}

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
  const chartData = useMemo(() => {
    return Object.keys(data)
      .map((monthYear) => ({
        monthYear,
        experian: data[monthYear].creditScores.experian.score8,
        equifax: data[monthYear].creditScores.equifax.score8,
        transunion: data[monthYear].creditScores.transunion.score8,
        mrCooper: data[monthYear].creditScores.mrCooper || 0,
      }))
      .filter(d => d.experian > 0 || d.equifax > 0 || d.transunion > 0 || d.mrCooper > 0) // Only show months with at least one score
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [data]);

  if(chartData.length < 2) {
      return <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">Not enough data to display chart.</div>
  }

  return (
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
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Line type="monotone" name="Experian FICO 8" dataKey="experian" stroke="#0D47A1" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 0 }} />
        <Line type="monotone" name="Equifax FICO 8" dataKey="equifax" stroke="#C62828" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 0 }} />
        <Line type="monotone" name="TransUnion FICO 8" dataKey="transunion" stroke="#2E7D32" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 0 }} />
        <Line type="monotone" name="Mr. Cooper FICO 4" dataKey="mrCooper" stroke="#F59E0B" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 0 }} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CreditScoreChart;
