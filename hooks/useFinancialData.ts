
import { useState, useEffect, useCallback, useRef } from 'react';
import type { FinancialData, MonthlyData } from '../types';
import { getInitialData, getDummyData } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'wmcw_local_guest_data';

export function useFinancialData() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const dataRef = useRef<FinancialData>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Data Subscription (Firebase OR LocalStorage)
  useEffect(() => {
    if (!user) {
      setFinancialData({});
      dataRef.current = {};
      return;
    }

    // Handle Mock Guest (Local Storage Only)
    if (user.isMock) {
      const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        setFinancialData(parsed);
        dataRef.current = parsed;
      } else {
        const seed = getDummyData();
        setFinancialData(seed);
        dataRef.current = seed;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seed));
      }
      setSaveStatus('saved');
      return;
    }

    // Handle Firebase User
    const docRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as FinancialData;
        setFinancialData(cloudData);
        dataRef.current = cloudData;
        setSaveStatus('saved');
      } else {
        console.log("Seeding initial data for Firebase user:", user.uid);
        const initialSeed = user.isAnonymous 
            ? getDummyData() 
            : { [new Date().toISOString().slice(0, 7)]: getInitialData() };
        
        try {
          await setDoc(docRef, initialSeed);
        } catch (err) {
          console.error("Failed to seed initial data:", err);
          setSaveStatus('error');
        }
      }
    }, (error) => {
      console.error("Firestore sync error:", error);
      setSaveStatus('error');
    });

    return () => unsubscribe();
  }, [user?.uid, user?.isMock]);

  // 2. Direct Persist Function
  const persistData = useCallback(async (dataToSave: FinancialData) => {
    if (!user) return;
    
    setSaveStatus('saving');
    try {
      if (user.isMock) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        setSaveStatus('saved');
      } else {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, dataToSave);
        setSaveStatus('saved');
      }
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus('error');
    }
  }, [user]);

  // 3. Data Update Logic
  const updateMonthData = useCallback((monthYear: string, newData: MonthlyData) => {
    const nextFullData = { ...dataRef.current, [monthYear]: newData };
    
    setFinancialData(nextFullData);
    dataRef.current = nextFullData;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistData(nextFullData);
    }, 1000);
  }, [persistData]);
  
  const getMonthData = useCallback((monthYear: string): MonthlyData => {
      return financialData[monthYear] || getInitialData();
  }, [financialData]);

  const importData = useCallback(async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === 'object' && parsed !== null) {
        await persistData(parsed as FinancialData);
        alert('Data successfully imported!');
      }
    } catch (error) {
      alert('Import failed: Invalid file format.');
    }
  }, [persistData]);

  const exportData = useCallback(() => {
    const jsonString = JSON.stringify(financialData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wmcw-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [financialData]);

  const clearCloudData = useCallback(async () => {
    if (!user) return;
    try {
      if (user.isMock) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else {
        const docRef = doc(db, 'users', user.uid);
        await deleteDoc(docRef);
      }
      setFinancialData({});
      dataRef.current = {};
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error("Failed to clear data:", err);
      throw err;
    }
  }, [user]);

  return { 
    financialData, 
    updateMonthData, 
    getMonthData, 
    importData, 
    exportData, 
    clearCloudData,
    hasData: () => Object.keys(financialData).length > 0, 
    exportTemplateData: () => {}, 
    saveStatus,
    refreshCounter,
    saveData: () => persistData(dataRef.current)
  };
}
