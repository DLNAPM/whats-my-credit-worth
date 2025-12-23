import { useState, useEffect, useCallback, useRef } from 'react';
import type { FinancialData, MonthlyData } from '../types';
import { getInitialData, getDummyData } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

export function useFinancialData() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const dataRef = useRef<FinancialData>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Real-time Subscription to Firebase
  useEffect(() => {
    if (!user) {
      setFinancialData({});
      dataRef.current = {};
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    
    // Subscribe to cloud changes
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as FinancialData;
        setFinancialData(cloudData);
        dataRef.current = cloudData;
        setSaveStatus('saved');
      } else {
        // Initial data seed for new users
        console.log("Seeding initial data for user:", user.uid, "IsAnonymous:", user.isAnonymous);
        
        // Guests get a rich 4-month experience. Registered users get a clean current month.
        const initialSeed = user.isAnonymous 
            ? getDummyData() 
            : { [new Date().toISOString().slice(0, 7)]: getInitialData() };
        
        try {
          await setDoc(docRef, initialSeed);
          console.log("Successfully seeded initial data for:", user.uid);
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
  }, [user?.uid]);

  // 2. Direct Cloud Save Function
  const persistToCloud = useCallback(async (dataToSave: FinancialData) => {
    if (!user) return;
    
    setSaveStatus('saving');
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, dataToSave);
      setSaveStatus('saved');
      setRefreshCounter(prev => prev + 1);
    } catch (err) {
      console.error("Cloud save failed:", err);
      setSaveStatus('error');
    }
  }, [user]);

  // 3. Data Update Logic (Database-first)
  const updateMonthData = useCallback((monthYear: string, newData: MonthlyData) => {
    const nextFullData = { ...dataRef.current, [monthYear]: newData };
    
    // Optimistic UI update
    setFinancialData(nextFullData);
    dataRef.current = nextFullData;

    // Debounced save to prevent database flooding while typing
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistToCloud(nextFullData);
    }, 1000);
  }, [persistToCloud]);
  
  const getMonthData = useCallback((monthYear: string): MonthlyData => {
      return financialData[monthYear] || getInitialData();
  }, [financialData]);

  const importData = useCallback(async (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (typeof parsed === 'object' && parsed !== null) {
        await persistToCloud(parsed as FinancialData);
        alert('Data successfully merged with your cloud profile!');
      }
    } catch (error) {
      alert('Import failed: Invalid file format.');
    }
  }, [persistToCloud]);

  const exportData = useCallback(() => {
    const jsonString = JSON.stringify(financialData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wmcw-cloud-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [financialData]);

  return { 
    financialData, 
    updateMonthData, 
    getMonthData, 
    importData, 
    exportData, 
    hasData: () => Object.keys(financialData).length > 0, 
    exportTemplateData: () => {}, 
    saveStatus,
    refreshCounter,
    saveData: () => persistToCloud(dataRef.current)
  };
}