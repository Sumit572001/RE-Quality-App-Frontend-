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

const STAGE_OPTIONS = ['Pre Work', 'Pour Card', 'During Work', 'After Work', 'General'];

const Home = () => {
  const { user, isAdmin } = useAuth();
  const [checklists, setChecklists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
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
    fetchChecklists();
    fetchCategories();
  }, [user]);

  const fetchChecklists = async () => {
    try {
      const res = await getChecklists();
      setChecklists(res.data.data);
    } catch (err) {
      console.error('Failed to fetch checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const cats = res.data.data;
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCategory(cats[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleFormChange = (e) => {
    setAuditForm({ ...auditForm, [e.target.name]: e.target.value });
  };

  const handleSubmitAudit = (e) => {
    e.preventDefault();
    if (!selectedCategory) {
      alert("Please select a Stage of Audit first.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Navigate to dashboard with the selected category as a filter
      navigate(`/dashboard?category=${encodeURIComponent(selectedCategory)}`);
    }, 1000);
  };

  const filteredChecklists = checklists.filter(
    (c) => c.category === selectedCategory || selectedCategory === 'All'
  );

  return (
    <div className="page-container bg-brand-gray">
      <Navbar />

      <main className="px-4 pt-4 pb-24 animate-fade-in">
        {/* Greeting Banner */}
        <div className="bg-gradient-brand rounded-2xl p-5 mb-5 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <p className="text-blue-200 text-xs font-medium mb-1">Good {getGreeting()},</p>
          <h2 className="text-white text-xl font-heading font-bold mb-0.5">{user?.name || 'Welcome'}</h2>
          <p className="text-blue-200 text-xs">{today}</p>
        </div>

        {/* Audit Checklist Form — Matching the Excel Design */}
        <div className="card mb-5 p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-700 text-white text-center py-2 px-4">
            <p className="font-semibold text-sm">QA - Internal Audit Checklist</p>
          </div>

          {/* Form Fields Grid */}
          <div className="p-0">
            {/* Row 1: Site Name + Date */}
            <div className="grid grid-cols-2 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200">
                <p className="text-xs font-semibold text-brand-orange mb-1">Name Of Site</p>
                <input
                  type="text"
                  name="siteName"
                  value={auditForm.siteName}
                  onChange={handleFormChange}
                  placeholder="Enter site name"
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-brand-orange mb-1">Date</p>
                <input
                  type="date"
                  name="date"
                  value={auditForm.date}
                  onChange={handleFormChange}
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent"
                />
              </div>
            </div>

            {/* Row 2: Auditor Name */}
            <div className="border-b border-gray-200 p-3">
              <p className="text-xs font-semibold text-brand-orange mb-1">Name of Auditor</p>
              <input
                type="text"
                name="auditorName"
                value={auditForm.auditorName}
                onChange={handleFormChange}
                placeholder="Enter auditor name"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
              />
            </div>

            {/* Row 3: Auditee Name */}
            <div className="border-b border-gray-200 p-3">
              <p className="text-xs font-semibold text-brand-orange mb-1">Name of Auditee</p>
              <input
                type="text"
                name="auditeeName"
                value={auditForm.auditeeName}
                onChange={handleFormChange}
                placeholder="Enter auditee name"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
              />
            </div>

            {/* Row 4: Stage of Audit with Category Checkboxes */}
            <div className="border-b border-gray-200 p-3">
              <p className="text-xs font-semibold text-brand-orange mb-2">Stage of Audit</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <label
                    key={cat._id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150
                      ${selectedCategory === cat.name
                        ? 'border-brand-orange bg-orange-50 text-brand-orange'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-300'
                      }`}
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 transition-all
                      ${selectedCategory === cat.name ? 'border-brand-orange bg-brand-orange' : 'border-gray-300'}`}>
                      {selectedCategory === cat.name && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-semibold">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* RCC Section Header */}
            <div className="bg-brand-blue text-white text-center py-2">
              <p className="font-bold text-sm tracking-wide">{selectedCategory}</p>
            </div>

            {/* Row 5: Location + Floor + Column + Flat */}
            <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200">
                <p className="text-xs font-semibold text-brand-orange mb-1">Location</p>
                <input
                  type="text"
                  name="location"
                  value={auditForm.location}
                  onChange={handleFormChange}
                  placeholder="Enter location"
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-brand-orange mb-1">Floor No.</p>
                <input
                  type="text"
                  name="floor"
                  value={auditForm.floor}
                  onChange={handleFormChange}
                  placeholder="Floor"
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200">
                <p className="text-xs font-semibold text-brand-orange mb-1">Column No.</p>
                <input
                  type="text"
                  name="columnNo"
                  value={auditForm.columnNo}
                  onChange={handleFormChange}
                  placeholder="Column"
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-brand-orange mb-1">Flat No.</p>
                <input
                  type="text"
                  name="flatNo"
                  value={auditForm.flatNo}
                  onChange={handleFormChange}
                  placeholder="Flat"
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
                />
              </div>
            </div>

            {/* Row 6: Building Name + Pour + Beam */}
            <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
              <div className="p-3 border-r border-gray-200">
                <p className="text-xs font-semibold text-brand-orange mb-1">Building Name/No.</p>
                <input
                  type="text"
                  name="buildingName"
                  value={auditForm.buildingName}
                  onChange={handleFormChange}
                  placeholder="Building"
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-brand-orange mb-1">Pour</p>
                <input
                  type="text"
                  name="pour"
                  value={auditForm.pour}
                  onChange={handleFormChange}
                  placeholder="Pour no."
                  className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
                />
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-brand-orange mb-1">Beam No.</p>
              <input
                type="text"
                name="beamNo"
                value={auditForm.beamNo}
                onChange={handleFormChange}
                placeholder="Enter beam number"
                className="w-full text-sm border-0 outline-none text-gray-700 bg-transparent placeholder-gray-300"
              />
            </div>
            
            <div className="p-3 bg-gray-50 border-t border-gray-100">
               <Button 
                 variant="primary" 
                 className="w-full" 
                 onClick={handleSubmitAudit}
                 loading={loading}
               >
                 Submit Internal Audit
               </Button>
            </div>
          </div>
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
