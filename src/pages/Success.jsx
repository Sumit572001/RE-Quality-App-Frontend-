import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const SuccessPage = () => {
  return (
    <div className="page-container bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 bg-[#1A56C8]/10 rounded-full flex items-center justify-center mb-6 animate-scale-in">
        <svg className="w-12 h-12 text-[#1A56C8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-heading font-bold text-brand-blue mb-2">Audit Submitted!</h1>
      <p className="text-gray-500 mb-8">
        The quality checklist has been successfully saved to the database.
      </p>

      <div className="w-full space-y-3">
        <Link to="/">
          <Button variant="primary" className="w-full">
            Back to Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="outline" className="w-full">
            View All Checklists
          </Button>
        </Link>
      </div>

      <div className="mt-12">
        <img
          src="https://api.placeholder.com/200/100"
          alt="Nyati Builders"
          className="h-10 opacity-30 grayscale mx-auto"
        />
      </div>
    </div>
  );
};

export default SuccessPage;
