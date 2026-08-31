import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LangProvider } from './i18n';
export const metadata: Metadata = {
  // 이게 없으면 openGraph.images 의 '/og.jpg' 같은 상대경로를 개발 기본값인
  // http://localhost:3000 에 붙여 절대주소를 만든다. 배포본에도 그대로 나가서
  // 카톡·트위터 공유 시 썸네일이 뜨지 않는다.
  metadataBase: new URL('https://chamatta.gyun23456.workers.dev'),
  title: '참았다!',
  description: '안 쓴 돈이 보이기 시작한다.',
  manifest: '/manifest.json',
  applicationName: '참았다!',
  openGraph: { title: '참았다!', description: '안 쓴 돈이 보이기 시작한다.', images: ['/og.jpg'], locale: 'ko_KR', type: 'website' },
  twitter: { card: 'summary_large_image', title: '참았다!', description: '안 쓴 돈이 보이기 시작한다.', images: ['/og.jpg'] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#123c2e' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body><LangProvider>{children}</LangProvider></body></html>; }
