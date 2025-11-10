import React, { useState, useMemo, useRef } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DataEditor from './components/DataEditor';
import { useFinancialData } from './hooks/useFinancialData';
import { getCurrentMonthYear, getNextMonthYear, getPreviousMonthYear } from './utils/helpers';
import type { View } from './types';
import Reports from './components/Reports';
import UploadHelpModal from './components/UploadHelpModal';
import ShareModal from './components/ShareModal';
import Snapshot from './components/Snapshot';
import type { MonthlyData } from './types';

function MainApp() {
  const { financialData, getMonthData, importData, exportData, hasData, exportTemplateData } = useFinancialData();
  const [currentMonthYear, setCurrentMonthYear] = useState(getCurrentMonthYear());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploadHelpOpen, setIsUploadHelpOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [view, setView] = useState<View>('dashboard');
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

  const handleImportExport = () => {
    if (hasData()) {
      exportData();
    } else {
      setIsUploadHelpOpen(true);
    }
  };

  // If no data exists, open the editor for the current month on first load.
  React.useEffect(() => {
    if (!hasData()) {
      setIsEditorOpen(true);
    }
  }, [hasData]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans">
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <Header 
          currentMonthYear={currentMonthYear}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          onEdit={() => setIsEditorOpen(true)}
          onShare={() => setIsShareModalOpen(true)}
          onImportExport={handleImportExport}
          view={view}
          setView={setView}
        />
        
        <main>
          {view === 'dashboard' && <Dashboard data={currentMonthData} allData={financialData} />}
          {view === 'reports' && <Reports allData={financialData} />}
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
}

function App() {
  const path = window.location.pathname;

  if (path.startsWith('/snapshot/')) {
    const encodedData = path.substring('/snapshot/'.length);
    const ErrorDisplay = ({ message }: { message: string }) => (
       <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md mx-4">
            <h1 className="text-2xl font-bold text-negative mb-4">Invalid Snapshot Link</h1>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
             <a href="/" className="mt-6 inline-block bg-brand-primary text-white font-bold py-2 px-4 rounded hover:bg-brand-secondary transition-colors">
              Go to Main App
            </a>
          </div>
        </div>
    );
    
    if (!encodedData) {
      return <ErrorDisplay message="The link you followed is incomplete." />;
    }
    
    try {
      const decodedJson = atob(encodedData);
      const snapshotPayload: { monthYear: string; data: MonthlyData } = JSON.parse(decodedJson);
      
      if (snapshotPayload && snapshotPayload.monthYear && snapshotPayload.data) {
        return <Snapshot snapshotData={snapshotPayload} />;
      } else {
        throw new Error("Invalid data structure");
      }
    } catch (error) {
      console.error("Failed to decode snapshot data:", error);
      return <ErrorDisplay message="The link you followed appears to be corrupted or invalid." />;
    }
  }

  return <MainApp />;
}


export default App;