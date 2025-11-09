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
      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow-lg">
        <p className="font-bold">{formatMonthYear(label)}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>
        ))}
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
      }))
      .filter(d => d.experian > 0 || d.equifax > 0 || d.transunion > 0) // Only show months with scores
      .sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [data]);

  if(chartData.length < 2) {
      return <div className="flex items-center justify-center h-full text-gray-500">Not enough data to display chart.</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
        <XAxis
          dataKey="monthYear"
          tickFormatter={(tick) => formatMonthYear(tick, 'short')}
          tick={{ fill: 'rgb(107 114 128)', fontSize: 12 }}
        />
        <YAxis
          domain={[300, 850]}
          tick={{ fill: 'rgb(107 114 128)', fontSize: 12 }}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" name="Experian FICO 8" dataKey="experian" stroke="#0D47A1" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line type="monotone" name="Equifax FICO 8" dataKey="equifax" stroke="#C62828" strokeWidth={2} activeDot={{ r: 8 }} />
        <Line type="monotone" name="TransUnion FICO 8" dataKey="transunion" stroke="#2E7D32" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CreditScoreChart;
