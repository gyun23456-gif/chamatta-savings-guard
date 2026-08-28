import type { Metadata } from 'next';
import PolicyBody from './PolicyBody';

// metadata 를 내보내려면 서버 컴포넌트여야 하고, 번역 훅은 클라이언트에서만
// 쓸 수 있다. 그래서 본문은 PolicyBody 로 나눠 두었다.
export const metadata: Metadata = {
  title: '개인정보처리방침 | 참았다!',
  description: '참았다! 앱의 개인정보 처리 기준과 이용자 권리를 안내합니다.',
};

export default function PrivacyPage() {
  return <PolicyBody />;
}
