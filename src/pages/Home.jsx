import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChecklists } from '../api/checklists';
import { getCategories } from '../api/categories';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { getFormattedCategoryName, sortCategories } from '../utils/categoryHelper';
import OfflineBanner from '../components/OfflineBanner';
import { syncPendingAudits } from '../utils/syncService';
import useOnlineStatus from '../hooks/useOnlineStatus';

const STAGE_OPTIONS = ['Pre Work', 'Pour Card', 'During Work', 'After Work', 'General'];

const AUDITOR_NAMES = [
  'Yogesh Shinde',
  'Amol Shitole',
  'Ganesh Deshmukh',
  'Santosh Iigade',
  'Nitin Nalawade',
  'Rajendra Rupnar',
  'Suraj Khandale',
  'Ketan Jaykar',
  'Santosh Patil',
  'Rahul Mane',
  'Sujit Chopde',
  'Subhash Bhandigare'
];

const AUDITEE_NAMES = [
  'Dhanajay Chavat',
  'Jaydeep Patil',
  'Sujit Shendkar',
  'Ashvin Pawar',
  'Sagar Patil'
];

const SITE_NAMES = [
  'Nyati Era',
  'Nyati Evoque',
  'Nyati Evania',
  'Nyati Elenor',
  'Nyati Equinox',
  'Nyati Exuberance',
  'Nyati Esteban',
  'Nyati Emerald',
  'Nyati Emblem'
];

const Home = () => {
  const { user, isAdmin } = useAuth();
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAuditorDropdownOpen, setIsAuditorDropdownOpen] = useState(false);
  const [isAuditeeDropdownOpen, setIsAuditeeDropdownOpen] = useState(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [auditForm, setAuditForm] = useState({
    siteName: '',
    auditorName: '',
    auditeeName: '',
    date: new Date().toISOString().split('T')[0],
    stage: 'RCC',
    location: '',
    floor: '',
    columnNo: '',
    flatNo: '',
    buildingName: '',
    pour: '',
    beamNo: '',
  });

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
    fetchCategories();
    // Auto-sync any pending offline audits on app load
    if (navigator.onLine) {
      syncPendingAudits().then(result => {
        if (result.synced > 0) console.log(`✅ Synced ${result.synced} pending audit(s) on startup`);
      });
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('auditForm');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAuditForm(prev => ({
          ...prev,
          ...parsed,
          date: parsed.date || new Date().toISOString().split('T')[0]
        }));
        if (parsed.category) {
          setSelectedCategory(parsed.category);
        }
      } catch (err) {
        console.error('Failed to parse auditForm from localStorage:', err);
      }
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const cats = res.data.data;
      setCategories(cats);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.auditor-dropdown-container')) {
        setIsAuditorDropdownOpen(false);
      }
      if (!event.target.closest('.auditee-dropdown-container')) {
        setIsAuditeeDropdownOpen(false);
      }
      if (!event.target.closest('.site-dropdown-container')) {
        setIsSiteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormChange = (e) => {
    setAuditForm({ ...auditForm, [e.target.name]: e.target.value });
  };

  const handleSubmitAudit = (e) => {
    e.preventDefault();
    if (!auditForm.siteName) {
      alert("Please select or enter the Name of Site.");
      return;
    }
    if (!auditForm.auditorName) {
      alert("Please select or enter the Name of Auditor.");
      return;
    }
    if (!auditForm.auditeeName) {
      alert("Please select or enter the Name of Auditee.");
      return;
    }
    if (!selectedCategory) {
      alert("Please select a Stage of Audit first.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('auditForm', JSON.stringify({ ...auditForm, category: selectedCategory }));
      navigate(`/select-subcategory?category=${encodeURIComponent(selectedCategory)}`);
    }, 800);
  };

  return (
    <div className="page-container bg-brand-gray">
      <OfflineBanner />
      <Navbar />

      <main className="px-4 pt-4 pb-24 animate-fade-in">
        {/* Greeting Banner */}
        <div className="bg-gradient-orange rounded-2xl p-5 mb-5 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          <p className="text-white/80 text-xs font-semibold mb-1">Good {getGreeting()},</p>
          <h2 className="text-white text-xl font-heading font-black mb-0.5">{user?.name || 'Welcome'}</h2>
          <p className="text-white/80 text-xs font-semibold">{today}</p>
        </div>

        {/* Page Heading */}
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-base font-heading font-black text-brand-blue tracking-tight uppercase">
            QA - Internal Audit Checklist
          </h1>
        </div>

        {/* Form Fields as Separate Cards */}
        <div className="space-y-3">
          {/* Row 1: Site Name + Date */}
          <div className="grid grid-cols-2 gap-3">
            {/* Site Name Box */}
            <div className="card p-3.5 relative site-dropdown-container flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Name Of Site</p>
              <div
                onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent flex justify-between items-center cursor-pointer py-1"
              >
                <span className={auditForm.siteName ? "text-gray-700 font-semibold" : "text-gray-300"}>
                  {auditForm.siteName || "Select site name"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSiteDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isSiteDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {SITE_NAMES.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                      onClick={() => {
                        const nextValue = auditForm.siteName === name ? '' : name;
                        setAuditForm({ ...auditForm, siteName: nextValue });
                        setIsSiteDropdownOpen(false);
                      }}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${auditForm.siteName === name ? 'border-brand-orange bg-brand-orange' : 'border-gray-300'}`}>
                        {auditForm.siteName === name && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Box */}
            <div className="card p-3.5 flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Date</p>
              <input
                type="date"
                name="date"
                value={auditForm.date}
                onChange={handleFormChange}
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent py-1"
              />
            </div>
          </div>

          {/* Row 2: Auditor Name Box */}
          <div className="card p-3.5 auditor-dropdown-container relative flex flex-col justify-center">
            <p className="text-xs font-bold text-brand-blue mb-1">Name of Auditor</p>
            <div
              onClick={() => setIsAuditorDropdownOpen(!isAuditorDropdownOpen)}
              className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent flex justify-between items-center cursor-pointer py-1"
            >
              <span className={auditForm.auditorName ? "text-gray-700 font-semibold" : "text-gray-300"}>
                {auditForm.auditorName || "Select auditor name"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAuditorDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isAuditorDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {AUDITOR_NAMES.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                    onClick={() => {
                      const nextValue = auditForm.auditorName === name ? '' : name;
                      setAuditForm({ ...auditForm, auditorName: nextValue });
                      setIsAuditorDropdownOpen(false);
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${auditForm.auditorName === name ? 'border-brand-orange bg-brand-orange' : 'border-gray-300'}`}>
                      {auditForm.auditorName === name && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 3: Auditee Name Box */}
          <div className="card p-3.5 auditee-dropdown-container relative flex flex-col justify-center">
            <p className="text-xs font-bold text-brand-blue mb-1">Name of Auditee</p>
            <div
              onClick={() => setIsAuditeeDropdownOpen(!isAuditeeDropdownOpen)}
              className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent flex justify-between items-center cursor-pointer py-1"
            >
              <span className={auditForm.auditeeName ? "text-gray-700 font-semibold" : "text-gray-300"}>
                {auditForm.auditeeName || "Select auditee name"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isAuditeeDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {isAuditeeDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                {AUDITEE_NAMES.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                    onClick={() => {
                      const nextValue = auditForm.auditeeName === name ? '' : name;
                      setAuditForm({ ...auditForm, auditeeName: nextValue });
                      setIsAuditeeDropdownOpen(false);
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${auditForm.auditeeName === name ? 'border-brand-orange bg-brand-orange' : 'border-gray-300'}`}>
                      {auditForm.auditeeName === name && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 4: Stage of Audit Box */}
          <div className="card p-3.5 flex flex-col justify-center">
            <p className="text-xs font-bold text-brand-blue mb-2.5">Stage of Audit</p>
            <div className="grid grid-cols-2 gap-2">
              {sortCategories(categories).map((cat) => (
                <label
                  key={cat._id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150
                    ${selectedCategory === cat.name
                      ? 'border-brand-orange bg-brand-orange/10 text-brand-blue font-bold'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-brand-orange/50'
                    }`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                >
                  <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                    ${selectedCategory === cat.name ? 'border-brand-orange bg-brand-orange' : 'border-gray-300'}`}>
                    {selectedCategory === cat.name && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">{getFormattedCategoryName(cat.name)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Row 5: Location + Floor */}
          <div className="grid grid-cols-2 gap-3">
            {/* Location Box */}
            <div className="card p-3.5 flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Location</p>
              <input
                type="text"
                name="location"
                value={auditForm.location}
                onChange={handleFormChange}
                placeholder="Enter location"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-350 py-1"
              />
            </div>
            {/* Floor Box */}
            <div className="card p-3.5 flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Floor No.</p>
              <input
                type="text"
                name="floor"
                value={auditForm.floor}
                onChange={handleFormChange}
                placeholder="Floor"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-355 py-1"
              />
            </div>
          </div>

          {/* Row 6: Column + Flat */}
          <div className="grid grid-cols-2 gap-3">
            {/* Column Box */}
            <div className="card p-3.5 flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Column No.</p>
              <input
                type="text"
                name="columnNo"
                value={auditForm.columnNo}
                onChange={handleFormChange}
                placeholder="Column"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-355 py-1"
              />
            </div>
            {/* Flat Box */}
            <div className="card p-3.5 flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Flat No.</p>
              <input
                type="text"
                name="flatNo"
                value={auditForm.flatNo}
                onChange={handleFormChange}
                placeholder="Flat"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-355 py-1"
              />
            </div>
          </div>

          {/* Row 7: Building + Pour */}
          <div className="grid grid-cols-2 gap-3">
            {/* Building Box */}
            <div className="card p-3.5 flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Building Name/No.</p>
              <input
                type="text"
                name="buildingName"
                value={auditForm.buildingName}
                onChange={handleFormChange}
                placeholder="Building"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-355 py-1"
              />
            </div>
            {/* Pour Box */}
            <div className="card p-3.5 flex flex-col justify-center">
              <p className="text-xs font-bold text-brand-blue mb-1">Pour</p>
              <input
                type="text"
                name="pour"
                value={auditForm.pour}
                onChange={handleFormChange}
                placeholder="Pour no."
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-355 py-1"
              />
            </div>
          </div>

          {/* Row 8: Beam No Box */}
          <div className="card p-3.5 flex flex-col justify-center">
            <p className="text-xs font-bold text-brand-blue mb-1">Beam No.</p>
            <input
              type="text"
              name="beamNo"
              value={auditForm.beamNo}
              onChange={handleFormChange}
              placeholder="Enter beam number"
              className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-355 py-1"
            />
          </div>
        </div>

        {/* Submit Button Container */}
        <div className="mt-5 mb-8">
          <Button
            variant="primary"
            className="w-full py-4 text-xs font-black tracking-widest uppercase shadow-md active:scale-95 text-white"
            onClick={handleSubmitAudit}
            loading={loading}
          >
            Submit Internal Audit
          </Button>
        </div>
      </main>
    </div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export default Home;
