// 📁 File: /app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { createClient } from '@supabase/supabase-js';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Chat AI của bạn',
  description: 'Ứng dụng chat AI đơn giản tích hợp Supabase và OpenAI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
