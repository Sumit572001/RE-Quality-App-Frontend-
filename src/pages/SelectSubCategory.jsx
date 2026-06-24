import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../api/categories';
import { getSubCategories, lockSubCategoriesByCategory } from '../api/subcategories';
import { getChecklists } from '../api/checklists';
import Navbar from '../components/Navbar';
import { getFormattedCategoryName } from '../utils/categoryHelper';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { getPendingAudits, getCachedAPIResponse, cacheAPIResponse } from '../utils/offlineDB';
import { getAuditSubmissions } from '../api/auditSubmissions';

const SelectSubCategory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittingLock, setSubmittingLock] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [previousSubmissions, setPreviousSubmissions] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, subsRes, checklistsRes] = await Promise.all([
        getCategories(),
        getSubCategories(),
        getChecklists(),
      ]);
      const cats = catsRes.data.data;
      setCategories(cats);
      setSubCategories(subsRes.data.data);
      setChecklists(checklistsRes.data.data);

      const searchParams = new URLSearchParams(window.location.search);
      const categoryParam = searchParams.get('category');

      if (categoryParam) {
        const found = cats.find(c => c.name.toLowerCase() === categoryParam.toLowerCase());
        if (found) {
          setSelectedCategory(found);
          setLoading(false);
          return;
        }
      }

      if (cats.length > 0) {
        setSelectedCategory(cats[0]);
      }
    } catch (err) {
      console.error('Failed to fetch categories or subcategories:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubCategories = subCategories.filter((sub) => {
    if (!selectedCategory) return false;
    const subCatVal = sub.category;
    if (!subCatVal) return false;
    if (typeof subCatVal === 'object') {
      return subCatVal._id === selectedCategory._id || subCatVal.name === selectedCategory.name;
    }
    return subCatVal === selectedCategory._id;
  });

  const getSubCategoryTotalMarks = (subName) => {
    if (!selectedCategory) return 0;
    const matchingChecklists = checklists.filter(
      (c) => c.category === selectedCategory.name && c.subCategory === subName
    );
    return matchingChecklists.reduce((sum, c) => sum + (c.items?.[0]?.mark || 0), 0);
  };

  const fetchPreviousSubmissions = useCallback(async () => {
    if (!selectedCategory) return;
    try {
      let offlineSubmissions = [];
      try {
        const pending = await getPendingAudits();
        if (pending) {
          offlineSubmissions = pending;
        }
      } catch (err) {
        console.error('Failed to fetch offline pending audits:', err);
      }

      let onlineSubmissions = [];
      if (isOnline) {
        try {
          const res = await getAuditSubmissions();
          onlineSubmissions = res.data.data || [];
          await cacheAPIResponse('audit-submissions', onlineSubmissions);
        } catch (err) {
          console.error('Failed to fetch online audit submissions:', err);
        }
      } else {
        const cached = await getCachedAPIResponse('audit-submissions');
        if (cached) {
          onlineSubmissions = cached;
        }
      }

      const allSubmissions = [...offlineSubmissions, ...onlineSubmissions];

      const currentForm = JSON.parse(localStorage.getItem('auditForm') || '{}');
      const matching = allSubmissions.filter((sub) => {
        return (
          String(sub.siteName || '').trim().toLowerCase() === String(currentForm.siteName || '').trim().toLowerCase() &&
          String(sub.category || '').trim().toLowerCase() === String(selectedCategory.name || '').trim().toLowerCase() &&
          String(sub.location || '').trim().toLowerCase() === String(currentForm.location || '').trim().toLowerCase() &&
          String(sub.floor || '').trim().toLowerCase() === String(currentForm.floor || '').trim().toLowerCase() &&
          String(sub.flatNo || '').trim().toLowerCase() === String(currentForm.flatNo || '').trim().toLowerCase() &&
          String(sub.buildingName || '').trim().toLowerCase() === String(currentForm.buildingName || '').trim().toLowerCase() &&
          String(sub.pour || '').trim().toLowerCase() === String(currentForm.pour || '').trim().toLowerCase()
        );
      });

      setPreviousSubmissions(matching);
    } catch (err) {
      console.error('Failed to load previous submissions in subcategory screen:', err);
    }
  }, [selectedCategory, isOnline]);

  useEffect(() => {
    if (selectedCategory) {
      fetchPreviousSubmissions();
    }
  }, [selectedCategory, isOnline, fetchPreviousSubmissions]);

  const getSubCategoryProgress = (subName) => {
    if (!selectedCategory) return { achievedMarks: 0, totalMarks: 0, scorePercentage: 0 };

    const subChecklists = checklists.filter(
      (c) => c.category === selectedCategory.name && c.subCategory === subName
    );
    const totalMarks = subChecklists.reduce((sum, c) => sum + (c.items?.[0]?.mark || 0), 0);

    // Get unique answered checklists in the submissions matching this subCategory
    const uniqueAnswers = {};
    previousSubmissions.forEach((submission) => {
      if (submission.subCategory === subName && submission.answers && Array.isArray(submission.answers)) {
        submission.answers.forEach((ans) => {
          if (ans.checklistId && ans.choice) {
            uniqueAnswers[ans.checklistId] = ans;
          }
        });
      }
    });

    const achievedMarks = Object.values(uniqueAnswers).reduce((sum, ans) => sum + (ans.marks || 0), 0);
    const scorePercentage = totalMarks > 0 ? Math.round((achievedMarks / totalMarks) * 100) : 0;

    return { achievedMarks, totalMarks, scorePercentage };
  };

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLockCategory = async () => {
    if (!selectedCategory) return;
    try {
      setSubmittingLock(true);
      await lockSubCategoriesByCategory(selectedCategory._id);
      showToast('Checklist closed and locked successfully!', 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to lock checklist', 'error');
    } finally {
      setSubmittingLock(false);
      setShowConfirmModal(false);
    }
  };

  const isAlreadyLocked = filteredSubCategories.length > 0 && filteredSubCategories.every(sub => sub.isLocked);

  return (
    <div className="page-container bg-brand-gray pb-10">
      <Navbar />

      <main className="px-4 pt-6 pb-24">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-brand-blue hover:bg-gray-50 transition-colors"
            title="Go Back to Details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-heading font-bold text-brand-blue">
                {selectedCategory ? getFormattedCategoryName(selectedCategory.name) : 'Sub-Category'}
              </h1>
              {!loading && (
                <span className="badge-orange text-[10px] font-bold">
                  {filteredSubCategories.length} available
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-12">
            <div className="spinner border-brand-orange w-10 h-10 mb-3"></div>
            <p className="text-sm text-gray-400">Loading sub-categories...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sub-Category List */}
            <div className="space-y-3">

              {filteredSubCategories.length === 0 ? (
                <div className="card text-center py-12 border border-gray-100 bg-white">
                  <p className="text-4xl mb-3">📁</p>
                  <p className="font-semibold text-gray-600 mb-1">No sub-categories found</p>
                  <p className="text-xs text-gray-400">Please choose another parent category or contact admin</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredSubCategories.map((sub) => (
                    <div
                      key={sub._id}
                      onClick={() => {
                        if (sub.isLocked) {
                          showToast('This sub-category checklist is locked.', 'error');
                          return;
                        }
                        navigate(`/dashboard?category=${encodeURIComponent(selectedCategory.name)}&subCategory=${encodeURIComponent(sub.name)}`);
                      }}
                      className={`flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 transition-all duration-200 group ${sub.isLocked
                        ? 'opacity-60 cursor-not-allowed bg-gray-50'
                        : 'hover:border-brand-orange hover:shadow-sm cursor-pointer'
                        }`}
                    >
                      <div className="flex items-center justify-between flex-1 pr-2 min-w-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 flex-shrink-0 ${sub.isLocked
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-brand-orange/10 text-brand-orange group-hover:bg-brand-orange group-hover:text-white'
                            }`}>
                            {sub.isLocked ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-xs font-bold leading-tight transition-colors truncate ${sub.isLocked
                            ? 'text-gray-400'
                            : 'text-gray-700 group-hover:text-brand-orange'
                            }`}>
                            {sub.name}
                          </span>
                        </div>
                        {(() => {
                          const progress = getSubCategoryProgress(sub.name);
                          return (
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full whitespace-nowrap border flex-shrink-0 ${sub.isLocked
                              ? 'text-gray-400 bg-gray-100 border-gray-200'
                              : 'text-brand-orange bg-brand-orange/10 border-brand-orange/20'
                              }`}>
                              {progress.achievedMarks > 0
                                ? `${progress.achievedMarks}/${progress.totalMarks} Marks (${progress.scorePercentage}%)`
                                : `${progress.totalMarks} Marks`
                              }
                            </span>
                          );
                        })()}
                      </div>
                      {sub.isLocked ? (
                        <svg
                          className="w-4 h-4 text-red-400 flex-shrink-0"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-gray-300 group-hover:text-brand-orange transition-colors flex-shrink-0"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {filteredSubCategories.length > 0 && (
              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  disabled={isAlreadyLocked || submittingLock}
                  onClick={() => setShowConfirmModal(true)}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${isAlreadyLocked
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                    : 'bg-brand-orange text-white hover:bg-brand-orangeDark active:scale-95'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {isAlreadyLocked ? 'Submitted' : 'Submit'}
                </button>

                <button
                  type="button"
                  disabled={!isAlreadyLocked}
                  onClick={() => navigate('/next')}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${!isAlreadyLocked
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                    : 'bg-brand-blue text-white hover:bg-brand-blueDark active:scale-95'
                    }`}
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay px-4">
          <div className="modal-sheet animate-scale-in max-w-sm rounded-3xl mx-auto mb-auto mt-24 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-lg font-heading font-bold text-brand-blue mb-2">
              Close Checklist
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Do you want to Submit this checklist? Once Submited, you will not be able to edit or reopen it.
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-150 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLockCategory}
                disabled={submittingLock}
                className="flex-1 py-2.5 px-4 bg-brand-orange hover:bg-brand-orangeDark text-white font-semibold rounded-xl shadow-sm transition-all duration-150 text-xs flex items-center justify-center gap-1.5"
              >
                {submittingLock ? (
                  <span className="spinner border-white w-3 h-3"></span>
                ) : 'Ok'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast ${toastType === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toastType === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default SelectSubCategory;
