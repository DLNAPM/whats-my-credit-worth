
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

import FinancialChatbot from './components/FinancialChatbot';
import MembershipModal from './components/MembershipModal';
import { AdminDashboard } from './components/AdminDashboard';
import StockTickerBanner from './components/StockTickerBanner';
import UserProfileModal from './components/UserProfileModal';
import NextStepsSyncModal from './components/NextStepsSyncModal';
import { ShieldAlertIcon } from './components/ui/Icons';

/**
 * Async Snapshot Loader
 * Fetches snapshot data from Firestore.
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
        let foundInFirestore = false;
        try {
          const docRef = doc(db, 'shared_snapshots', snapshotId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setSnapshot(docSnap.data() as any);
            foundInFirestore = true;
          }
        } catch (dbErr) {
          console.warn("Firestore lookup failed:", dbErr);
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
                throw new Error("Invalid structure");
            }
          } catch (e) {
             setError("This snapshot link is invalid, expired, or the database record was moved.");
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
            <h1 className="text-2xl font-bold text-negative mb-4">Link Unavailable</h1>
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
  const { user, isSuperUser, logout, upgradeToPremium, showStockBanner, accountType, businessName, businessType } = useAuth();
  const [currentMonthYear, setCurrentMonthYear] = useState(getCurrentMonthYear());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUploadHelpOpen, setIsUploadHelpOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [isNextStepsSyncOpen, setIsNextStepsSyncOpen] = useState(false);
  const [isDashboardHelpOpen, setIsDashboardHelpOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isChatbotMembershipOpen, setIsChatbotMembershipOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentMonthData = useMemo(() => getMonthData(currentMonthYear), [getMonthData, currentMonthYear]);
  
  const handlePreviousMonth = () => setCurrentMonthYear(prev => getPreviousMonthYear(prev));
  const handleNextMonth = () => setCurrentMonthYear(prev => getNextMonthYear(prev));

  // Payment Success Handler
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('payment_success') === 'true') {
        upgradeToPremium().then(() => {
            // Remove the query param from URL so refresh doesn't trigger it again
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path:newUrl},'',newUrl);
            alert("Payment Successful! Premium features unlocked.");
        });
    }
  }, [upgradeToPremium]);

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
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      {showStockBanner && <StockTickerBanner onOpenProfile={() => setIsProfileOpen(true)} />}
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Header 
          currentMonthYear={currentMonthYear}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onEdit={() => setIsEditorOpen(true)}
          onShare={() => setIsShareModalOpen(true)}
          onImportExport={() => setIsImportExportModalOpen(true)}
          onRecommendations={() => setIsRecommendationsOpen(true)}
          onNextStepsSync={() => setIsNextStepsSyncOpen(true)}
          view={view}
          setView={setView}
          onLogout={handleLogout}
          onSave={saveData}
          saveStatus={saveStatus}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
        
        <main>
          {view === 'dashboard' && (
            <Dashboard 
              key={`dashboard-${refreshCounter}-${currentMonthYear}`} 
              data={currentMonthData} 
              allData={financialData}
              monthYear={currentMonthYear}
              onNextStepsSync={() => setIsNextStepsSyncOpen(true)}
            />
          )}
          {view === 'reports' && (
            <Reports 
              key={`reports-${refreshCounter}`} 
              allData={financialData} 
            />
          )}
          {view === 'admin' && (
            isSuperUser ? (
              <AdminDashboard />
            ) : (
              <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-red-200 dark:border-red-900/50 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldAlertIcon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Admin Authorization Required</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  You are signed in as <strong>{user?.email || 'Guest'}</strong>, which does not have administrator privileges.
                  Please sign in with an authorized administrator account to review system alarms and acknowledge alerts.
                </p>
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={() => setView('dashboard')}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                  >
                    Return to Financial Dashboard
                  </button>
                  <button
                    onClick={() => logout()}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-sm transition-all"
                  >
                    Switch to Administrator Account
                  </button>
                </div>
              </div>
            )
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
            onOpenNextStepsSync={() => setIsNextStepsSyncOpen(true)}
            hasData={hasData()}
            currentMonthData={currentMonthData}
            currentMonthYear={currentMonthYear}
        />

        <NextStepsSyncModal
          isOpen={isNextStepsSyncOpen}
          onClose={() => setIsNextStepsSyncOpen(false)}
          data={currentMonthData}
          monthYear={currentMonthYear}
          accountType={accountType}
          businessName={businessName}
          businessType={businessType}
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

        <button 
            onClick={() => setIsDashboardHelpOpen(true)}
            className="fixed bottom-8 left-8 w-14 h-14 bg-brand-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-brand-secondary transform hover:scale-110 transition-all z-40 group"
            aria-label="Dashboard Help Center"
        >
            <HelpCircleIcon />
            <span className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Help & Support
            </span>
        </button>

        <FinancialChatbot 
          financialData={financialData} 
          onOpenMembership={() => setIsChatbotMembershipOpen(true)} 
        />

        <MembershipModal 
          isOpen={isChatbotMembershipOpen} 
          onClose={() => setIsChatbotMembershipOpen(false)} 
        />

        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onOpenMembership={() => setIsChatbotMembershipOpen(true)}
        />

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


// Robust helper to check if the incoming URL targets the Admin Dashboard
const checkIsAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const rawPath = (window.location.pathname || '').toLowerCase();
  const normalizedPath = rawPath.replace(/\/+/g, '/');
  const hash = (window.location.hash || '').toLowerCase().replace(/\/+/g, '/');
  const search = (window.location.search || '').toLowerCase();
  return (
    normalizedPath === '/admin' ||
    normalizedPath.startsWith('/admin/') ||
    hash.startsWith('#/admin') ||
    search.includes('view=admin')
  );
};

function App() {
  const [view, setView] = useState<View>(() => {
    if (checkIsAdminRoute()) return 'admin';
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      if (hash.startsWith('#/reports') || path === '/reports') return 'reports';
      if (hash.startsWith('#/privacy') || path === '/privacy') return 'privacy';
    }
    return 'dashboard';
  });

  // Sync view when the user uses browser back/forward or clicks direct links
  useEffect(() => {
    const handleLocationChange = () => {
      if (checkIsAdminRoute()) {
        setView('admin');
      } else if (window.location.hash.startsWith('#/reports') || window.location.pathname === '/reports') {
        setView('reports');
      } else if (window.location.hash.startsWith('#/privacy') || window.location.pathname === '/privacy') {
        setView('privacy');
      } else if (window.location.hash.startsWith('#/dashboard') || window.location.pathname === '/') {
        setView('dashboard');
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleSetView = (nextView: View) => {
    setView(nextView);
    // Update hash cleanly without page reload
    if (typeof window !== 'undefined') {
      if (nextView === 'admin') {
        // Keep existing query params if present (e.g. ?incident=...)
        const currentSearch = window.location.search || '';
        window.location.hash = `#/admin${currentSearch}`;
      } else if (nextView === 'reports') {
        window.location.hash = `#/reports`;
      } else if (nextView === 'privacy') {
        window.location.hash = `#/privacy`;
      } else {
        window.location.hash = `#/dashboard`;
      }
    }
  };
  
  // ROBUST SNAPSHOT ROUTING: Supports both traditional path and hash-based path
  const getSnapshotId = () => {
    const path = window.location.pathname;
    if (path.startsWith('/snapshot/')) return path.substring('/snapshot/'.length);
    
    const hash = window.location.hash;
    if (hash.startsWith('#/snapshot/')) return hash.substring('#/snapshot/'.length);
    
    return null;
  };

  const snapshotId = getSnapshotId();

  if (snapshotId) {
    return <SnapshotLoader snapshotId={snapshotId} />;
  }

  const { user, loading, isFrozen, logout } = useAuth();

  if (view === 'privacy') {
    return <PrivacyPolicy onBack={() => handleSetView('dashboard')} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen onViewPrivacy={() => handleSetView('privacy')} />;
  }

  if (isFrozen) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Frozen</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your account has been temporarily suspended by an administrator. 
            Please contact support if you believe this is an error.
          </p>
          <button 
            onClick={() => logout()}
            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <MainApp view={view} setView={handleSetView} />;
}

export default App;
