import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  getChecklists, createChecklist, deleteChecklist
} from '../api/checklists';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';

const TABS = [
  { id: 'checklist', label: 'CHECKLIST', icon: '📋' },
  { id: 'category', label: 'CATEGORY', icon: '🏷️' },
  { id: 'building', label: 'BUILDING', icon: '🏢' },
  { id: 'floor', label: 'FLOOR', icon: '📈' },
  { id: 'unit', label: 'UNIT/AREA', icon: '🏠' },
  { id: 'pour', label: 'POUR CARD', icon: '📜' },
];

const AdminPanel = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('checklist');
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form States
  const [checklistForm, setChecklistForm] = useState({ category: '', subCategory: '', question: '' });
  const [categoryName, setCategoryName] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [floorName, setFloorName] = useState('');
  const [unitName, setUnitName] = useState('');

  useEffect(() => {
    if (activeTab === 'checklist') fetchChecklists();
  }, [activeTab]);

  const fetchChecklists = async () => {
    try {
      const res = await getChecklists();
      setChecklists(res.data.data);
    } catch (err) {
      showToast('Failed to load checklists', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteChecklist = async (id) => {
    try {
      await deleteChecklist(id);
      setChecklists(checklists.filter(c => c._id !== id));
      showToast('Deleted successfully');
    } catch (err) {
      showToast('Error deleting', 'error');
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
              className={`flex items-center gap-2 px-6 py-4 text-[10px] font-bold transition-all border-b-4 ${
                activeTab === tab.id 
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
              
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">SELECT CATEGORY</label>
                  <select className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <option>AAC BLOCK WORKS</option>
                    <option>RCC COLUMN</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">SUB-CATEGORY (PHASE/STAGE - OPTIONAL)</label>
                  <select className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 italic text-gray-500">
                    <option>-- No Sub-Category --</option>
                    <option>PRE WORK</option>
                    <option>POUR CARD</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">INSPECTION QUESTION</label>
                  <input 
                    type="text" 
                    placeholder="Check Plumb / Reinforcement..." 
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:italic"
                  />
                </div>

                <button className="w-full bg-[#004282] text-white font-black text-xs py-4 rounded-xl shadow-md hover:bg-blue-900 transition-all uppercase tracking-widest mt-2 active:scale-95">
                  ADD CHECKLIST POINT
                </button>
              </div>
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
                  <div key={i} className="bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between group shadow-sm">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-[#E8690A] uppercase tracking-tighter">{c.category}</span>
                        <span className="text-[9px] font-black italic text-[#0051FF] uppercase">{c.stage}</span>
                      </div>
                      <p className="text-gray-700 text-sm font-medium leading-tight">{c.title}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteChecklist(c._id)}
                      className="text-red-300 hover:text-red-500 transition-colors p-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
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
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 px-1">CATEGORY NAME</label>
                <input 
                  type="text" 
                  placeholder="Enter category name..." 
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:italic"
                />
                <button className="w-full bg-[#004282] text-white font-black text-xs py-4 rounded-xl shadow-md uppercase tracking-widest mt-2">
                  ADD CATEGORY
                </button>
              </div>
            </section>
            
            <section className="bg-white rounded-2xl p-0 shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex items-center justify-between border-b">
                <h2 className="text-[#004282] font-bold text-sm uppercase">CURRENT CATEGORYS</h2>
                <div className="bg-[#EBF5FF] text-[#004282] text-[10px] font-black px-3 py-1.5 rounded-full">Total: 31</div>
              </div>
              <div className="p-4 space-y-2">
                {['AAC BLOCK WORKS', 'ALUMINIUM DOORS AND WINDOWS', 'ANTITERMITE'].map((cat, i) => (
                   <div key={i} className="bg-white border border-gray-100 p-5 rounded-xl flex items-center justify-between group">
                    <span className="text-gray-800 font-bold text-sm">{cat}</span>
                    <button className="text-red-300 hover:text-red-500"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                   </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* OTHER TABS SIMILARLY STRUCTURED... (Building, Floor, Unit) */}
        {(['building', 'floor', 'unit'].includes(activeTab)) && (
          <div className="card text-center py-20 bg-white rounded-2xl">
            <h3 className="text-lg font-bold text-gray-800">Section: {activeTab.toUpperCase()}</h3>
            <p className="text-gray-400 text-sm italic mt-2">This section follows the same UI as Categories/Checklists.</p>
            <button 
              onClick={() => setActiveTab('checklist')}
              className="btn-outline mt-6 mx-auto text-xs"
            >
              Back to Checklist Management
            </button>
          </div>
        )}

      </main>

      {/* TOAST NOTIFICATION */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminPanel;
