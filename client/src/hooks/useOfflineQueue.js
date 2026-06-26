import { useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const DB_NAME = 'xerox-offline-queue';
const STORE_NAME = 'pending-bookings';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export default function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const count = store.count();
      count.onsuccess = () => setPendingCount(count.result);
    } catch {
      // IndexedDB not available
    }
  }, []);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  const queueBooking = useCallback(async (bookingData) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add({ ...bookingData, queuedAt: new Date().toISOString() });
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = reject;
      });
      await loadCount();
      return true;
    } catch {
      return false;
    }
  }, [loadCount]);

  const syncAll = useCallback(async () => {
    setSyncing(true);
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      const items = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        try {
          const { id, queuedAt, files, ...bookingData } = item;
          let finalBookingData = { ...bookingData };

          if (files && files.length > 0) {
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));
            const uploadRes = await api.post('/customer/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            finalBookingData = { ...finalBookingData, ...uploadRes.data };
          }

          await api.post('/customer/bookings', finalBookingData);
          // Remove synced item
          const deleteTx = db.transaction(STORE_NAME, 'readwrite');
          deleteTx.objectStore(STORE_NAME).delete(id);
        } catch {
          // Keep failed items for retry
        }
      }

      await loadCount();
    } catch {
      // DB error
    } finally {
      setSyncing(false);
    }
  }, [loadCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (pendingCount > 0) syncAll();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [pendingCount, syncAll]);

  return { pendingCount, syncing, queueBooking, syncAll };
}
