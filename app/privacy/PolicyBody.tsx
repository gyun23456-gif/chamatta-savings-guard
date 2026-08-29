'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useT } from '../i18n';

// 방침 본문만 떼어낸 클라이언트 컴포넌트.
// page.tsx 는 metadata 를 내보내야 해서 서버 컴포넌트로 남아야 하고,
// 번역 훅은 클라이언트에서만 쓸 수 있어 이렇게 나눴다.
//
// 문장을 통째로 t() 에 넣는다. 법적 고지문이라 조각내서 이어붙이면
// 번역본에서 문장이 어색해지거나 뜻이 어긋날 수 있다.

const UPDATED = '2026년 8월 29일';
const CONTACT = 'gyun23456@gmail.com';
const MAILTO_ENQUIRY = 'mailto:gyun23456@gmail.com?subject=%EC%B0%B8%EC%95%98%EB%8B%A4!%20%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4%20%EB%AC%B8%EC%9D%98';
// 가입 이메일을 묻던 문구를 뺐다. 계정이 없어서 물어볼 것이 없다.
const MAILTO_DELETE = 'mailto:gyun23456@gmail.com?subject=%EC%B0%B8%EC%95%98%EB%8B%A4!%20%EB%82%B4%20%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD&body=%EC%82%AD%EC%A0%9C%EB%A5%BC%20%EC%9B%90%ED%95%98%EB%8A%94%20%ED%9B%84%EA%B8%B0%EB%82%98%20%EB%9E%AD%ED%82%B9%20%EA%B8%B0%EB%A1%9D%EC%9D%84%20%EC%95%8C%EB%A0%A4%EC%A3%BC%EC%84%B8%EC%9A%94.%20%EC%95%B1%EC%97%90%20%EC%A0%80%EC%9E%A5%EB%90%9C%20%EA%B8%B0%EB%A1%9D%EC%9D%80%20%EC%84%A4%EC%A0%95%20%3E%20%EB%82%B4%20%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%82%AD%EC%A0%9C%EB%A1%9C%20%EC%A7%81%EC%A0%91%20%EC%A7%80%EC%9A%B0%EC%8B%A4%20%EC%88%98%20%EC%9E%88%EC%8A%B5%EB%8B%88%EB%8B%A4.';

const SUMMARY = [
  '계좌번호와 예금주 정보는 이용자의 기기에만 저장되며 서버로 전송하지 않습니다.',
  '참았다!는 실제 결제나 계좌이체를 실행하지 않습니다.',
  '위치·연락처·사진·마이크·건강정보를 요구하지 않습니다.',
];

// 서버가 다루는 정보만 적는다. 계정을 없앤 뒤로 계정·프로필과 절약 기록은
// 기기 밖으로 나가지 않아 이 표에서 빠졌다. 그 둘은 아래 03 에서 다룬다.
const TABLE: { label: string; fields: string; purpose: string; optional?: boolean }[] = [
  { label: '목표 달성 후기', fields: '기기 식별값, 닉네임, 후기 제목·내용, 목표, 금액, 기간, 태그', purpose: '후기 검토·게시, 신고 처리 및 이벤트 운영', optional: true },
  { label: '광고·제휴 문의', fields: '브랜드명, 담당자명, 이메일, 예산, 희망 위치, 문의 내용', purpose: '문의 확인과 답변' },
  { label: '광고 반응 정보', fields: '캠페인 식별값, 조회·클릭 유형, 발생 시각', purpose: '광고 성과 집계. 개인 식별정보와 결합하지 않음' },
  { label: '절약 랭킹', fields: '기기 식별값, 닉네임, 기간별 절약 합계·아낀 칼로리·참은 횟수', purpose: '이용자가 랭킹 참여를 켰을 때만 전송. 무엇을 참았는지·메모·계좌정보는 보내지 않음', optional: true },
];

const RETENTION = [
  '후기: 이용자가 삭제를 요청하거나 게시 목적이 끝날 때까지. 공개 승인 전 후기 역시 요청 시 삭제',
  '광고·제휴 문의: 문의 처리 및 분쟁 대응에 필요한 기간 동안 보관 후 삭제',
  '절약 랭킹: 참여를 끄거나 랭킹에서 빠질 때까지. 빠지기를 누르면 해당 기기의 줄이 즉시 삭제됩니다',
  '기기 저장정보: 이용자가 앱 데이터 또는 브라우저 저장정보를 삭제할 때까지',
];

function Policy({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="policy-section">
      <div className="policy-title"><span>{n}</span><h2>{title}</h2></div>
      {children}
    </section>
  );
}

export default function PolicyBody() {
  const t = useT();
  return (
    <main className="privacy-page">
      <header>
        <Link href="/" aria-label={`${t('참았다!')} ${t('홈')}`}>ㅊ</Link>
        <div>
          <span>CHAMATTA PRIVACY</span>
          <h1>{t('개인정보처리방침')}</h1>
          <p>{t('참았다!는 이용자의 정보를 필요한 범위에서만 처리합니다.')}</p>
        </div>
      </header>

      <section className="privacy-summary">
        <b>{t('핵심 안내')}</b>
        <ul>{SUMMARY.map(line => <li key={line}>{t(line)}</li>)}</ul>
      </section>

      <Policy n="01" title={t('개인정보 처리자')}>
        <p>{t('참았다 스튜디오(이하 “운영자”)는 ‘참았다!’ 앱 및 웹서비스를 운영합니다.')}</p>
        <dl>
          <dt>{t('개인정보 문의·삭제 요청')}</dt>
          <dd><a href={MAILTO_ENQUIRY}>{CONTACT}</a></dd>
        </dl>
      </Policy>

      <Policy n="02" title={t('처리하는 정보와 목적')}>
        <div className="privacy-table">
          {TABLE.map(row => (
            <div key={row.label}>
              <b>{t(row.label)}{row.optional && <em>{t('선택')}</em>}</b>
              <p>{t(row.fields)}</p>
              <small>{t(row.purpose)}</small>
            </div>
          ))}
        </div>
      </Policy>

      <Policy n="03" title={t('기기에만 저장되는 정보')}>
        <p>{t('참았다!에는 계정이 없습니다. 절약 기록과 목표, 프로필 닉네임, 즐겨찾기와 사용자 메뉴, 저축 대기금액, 은행명·계좌번호·예금주는 모두 브라우저 또는 앱의 로컬 저장공간에만 저장됩니다. 해당 정보는 참았다! 서버로 전송되지 않습니다. 앱 데이터나 브라우저 저장정보를 삭제하면 함께 삭제되므로, 기기를 옮기실 때는 설정의 기록 백업에서 파일로 내보내 옮겨주세요.')}</p>
        <p>{t('예외는 두 가지입니다. 첫째, 목표 달성 후기를 올리면 후기 내용과 닉네임, 기기 식별값이 서버에 저장됩니다. 둘째, 설정에서 절약 랭킹 참여를 켜면 닉네임과 기간별 절약 합계가 서버로 올라갑니다. 랭킹은 기본값이 참여하지 않음이며, 켜기 전에는 아무것도 전송되지 않습니다. 랭킹 화면에서 빠지기를 누르면 올렸던 기록이 즉시 삭제됩니다. 두 기능 모두 계정이 아닌 기기 단위로 구분하므로 같은 사람이 여러 기기를 쓰면 각각 따로 잡힙니다.')}</p>
        <p>{t('계좌 비밀번호, 보안카드, 인증번호는 수집하지 않으며 실제 금융거래는 이용자가 은행 앱에서 직접 수행합니다.')}</p>
      </Policy>

      <Policy n="04" title={t('보관과 삭제')}>
        <ul>{RETENTION.map(line => <li key={line}>{t(line)}</li>)}</ul>
        <p>{t('관계 법령에서 별도 보관을 요구하는 경우 해당 기간 동안 분리 보관한 뒤 삭제합니다. 삭제 요청은 위 문의 이메일로 접수하며, 본인 확인 후 관련 정보를 삭제하거나 익명화합니다.')}</p>
      </Policy>

      <Policy n="05" title={t('제3자 제공 및 처리 위탁')}>
        <p>{t('운영자는 개인정보를 판매하지 않습니다. 서비스 제공을 위해 호스팅·데이터베이스·인증 인프라 제공업체가 운영자의 지시에 따라 정보를 처리할 수 있습니다. 법령에 근거한 요청이 있거나 이용자가 별도로 동의한 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.')}</p>
      </Policy>

      <Policy n="06" title={t('보호 조치')}>
        <p>{t('전송 구간 암호화(HTTPS), 접근 권한 제한, 운영자 기능의 접근 통제, 입력값 검증 등 합리적인 보호조치를 적용합니다. 다만 이용자는 공동으로 사용하는 기기에서 계좌정보나 기록을 저장하지 않도록 주의해야 합니다.')}</p>
      </Policy>

      <Policy n="07" title={t('이용자의 권리')}>
        <p>{t('이용자는 자신의 개인정보에 대한 열람, 정정, 삭제 및 처리정지를 요청할 수 있습니다. 기기에만 저장된 정보는 앱 데이터 삭제 기능이나 브라우저 저장정보 삭제를 통해 직접 제거할 수 있습니다. 서버에 저장된 후기와 랭킹 기록의 삭제는 문의 이메일로 요청할 수 있습니다.')}</p>
        <a className="delete-request" href={MAILTO_DELETE}>{t('내 데이터 삭제 요청하기')}</a>
      </Policy>

      <Policy n="08" title={t('아동 및 방침 변경')}>
        <p>{t('참았다!는 만 14세 미만 아동을 대상으로 개인정보를 의도적으로 수집하지 않습니다. 처리 방식이 달라지면 이 페이지의 시행일을 갱신하고 중요한 변경은 서비스 안에서 알립니다.')}</p>
      </Policy>

      <footer>
        <p>{t('공고 및 시행일')}: {t(UPDATED)}</p>
        <Link href="/">{t('참았다!로 돌아가기')}</Link>
      </footer>
    </main>
  );
}
