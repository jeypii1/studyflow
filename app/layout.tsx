import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StudyFlow | Student Productivity Dashboard',
  description: 'Plan tasks, track study time, and build better study habits.',
  openGraph: {
    title: 'StudyFlow | Student Productivity Dashboard',
    description: 'Plan smarter. Study better.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'StudyFlow student productivity dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyFlow | Student Productivity Dashboard',
    description: 'Plan smarter. Study better.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
