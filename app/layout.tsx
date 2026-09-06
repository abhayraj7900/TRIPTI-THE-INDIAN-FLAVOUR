import type { Metadata } from 'next';
import { DM_Sans, Lora } from 'next/font/google';
import './globals.css';

const sans = DM_Sans({ variable: '--font-tripti-sans', subsets: ['latin'] });
const serif = Lora({ variable: '--font-tripti-serif', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tripti — Restaurant Management',
  description: 'Restaurant point of sale, billing, kitchen, tables, inventory and reports.',
  icons: {
    icon: '/tripti-logo.png',
    apple: '/tripti-logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
