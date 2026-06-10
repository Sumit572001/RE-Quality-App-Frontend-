import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCategories } from '../api/categories';
import { getSubCategories } from '../api/subcategories';
import Navbar from '../components/Navbar';

const SelectSubCategory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, subsRes] = await Promise.all([
        getCategories(),
        getSubCategories(),
      ]);
      const cats = catsRes.data.data;
      setCategories(cats);
      setSubCategories(subsRes.data.data);

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
              <h1 className="text-xl font-heading font-bold text-brand-blue">Sub-Category</h1>
              {!loading && (
                <span className="badge-orange text-[10px] font-bold">
                  {filteredSubCategories.length} available
                </span>
              )}
            </div>
            {selectedCategory && (
              <p className="text-xs text-gray-500 mt-0.5">Stage of Audit: <span className="font-bold text-brand-orange">{selectedCategory.name}</span></p>
            )}
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
                      onClick={() => navigate(`/dashboard?category=${encodeURIComponent(selectedCategory.name)}&subCategory=${encodeURIComponent(sub.name)}`)}
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-brand-orange hover:shadow-sm cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-brand-orange group-hover:bg-brand-orange group-hover:text-white transition-colors duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-bold text-gray-700 leading-tight group-hover:text-brand-orange transition-colors">
                          {sub.name}
                        </span>
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-300 group-hover:text-brand-orange transition-colors"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SelectSubCategory;
