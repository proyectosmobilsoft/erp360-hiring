import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalLoadingContextType {
  isLoading: boolean;
  message: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading debe ser usado dentro de GlobalLoadingProvider');
  }
  return context;
};

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Procesando petición...');

  const showLoading = (customMessage?: string) => {
    setMessage(customMessage || 'Procesando petición...');
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, message, showLoading, hideLoading }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};

export default GlobalLoadingProvider;
