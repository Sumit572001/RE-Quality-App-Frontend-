import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChecklists } from '../api/checklists';
import Navbar from '../components/Navbar';
import { getFormattedCategoryName } from '../utils/categoryHelper';

/* ─────────────────────────────────────────────
   NO-Issue Modal — camera upload + severity
───────────────────────────────────────────── */
const NoIssueModal = ({ checklist, onClose, onSubmit }) => {
  const fileInputRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [severity, setSeverity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCameraClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!severity) {
      alert('Please select a severity level (Low, Medium, or High).');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({ photos, severity });
      setSubmitting(false);
      onClose();
    }, 600);
  };

  const SEVERITY_OPTIONS = [
    { label: 'Mild (2/5)', color: 'text-green-600', border: 'border-green-500', bg: 'bg-green-50', dot: 'bg-green-500', bars: 1 },
    { label: 'Moderate (1/5)', color: 'text-yellow-600', border: 'border-yellow-500', bg: 'bg-yellow-50', dot: 'bg-yellow-500', bars: 2 },
    { label: 'Siver (0/5)', color: 'text-orange-600', border: 'border-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500', bars: 3 },
    { label: 'Fatal (0/5)', color: 'text-red-600', border: 'border-red-500', bg: 'bg-red-50', dot: 'bg-red-500', bars: 4 },
  ];

  return (
    <>
      {/* Full-screen dark backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Issue Reported</p>
            <h3 className="font-heading font-bold text-brand-blue text-sm leading-tight line-clamp-2 max-w-[260px]">
              {checklist.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* ── Photo Upload Section ── */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              📷 Upload Photos
            </p>

            {/* Camera Button */}
            <button
              onClick={handleCameraClick}
              className="w-full border-2 border-dashed border-brand-orange/50 rounded-2xl py-6 flex flex-col items-center justify-center gap-2 bg-orange-50/30 hover:bg-orange-50 transition-colors active:scale-[0.98]"
            >
              <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-brand-orange">Open Camera</p>
              <p className="text-xs text-gray-400">Tap to capture photo</p>
            </button>

            {/* Hidden camera-only file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img
                      src={photo.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover rounded-xl border border-gray-200"
                    />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                <button
                  onClick={handleCameraClick}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-brand-orange hover:text-brand-orange transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ── Severity Section ── */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              ⚠️ Severity Level
            </p>
            <div className="space-y-2.5">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSeverity(opt.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200
                    ${severity === opt.label
                      ? `${opt.border} ${opt.bg}`
                      : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  {/* Custom radio circle */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${severity === opt.label ? `${opt.border}` : 'border-gray-300'}`}>
                    {severity === opt.label && (
                      <div className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                    )}
                  </div>
                  <span className={`text-sm font-bold transition-colors ${severity === opt.label ? opt.color : 'text-gray-600'}`}>
                    {opt.label}
                  </span>
                  {/* Indicator badge */}
                  <div className="ml-auto flex items-center gap-1">
                    {[...Array(opt.bars)].map((_, i) => (
                      <div key={i} className={`w-2 h-5 rounded-sm ${severity === opt.label ? opt.dot : 'bg-gray-200'} transition-colors`} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Submit Button ── */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !severity}
            className="w-full bg-brand-orange hover:bg-[#C4570A] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase mb-2"
          >
            {submitting ? (
              <>
                <div className="spinner border-white w-4 h-4" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Submit Issue</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   Main Dashboard Component
───────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubCategory, setActiveSubCategory] = useState('');
  const [checkedChecklists, setCheckedChecklists] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activePopoverId, setActivePopoverId] = useState(null);
  // noModalId stores which checklist is showing the NO-issue modal
  const [noModalId, setNoModalId] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin');

    const searchParams = new URLSearchParams(window.location.search);
    const categoryParam = searchParams.get('category');
    const subCategoryParam = searchParams.get('subCategory');
    if (categoryParam) setActiveCategory(categoryParam);
    if (subCategoryParam) setActiveSubCategory(subCategoryParam);

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

  const checklistsByStage = filtered.reduce((acc, checklist) => {
    const stage = checklist.stage || 'General';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(checklist);
    return acc;
  }, {});

  const totalSubCategoryMarks = filtered.reduce((sum, c) => sum + (c.items?.[0]?.mark || 0), 0);

  const togglePopover = (checklistId) => {
    setActivePopoverId((prev) => (prev === checklistId ? null : checklistId));
  };

  const handleSelectOption = (checklist, option) => {
    if (option === 'NO') {
      // Close the small popover and open the NO issue modal
      setActivePopoverId(null);
      setNoModalId(checklist._id);
      return;
    }
    // YES — toggle off if already selected
    setCheckedChecklists((prev) => ({
      ...prev,
      [checklist._id]: prev[checklist._id] === option ? null : option,
    }));
    setActivePopoverId(null);
  };

  const handleNoModalSubmit = (checklistId, { photos, severity }) => {
    setCheckedChecklists((prev) => ({
      ...prev,
      [checklistId]: 'NO',
    }));
    // You can store photos & severity in state if needed for API submission
  };

  const handleSaveAndSubmit = () => {
    const uncheckedRequired = filtered.filter(
      (c) => c.items?.[0]?.required && !checkedChecklists[c._id]
    );
    if (uncheckedRequired.length > 0) {
      alert(`Please respond to all required items:\n\n${uncheckedRequired.map(c => `• ${c.title}`).join('\n')}`);
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
        <div className="w-8 h-8 rounded-lg border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (choice === 'NO') {
      return (
        <div className="w-8 h-8 rounded-lg border-2 border-red-500 bg-red-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    return <div className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-white flex-shrink-0" />;
  };

  // The checklist whose NO modal is open
  const noModalChecklist = filtered.find((c) => c._id === noModalId);

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

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center py-12">
            <div className="spinner border-brand-orange w-10 h-10 mb-3"></div>
            <p className="text-sm text-gray-400">Loading checklists...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-semibold text-gray-600 mb-1">No checklists found</p>
            <p className="text-sm text-gray-400">No checklists in {getFormattedCategoryName(activeCategory)} - {activeSubCategory}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(checklistsByStage).map(([stage, stageChecklists]) => (
              <div key={stage} className="overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                {/* Blue Header */}
                <div className="bg-brand-blue text-white font-heading font-bold text-center py-4 px-4 text-sm uppercase tracking-wider flex justify-center items-center gap-2">
                  <span>{activeSubCategory || 'Audit Checklist'}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-black">
                    {totalSubCategoryMarks} Marks
                  </span>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="font-heading font-black italic text-xs text-brand-blue uppercase tracking-widest mb-1.5">
                    STAGE: {stage}
                  </p>
                  <div className="border-t border-gray-200/80 my-3" />

                  <div className="space-y-3 mt-4">
                    {stageChecklists.map((checklist) => {
                      const isSelected = !!checkedChecklists[checklist._id];
                      return (
                        <div key={checklist._id} className="relative">
                          {/* Item Card */}
                          <div
                            onClick={() => togglePopover(checklist._id)}
                            className={`flex items-center justify-between p-4 bg-white rounded-2xl border cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md
                              ${isSelected ? 'border-brand-orange/30' : 'border-gray-200/80 hover:border-brand-orange/30'}`}
                          >
                            <span className={`text-xs font-bold leading-relaxed flex-1 pr-4 transition-colors ${isSelected ? 'text-gray-500' : 'text-gray-800'} flex items-center flex-wrap gap-1.5`}>
                              <span>{checklist.title}</span>
                              {checklist.items?.[0]?.required && (
                                <span className="text-red-500 font-bold" title="Required">*</span>
                              )}
                              {checklist.items?.[0]?.mark !== undefined && (
                                <span className="text-[10px] font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  {checklist.items[0].mark} Marks
                                </span>
                              )}
                            </span>
                            {renderCheckbox(checklist._id)}
                          </div>

                          {/* YES / NO Popover */}
                          {activePopoverId === checklist._id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => { e.stopPropagation(); setActivePopoverId(null); }}
                              />
                              <div
                                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl border border-gray-200 shadow-card-hover p-2.5 flex items-center gap-2.5 animate-scale-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* YES */}
                                <button
                                  onClick={() => handleSelectOption(checklist, 'YES')}
                                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all duration-200
                                    ${checkedChecklists[checklist._id] === 'YES'
                                      ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                      : 'border-gray-200 hover:bg-gray-50 text-gray-500 bg-white'}`}
                                >
                                  <svg className="w-6 h-6 text-green-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-[11px] font-bold">YES</span>
                                </button>

                                {/* NO */}
                                <button
                                  onClick={() => handleSelectOption(checklist, 'NO')}
                                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all duration-200
                                    ${checkedChecklists[checklist._id] === 'NO'
                                      ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                                      : 'border-gray-200 hover:bg-gray-50 text-gray-500 bg-white'}`}
                                >
                                  <svg className="w-6 h-6 text-red-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-[11px] font-bold">NO</span>
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

      {/* Sticky Submit Button */}
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
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* NO Issue Bottom-Sheet Modal */}
      {noModalId && noModalChecklist && (
        <NoIssueModal
          checklist={noModalChecklist}
          onClose={() => setNoModalId(null)}
          onSubmit={(data) => handleNoModalSubmit(noModalId, data)}
        />
      )}
    </div>
  );
};

export default Dashboard;
