/**
 * offlineDB.js — IndexedDB wrapper for offline audit storage
 * Stores pending audit submissions when user is offline
 */

const DB_NAME = 'REQualityAppDB';
const DB_VERSION = 1;
const STORE_PENDING = 'pendingAudits';
const STORE_CACHE = 'apiCache';

let dbInstance = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store for pending (offline) audit submissions
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        const store = db.createObjectStore(STORE_PENDING, { keyPath: 'localId' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Store for caching API GET responses
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// ─── PENDING AUDITS ──────────────────────────────────────────

/**
 * Save a pending audit submission to IndexedDB
 */
export const savePendingAudit = async (auditData) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    const store = tx.objectStore(STORE_PENDING);
    const record = {
      ...auditData,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
};

/**
 * Get all pending (unsynced) audit submissions
 */
export const getPendingAudits = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readonly');
    const store = tx.objectStore(STORE_PENDING);
    const index = store.index('status');
    const req = index.getAll('pending');
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

/**
 * Get ALL audits (pending + synced) for display
 */
export const getAllPendingAudits = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readonly');
    const store = tx.objectStore(STORE_PENDING);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

/**
 * Mark an audit as synced after successful upload
 */
export const markAuditSynced = async (localId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    const store = tx.objectStore(STORE_PENDING);
    const getReq = store.get(localId);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.status = 'synced';
        record.syncedAt = new Date().toISOString();
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(record);
        putReq.onerror = () => reject(putReq.error);
      } else {
        resolve(null);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

/**
 * Delete a specific audit from IndexedDB
 */
export const deletePendingAudit = async (localId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    const store = tx.objectStore(STORE_PENDING);
    const req = store.delete(localId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/**
 * Count pending (unsynced) audits
 */
export const countPendingAudits = async () => {
  try {
    const pending = await getPendingAudits();
    return pending.length;
  } catch {
    return 0;
  }
};

// ─── API CACHE ──────────────────────────────────────────────

/**
 * Cache an API response
 */
export const cacheAPIResponse = async (key, data) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.put({ key, data, cachedAt: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('cacheAPIResponse failed:', err);
  }
};

/**
 * Get a cached API response
 */
export const getCachedAPIResponse = async (key) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};
