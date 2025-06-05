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
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);

  // Lấy user hiện tại
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

  // Lấy lịch sử chat khi đã có user
  useEffect(() => {
    const fetchHistory = async () => {
      if (user?.email) {
        const { data, error } = await supabase
          .from('messages')
          .select('question, answer')
          .eq('user_email', user.email)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setHistory(data);
        }
      }
    };

    fetchHistory();
  }, [user?.email]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };
const checkLimit = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_email', user.email)
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Lỗi khi kiểm tra giới hạn:', error);
    return false;
  }

  return count < 10;
};

  const handleAsk = async () => {
   const canAsk = await checkLimit();
  if (!canAsk) {
    alert('Bạn đã đạt giới hạn 10 câu hỏi hôm nay. Quay lại vào ngày mai nhé!');
    return;
  }

  setLoading(true);
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
    setInput('');
    setLoading(false);

    // Cập nhật lịch sử mới nhất
    setHistory([{ question: input, answer: data.answer }, ...history]);
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
        <div className="mt-8">
          <h2 className="font-semibold mb-2">📜 Lịch sử chat của bạn:</h2>
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={index} className="border p-3 rounded bg-white">
                <p><strong>🗨️ Bạn:</strong> {item.question}</p>
                <p><strong>🤖 AI:</strong> {item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
