import React from 'react';
import { AlertTriangle, Home, ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ErrorPage = () => {
  const navigate = useNavigate()

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleHome = () => {
    navigate('/')
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>

          {/* Error code */}
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          
          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
          
          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or has been moved. 
            Please check the URL or navigate back to continue.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>

            <button
              onClick={handleHome}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              Return Home
            </button>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Optional help text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? <a href="mailto:admin@templatesite.app" className="text-blue-600 hover:text-blue-700 font-medium">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;