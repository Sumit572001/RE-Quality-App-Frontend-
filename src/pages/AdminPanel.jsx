import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getChecklists,
  createChecklist,
  updateChecklist,
  deleteChecklist,
} from '../api/checklists';
import Navbar from '../components/Navbar';

const CATEGORIES = ['RCC', 'Paint NOC', 'RCC + Finishes', 'Checklist A', 'General'];
const STAGES = ['Pre Work', 'Pour Card', 'During Work', 'After Work', 'General'];

const emptyForm = {
  title: '',
  description: '',
  category: 'RCC',
  stage: 'General',
  items: [],
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newItem, setNewItem] = useState({ label: '', required: false });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const res = await getChecklists();
      setChecklists(res.data.data);
    } catch (err) {
      showToast('Failed to load checklists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNewItem({ label: '', required: false });
    setShowModal(true);
  };

  const openEditModal = (checklist) => {
    setEditingId(checklist._id);
    setForm({
      title: checklist.title,
      description: checklist.description || '',
      category: checklist.category,
      stage: checklist.stage,
      items: checklist.items || [],
    });
    setNewItem({ label: '', required: false });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addItem = () => {
    if (!newItem.label.trim()) return;
    setForm({ ...form, items: [...form.items, { ...newItem }] });
    setNewItem({ label: '', required: false });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const toggleItemRequired = (idx) => {
    const updated = form.items.map((item, i) =>
      i === idx ? { ...item, required: !item.required } : item
    );
    setForm({ ...form, items: updated });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateChecklist(editingId, form);
        showToast('Checklist updated successfully!');
      } else {
        await createChecklist(form);
        showToast('Checklist created successfully!');
      }
      closeModal();
      fetchChecklists();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save checklist', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteChecklist(id);
      showToast('Checklist deleted');
      setChecklists((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      showToast('Failed to delete checklist', 'error');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="page-container bg-brand-gray">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`${toast.type === 'error' ? 'toast-error' : 'toast-success'} animate-slide-up`}>
          {toast.type === 'error' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      <main className="px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-heading font-bold text-brand-blue">Admin Panel</h1>
            <p className="text-sm text-gray-500">Manage checklists</p>
          </div>
          <button
            id="add-checklist-btn"
            onClick={openAddModal}
            className="btn-primary py-2.5 px-4 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Checklist
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="card text-center py-3">
            <p className="text-2xl font-heading font-bold text-brand-orange">{checklists.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-heading font-bold text-brand-blue">
              {checklists.reduce((s, c) => s + (c.items?.length || 0), 0)}
            </p>
            <p className="text-xs text-gray-500">Items</p>
          </div>
          <div className="card text-center py-3">
            <p className="text-2xl font-heading font-bold text-green-500">
              {[...new Set(checklists.map((c) => c.category))].length}
            </p>
            <p className="text-xs text-gray-500">Categories</p>
          </div>
        </div>

        {/* Checklists List */}
        {loading ? (
          <div className="flex flex-col items-center py-12">
            <div className="spinner border-brand-orange w-10 h-10 mb-3"></div>
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : checklists.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-semibold text-gray-600 mb-1">No checklists yet</p>
            <p className="text-sm text-gray-400 mb-4">Create your first checklist to get started</p>
            <button onClick={openAddModal} className="btn-primary text-sm py-2.5 mx-auto">
              + Add First Checklist
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {checklists.map((checklist) => (
              <div key={checklist._id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-gray-800 text-sm truncate">{checklist.title}</h3>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <span className="badge-orange">{checklist.category}</span>
                      {checklist.stage !== 'General' && <span className="badge-blue">{checklist.stage}</span>}
                    </div>
                    {checklist.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{checklist.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {checklist.items?.length || 0} items • By {checklist.createdBy?.name || 'Admin'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    id={`edit-btn-${checklist._id}`}
                    onClick={() => openEditModal(checklist)}
                    className="btn-outline flex-1 text-xs py-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    id={`delete-btn-${checklist._id}`}
                    onClick={() => setConfirmDeleteId(checklist._id)}
                    disabled={deletingId === checklist._id}
                    className="btn-danger flex-1 text-xs py-2"
                  >
                    {deletingId === checklist._id ? (
                      <span className="spinner border-white w-3.5 h-3.5"></span>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-heading font-bold text-gray-800">Delete Checklist?</h3>
              <p className="text-sm text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-outline flex-1">Cancel</button>
              <button
                id="confirm-delete-btn"
                onClick={() => handleDelete(confirmDeleteId)}
                className="btn-danger flex-1"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            {/* Modal Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-heading font-bold text-brand-blue">
                {editingId ? 'Edit Checklist' : 'Add Checklist'}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title */}
              <div>
                <label className="input-label" htmlFor="modal-title">Title *</label>
                <input
                  id="modal-title"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g., RCC Column Checklist"
                  className="input-field"
                />
              </div>

              {/* Description */}
              <div>
                <label className="input-label" htmlFor="modal-description">Description</label>
                <textarea
                  id="modal-description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Brief description..."
                  rows={2}
                  className="input-field resize-none"
                />
              </div>

              {/* Category + Stage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label" htmlFor="modal-category">Category</label>
                  <select
                    id="modal-category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label" htmlFor="modal-stage">Stage</label>
                  <select
                    id="modal-stage"
                    name="stage"
                    value={form.stage}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <label className="input-label">Checklist Items ({form.items.length})</label>
                <div className="space-y-2 mb-2 max-h-40 overflow-y-auto no-scrollbar">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                      <button
                        type="button"
                        onClick={() => toggleItemRequired(idx)}
                        className={`w-4 h-4 rounded flex-shrink-0 border-2 transition-all
                          ${item.required ? 'border-red-400 bg-red-400' : 'border-gray-300'}`}
                        title={item.required ? 'Required' : 'Optional'}
                      />
                      <span className="flex-1 text-sm text-gray-700 truncate">{item.label}</span>
                      {item.required && <span className="badge-red text-xs">Req</span>}
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new-item-input"
                    value={newItem.label}
                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                    placeholder="Add a checkpoint..."
                    className="input-field flex-1 py-2 text-sm"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={newItem.required}
                      onChange={(e) => setNewItem({ ...newItem, required: e.target.checked })}
                      className="rounded"
                    />
                    Req
                  </label>
                  <button
                    type="button"
                    id="add-item-btn"
                    onClick={addItem}
                    className="w-10 h-10 bg-brand-orange text-white rounded-xl flex items-center justify-center hover:bg-brand-orangeDark transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                id="save-checklist-btn"
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? (
                  <><span className="spinner border-white w-4 h-4"></span> Saving...</>
                ) : (
                  <>{editingId ? 'Update Checklist' : 'Create Checklist'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
