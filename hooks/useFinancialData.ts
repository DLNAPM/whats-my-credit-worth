
import { useState, useEffect, useCallback, useRef } from 'react';
import type { FinancialData, MonthlyData } from '../types';
import { getInitialData, getDummyData } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useFinancialData() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const dataRef = useRef<FinancialData>({});
  const isSavingRef = useRef(false);

  // Sync ref with state when state changes
  useEffect(() => {
    dataRef.current = financialData;
  }, [financialData]);

  // Effect to load data from Firestore whenever the user state changes
  useEffect(() => {
    if (!user) {
      setFinancialData({});
      dataRef.current = {};
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');

    const docRef = doc(db, 'users', user.uid);
    getDoc(docRef).then(docSnap => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as FinancialData;
        setFinancialData(cloudData);
        dataRef.current = cloudData;
        setSaveStatus('saved');
      } else {
        // If it's a new anonymous user, give them dummy data to start with (cloud-persisted immediately)
        const initialSeed = user.isAnonymous ? getDummyData() : {};
        setFinancialData(initialSeed);
        dataRef.current = initialSeed;
        
        // Persist the seed data to Firestore immediately so it's not "just in browser"
        setDoc(docRef, initialSeed)
          .then(() => setSaveStatus('saved'))
          .catch(err => {
            console.error("Error creating initial cloud profile", err);
            setSaveStatus('error');
          });
      }
    }).catch(error => {
      console.error("Error fetching from Database:", error);
      setSaveStatus('error');
    });
  }, [user?.uid]);

  // Save function targeting Firebase Firestore
  const saveData = useCallback(async (): Promise<void> => {
    if (!user || isSavingRef.current) return;

    isSavingRef.current = true;
    setSaveStatus('saving');
    
    const currentDataToPersist = dataRef.current;
    
    // Cleanup and sort keys
    const sortedData = Object.keys(currentDataToPersist).sort().reduce((obj, key) => {
        obj[key] = currentDataToPersist[key];
        return obj;
    }, {} as FinancialData);

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, sortedData);
      setSaveStatus('saved');
      setRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error("Database persistence error:", error);
      setSaveStatus('error');
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  }, [user]);

  // Autosave when data is marked as unsaved
  useEffect(() => {
    if (saveStatus === 'unsaved') {
      const timer = setTimeout(() => {
        saveData().catch(() => {});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [financialData, saveStatus, saveData]);

  const updateMonthData = useCallback((monthYear: string, data: MonthlyData) => {
    const nextData = { ...dataRef.current, [monthYear]: data };
    dataRef.current = nextData;
    setFinancialData(nextData);
    setSaveStatus('unsaved');
  }, []);
  
  const getMonthData = useCallback((monthYear: string): MonthlyData => {
      return financialData[monthYear] || getInitialData();
  }, [financialData]);

  const importData = useCallback(async (jsonString: string) => {
    try {
      const parsedData = JSON.parse(jsonString);
      if (typeof parsedData === 'object' && parsedData !== null) {
        const newData = parsedData as FinancialData;
        dataRef.current = newData;
        setFinancialData(newData);
        setSaveStatus('unsaved');
        // Force an immediate cloud save on import
        await saveData();
        alert('Data successfully synced to the cloud!');
      } else {
        throw new Error("Invalid format");
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
    a.download = `wmcw-cloud-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [financialData]);

  const exportTemplateData = useCallback(() => {
    const templateData: FinancialData = { [new Date().toISOString().split('T')[0].slice(0, 7)]: getInitialData() };
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
