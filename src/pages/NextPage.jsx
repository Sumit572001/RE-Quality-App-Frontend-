import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const NextPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container bg-brand-gray pb-10">
      <Navbar />

      <main className="px-4 pt-6 pb-24">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-brand-blue hover:bg-gray-50 transition-colors"
            title="Go Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold text-brand-blue">
              Next Step
            </h1>
          </div>
        </div>

        {/* Content Card */}
        <div className="card bg-white border border-gray-100 flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-heading font-bold text-brand-blue mb-2">
            Details Coming Soon
          </h2>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed px-4">
            This blank page has been prepared for the next checklist flow. Content will be added here soon.
          </p>

          <button
            onClick={() => navigate('/')}
            className="mt-8 px-6 py-2.5 bg-brand-orange text-white font-semibold rounded-xl shadow-md hover:bg-brand-orangeDark active:scale-95 transition-all duration-200 text-sm"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default NextPage;
