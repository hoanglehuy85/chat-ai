'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ question: string; answer: string; created_at?: string }[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [streamingAnswer, setStreamingAnswer] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: history } = await supabase
        .from('chat_history')
        .select('*')
        .eq('email', user.email)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      setHistory(history || []);
    };

    if (user) fetchHistory();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingAnswer]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAsk = async () => {
    if (count !== null && count >= 10) {
      alert('Bạn đã hết 10 tin nhắn miễn phí hôm nay.');
      return;
    }

    setLoading(true);
    setStreamingAnswer('');

    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: input, userEmail: user.email })
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value);
        setStreamingAnswer(result);
      }
    }

    setResponse(result);
    setHistory([...history, { question: input, answer: result, created_at: new Date().toISOString() }]);
    setCount((prev) => (prev ?? 0) + 1);
    setInput('');
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Chào bạn!</h1>
        <button onClick={signInWithGoogle} className="px-4 py-2 bg-blue-600 text-white rounded">Đăng nhập với Google</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Xin chào, {user.email}</h2>
        <button onClick={signOut} className="text-red-500 underline">Đăng xuất</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {history.map((item, index) => (
          <div key={index}>
            <div className="flex justify-end">
              <div className="bg-blue-500 text-white p-3 rounded-lg max-w-sm">
                <p>{item.question}</p>
                <p className="text-xs text-right mt-1 opacity-70">
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
                </p>
              </div>
            </div>
            <div className="flex justify-start mt-2">
              <div className="bg-gray-200 text-black p-3 rounded-lg max-w-sm">
                <p>{item.answer}</p>
                <p className="text-xs text-right mt-1 opacity-60">
                  {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
                </p>
              </div>
            </div>
          </div>
        ))}
        {streamingAnswer && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-black p-3 rounded-lg max-w-sm animate-pulse">
              <p>{streamingAnswer}</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="mt-auto">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Bạn muốn hỏi gì?"
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={handleAsk}
          className="w-full px-4 py-2 bg-green-600 text-white rounded"
          disabled={loading || !input.trim()}
        >
          {loading ? 'Đang hỏi...' : 'Hỏi AI'}
        </button>
      </div>
    </div>
  );
}
