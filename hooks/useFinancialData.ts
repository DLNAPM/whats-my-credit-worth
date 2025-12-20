
import { useState, useEffect, useCallback, useRef } from 'react';
import type { FinancialData, MonthlyData } from '../types';
import { getInitialData, getCurrentMonthYear, getDummyData } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'financialData';

export function useFinancialData() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Use a ref to always have access to the latest data in async operations (like saveData)
  const dataRef = useRef<FinancialData>({});
  const isSavingRef = useRef(false);

  // Sync ref with state when state changes from loading
  useEffect(() => {
    dataRef.current = financialData;
  }, [financialData]);

  // Effect to load data on user change
  useEffect(() => {
    if (!user) {
      setFinancialData({});
      dataRef.current = {};
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');

    if ('isGuest' in user && user.isGuest) {
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setFinancialData(parsed);
          dataRef.current = parsed;
        } else {
          const dummyData = getDummyData();
          setFinancialData(dummyData);
          dataRef.current = dummyData;
        }
        setSaveStatus('saved');
      } catch (error) {
        console.error("Failed to read from localStorage", error);
        setFinancialData({});
        setSaveStatus('error');
      }
    } else {
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data() as FinancialData;
          setFinancialData(cloudData);
          dataRef.current = cloudData;
          setSaveStatus('saved');
        } else {
          const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
          let dataToMigrate: FinancialData = {};
          if (storedData) {
            try {
              dataToMigrate = JSON.parse(storedData);
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            } catch (error) {
              console.error("Error parsing local data for migration", error);
            }
          }
          setFinancialData(dataToMigrate);
          dataRef.current = dataToMigrate;
          setDoc(docRef, dataToMigrate)
            .then(() => setSaveStatus('saved'))
            .catch(err => {
              console.error("Error creating initial user doc", err);
              setSaveStatus('error');
            });
        }
      }).catch(error => {
        console.error("Error fetching from Firestore:", error);
        setSaveStatus('error');
      });
    }
  }, [user?.uid]);

  // Robust save function - returns a Promise
  const saveData = useCallback(async (): Promise<void> => {
    if (!user || isSavingRef.current) return;

    isSavingRef.current = true;
    setSaveStatus('saving');
    
    // Always read from the synchronous ref to get the most recent updates
    const currentDataToPersist = dataRef.current;
    
    // Ensure keys are sorted for consistent storage
    const sortedData = Object.keys(currentDataToPersist).sort().reduce((obj, key) => {
        obj[key] = currentDataToPersist[key];
        return obj;
    }, {} as FinancialData);

    try {
      if ('isGuest' in user && user.isGuest) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedData));
      } else {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, sortedData);
      }
      setSaveStatus('saved');
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Error persisting data:", error);
      setSaveStatus('error');
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  }, [user]);

  // Debounced Autosave Effect
  useEffect(() => {
    if (saveStatus === 'unsaved') {
      const timer = setTimeout(() => {
        saveData().catch(() => {}); // Handle errors silently for autosave
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [financialData, saveStatus, saveData]);

  const updateMonthData = useCallback((monthYear: string, data: MonthlyData) => {
    // 1. Update the reference synchronously so subsequent calls see it immediately
    const nextData = { ...dataRef.current, [monthYear]: data };
    dataRef.current = nextData;
    
    // 2. Trigger React state update for UI
    setFinancialData(nextData);
    
    // 3. Mark as unsaved
    setSaveStatus('unsaved');
  }, []);
  
  const getMonthData = useCallback((monthYear: string): MonthlyData => {
      // Use state for rendering to ensure React reactivity
      return financialData[monthYear] || getInitialData();
  }, [financialData]);

  const importData = useCallback((jsonString: string) => {
    try {
      const parsedData = JSON.parse(jsonString);
      if (typeof parsedData === 'object' && parsedData !== null) {
        const newData = parsedData as FinancialData;
        dataRef.current = newData; // Sync ref immediately
        setFinancialData(newData);
        setSaveStatus('unsaved');
        alert('Data imported! The app will save your changes automatically.');
      } else {
        throw new Error("Invalid format");
      }
    } catch (error) {
      console.error("Import failed", error);
      throw error;
    }
  }, []);

  const exportData = useCallback(() => {
    const jsonString = JSON.stringify(financialData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wmcw-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [financialData]);

  const exportTemplateData = useCallback(() => {
    const templateData: FinancialData = { [getCurrentMonthYear()]: getInitialData() };
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

  const hasData = useCallback(() => Object.keys(financialData).length > 0, [financialData]);

  return { 
    financialData, 
    updateMonthData, 
    getMonthData, 
    importData, 
    exportData, 
    hasData, 
    exportTemplateData, 
    saveData, 
    saveStatus,
    refreshCounter
  };
}
