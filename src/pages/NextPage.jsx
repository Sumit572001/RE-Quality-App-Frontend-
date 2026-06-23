import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { submitDocumentAudit } from '../api/documentAudits';
import { savePendingAudit } from '../utils/offlineDB';
import OfflineBanner from '../components/OfflineBanner';

const ITEMS_DATA = [
  { srNo: 1, documentType: 'Register', description: 'Daily Incoming Register', details: 'A) GTN + Register\nB) M+L (Soft or register)', fileCode: 'QAD/site/701' },
  { srNo: 2, documentType: 'Register', description: 'Cube Register', details: 'A) Register update\nB) Inward Entry', fileCode: 'QAD/site/702' },
  { srNo: 3, documentType: 'Register', description: 'NC Register', details: 'Rejected Material\nRejected activity / issues', fileCode: 'QAD/site/703' },
  { srNo: 4, documentType: 'Register', description: 'Curing tank Temp.control register', details: '', fileCode: 'QAD/site/704' },
  { srNo: 5, documentType: 'Register', description: 'Slump Register', details: '', fileCode: 'QAD/site/705' },
  { srNo: 6, documentType: 'FILE', description: 'QAD Procedure', details: 'QAD 201 & 202', fileCode: 'QAD/site/801' },
  { srNo: 7, documentType: 'FILE', description: 'QAD Policy', details: 'QAP 001, 002 & D&D 601', fileCode: 'QAD/site/802' },
  { srNo: 8, documentType: 'FILE', description: 'Mix Design', details: 'A) Updated Mix designs\nB) Plant Trail Report', fileCode: 'D&D/site/803' },
  { srNo: 9, documentType: 'FILE', description: 'Consultant Certificates', details: 'A) Structural\nB) U Con\nC) MEP (Arch,plumbing,Ele)', fileCode: 'D&D/site/804' },
  { srNo: 10, documentType: 'FILE', description: 'Calibration Certificates', details: 'A) CTM\nB) Lab Equipment\'s', fileCode: 'QAD/site/805' },
  { srNo: 11, documentType: 'FILE', description: 'MTC Certificates', details: 'A) Steel MTC + rolling margin\nB) Other-aac block,coupler,mortar,tile,cover block etc.', fileCode: 'CON/site/806' },
  { srNo: 12, documentType: 'FILE', description: 'Third Party Test Reports', details: 'steel,coupler,PT,NDT etc.', fileCode: 'QAD/site/807' },
  { srNo: 13, documentType: 'FILE', description: 'RMC plant visit checklist', details: 'a) plant visit checklist\nb) all raw material test reports\nc) plant & lab equipment calibration', fileCode: 'CON/site/808' },
  { srNo: 14, documentType: 'FILE', description: 'Training Records', details: 'a) ongoing & planned\nb) Engineers', fileCode: 'QAD/site/809' },
  { srNo: 15, documentType: 'FILE', description: 'NC Quality Report', details: 'a) Rejection\nb) mock ups', fileCode: 'CON/site/810' },
  { srNo: 16, documentType: 'FILE', description: 'Instruction memo / visit reports', details: 'a) QA- contractor / engineer\nb) wrong GTN / any mistakes', fileCode: 'QAD/site/811' },
  { srNo: 17, documentType: 'FILE', description: 'Project Specification details', details: 'all specs & method statement & process', fileCode: '' },
];

const NextPage = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [submitting, setSubmitting] = useState(false);
  const [meta, setMeta] = useState({
    siteName: '',
    auditorName: '',
    siteQA: '',
    date: '',
  });

  const [answers, setAnswers] = useState(
    ITEMS_DATA.reduce((acc, item) => {
      acc[item.srNo] = { status: '', remark: '' };
      return acc;
    }, {})
  );

  useEffect(() => {
    const saved = localStorage.getItem('auditForm');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMeta((prev) => ({
          ...prev,
          siteName: parsed.siteName || '',
          auditorName: parsed.auditorName || '',
          date: parsed.date || new Date().toISOString().split('T')[0],
        }));
      } catch (err) {
        console.error('Failed to parse auditForm in NextPage:', err);
      }
    }
  }, []);

  const handleStatusChange = (srNo, value) => {
    setAnswers((prev) => ({
      ...prev,
      [srNo]: {
        ...prev[srNo],
        status: prev[srNo].status === value ? '' : value,
      },
    }));
  };

  const handleRemarkChange = (srNo, value) => {
    setAnswers((prev) => ({
      ...prev,
      [srNo]: {
        ...prev[srNo],
        remark: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const answersPayload = ITEMS_DATA.map((item) => ({
      srNo: item.srNo,
      documentType: item.documentType,
      description: item.description,
      details: item.details,
      fileCode: item.fileCode,
      status: answers[item.srNo].status,
      remark: answers[item.srNo].remark,
    }));

    const auditPayload = {
      type: 'document-audit',
      localId: `doc_audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      siteName: meta.siteName,
      auditorName: meta.auditorName,
      siteQA: meta.siteQA,
      date: meta.date,
      answers: answersPayload,
      submittedAt: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        await submitDocumentAudit(auditPayload);
        console.log('✅ Document audit submitted online');
      } else {
        await savePendingAudit(auditPayload);
        console.log('💾 Document audit saved offline');
      }
      navigate('/success', { state: { offline: !isOnline } });
    } catch (err) {
      console.error('Document audit submission failed, saving offline:', err);
      await savePendingAudit(auditPayload);
      navigate('/success', { state: { offline: true } });
    } finally {
      setSubmitting(false);
    }
  };

  const registers = ITEMS_DATA.filter((item) => item.documentType === 'Register');
  const files = ITEMS_DATA.filter((item) => item.documentType === 'FILE');

  return (
    <div className="page-container bg-brand-gray pb-10">
      <OfflineBanner />
      <Navbar />

      <main className="px-4 pt-6 pb-24 text-left">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-brand-blue hover:bg-gray-50 transition-colors focus:outline-none"
            title="Go Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold text-brand-blue leading-tight">
              Registers &amp; Files Audit
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              QA - Internal Audit Checklist
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Card */}
          <div className="card bg-white border border-gray-150 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-blue">{meta.siteName || 'Site Name'}</p>
                <p className="text-[10px] text-gray-400 font-semibold">Date: {meta.date}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Name of Auditor
                </label>
                <p className="text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  {meta.auditorName || 'Auditor Name'}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Name of Site QA
                </label>
                <input
                  type="text"
                  value={meta.siteQA}
                  onChange={(e) => setMeta({ ...meta, siteQA: e.target.value })}
                  placeholder="Enter Name of Site QA"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-xs font-semibold text-gray-700 placeholder-gray-400 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Render Groups */}
          {[
            { title: 'Registers Records', list: registers, icon: '📋' },
            { title: 'Files Records', list: files, icon: '📁' },
          ].map((group) => (
            <div key={group.title} className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-lg">{group.icon}</span>
                <h3 className="font-heading font-black text-xs text-brand-blue uppercase tracking-widest">
                  {group.title}
                </h3>
              </div>

              <div className="space-y-3.5">
                {group.list.map((item) => (
                  <div key={item.srNo} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm space-y-3">
                    {/* Item Top row (badges) */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-md">
                        SR NO: {item.srNo}
                      </span>
                      {item.fileCode && (
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 border border-gray-200 rounded-md">
                          Code: {item.fileCode}
                        </span>
                      )}
                    </div>

                    {/* Descriptions */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 leading-snug">
                        {item.description}
                      </h4>
                      {item.details && (
                        <div className="mt-1.5 bg-gray-50 border border-gray-100 rounded-xl p-2.5 space-y-1">
                          {item.details.split('\n').map((det, index) => (
                            <p key={index} className="text-[10px] text-gray-500 font-medium leading-relaxed flex items-start gap-1">
                              <span>•</span>
                              <span>{det}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* YES / NO Choices & Remarks */}
                    <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* YES */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.srNo, 'YES')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-xs transition-all active:scale-[0.98]
                            ${answers[item.srNo].status === 'YES'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300'}`}
                        >
                          <svg className={`w-4 h-4 ${answers[item.srNo].status === 'YES' ? 'text-green-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          YES
                        </button>

                        {/* NO */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.srNo, 'NO')}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-xs transition-all active:scale-[0.98]
                            ${answers[item.srNo].status === 'NO'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300'}`}
                        >
                          <svg className={`w-4 h-4 ${answers[item.srNo].status === 'NO' ? 'text-red-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          NO
                        </button>
                      </div>

                      {/* Remark text field */}
                      <input
                        type="text"
                        value={answers[item.srNo].remark}
                        onChange={(e) => handleRemarkChange(item.srNo, e.target.value)}
                        placeholder="Add Remark / Comments..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-brand-orange focus:outline-none text-[11px] font-medium text-gray-700 placeholder-gray-350 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Form Actions */}
          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all active:scale-95 text-center focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3.5 bg-brand-orange hover:bg-brand-orangeDark text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 focus:outline-none"
            >
              {submitting ? (
                <>
                  <div className="spinner border-white w-4 h-4" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Submit Audit</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default NextPage;
