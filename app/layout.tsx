import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '참았다!',
  description: '안 쓴 돈이 보이기 시작한다.',
  manifest: '/manifest.json',
  applicationName: '참았다!',
  openGraph: { title: '참았다!', description: '안 쓴 돈이 보이기 시작한다.', images: ['/og.jpg'], locale: 'ko_KR', type: 'website' },
  twitter: { card: 'summary_large_image', title: '참았다!', description: '안 쓴 돈이 보이기 시작한다.', images: ['/og.jpg'] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#123c2e' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
