import { useState, useEffect, useCallback } from 'react';
import type { FinancialData, MonthlyData } from '../types';
import { getInitialData, getCurrentMonthYear } from '../utils/helpers';

const LOCAL_STORAGE_KEY = 'financialData';

export function useFinancialData() {
  const [financialData, setFinancialData] = useState<FinancialData>({});
  
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        setFinancialData(JSON.parse(storedData));
      } else {
        setFinancialData({});
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
      setFinancialData({});
    }
  }, []);

  const hasData = useCallback(() => {
      return Object.keys(financialData).length > 0;
  }, [financialData]);

  const saveData = useCallback((data: FinancialData) => {
    try {
      const sortedData = Object.keys(data).sort().reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {} as FinancialData);

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedData));
      setFinancialData(sortedData);
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  }, []);

  const updateMonthData = useCallback((monthYear: string, data: MonthlyData) => {
    setFinancialData(prevData => {
      const newData = { ...prevData, [monthYear]: data };
      saveData(newData);
      return newData;
    });
  }, [saveData]);
  
  const getMonthData = useCallback((monthYear: string): MonthlyData => {
      return financialData[monthYear] || getInitialData();
  }, [financialData]);

  const importData = useCallback((jsonString: string) => {
    try {
      const parsedData = JSON.parse(jsonString);
      // Simple validation can be expanded
      if (typeof parsedData === 'object' && parsedData !== null) {
        saveData(parsedData as FinancialData);
        // Force reload or state update to reflect changes immediately
        window.location.reload(); 
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error("Import failed", error);
      throw error;
    }
  }, [saveData]);

  const exportData = useCallback(() => {
    const jsonString = JSON.stringify(financialData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whats-my-credit-worth-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [financialData]);

  const exportTemplateData = useCallback(() => {
    const templateData: FinancialData = {
      [getCurrentMonthYear()]: getInitialData(),
    };
    const jsonString = JSON.stringify(templateData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wmcw-template.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return { financialData, updateMonthData, getMonthData, importData, exportData, hasData, exportTemplateData };
}