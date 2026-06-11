import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useUpload(sessionId) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const upload = useCallback(async (files) => {
    if (!sessionId || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const res = await api.post(`/sessions/${sessionId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setProgress((prev) => ({ ...prev, total: pct }));
        },
      });
      setResults(res.data.results || []);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed';
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [sessionId]);

  return { upload, uploading, progress, results, error };
}
