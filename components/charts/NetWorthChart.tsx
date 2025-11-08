import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialData } from '../../types';
import { calculateNetWorth, formatCurrency, formatMonthYear } from '../../utils/helpers';

interface NetWorthChartProps {
  data: FinancialData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow-lg">
        <p className="font-bold">{formatMonthYear(label)}</p>
        <p className="text-brand-primary">{`Net Worth: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const NetWorthChart: React.FC<NetWorthChartProps> = ({ data }) => {
  // FIX: Refactored to use `Object.keys` to ensure correct type inference for `monthlyData`.
  // `Object.entries` on an object with an index signature was inferring the value as `unknown`.
  const chartData = useMemo(() => {
    return Object.keys(data)
      .map((monthYear) => ({
        monthYear,
        netWorth: calculateNetWorth(data[monthYear]),
      }))
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
          tickFormatter={(tick) => formatCurrency(tick)}
          tick={{ fill: 'rgb(107 114 128)', fontSize: 12 }}
          width={100}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="netWorth" stroke="#0D47A1" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default NetWorthChart;
