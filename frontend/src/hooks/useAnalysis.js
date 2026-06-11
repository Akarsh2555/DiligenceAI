import { useState, useCallback } from 'react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

export function useAnalysis(sessionId) {
  const [analyzing, setAnalyzing] = useState(false);
  const [steps, setSteps] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (mode = 'full') => {
    if (!sessionId) return;

    setAnalyzing(true);
    setSteps([]);
    setReport(null);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`/api/sessions/${sessionId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Analysis failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.event === 'node_start' || data.event === 'node_complete') {
                setSteps((prev) => [...prev, data]);
              } else if (data.event === 'complete') {
                setReport(data.report);
              } else if (data.event === 'error') {
                setError(data.message);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [sessionId]);

  return { analyze, analyzing, steps, report, error };
}
