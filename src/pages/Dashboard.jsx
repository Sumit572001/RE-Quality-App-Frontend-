import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getChecklists } from '../api/checklists';
import Navbar from '../components/Navbar';

const CATEGORIES = ['All', 'RCC', 'Paint NOC', 'RCC + Finishes', 'Checklist A', 'General'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSubCategory, setActiveSubCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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
    const matchSearch =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSub && matchSearch;
  });

  return (
    <div className="page-container bg-brand-gray pb-10">
      <main className="px-4 pt-8 pb-24">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/select-subcategory')}
            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-brand-blue hover:bg-gray-50 transition-colors"
            title="Go Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-blue">Audit Checkpoints</h1>
            <p className="text-sm text-gray-500">Executing Audit for: <span className="font-bold text-brand-orange">{activeCategory} - {activeSubCategory}</span></p>
          </div>
        </div>

        {/* Checklist Cards */}
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
              {searchQuery ? 'Try a different search term' : `No checklists in ${activeCategory} - ${activeSubCategory}`}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {filtered.map((checklist) => (
              <ChecklistCard
                key={checklist._id}
                checklist={checklist}
                isExpanded={expandedId === checklist._id}
                onToggle={() => setExpandedId(expandedId === checklist._id ? null : checklist._id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const ChecklistCard = ({ checklist, isExpanded, onToggle }) => {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItem = (idx) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = checklist.items?.length || 0;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className={`card transition-all duration-300 ${isExpanded ? 'ring-2 ring-brand-orange/30' : ''}`}>
      {/* Card Header */}
      <button className="w-full text-left" onClick={onToggle} id={`checklist-${checklist._id}`}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-gradient-orange rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading font-bold text-gray-800 text-sm leading-tight">{checklist.title}</h3>
              <svg
                className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="badge-orange">{checklist.category}</span>
              {checklist.stage !== 'General' && <span className="badge-blue">{checklist.stage}</span>}
            </div>
            {checklist.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{checklist.description}</p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">{completedCount}/{totalItems} items</span>
              <span className="text-xs font-semibold text-brand-orange">{progressPercent}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-orange rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </button>

      {/* Expanded Checklist Items */}
      {isExpanded && checklist.items?.length > 0 && (
        <div className="mt-4 space-y-2 animate-fade-in">
          <div className="divider" />
          {checklist.items.map((item, idx) => (
            <div
              key={idx}
              className={`checklist-item-row cursor-pointer ${checkedItems[idx] ? 'bg-green-50 border-green-200' : ''}`}
              onClick={() => toggleItem(idx)}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                ${checkedItems[idx] ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                {checkedItems[idx] && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm flex-1 transition-all ${checkedItems[idx] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item.label}
                {item.mark !== undefined && item.mark !== null && (
                  <span className="ml-2 text-xs font-semibold text-brand-orange bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                    Mark: {item.mark}
                  </span>
                )}
              </span>
              {item.required && (
                <span className="badge-red text-xs flex-shrink-0">Required</span>
              )}
            </div>
          ))}
        </div>
      )}

      {isExpanded && (!checklist.items || checklist.items.length === 0) && (
        <div className="mt-3 text-center py-4 animate-fade-in">
          <p className="text-sm text-gray-400">No items in this checklist</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
