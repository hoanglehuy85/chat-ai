import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const question = body.question;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(question);
    const response = await result.response;
    // Sau khi có kết quả từ Gemini
    const text = response.text();
    console.log('body:', body);

    // Ghi lại vào Supabase
    const { error } = await supabase.from('messages').insert([
     {
    user_email: body.userEmail,
    question,
    answer: text,
     },
    ]);

    if (error) {
  console.error('Lỗi khi ghi Supabase:', error);
    }


    return NextResponse.json({ answer: text });
  } catch (error) {
    console.error('Lỗi khi gọi Gemini SDK:', error);
    return NextResponse.json({ answer: 'Lỗi khi gọi Gemini SDK.' });
  }
}
