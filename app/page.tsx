'use client';

import { useState, useEffect } from 'react';
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
      .order('created_at', { ascending: false });

    setHistory(history || []);
  };

  if (user) fetchHistory();
}, [user]);

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
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: input,
        userEmail: user.email,
      }),
    });

    const data = await res.json();
    setResponse(data.answer);
    setLoading(false);
    setHistory([{ question: input, answer: data.answer }, ...history]);
    setCount((prev) => (prev ?? 0) + 1);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Chào bạn!</h1>
        <button
          onClick={signInWithGoogle}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Đăng nhập với Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Xin chào, {user.email}</h2>
        <button onClick={signOut} className="text-red-500 underline">Đăng xuất</button>
      </div>
      <textarea
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Bạn muốn hỏi gì?"
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleAsk}
        className="px-4 py-2 bg-green-600 text-white rounded"
        disabled={loading}
      >
        {loading ? 'Đang hỏi...' : 'Hỏi AI'}
      </button>
      {response && (
        <div className="mt-4 p-4 bg-gray-100 border rounded whitespace-pre-wrap">
          {response}
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Lịch sử gần đây:</h3>
          <ul className="space-y-2">
            {history.map((item, index) => (
  <div key={index} className="mb-4">
    {/* Câu hỏi của người dùng */}
    <div className="flex justify-end">
      <div className="bg-blue-500 text-white p-3 rounded-lg max-w-sm">
        <p>{item.question}</p>
        <p className="text-xs text-right mt-1 opacity-70">
          {new Date(item.created_at!).toLocaleTimeString()}
        </p>
      </div>
    </div>

    {/* Trả lời từ AI */}
    <div className="flex justify-start mt-2">
      <div className="bg-gray-200 text-black p-3 rounded-lg max-w-sm">
        <p>{item.answer}</p>
        <p className="text-xs text-right mt-1 opacity-60">
          {new Date(item.created_at!).toLocaleTimeString()}
        </p>
      </div>
    </div>
  </div>
))}

          </ul>
        </div>
      )}
    </div>
  );
}
