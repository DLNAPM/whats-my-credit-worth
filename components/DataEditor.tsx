import React, { useState, useEffect } from 'react';
import type { MonthlyData, NamedAmount, CreditCard, Loan, Asset, IncomeSource, PayFrequency } from '../types';
import { useFinancialData } from '../hooks/useFinancialData';
import { formatMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { AddIcon, DeleteIcon } from './ui/Icons';

interface DataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  monthYear: string;
}

const InputField = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string }>(({ label, ...props }, ref) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input ref={ref} {...props} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm" />
    </div>
));

type ItemType = 'creditCards' | 'loans' | 'assets' | 'monthlyBills';

const DataEditor: React.FC<DataEditorProps> = ({ isOpen, onClose, monthYear }) => {
  const { getMonthData, updateMonthData, financialData } = useFinancialData();
  const [data, setData] = useState<MonthlyData>(getMonthData(monthYear));
  const [copyFromMonth, setCopyFromMonth] = useState<string>('');

  useEffect(() => {
    setData(getMonthData(monthYear));
    setCopyFromMonth(''); // Reset on open/month change
  }, [monthYear, getMonthData, isOpen]);

  if (!isOpen) return null;

  const availableMonths = Object.keys(financialData)
    .filter(m => m !== monthYear)
    .sort((a, b) => b.localeCompare(a));

  const handleCopyData = () => {
    if (!copyFromMonth) return;
    
    if (window.confirm(`Are you sure you want to replace this month's data with the data from ${formatMonthYear(copyFromMonth)}? All current edits will be lost.`)) {
        const dataToCopy = getMonthData(copyFromMonth);
        
        // Deep clone and regenerate IDs to ensure they are unique for the new month
        const deepClonedData = JSON.parse(JSON.stringify(dataToCopy));
        
        deepClonedData.income.jobs.forEach((item: IncomeSource) => item.id = crypto.randomUUID());
        deepClonedData.creditCards.forEach((item: CreditCard) => item.id = crypto.randomUUID());
        deepClonedData.loans.forEach((item: Loan) => item.id = crypto.randomUUID());
        deepClonedData.assets.forEach((item: Asset) => item.id = crypto.randomUUID());
        deepClonedData.monthlyBills.forEach((item: NamedAmount) => item.id = crypto.randomUUID());

        setData(deepClonedData);
        setCopyFromMonth(''); // Reset select
    }
  };

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement>, ...path: string[]) => {
    const { name, value } = e.target;
    setData(prev => {
        let nested = prev;
        for(let i = 0; i < path.length - 1; i++) {
            nested = nested[path[i]];
        }
        nested[path[path.length - 1]][name] = Number(value) || 0;
        return { ...prev };
    });
  };

  const handleJobsChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => {
        const jobs = [...prev.income.jobs];
        jobs[index] = { ...jobs[index], [name]: name === 'name' || name === 'frequency' ? value : Number(value) || 0 };
        return { ...prev, income: { ...prev.income, jobs } };
    });
  };
  
  const handleAddJob = () => {
      setData(prev => {
          const newJob: IncomeSource = { id: crypto.randomUUID(), name: 'New Job', amount: 0, frequency: 'bi-weekly' };
          return {...prev, income: {...prev.income, jobs: [...prev.income.jobs, newJob]}}
      })
  };

  const handleRemoveJob = (index: number) => {
      setData(prev => {
          const jobs = prev.income.jobs.filter((_, i) => i !== index);
          return {...prev, income: {...prev.income, jobs}};
      })
  }

  const handleListChange = (index: number, e: React.ChangeEvent<HTMLInputElement>, list: ItemType) => {
    const { name, value } = e.target;
    setData(prev => {
        const items = [...prev[list]];
        items[index] = { ...items[index], [name]: name === 'name' ? value : Number(value) || 0 };
        return { ...prev, [list]: items as any };
    });
  };
  
  const handleAddItem = <T,>(list: ItemType, newItem: T) => {
    setData(prev => ({...prev, [list]: [...prev[list], newItem] as any}));
  };

  const handleRemoveItem = (index: number, list: ItemType) => {
    setData(prev => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) as any }));
  };
  
  const handleSave = () => {
    updateMonthData(monthYear, data);
    onClose();
  };

  const renderListEditor = <T extends {id: string, name: string}>(
    title: string, 
    listName: ItemType, 
    items: T[], 
    fields: (keyof T)[]
  ) => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">{title}</h3>
        {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                {fields.map(field => (
                    <InputField 
                        key={String(field)}
                        label={String(field).charAt(0).toUpperCase() + String(field).slice(1)}
                        name={String(field)}
                        type={field === 'name' ? 'text' : 'number'}
                        value={item[field] as any}
                        onChange={(e) => handleListChange(index, e, listName)}
                    />
                ))}
                 <Button onClick={() => handleRemoveItem(index, listName)} variant="danger" size="small"><DeleteIcon /></Button>
            </div>
        ))}
         <Button onClick={() => {
             const newItem: any = { id: crypto.randomUUID(), name: 'New Item' };
             fields.filter(f => f !== 'id' && f !== 'name').forEach(f => newItem[f] = 0);
             handleAddItem<any>(listName, newItem);
         }} size="small"><AddIcon /> Add {title.slice(0, -1)}</Button>
    </div>
  );


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sticky top-0 bg-white dark:bg-gray-900 border-b z-10">
            <h2 className="text-2xl font-bold">Edit Data for {formatMonthYear(monthYear)}</h2>
            {availableMonths.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <label htmlFor="copy-month-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Start with data from another month?
                </label>
                <div className="flex-grow flex items-center gap-2">
                    <select
                        id="copy-month-select"
                        value={copyFromMonth}
                        onChange={(e) => setCopyFromMonth(e.target.value)}
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                    >
                        <option value="">Select a month...</option>
                        {availableMonths.map(m => (
                            <option key={m} value={m}>{formatMonthYear(m)}</option>
                        ))}
                    </select>
                    <Button onClick={handleCopyData} disabled={!copyFromMonth} size="small">
                        Copy Data
                    </Button>
                </div>
              </div>
            )}
        </div>
        <div className="p-6 space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Credit Scores</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField label="Experian FICO 2" name="score2" type="number" value={data.creditScores.experian.score2} onChange={e => handleSimpleChange(e, 'creditScores', 'experian')} />
                    <InputField label="Experian FICO 8" name="score8" type="number" value={data.creditScores.experian.score8} onChange={e => handleSimpleChange(e, 'creditScores', 'experian')} />
                    <InputField label="Equifax FICO 2" name="score2" type="number" value={data.creditScores.equifax.score2} onChange={e => handleSimpleChange(e, 'creditScores', 'equifax')} />
                    <InputField label="Equifax FICO 8" name="score8" type="number" value={data.creditScores.equifax.score8} onChange={e => handleSimpleChange(e, 'creditScores', 'equifax')} />
                    <InputField label="TransUnion FICO 2" name="score2" type="number" value={data.creditScores.transunion.score2} onChange={e => handleSimpleChange(e, 'creditScores', 'transunion')} />
                    <InputField label="TransUnion FICO 8" name="score8" type="number" value={data.creditScores.transunion.score8} onChange={e => handleSimpleChange(e, 'creditScores', 'transunion')} />
                    <InputField label="Lending Tree" name="lendingTree" type="number" value={data.creditScores.lendingTree} onChange={e => handleSimpleChange(e, 'creditScores')} />
                    <InputField label="Credit Karma" name="creditKarma" type="number" value={data.creditScores.creditKarma} onChange={e => handleSimpleChange(e, 'creditScores')} />
                    <InputField label="Credit Sesame" name="creditSesame" type="number" value={data.creditScores.creditSesame} onChange={e => handleSimpleChange(e, 'creditScores')} />
                    <InputField label="Mr. Cooper FICO 4" name="mrCooper" type="number" value={data.creditScores.mrCooper} onChange={e => handleSimpleChange(e, 'creditScores')} />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Income</h3>
                {data.income.jobs.map((job, index) => (
                    <div key={job.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                        <InputField 
                            label="Source"
                            name="name"
                            type="text"
                            value={job.name}
                            onChange={(e) => handleJobsChange(index, e)}
                        />
                        <InputField 
                            label="Amount"
                            name="amount"
                            type="number"
                            value={job.amount}
                            onChange={(e) => handleJobsChange(index, e)}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
                            <select 
                                name="frequency"
                                value={job.frequency}
                                onChange={(e) => handleJobsChange(index, e)}
                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                            >
                                <option value="weekly">Weekly</option>
                                <option value="bi-weekly">Bi-weekly</option>
                                <option value="twice-a-month">Twice a month</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                         <Button onClick={() => handleRemoveJob(index)} variant="danger" size="small"><DeleteIcon /></Button>
                    </div>
                ))}
                 <Button onClick={handleAddJob} size="small"><AddIcon /> Add Income Source</Button>
            </div>

            {renderListEditor<CreditCard>('Credit Cards', 'creditCards', data.creditCards, ['name', 'balance', 'limit'])}
            {renderListEditor<Loan>('Mortgages and Loans', 'loans', data.loans, ['name', 'balance', 'limit'])}
            {renderListEditor<Asset>('Assets', 'assets', data.assets, ['name', 'value'])}
            {renderListEditor<NamedAmount>('Monthly Bills', 'monthlyBills', data.monthlyBills, ['name', 'amount'])}
        </div>
        <div className="p-6 flex justify-end gap-4 sticky bottom-0 bg-white dark:bg-gray-900 border-t">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default DataEditor;