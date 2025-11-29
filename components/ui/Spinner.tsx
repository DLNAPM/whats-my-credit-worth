import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
    </div>
  );
};

export const LoadingScreen: React.FC = () => {
    return (
        <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <Spinner />
        </div>
    );
}

export default Spinner;