import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://agentmint.com'),
  title: {
    default: 'AgentMint - Monetization infrastructure for AI agents',
    template: '%s | AgentMint',
  },
  description:
    'The payments, credits and subscriptions stack for AI agents. Plug in behind two SDK calls and start collecting revenue from every agent you ship.',
  keywords: ['AI agent monetization', 'AI agent billing', 'credit wallet', 'usage-based pricing', 'Stripe for AI agents', 'AgentMint'],
  openGraph: {
    title: 'AgentMint - Monetize all your AI agents from one place',
    description: 'Plug in behind two SDK calls and start collecting revenue from every agent you ship.',
    type: 'website',
    siteName: 'AgentMint',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentMint',
    description: 'Monetize all your AI agents from one place.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
