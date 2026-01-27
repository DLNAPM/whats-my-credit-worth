
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DataEditor from './components/DataEditor';
import { useFinancialData } from './hooks/useFinancialData';
import { getCurrentMonthYear, getNextMonthYear, getPreviousMonthYear } from './utils/helpers';
import type { View, MonthlyData } from './types';
import Reports from './components/Reports';
import UploadHelpModal from './components/UploadHelpModal';
import ShareModal from './components/ShareModal';
import Snapshot from './components/Snapshot';
import ImportExportModal from './components/ImportExportModal';
import RecommendationsModal from './components/RecommendationsModal';
import { useAuth } from './contexts/AuthContext';
import AuthScreen from './components/AuthScreen';
import Spinner, { LoadingScreen } from './components/ui/Spinner';
import PrivacyPolicy from './components/PrivacyPolicy';
import DashboardHelpModal from './components/DashboardHelpModal';
import ContactSupportModal from './components/ContactSupportModal';
import { HelpCircleIcon } from './components/ui/Icons';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * NEW: Async Snapshot Loader
 * This fetches the snapshot data from Firestore using the Short ID.
 */
const SnapshotLoader: React.FC<{ snapshotId: string }> = ({ snapshotId }) => {
  const [snapshot, setSnapshot] = useState<{ monthYear: string; data: MonthlyData } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshot = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Try treating as Firestore ID (Short URL)
        // We wrap this in its own try/catch to ensure the legacy fallback runs if Firestore fails
        let foundInFirestore = false;
        try {
          const docRef = doc(db, 'shared_snapshots', snapshotId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setSnapshot(docSnap.data() as any);
            foundInFirestore = true;
          }
        } catch (dbErr) {
          console.warn("Firestore lookup failed, attempting Base64 fallback:", dbErr);
        }

        if (!foundInFirestore) {
          // 2. Fallback: Try decoding as Legacy Base64
          try {
            const urlSafeBase64ToStr = (base64Url: string): string => {
                let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const padding = '='.repeat((4 - base64.length % 4) % 4);
                base64 += padding;
                const binaryStr = atob(base64);
                const uint8Array = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    uint8Array[i] = binaryStr.charCodeAt(i);
                }
                return new TextDecoder().decode(uint8Array);
            };
            const decodedJson = urlSafeBase64ToStr(snapshotId);
            const legacyData = JSON.parse(decodedJson);
            if (legacyData?.monthYear && legacyData?.data) {
                setSnapshot(legacyData);
            } else {
                throw new Error("Invalid snapshot data structure");
            }
          } catch (e) {
             setError("This snapshot link is invalid or has expired.");
          }
        }
      } catch (err) {
        console.error("Snapshot loader critical error:", err);
        setError("Failed to load snapshot. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [snapshotId]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner />
        <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Fetching Published Snapshot...</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
       <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md mx-4 border border-red-100">
            <h1 className="text-2xl font-bold text-negative mb-4">Link Expired or Invalid</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error || "The snapshot you are looking for could not be found."}</p>
             <a href="/" className="inline-block bg-brand-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-brand-secondary transition-all shadow-lg">
              Go to Homepage
            </a>
          </div>
        </div>
    );
  }

  return <Snapshot snapshotData={snapshot} />;
};

const MainApp: React.FC<{ view: View; setView: (v: View) => void }> = ({ view, setView }) => {
  const { financialData, getMonthData, importData, exportData, hasData, exportTemplateData, saveData, saveStatus, refreshCounter } = useFinancialData();
  const { logout } = useAuth();
  const [currentMonthYear, setCurrentMonthYear] = useState(getCurrentMonthYear());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploadHelpOpen, setIsUploadHelpOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [isDashboardHelpOpen, setIsDashboardHelpOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentMonthData = useMemo(() => getMonthData(currentMonthYear), [getMonthData, currentMonthYear]);
  
  const handlePreviousMonth = () => setCurrentMonthYear(prev => getPreviousMonthYear(prev));
  const handleNextMonth = () => setCurrentMonthYear(prev => getNextMonthYear(prev));

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          importData(content);
        } catch (error) {
          console.error(error);
          alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleLogout = async () => {
    await logout(); 
  };

  if (view === 'privacy') {
    return <PrivacyPolicy onBack={() => setView('dashboard')} />;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans relative">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Header 
          currentMonthYear={currentMonthYear}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onEdit={() => setIsEditorOpen(true)}
          onShare={() => setIsShareModalOpen(true)}
          onImportExport={() => setIsImportExportModalOpen(true)}
          onRecommendations={() => setIsRecommendationsOpen(true)}
          view={view === 'dashboard' || view === 'reports' ? view : 'dashboard'}
          setView={setView}
          onLogout={handleLogout}
          onSave={saveData}
          saveStatus={saveStatus}
        />
        
        <main>
          {view === 'dashboard' && (
            <Dashboard 
              key={`dashboard-${refreshCounter}-${currentMonthYear}`} 
              data={currentMonthData} 
              allData={financialData}
              monthYear={currentMonthYear}
            />
          )}
          {view === 'reports' && (
            <Reports 
              key={`reports-${refreshCounter}`} 
              allData={financialData} 
            />
          )}
        </main>

        <DataEditor 
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          monthYear={currentMonthYear}
        />
        
        <UploadHelpModal 
          isOpen={isUploadHelpOpen}
          onClose={() => setIsUploadHelpOpen(false)}
          onUploadClick={triggerFileUpload}
          exportTemplateData={exportTemplateData}
        />

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          data={currentMonthData}
          monthYear={currentMonthYear}
        />

        <ImportExportModal
            isOpen={isImportExportModalOpen}
            onClose={() => setIsImportExportModalOpen(false)}
            onUpload={() => {
                setIsImportExportModalOpen(false);
                triggerFileUpload();
            }}
            onDownload={() => {
                setIsImportExportModalOpen(false);
                exportData();
            }}
            onShowHelp={() => {
                setIsImportExportModalOpen(false);
                setIsUploadHelpOpen(true);
            }}
            onViewPrivacy={() => {
              setIsImportExportModalOpen(false);
              setView('privacy');
            }}
            hasData={hasData()}
        />

        <RecommendationsModal
          isOpen={isRecommendationsOpen}
          onClose={() => setIsRecommendationsOpen(false)}
          data={currentMonthData}
          monthYear={currentMonthYear}
        />

        <DashboardHelpModal
          isOpen={isDashboardHelpOpen}
          onClose={() => setIsDashboardHelpOpen(false)}
          onOpenManageData={() => setIsImportExportModalOpen(true)}
          onOpenSupport={() => setIsSupportOpen(true)}
        />

        <ContactSupportModal
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
        />

        {/* Floating Help Button for Dashboard */}
        <button 
            onClick={() => setIsDashboardHelpOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-brand-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-secondary transform hover:scale-110 transition-all z-40 group"
            aria-label="Dashboard Help Center"
        >
            <HelpCircleIcon />
            <span className="absolute right-full mr-4 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Help & Support
            </span>
        </button>

        <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileImport}
            style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};


function App() {
  const [view, setView] = useState<View>('dashboard');
  const path = window.location.pathname;

  // HANDLE SNAPSHOT VIEWING
  if (path.startsWith('/snapshot/')) {
    const snapshotId = path.substring('/snapshot/'.length);
    if (!snapshotId) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p>Missing Snapshot ID</p>
            </div>
        );
    }
    return <SnapshotLoader snapshotId={snapshotId} />;
  }

  const { user, loading } = useAuth();

  // Allow users to see the privacy policy without being logged in
  if (view === 'privacy') {
    return <PrivacyPolicy onBack={() => setView('dashboard')} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen onViewPrivacy={() => setView('privacy')} />;
  }

  return <MainApp view={view} setView={setView} />;
}

export default App;
