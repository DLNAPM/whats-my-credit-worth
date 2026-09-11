
import React, { useState, useEffect } from 'react';
import type { MonthlyData, NamedAmount, CreditCard, Loan, Asset, IncomeSource } from '../types';
import { useFinancialData } from '../hooks/useFinancialData';
import { formatMonthYear, isValidMonthYear } from '../utils/helpers';
import Button from './ui/Button';
import { AddIcon, DeleteIcon, SaveIcon } from './ui/Icons';

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
  const { getMonthData, updateMonthData, financialData, saveData } = useFinancialData();
  const [data, setData] = useState<MonthlyData>(getMonthData(monthYear));
  const [copyFromMonth, setCopyFromMonth] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setData(getMonthData(monthYear));
      setCopyFromMonth(''); 
      setIsSaving(false);
    }
  }, [monthYear, getMonthData, isOpen]);

  if (!isOpen) return null;

  const availableMonths = Object.keys(financialData)
    .filter(m => isValidMonthYear(m) && m !== monthYear)
    .sort((a, b) => b.localeCompare(a));

  const handleCopyData = () => {
    if (!copyFromMonth) return;
    
    if (window.confirm(`Are you sure you want to replace this month's data with the data from ${formatMonthYear(copyFromMonth)}? All current edits will be lost.`)) {
        const dataToCopy = getMonthData(copyFromMonth);
        const deepClonedData = JSON.parse(JSON.stringify(dataToCopy));
        
        deepClonedData.income.jobs.forEach((item: IncomeSource) => item.id = crypto.randomUUID());
        deepClonedData.creditCards.forEach((item: CreditCard) => item.id = crypto.randomUUID());
        deepClonedData.loans.forEach((item: Loan) => item.id = crypto.randomUUID());
        deepClonedData.assets.forEach((item: Asset) => item.id = crypto.randomUUID());
        deepClonedData.monthlyBills.forEach((item: NamedAmount) => item.id = crypto.randomUUID());

        setData(deepClonedData);
        setCopyFromMonth(''); 
    }
  };

  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement>, ...path: string[]) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? (Number(value) || 0) : value;
    
    setData(prev => {
        if (path.length === 1) {
            const section = path[0] as keyof MonthlyData;
            return {
                ...prev,
                [section]: {
                    ...(prev[section] as any),
                    [name]: val
                }
            };
        }
        if (path.length === 2) {
            const section = path[0] as keyof MonthlyData;
            const subsection = path[1];
            const currentSection = prev[section] as any;
            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [subsection]: {
                        ...currentSection[subsection],
                        [name]: val
                    }
                }
            };
        }
        return prev;
    });
  };

  const handleJobsChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => {
        const jobs = [...prev.income.jobs];
        jobs[index] = { 
            ...jobs[index], 
            [name]: name === 'name' || name === 'frequency' ? value : Number(value) || 0 
        };
        return { 
            ...prev, 
            income: { ...prev.income, jobs } 
        };
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

  const handleListChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, list: ItemType) => {
    const { name, value, type } = e.target as any;
    setData(prev => {
        const items = [...prev[list]];
        let formattedValue: any = value;

        if (type === 'checkbox') {
            formattedValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'accountNumber' || name === 'last4') {
            formattedValue = value.replace(/\D/g, '').slice(0, 4);
            items[index] = {
                ...items[index],
                accountNumber: formattedValue,
                last4: formattedValue
            };
            return { ...prev, [list]: items as any };
        } else if (['name', 'lenderName', 'institution', 'apr', 'apy', 'url', 'notes', 'info', 'category'].includes(name)) {
            formattedValue = value;
        } else {
            formattedValue = Number(value) || 0;
        }

        items[index] = { 
            ...items[index], 
            [name]: formattedValue
        };
        return { ...prev, [list]: items as any };
    });
  };
  
  const handleAddItem = <T,>(list: ItemType, newItem: T) => {
    setData(prev => ({...prev, [list]: [...prev[list], newItem] as any}));
  };

  const handleRemoveItem = (index: number, list: ItemType) => {
    setData(prev => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) as any }));
  };
  
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
        // 1. Update the centralized data store
        updateMonthData(monthYear, data);
        
        // 2. Explicitly trigger and await the persistence operation
        await saveData();
        
        // 3. Only close if persistence succeeded
        onClose();
    } catch (err) {
        console.error("Save error:", err);
        alert("There was an error saving your data. Please try again or check your connection.");
    } finally {
        setIsSaving(false);
    }
  };

  const renderCreditCardEditor = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
        <div>
          <h3 className="text-lg font-semibold">Credit Cards</h3>
          <p className="text-xs text-gray-500">Includes Last 4 digits & APR for 1-Click Sync to Next Steps</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="credit-card-fico-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Credit Card FICO 8 Score:
          </label>
          <input 
            id="credit-card-fico-input"
            type="number" 
            name="creditCardFico8" 
            value={data?.creditScores?.creditCardFico8 || 0} 
            onChange={e => handleSimpleChange(e, 'creditScores')} 
            className="w-24 px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
          />
        </div>
      </div>

      {data.creditCards.map((card, index) => (
        <div key={card.id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <InputField 
                label="Card Name"
                name="name"
                type="text"
                value={card.name}
                onChange={(e) => handleListChange(index, e, 'creditCards')}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField 
                label="Balance ($)"
                name="balance"
                type="number"
                value={card.balance}
                onChange={(e) => handleListChange(index, e, 'creditCards')}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField 
                label="Limit ($)"
                name="limit"
                type="number"
                value={card.limit}
                onChange={(e) => handleListChange(index, e, 'creditCards')}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField 
                label="Last 4 #"
                name="accountNumber"
                type="text"
                value={card.accountNumber || card.last4 || ''}
                placeholder="e.g. 4819"
                onChange={(e) => handleListChange(index, e, 'creditCards')}
              />
            </div>
            <div className="sm:col-span-1">
              <InputField 
                label="APR %"
                name="apr"
                type="text"
                value={card.apr || ''}
                placeholder="21.49"
                onChange={(e) => handleListChange(index, e, 'creditCards')}
              />
            </div>
            <div className="sm:col-span-1 flex justify-end pb-1">
              <Button onClick={() => handleRemoveItem(index, 'creditCards')} variant="danger" size="small"><DeleteIcon /></Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/40 text-xs text-gray-500">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                name="isBusiness"
                checked={!!card.isBusiness}
                onChange={(e) => handleListChange(index, e, 'creditCards')}
                className="rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>Business / Commercial Card (syncs as LLC in Next Steps)</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Lender:</span>
              <input
                type="text"
                name="lenderName"
                value={card.lenderName || ''}
                placeholder="Auto-inferred from name"
                onChange={(e) => handleListChange(index, e, 'creditCards')}
                className="w-36 px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
              />
            </div>
          </div>
        </div>
      ))}

      <Button onClick={() => {
        const newItem: CreditCard = { 
          id: crypto.randomUUID(), 
          name: 'New Credit Card', 
          balance: 0, 
          limit: 1000,
          accountNumber: '',
          apr: '19.99',
          isBusiness: false
        };
        handleAddItem<CreditCard>('creditCards', newItem);
      }} size="small"><AddIcon /> Add Credit Card</Button>
    </div>
  );

  const renderLoanEditor = () => (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Mortgages and Loans</h3>
        <p className="text-xs text-gray-500">Fixed & installment accounts with last 4 digits matching</p>
      </div>

      {data.loans.map((loan, index) => (
        <div key={loan.id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <InputField 
                label="Loan / Mortgage Name"
                name="name"
                type="text"
                value={loan.name}
                onChange={(e) => handleListChange(index, e, 'loans')}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField 
                label="Balance ($)"
                name="balance"
                type="number"
                value={loan.balance}
                onChange={(e) => handleListChange(index, e, 'loans')}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField 
                label="Original / Limit ($)"
                name="limit"
                type="number"
                value={loan.limit}
                onChange={(e) => handleListChange(index, e, 'loans')}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField 
                label="Last 4 #"
                name="accountNumber"
                type="text"
                value={loan.accountNumber || loan.last4 || ''}
                placeholder="e.g. 1024"
                onChange={(e) => handleListChange(index, e, 'loans')}
              />
            </div>
            <div className="sm:col-span-1">
              <InputField 
                label="Rate %"
                name="apr"
                type="text"
                value={loan.apr || ''}
                placeholder="6.75"
                onChange={(e) => handleListChange(index, e, 'loans')}
              />
            </div>
            <div className="sm:col-span-1 flex justify-end pb-1">
              <Button onClick={() => handleRemoveItem(index, 'loans')} variant="danger" size="small"><DeleteIcon /></Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/40 text-xs text-gray-500">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                name="isBusiness"
                checked={!!loan.isBusiness}
                onChange={(e) => handleListChange(index, e, 'loans')}
                className="rounded text-brand-primary focus:ring-brand-primary"
              />
              <span>Commercial / Business Loan</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Lender:</span>
              <input
                type="text"
                name="lenderName"
                value={loan.lenderName || ''}
                placeholder="Auto-inferred"
                onChange={(e) => handleListChange(index, e, 'loans')}
                className="w-36 px-2 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
              />
            </div>
          </div>
        </div>
      ))}

      <Button onClick={() => {
        const newItem: Loan = { 
          id: crypto.randomUUID(), 
          name: 'New Loan / Mortgage', 
          balance: 0, 
          limit: 10000,
          accountNumber: '',
          apr: '6.5',
          isBusiness: false
        };
        handleAddItem<Loan>('loans', newItem);
      }} size="small"><AddIcon /> Add Loan / Mortgage</Button>
    </div>
  );

  const renderAssetEditor = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
        <div>
          <h3 className="text-lg font-semibold">Asset Accounts</h3>
          <p className="text-xs text-gray-500">Savings, investments, retirement, crypto & real estate accounts (syncs to Next Steps)</p>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total Assets: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0))}</span>
        </div>
      </div>

      {data.assets.map((asset, index) => (
        <div key={asset.id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4">
              <InputField 
                label="Account / Asset Name"
                name="name"
                type="text"
                value={asset.name}
                placeholder="e.g. Marcus Savings, Fidelity 401k"
                onChange={(e) => handleListChange(index, e, 'assets')}
              />
            </div>
            <div className="sm:col-span-3">
              <InputField 
                label="Balance / Value ($)"
                name="value"
                type="number"
                value={asset.value}
                onChange={(e) => handleListChange(index, e, 'assets')}
              />
            </div>
            <div className="sm:col-span-2">
              <InputField 
                label="Last 4 # (Next Steps)"
                name="accountNumber"
                type="text"
                maxLength={4}
                value={asset.accountNumber || asset.last4 || ''}
                placeholder="e.g. 3912"
                title="Crucial: 4 digits used to match and sync with accounts in Next Steps App"
                onChange={(e) => handleListChange(index, e, 'assets')}
              />
            </div>
            <div className="sm:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  name="category"
                  value={asset.category || ''}
                  onChange={(e) => handleListChange(index, e, 'assets')}
                  className="mt-1 block w-full px-2.5 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-xs"
                >
                  <option value="">Auto-detect</option>
                  <option value="Savings / HYSA">Savings / HYSA</option>
                  <option value="Checking / Cash">Checking / Cash</option>
                  <option value="Investment / Brokerage">Investment / Brokerage</option>
                  <option value="Retirement (401k/IRA)">Retirement (401k/IRA)</option>
                  <option value="Cryptocurrency">Cryptocurrency</option>
                  <option value="Real Estate Equity">Real Estate Equity</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Other Asset">Other Asset</option>
                </select>
              </div>
            </div>
            <div className="sm:col-span-1 flex justify-end pb-1">
              <Button onClick={() => handleRemoveItem(index, 'assets')} variant="danger" size="small"><DeleteIcon /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/40 text-xs items-center">
            <div className="sm:col-span-4 flex items-center gap-2">
              <span className="text-[11px] text-gray-400 whitespace-nowrap">Institution:</span>
              <input
                type="text"
                name="institution"
                value={asset.institution || ''}
                placeholder="Auto-inferred (e.g. Fidelity, Marcus)"
                onChange={(e) => handleListChange(index, e, 'assets')}
                className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
              />
            </div>
            <div className="sm:col-span-5 flex items-center gap-2">
              <span className="text-[11px] text-gray-400 whitespace-nowrap">Info / Notes:</span>
              <input
                type="text"
                name="notes"
                value={asset.notes || ''}
                placeholder="e.g. Emergency fund / Liquid reserves"
                onChange={(e) => handleListChange(index, e, 'assets')}
                className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-gray-500">
                <input 
                  type="checkbox"
                  name="isBusiness"
                  checked={!!asset.isBusiness}
                  onChange={(e) => handleListChange(index, e, 'assets')}
                  className="rounded text-brand-primary focus:ring-brand-primary"
                />
                <span>Commercial Asset</span>
              </label>
            </div>
          </div>
        </div>
      ))}

      <Button onClick={() => {
        const newItem: Asset = { 
          id: crypto.randomUUID(), 
          name: 'New Asset Account', 
          value: 0,
          accountNumber: '',
          institution: '',
          category: '',
          isBusiness: false,
          notes: ''
        };
        handleAddItem<Asset>('assets', newItem);
      }} size="small"><AddIcon /> Add Asset Account</Button>
    </div>
  );

  const renderListEditor = <T extends {id: string, name: string}>(
    title: string, 
    listName: ItemType, 
    items: T[], 
    fields: (keyof T)[],
    extraHeaderElement?: React.ReactNode
  ) => (
    <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            {extraHeaderElement}
        </div>
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Data for {formatMonthYear(monthYear)}</h2>
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
                        {availableMonths.map(m => {
                            const label = formatMonthYear(m);
                            if (!label) return null;
                            return <option key={m} value={m}>{label}</option>;
                        })}
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
                    <InputField label="Experian FICO 8" name="score8" type="number" value={data?.creditScores?.experian?.score8 || 0} onChange={e => handleSimpleChange(e, 'creditScores', 'experian')} />
                    <InputField label="Equifax FICO 8" name="score8" type="number" value={data?.creditScores?.equifax?.score8 || 0} onChange={e => handleSimpleChange(e, 'creditScores', 'equifax')} />
                    <InputField label="TransUnion FICO 8" name="score8" type="number" value={data?.creditScores?.transunion?.score8 || 0} onChange={e => handleSimpleChange(e, 'creditScores', 'transunion')} />
                    <InputField label="Auto FICO 8" name="autoFico8" type="number" value={data?.creditScores?.autoFico8 || 0} onChange={e => handleSimpleChange(e, 'creditScores')} />
                    <InputField label="Lending Tree" name="lendingTree" type="number" value={data?.creditScores?.lendingTree || 0} onChange={e => handleSimpleChange(e, 'creditScores')} />
                    <InputField label="Credit Karma" name="creditKarma" type="number" value={data?.creditScores?.creditKarma || 0} onChange={e => handleSimpleChange(e, 'creditScores')} />
                    <InputField label="Credit Sesame" name="creditSesame" type="number" value={data?.creditScores?.creditSesame || 0} onChange={e => handleSimpleChange(e, 'creditScores')} />
                </div>

                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-gray-800 dark:to-gray-800/80 p-4 rounded-xl border border-blue-100 dark:border-gray-700/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                🏠 Mortgage Score Customization
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Edit the mortgage score label (e.g. "Rocket Mortgage FICO 2", "Mr. Cooper FICO 4") and record your score.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField 
                            label="Mortgage Provider / Label" 
                            name="mrCooperLabel" 
                            type="text" 
                            placeholder="e.g. Rocket Mortgage FICO 2"
                            value={data?.creditScores?.mrCooperLabel ?? "Mr. Cooper FICO 4"} 
                            onChange={e => handleSimpleChange(e, 'creditScores')} 
                        />
                        <InputField 
                            label="Mortgage Score Value" 
                            name="mrCooper" 
                            type="number" 
                            value={data?.creditScores?.mrCooper || 0} 
                            onChange={e => handleSimpleChange(e, 'creditScores')} 
                        />
                    </div>
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

            {renderCreditCardEditor()}
            {renderLoanEditor()}
            {renderAssetEditor()}
            {renderListEditor<NamedAmount>('Monthly Bills', 'monthlyBills', data.monthlyBills, ['name', 'amount'])}
        </div>
        <div className="p-6 flex justify-end gap-4 sticky bottom-0 bg-white dark:bg-gray-900 border-t">
          <Button onClick={onClose} variant="secondary" disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                </>
            ) : (
                <>
                    <SaveIcon />
                    Save Changes
                </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataEditor;
