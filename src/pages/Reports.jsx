import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getAuditSubmissions } from '../api/auditSubmissions';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { getPendingAudits } from '../utils/offlineDB';
import OfflineBanner from '../components/OfflineBanner';

const Reports = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(true);
  const [allAudits, setAllAudits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract base api url dynamically (removing the '/api' suffix)
  const apiBaseUrl = (() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return `http://${hostname}:5000`;
      }
    }
    return (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');
  })();

  useEffect(() => {
    fetchReports();
  }, [isOnline]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch online checklist reports if online
      let onlineStandards = [];
      
      if (isOnline) {
        try {
          const standardRes = await getAuditSubmissions();
          onlineStandards = standardRes.data.data || [];
        } catch (e) {
          console.error('Error fetching online standard audits:', e);
        }
      }

      // Fetch pending offline checklist reports to display
      let offlineAudits = [];
      try {
        const pending = await getPendingAudits();
        if (pending) {
          // Keep only standard checklist audits (type !== 'document-audit')
          offlineAudits = pending.filter(a => !a.type || a.type !== 'document-audit');
        }
      } catch (e) {
        console.error('Error fetching offline pending audits:', e);
      }

      // Combine online and offline submissions, sorting by date (newest first)
      const combined = [...offlineAudits, ...onlineStandards].sort(
        (a, b) => new Date(b.createdAt || b.submittedAt || b.date) - new Date(a.createdAt || a.submittedAt || a.date)
      );
      
      setAllAudits(combined);

    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreSummary = (audit) => {
    const yesCount = (audit.answers || []).filter(a => a.choice === 'YES').length;
    const noCount = (audit.answers || []).filter(a => a.choice === 'NO').length;
    return { yesCount, noCount };
  };

  const filteredAudits = allAudits.filter((audit) => {
    const site = (audit.siteName || '').toLowerCase();
    const auditor = (audit.auditorName || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return site.includes(query) || auditor.includes(query);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.replace('T', ' ');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  return (
    <div className="page-container bg-brand-gray pb-10">
      <OfflineBanner />
      <Navbar />

      <main className="px-4 pt-6 pb-24 text-left">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-brand-blue hover:bg-gray-50 transition-colors focus:outline-none"
            title="Go Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold text-brand-blue leading-tight">
              Inspection Reports
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              View and download submitted audit PDFs
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-5 relative">
          <input
            type="text"
            placeholder="Search by Site Name or Auditor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-11 py-3 rounded-xl border-2 border-gray-200 bg-white focus:border-brand-orange focus:outline-none text-xs font-semibold text-gray-700 placeholder-gray-400 shadow-sm"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="spinner border-brand-orange w-10 h-10 mb-3"></div>
            <p className="text-sm text-gray-400">Loading reports...</p>
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="card bg-white text-center py-14 border border-gray-150 rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">📁</p>
            <p className="font-semibold text-gray-600 mb-1 text-sm">No reports found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or complete a new audit</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAudits.map((audit) => {
              const { yesCount, noCount } = getScoreSummary(audit);
              const isOffline = !audit._id; // offline entries don't have MongoDB _id yet
              const reportNo = audit._id 
                ? `SIR-${audit._id.substring(audit._id.length - 6).toUpperCase()}` 
                : 'Offline Pending';

              return (
                <div
                  key={audit._id || audit.localId}
                  className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm space-y-4 text-left hover:border-brand-orange/40 hover:shadow-md transition-all duration-200"
                >
                  {/* Top Bar with ID / Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-extrabold text-brand-blue">
                      {reportNo}
                    </span>
                    {isOffline ? (
                      <span className="bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Pending Sync
                      </span>
                    ) : (
                      <span className="bg-green-50 border border-green-200 text-green-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Available
                      </span>
                    )}
                  </div>

                  {/* Audit details grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-400">Site Name:</span>
                      <span className="font-bold text-gray-700">{audit.siteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-400">Auditor:</span>
                      <span className="font-bold text-gray-700">{audit.auditorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-400">Site Auditee:</span>
                      <span className="font-bold text-gray-700">{audit.siteQA || audit.auditeeName}</span>
                    </div>
                    {audit.subCategory && (
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-400">Category / Sub:</span>
                        <span className="font-bold text-brand-orange truncate max-w-[200px]">
                          {audit.category} - {audit.subCategory}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-400">Audit Date:</span>
                      <span className="font-bold text-gray-600">{formatDate(audit.date)}</span>
                    </div>
                    
                    {/* Scores summary */}
                    <div className="flex justify-between pt-2 border-t border-dashed border-gray-100 mt-2">
                      <span className="font-bold text-gray-400">Checkpoints Summary:</span>
                      <span className="font-bold text-xs">
                        <span className="text-green-600">YES: {yesCount}</span>
                        <span className="text-gray-300 mx-1.5">|</span>
                        <span className="text-red-500">NO: {noCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* Download Action */}
                  <div className="pt-2">
                    {isOffline ? (
                      <button
                        type="button"
                        disabled
                        className="w-full bg-gray-100 border border-gray-200 text-gray-400 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed shadow-none"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Report Available After Sync
                      </button>
                    ) : (
                      <a
                        href={`${apiBaseUrl}/reports/${audit._id}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-brand-blue hover:bg-brand-blueDark text-white text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm text-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download PDF Report
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
