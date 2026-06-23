import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChecklists } from '../api/checklists';
import { cacheAPIResponse, getCachedAPIResponse, savePendingAudit, getPendingAudits } from '../utils/offlineDB';
import { submitAuditSubmission, getAuditSubmissions } from '../api/auditSubmissions';
import { syncPendingAudits } from '../utils/syncService';
import useOnlineStatus from '../hooks/useOnlineStatus';
import OfflineBanner from '../components/OfflineBanner';
import Navbar from '../components/Navbar';
import { getFormattedCategoryName } from '../utils/categoryHelper';

/* ─────────────────────────────────────────────
   Custom Camera Component
   Direct stream capture, no gallery access
───────────────────────────────────────────── */
const CustomCamera = ({ onSave, onClose, onFallback }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);

      // Stop stream tracks on freeze
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSave = () => {
    onSave(capturedImage);
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col justify-between max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-4 text-white bg-black/40 backdrop-blur-md">
        <h4 className="font-heading font-bold text-sm">Capture Photo</h4>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video / Captured Image Container */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        {error ? (
          <div className="text-center p-6">
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <div className="flex flex-col gap-2.5 max-w-[200px] mx-auto">
              <button
                onClick={startCamera}
                className="px-4 py-2.5 bg-white text-black font-semibold rounded-xl text-xs active:scale-95 transition-transform"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onFallback) onFallback();
                }}
                className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl text-xs active:scale-95 transition-all"
              >
                Choose File instead
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Bottom Controls */}
      <div className="py-8 px-6 bg-black/60 backdrop-blur-md flex justify-center items-center gap-8">
        {capturedImage ? (
          <>
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors active:scale-95"
            >
              Retake
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors active:scale-95"
            >
              Save
            </button>
          </>
        ) : (
          <button
            onClick={handleCapture}
            disabled={!!error}
            className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 bg-transparent hover:scale-105 active:scale-95 transition-all"
          >
            <div className="w-full h-full rounded-full bg-red-600" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   NO-Issue Modal — camera upload + severity
   ───────────────────────────────────────────── */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const NoIssueModal = ({ checklist, onClose, onSubmit, initialData }) => {
  const fileInputRef = useRef(null);
  const [photos, setPhotos] = useState(initialData?.photos || []);
  const [severity, setSeverity] = useState(initialData?.severity || '');
  const [submitting, setSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [building, setBuilding] = useState(initialData?.building || '');
  const [unit, setUnit] = useState(initialData?.unit || '');
  const [room, setRoom] = useState(initialData?.room || '');

  const handleCameraClick = () => {
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileDevice) {
      setIsCameraOpen(true);
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleCameraSave = (capturedBase64) => {
    const newPhoto = {
      url: capturedBase64,
      name: `captured_${Date.now()}.jpg`,
    };
    setPhotos((prev) => [...prev, newPhoto]);
    setIsCameraOpen(false);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = [];
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);
        newPhotos.push({
          url: base64,
          name: file.name,
        });
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (photos.length === 0) {
      alert('Please capture/upload at least one photo.');
      return;
    }
    if (!building.trim()) {
      alert('Please enter Building details.');
      return;
    }
    if (!unit.trim()) {
      alert('Please enter Unit details.');
      return;
    }
    if (!room.trim()) {
      alert('Please enter Room details.');
      return;
    }
    if (!severity) {
      alert('Please select a severity level.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      onSubmit({
        photos,
        severity,
        building: building.trim(),
        unit: unit.trim(),
        room: room.trim(),
      });
      setSubmitting(false);
      onClose();
    }, 600);
  };

  const SEVERITY_OPTIONS = [
    { label: 'Mild (2/5)', color: 'text-[#1A56C8]', border: 'border-[#1A56C8]', bg: 'bg-[#1A56C8]/10', dot: 'bg-[#1A56C8]', bars: 1 },
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
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                📷 Capture Photo <span className="text-red-500 font-bold">*</span>
              </p>
              {photos.length > 0 && (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                  {photos.length} Captured
                </span>
              )}
            </div>

            {/* Camera Button */}
            <button
              type="button"
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
              <p className="text-xs text-gray-400">Tap to capture photo directly</p>
            </button>

            {/* Hidden fallback file input */}
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

          {/* ── Location Accordion Section ── */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            <button
              type="button"
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/80 transition-colors focus:outline-none"
            >
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                📍 Location <span className="text-red-500 font-bold">*</span>
              </span>
              <div className="flex items-center gap-2">
                {building.trim() || unit.trim() || room.trim() ? (
                  <span className="text-[10px] bg-[#1A56C8]/10 text-[#1A56C8] px-2 py-0.5 rounded-full font-bold">
                    Filled
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">
                    Required
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isLocationOpen ? 'transform rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isLocationOpen && (
              <div className="p-4 bg-white border-t border-gray-100 space-y-4 animate-fade-in text-left">
                {/* Building Input */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Building <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="Enter building details..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-brand-orange focus:outline-none text-xs font-semibold text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Unit Input */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Enter unit details..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-brand-orange focus:outline-none text-xs font-semibold text-gray-700 placeholder-gray-400"
                  />
                </div>

                {/* Room Input */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Room <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Enter room details..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-brand-orange focus:outline-none text-xs font-semibold text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Severity Section ── */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              ⚠️ Severity Level <span className="text-red-500 font-bold">*</span>
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
            disabled={submitting || !severity || photos.length === 0 || !building.trim() || !unit.trim() || !room.trim()}
            className="w-full bg-brand-orange hover:bg-[#1040A8] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase mb-2"
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

      {/* Custom Camera Overlay */}
      {isCameraOpen && (
        <CustomCamera
          onSave={handleCameraSave}
          onClose={() => setIsCameraOpen(false)}
          onFallback={() => fileInputRef.current?.click()}
        />
      )}
    </>
  );
};

/* ─────────────────────────────────────────────
   Main Dashboard Component
───────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubCategory, setActiveSubCategory] = useState('');
  const [checkedChecklists, setCheckedChecklists] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [activePopoverId, setActivePopoverId] = useState(null);
  // noModalId stores which checklist is showing the NO-issue modal
  const [noModalId, setNoModalId] = useState(null);
  const [previousSubmissions, setPreviousSubmissions] = useState([]);

  const fetchPreviousSubmissions = useCallback(async () => {
    if (!activeCategory || !activeSubCategory) return;
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
          String(sub.category || '').trim().toLowerCase() === String(activeCategory || '').trim().toLowerCase() &&
          String(sub.subCategory || '').trim().toLowerCase() === String(activeSubCategory || '').trim().toLowerCase() &&
          String(sub.location || '').trim().toLowerCase() === String(currentForm.location || '').trim().toLowerCase() &&
          String(sub.floor || '').trim().toLowerCase() === String(currentForm.floor || '').trim().toLowerCase() &&
          String(sub.columnNo || '').trim().toLowerCase() === String(currentForm.columnNo || '').trim().toLowerCase() &&
          String(sub.flatNo || '').trim().toLowerCase() === String(currentForm.flatNo || '').trim().toLowerCase() &&
          String(sub.buildingName || '').trim().toLowerCase() === String(currentForm.buildingName || '').trim().toLowerCase() &&
          String(sub.pour || '').trim().toLowerCase() === String(currentForm.pour || '').trim().toLowerCase() &&
          String(sub.beamNo || '').trim().toLowerCase() === String(currentForm.beamNo || '').trim().toLowerCase()
        );
      });

      setPreviousSubmissions(matching);
    } catch (err) {
      console.error('Failed to load previous submissions:', err);
    }
  }, [activeCategory, activeSubCategory, isOnline]);

  useEffect(() => {
    if (activeCategory && activeSubCategory) {
      fetchPreviousSubmissions();
    }
  }, [activeCategory, activeSubCategory, isOnline, fetchPreviousSubmissions]);

  const previouslySubmittedAnswers = useMemo(() => {
    const map = {};
    previousSubmissions.forEach((sub) => {
      if (sub.answers && Array.isArray(sub.answers)) {
        sub.answers.forEach((ans) => {
          if (ans.checklistId && ans.choice) {
            map[ans.checklistId] = ans;
          }
        });
      }
    });
    return map;
  }, [previousSubmissions]);

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
      const data = res.data.data;
      setChecklists(data);
      // Cache for offline use
      await cacheAPIResponse('checklists', data);
    } catch (err) {
      console.error('Failed to fetch checklists:', err);
      // Fallback to cached data when offline
      const cached = await getCachedAPIResponse('checklists');
      if (cached) {
        setChecklists(cached);
        console.log('📦 Loaded checklists from offline cache');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync when coming back online
  const handleSyncComplete = useCallback(async () => {
    const result = await syncPendingAudits();
    if (result.synced > 0) {
      console.log(`✅ Auto-synced ${result.synced} audit(s)`);
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncPendingAudits();
    }
  }, [isOnline]);

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

  const getChecklistMaxMarks = (checklistId) => {
    const checklist = filtered.find((c) => c._id === checklistId);
    return checklist?.items?.[0]?.mark !== undefined ? checklist.items[0].mark : 5;
  };

  const getMarksForSeverity = (severity) => {
    if (!severity) return 0;
    if (severity.includes('Mild')) return 2;
    if (severity.includes('Moderate')) return 1;
    if (severity.includes('Siver')) return 0;
    if (severity.includes('Fatal')) return 0;
    return 0;
  };

  // Derived scoring calculations
  const allActionedItems = useMemo(() => {
    const combined = {};
    Object.entries(previouslySubmittedAnswers).forEach(([id, val]) => {
      combined[id] = val;
    });
    Object.entries(checkedChecklists).forEach(([id, val]) => {
      if (val && val.choice) {
        combined[id] = val;
      }
    });
    return combined;
  }, [previouslySubmittedAnswers, checkedChecklists]);

  const actionedItems = Object.values(allActionedItems);
  const achievedMarks = actionedItems.reduce((sum, item) => sum + (item.marks || 0), 0);
  const totalActionedMaxMarks = Object.keys(allActionedItems).reduce((sum, checklistId) => {
    return sum + getChecklistMaxMarks(checklistId);
  }, 0);
  const scorePercentage = totalSubCategoryMarks > 0
    ? Math.round((achievedMarks / totalSubCategoryMarks) * 100)
    : 0;

  const togglePopover = (checklistId) => {
    if (previouslySubmittedAnswers[checklistId]) return;
    setActivePopoverId((prev) => (prev === checklistId ? null : checklistId));
  };

  const handleSelectOption = (checklist, option) => {
    if (previouslySubmittedAnswers[checklist._id]) return;
    if (option === 'NO') {
      setActivePopoverId(null);
      setNoModalId(checklist._id);
      return;
    }
    // YES or N/A — toggle off if already selected
    setCheckedChecklists((prev) => {
      if (prev[checklist._id]?.choice === option) {
        const next = { ...prev };
        delete next[checklist._id];
        return next;
      }
      return {
        ...prev,
        [checklist._id]: {
          choice: option,
          marks: checklist.items?.[0]?.mark !== undefined ? checklist.items[0].mark : 5,
        },
      };
    });
    setActivePopoverId(null);
  };

  const handleNoModalSubmit = (checklistId, { photos, severity, building, unit, room }) => {
    const marks = getMarksForSeverity(severity);
    setCheckedChecklists((prev) => ({
      ...prev,
      [checklistId]: {
        choice: 'NO',
        severity,
        photos,
        marks,
        building,
        unit,
        room,
      },
    }));
  };

  const handleSaveAndSubmit = async () => {
    if (Object.keys(checkedChecklists).length === 0) {
      alert("Please select YES or NO on at least one checkpoint before submitting.");
      return;
    }

    setSubmitting(true);

    // Build audit payload
    const auditForm = JSON.parse(localStorage.getItem('auditForm') || '{}');
    const answers = Object.entries(checkedChecklists).map(([checklistId, item]) => {
      const checklist = filtered.find(c => c._id === checklistId);
      return {
        checklistId,
        title: checklist?.title || '',
        choice: item.choice,
        marks: item.marks || 0,
        maxMarks: checklist?.items?.[0]?.mark || 0,
        severity: item.severity || '',
        photos: (item.photos || []).map(p => p.url || ''),
        building: item.building || '',
        unit: item.unit || '',
        room: item.room || '',
      };
    });

    const auditPayload = {
      localId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      siteName: auditForm.siteName || '',
      auditorName: auditForm.auditorName || '',
      auditeeName: auditForm.auditeeName || '',
      date: auditForm.date || new Date().toISOString().split('T')[0],
      category: activeCategory,
      subCategory: activeSubCategory,
      location: auditForm.location || '',
      floor: auditForm.floor || '',
      columnNo: auditForm.columnNo || '',
      flatNo: auditForm.flatNo || '',
      buildingName: auditForm.buildingName || '',
      pour: auditForm.pour || '',
      beamNo: auditForm.beamNo || '',
      answers,
      totalMarks: totalSubCategoryMarks,
      achievedMarks,
      scorePercentage,
      submittedAt: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // Online: submit directly to server
        await submitAuditSubmission(auditPayload);
        console.log('✅ Audit submitted online');
      } else {
        // Offline: save to IndexedDB queue
        await savePendingAudit(auditPayload);
        console.log('💾 Audit saved offline — will sync when online');
      }
      navigate('/success', { state: { offline: !isOnline, category: activeCategory } });
    } catch (err) {
      console.error('Submit failed, saving offline:', err);
      // Fallback: save offline even if online submit fails
      await savePendingAudit(auditPayload);
      navigate('/success', { state: { offline: true, category: activeCategory } });
    } finally {
      setSubmitting(false);
    }
  };

  const renderCheckbox = (checklistId, isPreviouslySubmitted, submittedAnswer) => {
    if (isPreviouslySubmitted && submittedAnswer) {
      if (submittedAnswer.choice === 'YES') {
        return (
          <div className="w-8 h-8 rounded-lg border-2 border-green-200 bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      } else if (submittedAnswer.choice === 'N/A') {
        return (
          <div className="w-8 h-8 rounded-lg border-2 border-orange-200 bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M20 12H4" />
            </svg>
          </div>
        );
      } else {
        return (
          <div className="w-8 h-8 rounded-lg border-2 border-red-200 bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      }
    }

    const choice = checkedChecklists[checklistId]?.choice;
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
    if (choice === 'N/A') {
      return (
        <div className="w-8 h-8 rounded-lg border-2 border-orange-500 bg-orange-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M20 12H4" />
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
      <OfflineBanner onSyncComplete={handleSyncComplete} />
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
                    {totalActionedMaxMarks > 0
                      ? `${achievedMarks}/${totalSubCategoryMarks} Marks (${scorePercentage}%)`
                      : `${totalSubCategoryMarks} Marks`}
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
                      const submittedAnswer = previouslySubmittedAnswers[checklist._id];
                      const isPreviouslySubmitted = !!submittedAnswer;
                      return (
                        <div key={checklist._id} className="relative">
                          {/* Item Card */}
                          <div
                            onClick={() => togglePopover(checklist._id)}
                            className={`flex items-center justify-between p-4 rounded-2xl border select-none shadow-sm transition-all duration-200
                              ${isPreviouslySubmitted 
                                ? 'bg-gray-50/70 border-gray-200 opacity-85 cursor-not-allowed pointer-events-none' 
                                : isSelected 
                                  ? 'bg-white border-brand-orange/30 cursor-pointer hover:shadow-md' 
                                  : 'bg-white border-gray-200/80 hover:border-brand-orange/30 cursor-pointer hover:shadow-md'
                              }`}
                          >
                            <div className="flex-1 pr-4 text-left">
                              <span className={`text-xs font-bold leading-relaxed transition-colors flex items-center flex-wrap gap-1.5
                                ${isPreviouslySubmitted
                                  ? 'text-gray-400 font-semibold'
                                  : isSelected 
                                    ? 'text-gray-500' 
                                    : 'text-gray-800'
                                }`}
                              >
                                <span>{checklist.title}</span>
                                {!isPreviouslySubmitted && checklist.items?.[0]?.required && (
                                  <span className="text-red-500 font-bold" title="Required">*</span>
                                )}
                                {!isPreviouslySubmitted && (() => {
                                  const maxMark = checklist.items?.[0]?.mark !== undefined ? checklist.items[0].mark : 5;
                                  const state = checkedChecklists[checklist._id];
                                  if (!state) {
                                    return (
                                      <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {maxMark} Marks
                                      </span>
                                    );
                                  }
                                  if (state.choice === 'YES') {
                                    return (
                                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        {state.marks}/{maxMark} Marks (Pass)
                                      </span>
                                    );
                                  }
                                  if (state.choice === 'N/A') {
                                    return (
                                      <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                        {state.marks}/{maxMark} Marks (N/A)
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                      {state.marks}/{maxMark} Marks (Fail - {state.severity?.split(' ')[0]})
                                    </span>
                                  );
                                })()}
                              </span>
                            </div>
                            {renderCheckbox(checklist._id, isPreviouslySubmitted, submittedAnswer)}
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
                                    ${checkedChecklists[checklist._id]?.choice === 'YES'
                                      ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                      : 'border-gray-200 hover:bg-gray-50 text-gray-500 bg-white'}`}
                                >
                                  <svg className={`w-6 h-6 mb-0.5 ${checkedChecklists[checklist._id]?.choice === 'YES' ? 'text-green-600' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-[11px] font-bold">YES</span>
                                </button>

                                {/* NO */}
                                <button
                                  onClick={() => handleSelectOption(checklist, 'NO')}
                                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all duration-200
                                    ${checkedChecklists[checklist._id]?.choice === 'NO'
                                      ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                                      : 'border-gray-200 hover:bg-gray-50 text-gray-500 bg-white'}`}
                                >
                                  <svg className="w-6 h-6 text-red-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-[11px] font-bold">NO</span>
                                </button>

                                {/* N/A */}
                                <button
                                  onClick={() => handleSelectOption(checklist, 'N/A')}
                                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 transition-all duration-200
                                    ${checkedChecklists[checklist._id]?.choice === 'N/A'
                                      ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold'
                                      : 'border-gray-200 hover:bg-gray-50 text-gray-500 bg-white'}`}
                                >
                                  <svg className={`w-6 h-6 mb-0.5 ${checkedChecklists[checklist._id]?.choice === 'N/A' ? 'text-orange-600' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M20 12H4" />
                                  </svg>
                                  <span className="text-[11px] font-bold">N/A</span>
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
          {/* Offline indicator above button */}
          {!isOnline && (
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[10px] text-gray-500 font-semibold">
                Offline — audit will be saved locally &amp; synced later
              </p>
            </div>
          )}
          <button
            onClick={handleSaveAndSubmit}
            disabled={submitting}
            className={`w-full text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm uppercase
              ${isOnline ? 'bg-brand-orange hover:bg-[#1040A8]' : 'bg-gray-700 hover:bg-gray-800'}`}
          >
            {submitting ? (
              <>
                <div className="spinner border-white w-4 h-4" />
                <span>{isOnline ? 'Submitting...' : 'Saving offline...'}</span>
              </>
            ) : (
              <>
                {isOnline ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                <span>{isOnline ? 'Submit Audit' : 'Save Offline'}</span>
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
          initialData={checkedChecklists[noModalId]}
        />
      )}
    </div>
  );
};

export default Dashboard;
