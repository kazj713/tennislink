import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from './client-layout';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'TennisLink',
  description: 'Tennis coaching and booking platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <ClientLayout>
          <Navbar />
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
