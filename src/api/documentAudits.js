import API from './axios';

export const submitDocumentAudit = (data) =>
  API.post('/document-audits', data);

export const getDocumentAudits = () =>
  API.get('/document-audits');
