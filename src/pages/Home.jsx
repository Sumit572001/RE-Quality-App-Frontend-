import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChecklists } from '../api/checklists';
import Navbar from '../components/Navbar';

const STAGE_OPTIONS = ['Pre Work', 'Pour Card', 'During Work', 'After Work', 'General'];
const CATEGORY_OPTIONS = ['RCC', 'Paint NOC', 'RCC + Finishes', 'Checklist A', 'General'];

const Home = () => {
  const { user, isAdmin } = useAuth();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('RCC');
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

  useEffect(() => {
    fetchChecklists();
  }, []);

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

  const handleFormChange = (e) => {
    setAuditForm({ ...auditForm, [e.target.name]: e.target.value });
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
          <div className="mt-3 flex gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex-1 text-center border border-white/20">
              <p className="text-white text-lg font-bold font-heading">{checklists.length}</p>
              <p className="text-blue-200 text-xs">Checklists</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex-1 text-center border border-white/20">
              <p className="text-white text-lg font-bold font-heading">{CATEGORY_OPTIONS.length}</p>
              <p className="text-blue-200 text-xs">Categories</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex-1 text-center border border-white/20">
              <p className={`text-lg font-bold font-heading ${isAdmin ? 'text-yellow-300' : 'text-green-300'}`}>
                {isAdmin ? 'Admin' : 'User'}
              </p>
              <p className="text-blue-200 text-xs">Role</p>
            </div>
          </div>
        </div>

        {/* Audit Checklist Form — Matching the Excel Design */}
        <div className="card mb-5 p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-brand-blue text-white text-center py-3 px-4">
            <h2 className="font-heading font-bold text-base tracking-wide">NYATI BUILDERS PVT. LTD</h2>
          </div>
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
                {['RCC', 'Paint NOC', 'RCC + Finishes', 'Checklist A'].map((cat) => (
                  <label
                    key={cat}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150
                      ${selectedCategory === cat
                        ? 'border-brand-orange bg-orange-50 text-brand-orange'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-300'
                      }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 transition-all
                      ${selectedCategory === cat ? 'border-brand-orange bg-brand-orange' : 'border-gray-300'}`}>
                      {selectedCategory === cat && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-semibold">{cat}</span>
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
          </div>
        </div>

        {/* Active Checklists for Selected Category */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">
              {selectedCategory} Checklists
            </h3>
            <span className="badge-orange">{filteredChecklists.length}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="spinner border-brand-orange w-8 h-8"></div>
            </div>
          ) : filteredChecklists.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-500 text-sm font-medium">No checklists for {selectedCategory}</p>
              {isAdmin && (
                <Link to="/admin" className="btn-outline mt-3 text-sm py-2 inline-flex">
                  + Add Checklist
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChecklists.map((cl) => (
                <ChecklistCard key={cl._id} checklist={cl} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h3 className="section-title mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/dashboard" className="card-hover flex flex-col items-center py-5 gap-2 text-center">
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">View All</p>
              <p className="text-xs text-gray-400">Checklists</p>
            </Link>
            {isAdmin ? (
              <Link to="/admin" className="card-hover flex flex-col items-center py-5 gap-2 text-center">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">Admin Panel</p>
                <p className="text-xs text-gray-400">Manage Lists</p>
              </Link>
            ) : (
              <div className="card flex flex-col items-center py-5 gap-2 text-center">
                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">{user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const ChecklistCard = ({ checklist }) => (
  <div className="card-hover animate-fade-in">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="badge-orange text-xs">{checklist.category}</span>
          {checklist.stage !== 'General' && (
            <span className="badge-blue text-xs">{checklist.stage}</span>
          )}
        </div>
        <h4 className="font-semibold text-gray-800 text-sm font-heading truncate">{checklist.title}</h4>
        {checklist.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{checklist.description}</p>
        )}
        <p className="text-xs text-gray-400 mt-1.5">{checklist.items?.length || 0} checkpoint{checklist.items?.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7l2 2 4-4" />
        </svg>
      </div>
    </div>
  </div>
);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export default Home;
