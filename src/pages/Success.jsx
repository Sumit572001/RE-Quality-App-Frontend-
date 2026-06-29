import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isOffline = location.state?.offline === true;
  const category = location.state?.category;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (category) {
        navigate(`/select-subcategory?category=${encodeURIComponent(category)}`);
      } else {
        navigate('/');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [category, navigate]);

  return (
    <div className="page-container bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-scale-in
        ${isOffline ? 'bg-gray-100' : 'bg-[#1A56C8]/10'}`}>
        {isOffline ? (
          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        ) : (
          <svg className="w-12 h-12 text-[#1A56C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {isOffline ? (
        <>
          <h1 className="text-2xl font-heading font-bold text-brand-blue mb-2">
            Saved Offline!
          </h1>
          <p className="text-gray-500 mb-3">
            The audit has been saved to your device.
          </p>
          {/* Offline notice card */}
          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3 3l18 18" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">
                  Auto-Sync Pending
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  This audit will automatically upload to the server as soon as your internet connection is restored. No action needed!
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-heading font-bold text-brand-blue mb-2">
            Audit Submitted!
          </h1>
          <p className="text-gray-500 mb-6 animate-fade-in">
            The quality checklist has been successfully submitted.
          </p>
        </>
      )}
    </div>
  );
};

export default SuccessPage;
