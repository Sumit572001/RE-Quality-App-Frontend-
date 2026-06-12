import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChecklists } from '../api/checklists';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubCategory, setActiveSubCategory] = useState('');
  const [checkedChecklists, setCheckedChecklists] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }

    // Read category and subCategory from URL params if available
    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = searchParams.get('category');
    const subCategoryParam = searchParams.get('subCategory');
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
    if (subCategoryParam) {
      setActiveSubCategory(subCategoryParam);
    }

    fetchChecklists();
  }, [user, navigate]);

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const res = await getChecklists();
      setChecklists(res.data.data);
    } catch (err) {
      console.error('Failed to fetch checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = checklists.filter((c) => {
    const matchCat = !activeCategory || c.category === activeCategory;
    const matchSub = !activeSubCategory || c.subCategory === activeSubCategory;
    return matchCat && matchSub;
  });

  // Group checklists by stage
  const checklistsByStage = filtered.reduce((acc, checklist) => {
    const stage = checklist.stage || 'General';
    if (!acc[stage]) {
      acc[stage] = [];
    }
    acc[stage].push(checklist);
    return acc;
  }, {});

  const [activePopoverId, setActivePopoverId] = useState(null);

  const togglePopover = (checklistId) => {
    setActivePopoverId((prev) => (prev === checklistId ? null : checklistId));
  };

  const handleSelectOption = (checklistId, option) => {
    setCheckedChecklists((prev) => ({
      ...prev,
      [checklistId]: option, // 'YES', 'NO', 'N/A'
    }));
    setActivePopoverId(null);
  };

  const handleSaveAndSubmit = () => {
    // Validation: Check if any required checklists are unchecked
    const uncheckedRequired = filtered.filter(
      (checklist) => checklist.items?.[0]?.required && !checkedChecklists[checklist._id]
    );

    if (uncheckedRequired.length > 0) {
      alert(`Please select YES, NO, or N/A for the required item(s): \n\n${uncheckedRequired.map(c => `• ${c.title}`).join('\n')}`);
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      localStorage.removeItem('auditForm');
      navigate('/success');
    }, 1000);
  };

  const renderCheckbox = (checklistId) => {
    const choice = checkedChecklists[checklistId];
    if (choice === 'YES') {
      return (
        <div className="w-8 h-8 rounded-lg border-2 border-green-500 bg-green-500 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (choice === 'NO') {
      return (
        <div className="w-8 h-8 rounded-lg border-2 border-red-500 bg-red-500 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    if (choice === 'N/A') {
      return (
        <div className="w-8 h-8 rounded-lg border-2 border-brand-orange bg-brand-orange text-white flex items-center justify-center flex-shrink-0 transition-all duration-200">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M20 12H4" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-white flex-shrink-0 transition-all duration-200" />
    );
  };

  return (
    <div className="page-container bg-brand-gray pb-24 relative">
      <Navbar />

      <main className="px-4 pt-4 pb-28 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/select-subcategory?category=' + encodeURIComponent(activeCategory))}
          className="flex items-center gap-2 text-brand-blue font-bold text-sm hover:opacity-80 transition-opacity mb-4"
        >
          <svg className="w-4 h-4 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center py-12">
            <div className="spinner border-brand-orange w-10 h-10 mb-3"></div>
            <p className="text-sm text-gray-400">Loading checklists...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-semibold text-gray-600 mb-1">No checklists found</p>
            <p className="text-sm text-gray-400">
              No checklists in {activeCategory} - {activeSubCategory}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(checklistsByStage).map(([stage, stageChecklists]) => (
              <div key={stage} className="overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                {/* Header Container */}
                <div className="bg-brand-blue text-white font-heading font-bold text-center py-4 px-4 text-sm uppercase tracking-wider">
                  {activeSubCategory || 'Audit Checklist'}
                </div>

                {/* Body Container */}
                <div className="p-5">
                  <p className="font-heading font-black italic text-xs text-brand-blue uppercase tracking-widest mb-1.5">
                    STAGE: {stage}
                  </p>
                  <div className="border-t border-gray-200/80 my-3" />

                  {/* Checklist Items list */}
                  <div className="space-y-3 mt-4">
                    {stageChecklists.map((checklist) => {
                      const isSelected = !!checkedChecklists[checklist._id];
                      return (
                        <div key={checklist._id} className="relative">
                          <div
                            onClick={() => togglePopover(checklist._id)}
                            className={`flex items-center justify-between p-4 bg-white rounded-2xl border cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md
                              ${isSelected ? 'border-brand-orange/30 bg-orange-50/5' : 'border-gray-200/80 hover:border-brand-orange/30'}`}
                          >
                            <span className={`text-xs font-bold text-gray-700 leading-relaxed flex-1 pr-4 transition-colors ${isSelected ? 'text-gray-500 font-medium' : 'text-gray-800'}`}>
                              {checklist.title}
                              {checklist.items?.[0]?.required && (
                                <span className="text-red-500 ml-1 font-bold" title="Required">*</span>
                              )}
                            </span>
                            {renderCheckbox(checklist._id)}
                          </div>

                          {/* Floating Popover Overlay */}
                          {activePopoverId === checklist._id && (
                            <>
                              {/* Invisible backdrop to dismiss popover on click outside */}
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopoverId(null);
                                }}
                              />
                              <div
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl border border-gray-200 shadow-card-hover p-2.5 flex items-center gap-2.5 animate-scale-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* YES Button */}
                                <button
                                  onClick={() => handleSelectOption(checklist._id, 'YES')}
                                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-200
                                    ${checkedChecklists[checklist._id] === 'YES'
                                      ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                      : 'border-gray-150 hover:bg-gray-50 text-gray-500 font-semibold bg-white'}`}
                                >
                                  <svg className="w-5 h-5 text-green-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-[10px]">YES</span>
                                </button>

                                {/* NO Button */}
                                <button
                                  onClick={() => handleSelectOption(checklist._id, 'NO')}
                                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-200
                                    ${checkedChecklists[checklist._id] === 'NO'
                                      ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                                      : 'border-gray-150 hover:bg-gray-50 text-gray-500 font-semibold bg-white'}`}
                                >
                                  <svg className="w-5 h-5 text-red-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-[10px]">NO</span>
                                </button>

                                {/* N/A Button */}
                                <button
                                  onClick={() => handleSelectOption(checklist._id, 'N/A')}
                                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-200
                                    ${checkedChecklists[checklist._id] === 'N/A'
                                      ? 'border-brand-orange bg-orange-50 text-brand-orange font-bold'
                                      : 'border-gray-150 hover:bg-gray-50 text-gray-500 font-semibold bg-white'}`}
                                >
                                  <svg className="w-5 h-5 text-brand-orange mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M20 12H4" />
                                  </svg>
                                  <span className="text-[10px]">N/A</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Sticky/Fixed Bottom Button Container */}
      {!loading && filtered.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-150 z-40 max-w-md mx-auto shadow-lg">
          <button
            onClick={handleSaveAndSubmit}
            disabled={submitting}
            className="w-full bg-brand-orange hover:bg-[#C4570A] text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase"
          >
            {submitting ? (
              <>
                <div className="spinner border-white w-4 h-4" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Submit to QE</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
