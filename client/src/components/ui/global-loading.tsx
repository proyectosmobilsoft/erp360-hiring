import React from 'react';

interface GlobalLoadingProps {
  isLoading: boolean;
  message?: string;
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({ 
  isLoading, 
  message = "Procesando petición..." 
}) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
        {/* Spinner elegante */}
        <div className="relative">
          {/* Anillo principal */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-cyan-600"></div>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando...
          </h3>
          <p className="text-sm text-gray-600">
            {message}
          </p>
          
          {/* Puntos animados */}
          <div className="flex justify-center items-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoading;
