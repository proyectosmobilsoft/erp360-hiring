import React from 'react';
import { RefreshCw } from 'lucide-react';

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
    <div className="fixed inset-0 bg-gray-400 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md mx-4">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Spinner moderno */}
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-white border-t-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-white animate-spin-reverse" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white">
                Cargando
              </h3>
              <p className="text-xs text-teal-100">
                Por favor espere...
              </p>
            </div>
          </div>
        </div>
        
        {/* Contenido */}
        <div className="px-6 py-5">
          <div className="text-center mb-5">
            <p className="text-base font-medium text-gray-800 leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Barra de progreso animada */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 via-cyan-500 to-teal-400 animate-shimmer" 
                 style={{
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 1.5s infinite'
                 }}>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GlobalLoading;
