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

function App() {
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

export default App;
