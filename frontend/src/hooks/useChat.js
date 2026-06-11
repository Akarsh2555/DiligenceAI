import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useChat(sessionId) {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (question) => {
    if (!sessionId || !question.trim()) return;

    setStreaming(true);
    setError(null);

    // Add user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: question, citations: [] }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch(`/api/sessions/${sessionId}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) throw new Error('Failed to send question');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let citations = [];

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '', citations: [] }]);

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
              if (data.event === 'token') {
                fullText += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: fullText, citations };
                  return updated;
                });
              } else if (data.event === 'citations') {
                citations = data.data || [];
              } else if (data.event === 'error') {
                fullText = `⚠️ ${data.message || 'Something went wrong answering that.'}`;
                setError(data.message || 'error');
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: fullText, citations };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      // Final update with citations
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: fullText, citations };
        return updated;
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setStreaming(false);
    }
  }, [sessionId]);

  const loadHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/sessions/${sessionId}/chat-history`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {}
  }, [sessionId]);

  return { messages, sendMessage, streaming, error, loadHistory, setMessages };
}
