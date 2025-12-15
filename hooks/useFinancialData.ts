import { useState, useEffect, useCallback } from 'react';
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

  // Effect to load data on user change
  useEffect(() => {
    if (!user) {
      setFinancialData({}); // Clear data on logout
      return;
    }

    if ('isGuest' in user && user.isGuest) {
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            setFinancialData(JSON.parse(storedData));
        } else {
            // Initialize with dummy data for new guests so they can test features
            const dummyData = getDummyData();
            setFinancialData(dummyData);
        }
        setSaveStatus('saved');
      } catch (error) {
        console.error("Failed to read from localStorage", error);
        setFinancialData({});
      }
    } else {
      // User is logged in with Google, fetch from Firestore
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          setFinancialData(docSnap.data() as FinancialData);
          setSaveStatus('saved');
        } else {
          // New Google User: check for guest data to migrate
          const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
          let dataToMigrate: FinancialData = {};
          if (storedData) {
            try {
              dataToMigrate = JSON.parse(storedData);
              // Clear local data after migrating
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            } catch (error) {
              console.error("Error parsing local data for migration", error);
            }
          }
          setFinancialData(dataToMigrate);
          // Create the document in Firestore with migrated or empty data.
          setDoc(docRef, dataToMigrate)
            .then(() => setSaveStatus('saved'))
            .catch(err => {
              console.error("Error creating initial user doc in Firestore", err);
              setSaveStatus('error');
            });
        }
      }).catch(error => {
        console.error("Error fetching data from Firestore:", error);
        setSaveStatus('error');
      });
    }
  }, [user]);

  // Effect to save data on change (autosave for GUESTS ONLY)
  useEffect(() => {
    if (user && 'isGuest' in user && user.isGuest) {
      // Only save if we have data to avoid overwriting with empty object on initial load race conditions
      if (Object.keys(financialData).length > 0) {
        const sortedData = Object.keys(financialData).sort().reduce((obj, key) => {
            obj[key] = financialData[key];
            return obj;
        }, {} as FinancialData);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortedData));
        } catch (error) {
          console.error("Failed to save to localStorage", error);
        }
      }
    }
  }, [financialData, user]);
  
  const saveData = useCallback(async () => {
    if (user && !('isGuest' in user) && saveStatus !== 'saving') {
      setSaveStatus('saving');
      const sortedData = Object.keys(financialData).sort().reduce((obj, key) => {
          obj[key] = financialData[key];
          return obj;
      }, {} as FinancialData);
      
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, sortedData).then(() => {
        setSaveStatus('saved');
      }).catch((error) => {
        console.error("Error saving data to Firestore:", error);
        setSaveStatus('error');
        throw error; // Re-throw to be caught by caller (e.g., logout handler)
      });
    }
  }, [user, financialData, saveStatus]);

  const updateMonthData = useCallback((monthYear: string, data: MonthlyData) => {
    setFinancialData(prev => ({ ...prev, [monthYear]: data }));
    if (user && !('isGuest' in user)) {
      setSaveStatus('unsaved');
    }
  }, [user]);
  
  const getMonthData = useCallback((monthYear: string): MonthlyData => {
      return financialData[monthYear] || getInitialData();
  }, [financialData]);

  const importData = useCallback((jsonString: string) => {
    try {
      const parsedData = JSON.parse(jsonString);
      if (typeof parsedData === 'object' && parsedData !== null) {
        setFinancialData(parsedData as FinancialData);
        if (user && !('isGuest' in user)) {
            setSaveStatus('unsaved');
        }
        alert('Data imported successfully! Remember to save your changes.');
      } else {
        throw new Error("Invalid data format");
      }
    } catch (error) {
      console.error("Import failed", error);
      throw error;
    }
  }, [user]);

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

  const hasData = useCallback(() => {
    return Object.keys(financialData).length > 0;
  }, [financialData]);

  return { financialData, updateMonthData, getMonthData, importData, exportData, hasData, exportTemplateData, saveData, saveStatus };
}