import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prodigy — CrossFit Analytics',
  description: 'Track workouts. Understand performance.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} bg-gray-950 text-white min-h-screen`}>
        <Navigation />
        <main className="md:ml-56 pb-20 md:pb-0 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
