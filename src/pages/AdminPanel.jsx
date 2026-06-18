import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getChecklists, createChecklist, updateChecklist, deleteChecklist
} from '../api/checklists';
import {
  getCategories, createCategory, updateCategory, deleteCategory
} from '../api/categories';
import {
  getSubCategories, createSubCategory, updateSubCategory, deleteSubCategory
} from '../api/subcategories';
import Toast from '../components/ui/Toast';
import { getFormattedCategoryName, sortCategories } from '../utils/categoryHelper';

const TABS = [
  { id: 'checklist', label: 'CHECKLIST', icon: '📋' },
  { id: 'category', label: 'CATEGORY', icon: '🏷️' },
  { id: 'subcategory', label: 'SUB-CATEGORY', icon: '📁' },
];

const AdminPanel = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('checklist');
  const [checklists, setChecklists] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form States
  const [checklistForm, setChecklistForm] = useState({ category: '', subCategory: '', question: '', mark: '' });
  const [categoryName, setCategoryName] = useState('');
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', category: '' });

  // Inline Editing States
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [editingSubCategoryId, setEditingSubCategoryId] = useState(null);
  const [editSubCategoryName, setEditSubCategoryName] = useState('');
  const [editSubCategoryParent, setEditSubCategoryParent] = useState('');

  // Checklist Point Editing States
  const [editingChecklistId, setEditingChecklistId] = useState(null);
  const [editChecklistCategory, setEditChecklistCategory] = useState('');
  const [editChecklistSubCategory, setEditChecklistSubCategory] = useState('');
  const [editChecklistQuestion, setEditChecklistQuestion] = useState('');
  const [editChecklistMark, setEditChecklistMark] = useState('');
  const [editChecklistFilteredSubs, setEditChecklistFilteredSubs] = useState([]);

  useEffect(() => {
    if (activeTab === 'checklist') {
      fetchChecklists();
      fetchCategories();
      fetchSubCategories();
    } else if (activeTab === 'category') {
      fetchCategories();
    } else if (activeTab === 'subcategory') {
      fetchCategories();
      fetchSubCategories();
    }
  }, [activeTab]);

  const fetchChecklists = async () => {
    try {
      const res = await getChecklists();
      setChecklists(res.data.data);
    } catch (err) {
      showToast('Failed to load checklists', 'error');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data.data);
    } catch (err) {
      showToast('Failed to load categories', 'error');
    }
  };

  const fetchSubCategories = async () => {
    try {
      const res = await getSubCategories();
      setSubCategories(res.data.data);
    } catch (err) {
      showToast('Failed to load sub-categories', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Checklist Actions ---
  const handleDeleteChecklist = async (id) => {
    try {
      await deleteChecklist(id);
      setChecklists(checklists.filter(c => c._id !== id));
      showToast('Deleted successfully');
    } catch (err) {
      showToast('Error deleting checklist', 'error');
    }
  };

  const handleCategoryChange = (catName) => {
    setChecklistForm(prev => ({ ...prev, category: catName, subCategory: '' }));
    const categoryObj = categories.find(c => c.name === catName);
    if (categoryObj) {
      const filtered = subCategories.filter(
        sub => (sub.category?._id === categoryObj._id || sub.category === categoryObj._id)
      );
      setFilteredSubCategories(filtered);
    } else {
      setFilteredSubCategories([]);
    }
  };

  const handleAddChecklistPoint = async (e) => {
    e.preventDefault();
    const { category, subCategory, question, mark } = checklistForm;

    if (!category) {
      showToast('Please select a category', 'error');
      return;
    }
    if (!subCategory) {
      showToast('Please select a sub-category', 'error');
      return;
    }
    if (!question.trim()) {
      showToast('Please enter an inspection question', 'error');
      return;
    }

    setLoading(true);
    try {
      const markVal = Number(mark);
      const newItem = {
        label: question.trim(),
        required: true,
        mark: isNaN(markVal) ? 0 : markVal
      };

      await createChecklist({
        title: question.trim(),
        category,
        subCategory,
        stage: 'General',
        items: [newItem]
      });

      showToast('Checklist point added successfully');
      setChecklistForm(prev => ({ ...prev, question: '', mark: '' })); // keep category/subcategory selected
      fetchChecklists();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add checklist point', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditChecklist = (c) => {
    setEditingChecklistId(c._id);
    setEditChecklistCategory(c.category);
    setEditChecklistSubCategory(c.subCategory || '');
    setEditChecklistQuestion(c.title);
    setEditChecklistMark(c.items && c.items[0] ? c.items[0].mark : '');

    const categoryObj = categories.find(cat => cat.name === c.category);
    if (categoryObj) {
      const filtered = subCategories.filter(
        sub => (sub.category?._id === categoryObj._id || sub.category === categoryObj._id)
      );
      setEditChecklistFilteredSubs(filtered);
    } else {
      setEditChecklistFilteredSubs([]);
    }
  };

  const handleEditChecklistCategoryChange = (catName) => {
    setEditChecklistCategory(catName);
    setEditChecklistSubCategory('');
    const categoryObj = categories.find(c => c.name === catName);
    if (categoryObj) {
      const filtered = subCategories.filter(
        sub => (sub.category?._id === categoryObj._id || sub.category === categoryObj._id)
      );
      setEditChecklistFilteredSubs(filtered);
    } else {
      setEditChecklistFilteredSubs([]);
    }
  };

  const handleSaveChecklist = async (id) => {
    if (!editChecklistCategory) {
      showToast('Please select a category', 'error');
      return;
    }
    if (!editChecklistSubCategory) {
      showToast('Please select a sub-category', 'error');
      return;
    }
    if (!editChecklistQuestion.trim()) {
      showToast('Please enter an inspection question', 'error');
      return;
    }

    setLoading(true);
    try {
      const markVal = Number(editChecklistMark);
      const updatedItem = {
        label: editChecklistQuestion.trim(),
        required: true,
        mark: isNaN(markVal) ? 0 : markVal
      };

      await updateChecklist(id, {
        title: editChecklistQuestion.trim(),
        category: editChecklistCategory,
        subCategory: editChecklistSubCategory,
        stage: 'General',
        items: [updatedItem]
      });

      showToast('Checklist updated successfully');
      setEditingChecklistId(null);
      fetchChecklists();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update checklist', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Category Actions ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }
    setLoading(true);
    try {
      await createCategory({ name: categoryName.trim() });
      showToast('Category created successfully');
      setCategoryName('');
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditCategory = (cat) => {
    setEditingCategoryId(cat._id);
    setEditCategoryName(cat.name);
  };

  const handleSaveCategory = async (id) => {
    if (!editCategoryName.trim()) {
      showToast('Category name cannot be empty', 'error');
      return;
    }
    try {
      await updateCategory(id, { name: editCategoryName.trim() });
      showToast('Category updated successfully');
      setEditingCategoryId(null);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update category', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      showToast('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  // --- Sub-Category Actions ---
  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    const { name, category } = subcategoryForm;

    if (!category) {
      showToast('Please select a parent category', 'error');
      return;
    }
    if (!name.trim()) {
      showToast('Please enter sub-category name', 'error');
      return;
    }

    setLoading(true);
    try {
      await createSubCategory({ name: name.trim(), category });
      showToast('Sub-category created successfully');
      setSubcategoryForm({ name: '', category: category }); // keep category selected
      fetchSubCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create sub-category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEditSubCategory = (sub) => {
    setEditingSubCategoryId(sub._id);
    setEditSubCategoryName(sub.name);
    setEditSubCategoryParent(sub.category?._id || sub.category || '');
  };

  const handleSaveSubCategory = async (id) => {
    if (!editSubCategoryName.trim()) {
      showToast('Sub-category name cannot be empty', 'error');
      return;
    }
    if (!editSubCategoryParent) {
      showToast('Please select a parent category', 'error');
      return;
    }
    try {
      await updateSubCategory(id, { name: editSubCategoryName.trim(), category: editSubCategoryParent });
      showToast('Sub-category updated successfully');
      setEditingSubCategoryId(null);
      fetchSubCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update sub-category', 'error');
    }
  };

  const handleDeleteSubCategory = async (id) => {
    try {
      await deleteSubCategory(id);
      showToast('Sub-category deleted successfully');
      fetchSubCategories();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete sub-category', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] pb-12">
      {/* 1. TOP HEADER */}
      <header className="bg-[#004282] px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-white rotate-45" />
          </div>
          <h1 className="text-white font-black text-lg tracking-tighter">NYATI ADMIN</h1>
        </div>
        <button
          onClick={handleLogout}
          className="bg-[#FF4D4D] text-white text-[10px] font-bold px-4 py-1.5 rounded uppercase hover:bg-red-600 transition-colors"
        >
          LOGOUT
        </button>
      </header>

      {/* 2. SUB NAVIGATION */}
      <nav className="bg-white shadow-sm border-b border-gray-200 overflow-x-auto no-scrollbar">
        <div className="flex min-w-max px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-bold transition-all border-b-4 ${activeTab === tab.id
                ? 'border-[#004282] text-[#004282]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              <span className="text-sm opacity-70">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. MAIN CONTENT */}
      <main className="max-w-3xl mx-auto px-5 py-8 animate-fade-in">

        {/* TAB: CHECKLIST */}
        {activeTab === 'checklist' && (
          <div className="space-y-8">
            {/* Add Form */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-5 bg-[#E8690A] rounded-full" />
                <h2 className="text-[#004282] font-black text-sm uppercase tracking-tight">ADD NEW CHECKLIST</h2>
              </div>

              <form onSubmit={handleAddChecklistPoint} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">SELECT CATEGORY</label>
                  <select
                    value={checklistForm.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Select Category --</option>
                    {sortCategories(categories).map((cat) => (
                      <option key={cat._id} value={cat.name}>{getFormattedCategoryName(cat.name)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">SELECT SUB-CATEGORY</label>
                  <select
                    value={checklistForm.subCategory}
                    onChange={(e) => setChecklistForm({ ...checklistForm, subCategory: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Select Sub-Category --</option>
                    {filteredSubCategories.map((sub) => (
                      <option key={sub._id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">INSPECTION QUESTION</label>
                  <input
                    type="text"
                    value={checklistForm.question}
                    onChange={(e) => setChecklistForm({ ...checklistForm, question: e.target.value })}
                    placeholder="Check Plumb / Reinforcement..."
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:italic"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">MARK</label>
                  <input
                    type="number"
                    value={checklistForm.mark}
                    onChange={(e) => setChecklistForm({ ...checklistForm, mark: e.target.value })}
                    placeholder="Enter mark (e.g. 5)..."
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:italic"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#004282] text-white font-black text-xs py-4 rounded-xl shadow-md hover:bg-blue-900 transition-all uppercase tracking-widest mt-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'ADDING...' : 'ADD CHECKLIST POINT'}
                </button>
              </form>
            </section>

            {/* List Section */}
            <section className="bg-white rounded-2xl p-0 shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <h2 className="text-[#004282] font-bold text-sm uppercase">CURRENT CHECKLISTS</h2>
                <div className="bg-[#EBF5FF] text-[#004282] text-[10px] font-black px-3 py-1.5 rounded-full border border-blue-100">
                  Total: {checklists.length || '0'}
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                {checklists.map((c, i) => (
                  <div key={c._id || i} className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between group shadow-sm">
                    {editingChecklistId === c._id ? (
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Category</label>
                            <select
                              value={editChecklistCategory}
                              onChange={(e) => handleEditChecklistCategoryChange(e.target.value)}
                              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-100"
                            >
                              {sortCategories(categories).map(cat => (
                                <option key={cat._id} value={cat.name}>{getFormattedCategoryName(cat.name)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Sub-Category</label>
                            <select
                              value={editChecklistSubCategory}
                              onChange={(e) => setEditChecklistSubCategory(e.target.value)}
                              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-100"
                            >
                              <option value="">-- Select Sub-Category --</option>
                              {editChecklistFilteredSubs.map(sub => (
                                <option key={sub._id} value={sub.name}>{sub.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Inspection Question</label>
                            <input
                              type="text"
                              value={editChecklistQuestion}
                              onChange={(e) => setEditChecklistQuestion(e.target.value)}
                              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-100"
                            />
                          </div>
                          <div className="w-full sm:w-20">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-tighter block mb-1">Mark</label>
                            <input
                              type="number"
                              value={editChecklistMark}
                              onChange={(e) => setEditChecklistMark(e.target.value)}
                              className="w-full bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-1">
                          <button onClick={() => handleSaveChecklist(c._id)} className="bg-[#4B5694] hover:bg-[#353E73] text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Save</button>
                          <button onClick={() => setEditingChecklistId(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-[#E8690A] uppercase tracking-tighter">{getFormattedCategoryName(c.category)}</span>
                            {c.subCategory && (
                              <span className="text-[9px] font-black text-[#0051FF] uppercase tracking-tighter">{c.subCategory}</span>
                            )}
                            {c.items && c.items[0] && c.items[0].mark !== undefined && (
                              <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                Mark: {c.items[0].mark}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm font-medium leading-tight">{c.title}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditChecklist(c)}
                            className="text-blue-500 hover:text-blue-700 text-[10px] font-black px-3 py-1.5 uppercase transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChecklist(c._id)}
                            className="text-red-300 hover:text-red-500 transition-colors p-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1-1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB: CATEGORY */}
        {activeTab === 'category' && (
          <div className="space-y-8 animate-fade-in">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-5 bg-[#E8690A] rounded-full" />
                <h2 className="text-[#004282] font-black text-sm uppercase tracking-tight">ADD NEW CATEGORY</h2>
              </div>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">CATEGORY NAME</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:italic"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#004282] text-white font-black text-xs py-4 rounded-xl shadow-md uppercase tracking-widest mt-2 disabled:opacity-50"
                >
                  {loading ? 'ADDING...' : 'ADD CATEGORY'}
                </button>
              </form>
            </section>

            <section className="bg-white rounded-2xl p-0 shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b">
                <h2 className="text-[#004282] font-bold text-sm uppercase">CURRENT CATEGORIES</h2>
                <div className="bg-[#EBF5FF] text-[#004282] text-[10px] font-black px-3 py-1.5 rounded-full">
                  Total: {categories.length}
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto bg-[#F8FAFC]">
                {sortCategories(categories).map((cat) => (
                  <div key={cat._id} className="bg-white border border-gray-100 p-5 rounded-xl flex items-center justify-between group shadow-sm">
                    {editingCategoryId === cat._id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1"
                        />
                        <button onClick={() => handleSaveCategory(cat._id)} className="bg-[#4B5694] hover:bg-[#353E73] text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Save</button>
                        <button onClick={() => setEditingCategoryId(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-800 font-bold text-sm">{cat.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditCategory(cat)}
                            className="text-blue-500 hover:text-blue-700 text-[10px] font-black px-3 py-1.5 uppercase transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat._id)}
                            className="text-red-300 hover:text-red-500 transition-colors p-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1-1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB: SUB-CATEGORY */}
        {activeTab === 'subcategory' && (
          <div className="space-y-8 animate-fade-in">
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-5 bg-[#E8690A] rounded-full" />
                <h2 className="text-[#004282] font-black text-sm uppercase tracking-tight">ADD NEW SUB-CATEGORY</h2>
              </div>
              <form onSubmit={handleAddSubCategory} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">SELECT PARENT CATEGORY</label>
                  <select
                    value={subcategoryForm.category}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category: e.target.value })}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">-- Select Category --</option>
                    {sortCategories(categories).map((cat) => (
                      <option key={cat._id} value={cat._id}>{getFormattedCategoryName(cat.name)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">SUB-CATEGORY NAME</label>
                  <input
                    type="text"
                    value={subcategoryForm.name}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                    placeholder="Enter sub-category name..."
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:italic"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#004282] text-white font-black text-xs py-4 rounded-xl shadow-md uppercase tracking-widest mt-2 disabled:opacity-50"
                >
                  {loading ? 'ADDING...' : 'ADD SUB-CATEGORY'}
                </button>
              </form>
            </section>

            <section className="bg-white rounded-2xl p-0 shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b">
                <h2 className="text-[#004282] font-bold text-sm uppercase">CURRENT SUB-CATEGORIES</h2>
                <div className="bg-[#EBF5FF] text-[#004282] text-[10px] font-black px-3 py-1.5 rounded-full">
                  Total: {subCategories.length}
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto bg-[#F8FAFC]">
                {subCategories.map((sub) => (
                  <div key={sub._id} className="bg-white border border-gray-100 p-5 rounded-xl flex items-center justify-between group shadow-sm">
                    {editingSubCategoryId === sub._id ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <select
                          value={editSubCategoryParent}
                          onChange={(e) => setEditSubCategoryParent(e.target.value)}
                          className="bg-[#f8fafc] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="">-- Parent Category --</option>
                          {sortCategories(categories).map(c => (
                            <option key={c._id} value={c._id}>{getFormattedCategoryName(c.name)}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={editSubCategoryName}
                          onChange={(e) => setEditSubCategoryName(e.target.value)}
                          className="bg-[#f8fafc] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none flex-1"
                        />
                        <div className="flex gap-1">
                          <button onClick={() => handleSaveSubCategory(sub._id)} className="bg-[#4B5694] hover:bg-[#353E73] text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Save</button>
                          <button onClick={() => setEditingSubCategoryId(null)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-all">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-gray-800 font-bold text-sm">{sub.name}</span>
                          <p className="text-[9px] text-[#E8690A] font-black uppercase tracking-tighter mt-0.5">
                            Category: {getFormattedCategoryName(sub.category?.name) || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditSubCategory(sub)}
                            className="text-blue-500 hover:text-blue-700 text-[10px] font-black px-3 py-1.5 uppercase transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSubCategory(sub._id)}
                            className="text-red-300 hover:text-red-500 transition-colors p-2"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1-1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

      </main>

      {/* TOAST NOTIFICATION */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminPanel;
