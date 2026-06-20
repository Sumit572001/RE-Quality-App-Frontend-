import API from './axios';

/**
 * Submit an audit (online submission or sync from offline queue)
 */
export const submitAuditSubmission = (data) =>
  API.post('/audit-submissions', data);

export const getAuditSubmissions = () =>
  API.get('/audit-submissions');

export const getAuditSubmissionById = (id) =>
  API.get(`/audit-submissions/${id}`);
