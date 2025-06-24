import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bus, ArrowLeft, Navigation } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {!isHomePage && (
                <Link 
                  to="/" 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
              )}
              <Link to="/" className="flex items-center space-x-3">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Bus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Shuttler</h1>
                  <p className="text-xs text-gray-500">Live Bus Tracking</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Navigation className="w-4 h-4" />
                <span>Live Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};