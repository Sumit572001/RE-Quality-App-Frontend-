/**
 * syncService.js — Handles syncing pending offline audits to the server
 */
import { getPendingAudits, markAuditSynced } from './offlineDB';
import { submitAuditSubmission } from '../api/auditSubmissions';

let isSyncing = false;

/**
 * Sync all pending audits to the server.
 * Returns { synced: number, failed: number }
 */
export const syncPendingAudits = async () => {
  if (isSyncing) return { synced: 0, failed: 0 };
  if (!navigator.onLine) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingAudits();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    for (const audit of pending) {
      try {
        await submitAuditSubmission(audit);
        await markAuditSynced(audit.localId);
        synced++;
        console.log(`✅ Synced audit: ${audit.localId}`);
      } catch (err) {
        failed++;
        console.warn(`❌ Failed to sync audit ${audit.localId}:`, err.message);
      }
    }
  } catch (err) {
    console.error('syncPendingAudits error:', err);
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
};
