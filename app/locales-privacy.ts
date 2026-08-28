// 개인정보처리방침 번역.
//
// 다른 사전과 달리 이 파일은 사람이 검토한 문장만 들어간다. 법적 고지문이라
// 오역이 그대로 정책 위반이 될 수 있어서다. 영문은 2026-08-28 검토·승인됨.
//
// 아동 연령은 원문의 만 14세(한국 기준)를 그대로 두기로 했다. 미국 COPPA 는
// 13세, EU GDPR 은 13~16세라 지역에 따라 기준이 다르다는 점은 알고 있는 선택이다.
//
// 일본어·중국어는 아직 검토 전이라 넣지 않았다. 사전에 없으면 t() 가 한국어를
// 그대로 돌려주므로, 그 두 언어에서는 방침이 한국어로 보인다.

type Dict = Record<string, string>;

export const enPrivacy: Dict = {
  '개인정보처리방침': 'Privacy Policy',
  '참았다!는 이용자의 정보를 필요한 범위에서만 처리합니다.': 'Chamatta processes your information only to the extent needed.',
  '핵심 안내': 'Key points',
  '계좌번호와 예금주 정보는 이용자의 기기에만 저장되며 서버로 전송하지 않습니다.':
    'Your account number and account holder name are stored only on your device and are never sent to our servers.',
  '참았다!는 실제 결제나 계좌이체를 실행하지 않습니다.': 'Chamatta does not process payments or transfer money.',
  '위치·연락처·사진·마이크·건강정보를 요구하지 않습니다.':
    'We do not request location, contacts, photos, microphone, or health data.',

  // 01
  '개인정보 처리자': 'Who processes your data',
  '참았다 스튜디오(이하 “운영자”)는 ‘참았다!’ 앱 및 웹서비스를 운영합니다.':
    'Chamatta Studio ("we") operates the Chamatta app and web service.',
  '개인정보 문의·삭제 요청': 'Privacy enquiries and deletion requests',

  // 02
  '처리하는 정보와 목적': 'What we process, and why',
  '선택': 'optional',
  '계정·프로필': 'Account & profile',
  '이메일 주소, 서비스 내부 이용자 식별값, 닉네임': 'Email address, internal user identifier, nickname',
  '로그인 상태 확인, 이용자 식별, 프로필 제공': 'Confirming sign-in status, identifying users, providing a profile',
  '절약 기록·목표': 'Savings records & goals',
  '소비 카테고리, 금액, 메모, 성공·실패 결과, 날짜, 예상 열량, 목표명·목표금액':
    'Spending category, amount, memo, resisted/gave-in outcome, date, estimated calories, goal name and target',
  '절약 기록 저장, 통계 및 목표 달성률 제공': 'Storing records, providing statistics and goal progress',
  '목표 달성 후기': 'Goal stories',
  '닉네임, 후기 제목·내용, 목표, 금액, 기간, 태그, 작성자 식별값·이메일':
    'Nickname, story title and body, goal, amount, period, tag, author identifier and email',
  '후기 검토·게시, 신고 처리 및 이벤트 운영': 'Reviewing and publishing stories, handling reports, running events',
  '광고·제휴 문의': 'Advertising enquiries',
  '브랜드명, 담당자명, 이메일, 예산, 희망 위치, 문의 내용':
    'Brand name, contact name, email, budget, preferred placement, message',
  '문의 확인과 답변': 'Confirming and answering the enquiry',
  '광고 반응 정보': 'Ad interaction data',
  '캠페인 식별값, 조회·클릭 유형, 발생 시각': 'Campaign identifier, view/click type, timestamp',
  '광고 성과 집계. 개인 식별정보와 결합하지 않음':
    'Measuring campaign performance. Not combined with personally identifying data',
  '기기 식별값, 닉네임, 기간별 절약 합계·아낀 칼로리·참은 횟수':
    'Device identifier, nickname, per-period savings totals, calories avoided, number of times resisted',
  '이용자가 랭킹 참여를 켰을 때만 전송. 무엇을 참았는지·메모·계좌정보는 보내지 않음':
    'Sent only when you turn on leaderboard participation. What you resisted, your memos and your bank details are not sent',

  // 03
  '기기에만 저장되는 정보': 'Data kept only on your device',
  '로그인 없이 사용하는 절약 기록·목표, 즐겨찾기와 사용자 메뉴, 저축 대기금액, 은행명·계좌번호·예금주 등은 브라우저 또는 앱의 로컬 저장공간에 저장됩니다. 해당 정보는 참았다! 서버로 전송되지 않습니다. 앱 데이터나 브라우저 저장정보를 삭제하면 함께 삭제됩니다.':
    "Savings records and goals used without signing in, favourites and custom menus, pending savings amounts, and your bank name, account number and account holder name are stored in your browser's or app's local storage. This information is not sent to Chamatta's servers. Clearing the app's data or your browser storage deletes it as well.",
  '예외 한 가지. 설정에서 절약 랭킹 참여를 켜면 닉네임과 기간별 절약 합계가 서버로 올라갑니다. 기본값은 참여하지 않음이며, 켜기 전에는 아무것도 전송되지 않습니다. 랭킹 화면에서 빠지기를 누르면 올렸던 기록이 즉시 삭제됩니다. 랭킹은 계정이 아닌 기기 단위로 집계되므로 같은 사람이 여러 기기를 쓰면 각각 따로 잡힙니다.':
    'One exception. If you turn on leaderboard participation in Settings, your nickname and per-period savings totals are uploaded to our servers. Participation is off by default, and nothing is sent before you turn it on. Pressing Leave on the leaderboard deletes what was uploaded immediately. The leaderboard counts by device rather than by account, so one person using several devices is counted separately on each.',
  '계좌 비밀번호, 보안카드, 인증번호는 수집하지 않으며 실제 금융거래는 이용자가 은행 앱에서 직접 수행합니다.':
    "We do not collect banking passwords, security cards or authentication codes, and any real transfer is carried out by you in your own bank's app.",

  // 04
  '보관과 삭제': 'Retention and deletion',
  '계정·프로필·절약 기록·목표: 이용자가 삭제를 요청하거나 서비스가 종료될 때까지':
    'Account, profile, savings records and goals: until you request deletion or the service closes',
  '후기: 이용자가 삭제를 요청하거나 게시 목적이 끝날 때까지. 공개 승인 전 후기 역시 요청 시 삭제':
    'Stories: until you request deletion or the purpose of publication ends. Stories awaiting approval are also deleted on request',
  '광고·제휴 문의: 문의 처리 및 분쟁 대응에 필요한 기간 동안 보관 후 삭제':
    'Advertising enquiries: kept for as long as needed to handle the enquiry and any dispute, then deleted',
  '절약 랭킹: 참여를 끄거나 랭킹에서 빠질 때까지. 빠지기를 누르면 해당 기기의 줄이 즉시 삭제됩니다':
    "Savings leaderboard: until you turn participation off or leave the leaderboard. Pressing Leave deletes that device's entry immediately",
  '기기 저장정보: 이용자가 앱 데이터 또는 브라우저 저장정보를 삭제할 때까지':
    "Device-stored data: until you clear the app's data or your browser storage",
  '관계 법령에서 별도 보관을 요구하는 경우 해당 기간 동안 분리 보관한 뒤 삭제합니다. 삭제 요청은 위 문의 이메일로 접수하며, 본인 확인 후 관련 정보를 삭제하거나 익명화합니다.':
    'Where the law requires separate retention, we keep the data apart for that period and then delete it. Send deletion requests to the email above; after verifying your identity we delete or anonymise the relevant information.',

  // 05
  '제3자 제공 및 처리 위탁': 'Sharing and processors',
  '운영자는 개인정보를 판매하지 않습니다. 서비스 제공을 위해 호스팅·데이터베이스·인증 인프라 제공업체가 운영자의 지시에 따라 정보를 처리할 수 있습니다. 법령에 근거한 요청이 있거나 이용자가 별도로 동의한 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.':
    'We do not sell personal information. To run the service, our hosting, database and authentication providers may process information on our instructions. We do not provide personal information to third parties except where required by law or where you have separately consented.',

  // 06
  '보호 조치': 'Safeguards',
  '전송 구간 암호화(HTTPS), 접근 권한 제한, 운영자 기능의 접근 통제, 입력값 검증 등 합리적인 보호조치를 적용합니다. 다만 이용자는 공동으로 사용하는 기기에서 계좌정보나 기록을 저장하지 않도록 주의해야 합니다.':
    'We apply reasonable safeguards including encryption in transit (HTTPS), restricted access rights, access control on operator features, and input validation. Please take care not to store bank details or records on a shared device.',

  // 07
  '이용자의 권리': 'Your rights',
  '이용자는 자신의 개인정보에 대한 열람, 정정, 삭제 및 처리정지를 요청할 수 있습니다. 기기에만 저장된 정보는 앱 데이터 삭제 기능이나 브라우저 저장정보 삭제를 통해 직접 제거할 수 있습니다. 서버에 저장된 정보와 계정 삭제는 문의 이메일로 요청할 수 있습니다.':
    "You may request access to, correction of, deletion of, or a halt to the processing of your personal information. Information held only on your device can be removed directly, using the app's delete-data feature or by clearing your browser storage. For information held on our servers, and for account deletion, contact us at the email above.",
  '계정·데이터 삭제 요청하기': 'Request account and data deletion',

  // 08
  '아동 및 방침 변경': 'Children, and changes to this policy',
  '참았다!는 만 14세 미만 아동을 대상으로 개인정보를 의도적으로 수집하지 않습니다. 처리 방식이 달라지면 이 페이지의 시행일을 갱신하고 중요한 변경은 서비스 안에서 알립니다.':
    'Chamatta does not knowingly collect personal information from children under 14. If how we process data changes, we will update the effective date on this page and announce significant changes inside the service.',

  '공고 및 시행일': 'Published and effective',
  '2026년 8월 25일': '25 August 2026',
  '참았다!로 돌아가기': 'Back to Chamatta',
};
