'use client';

import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react';
import ProfileModal from './ProfileModal';
import SavingsModal, { SavingsQueue } from './SavingsModal';
import CustomMenuModal from './CustomMenuModal';
import MenuOptionsModal, { optionProfileForName } from './MenuOptionsModal';
import DeliveryJourney from './DeliveryJourney';
import SettingsModal from './SettingsModal';

type Tab = 'home' | 'market' | 'history' | 'stats' | 'goals';
type Result = 'saved' | 'spent';
type RecordItem = { id: string; category: string; amount: number; memo: string; result: Result; date: string; calories?: number };
type Goal = { id: string; name: string; amount: number; emoji: string };
type Story = { id: string; nickname: string; title: string; body: string; goal: string; amount: number; period: string; tag: string; createdAt: string; featured?: boolean; status?: 'pending'|'approved'|'hidden' };
type AppData = { records: RecordItem[]; goals: Goal[]; stories?: Story[] };
type MenuItem = { id: string; name: string; description: string; price: number; icon: string; calories?: number; options?: string; section?: string };
type Shop = { id: string; name: string; category: string; icon: string; rating: number; delivery: number; time: string; badge?: string; menus: MenuItem[] };
type CartItem = MenuItem & { quantity: number; shopId: string; shopName: string };
type Profile = { authenticated: boolean; nickname?: string; email?: string };
type Campaign = { id:string; brand:string; label:string; title:string; description:string; linkUrl:string; placement:string; status?:string; startsAt?:string; endsAt?:string };
// Shapes returned by the route handlers in app/api/*. Response.json() is typed as
// Promise<unknown> here, so each fetch below names the payload it expects.
type StoriesResponse = { stories?: Story[]; pending?: Story[]; signedIn?: boolean; localPreview?: boolean };
type UserDataResponse = { records?: RecordItem[]; goals?: Goal[]; hasData?: boolean; localPreview?: boolean };
type AdsResponse = { campaigns?: Campaign[] };
type AdminStoriesResponse = { admin?: boolean; stories?: (Story & { reportCount?: number })[]; localPreview?: boolean };
type AdInquiry = { id:string; brand:string; contactName:string; email:string; budget:string; placement:string; message:string; status:string; createdAt:string };
type AdStat = { campaignId:string; eventType:string; count:number };
type AdminAdsResponse = { inquiries?: AdInquiry[]; stats?: AdStat[]; campaigns?: Campaign[]; localPreview?: boolean };

const categories = [
  { id: '배달', icon: '🍜', color: '#ffefdc' }, { id: '카페', icon: '☕', color: '#e9e1d7' },
  { id: '쇼핑', icon: '🛍️', color: '#f2e5ff' }, { id: '택시', icon: '🚕', color: '#fff3c7' },
  { id: '게임/앱결제', icon: '🎮', color: '#dfeeff' }, { id: '술자리', icon: '🍺', color: '#ffe8b5' },
  { id: '기타', icon: '✨', color: '#e9efe5' },
];
const shopCategories = ['전체', '한식', '치킨', '분식', '카페', '아시안', '야식'];
const shops: Shop[] = [
  { id:'warm-table', name:'따뜻한 한상', category:'한식', icon:'🍲', rating:4.8, delivery:2000, time:'25~35분', badge:'혼밥 추천', menus:[{id:'kimchi',name:'묵은지 김치찌개',description:'푹 익은 묵은지와 두툼한 돼지고기',price:9900,icon:'🍲'},{id:'bulgogi',name:'직화 불고기 한상',description:'불향 가득 불고기와 5가지 반찬',price:13900,icon:'🥘'},{id:'bibim',name:'계절 나물 비빔밥',description:'신선한 제철 나물과 고추장',price:8900,icon:'🍚'}]},
  { id:'crunch-lab', name:'바삭 연구소', category:'치킨', icon:'🍗', rating:4.9, delivery:0, time:'30~40분', badge:'배달비 0원', menus:[{id:'crisp',name:'시그니처 바삭 치킨',description:'두 번 튀겨 더 바삭한 한 마리',price:19900,icon:'🍗'},{id:'soy',name:'단짠 간장 치킨',description:'마늘 간장 소스와 바삭한 식감',price:20900,icon:'🍗'},{id:'wing',name:'매콤 윙 12조각',description:'알싸하게 매콤한 윙과 봉',price:16900,icon:'🌶️'}]},
  { id:'school-snack', name:'방과후 분식', category:'분식', icon:'🍢', rating:4.7, delivery:1500, time:'20~30분', badge:'인기 급상승', menus:[{id:'tteok',name:'쫄깃 국물 떡볶이',description:'밀떡과 어묵이 듬뿍',price:6500,icon:'🌶️'},{id:'sundae',name:'찰순대 한 접시',description:'쫀득한 순대와 내장 모둠',price:6000,icon:'🍽️'},{id:'set',name:'분식 올스타 세트',description:'떡볶이·순대·튀김·어묵',price:18900,icon:'🍢'}]},
  { id:'slow-coffee', name:'느린 오후', category:'카페', icon:'☕', rating:4.9, delivery:1000, time:'15~25분', badge:'디저트 맛집', menus:[{id:'latte',name:'너티 크림 라테',description:'고소한 크림과 진한 에스프레소',price:5900,icon:'☕'},{id:'ade',name:'제주 청귤 에이드',description:'상큼한 청귤과 탄산',price:5500,icon:'🍊'},{id:'cake',name:'말차 크림 케이크',description:'쌉싸름한 말차와 부드러운 크림',price:6900,icon:'🍰'}]},
  { id:'bangkok-night', name:'방콕의 밤', category:'아시안', icon:'🍜', rating:4.8, delivery:2500, time:'30~45분', badge:'현지의 맛', menus:[{id:'padthai',name:'새우 팟타이',description:'탱글한 새우와 새콤달콤 소스',price:12900,icon:'🍜'},{id:'rice',name:'카오팟 볶음밥',description:'불향 가득 태국식 볶음밥',price:10900,icon:'🍚'},{id:'tom',name:'똠얌꿍',description:'새우와 향신료의 진한 국물',price:14900,icon:'🥣'}]},
  { id:'midnight-kitchen', name:'자정의 주방', category:'야식', icon:'🌙', rating:4.6, delivery:3000, time:'35~50분', menus:[{id:'feet',name:'불향 무뼈 닭발',description:'화끈한 불맛과 쫄깃한 식감',price:17900,icon:'🔥'},{id:'pork',name:'마늘 보쌈',description:'부드러운 수육과 알싸한 마늘',price:24900,icon:'🥩'},{id:'soup',name:'얼큰 어묵탕',description:'꼬치 어묵과 칼칼한 국물',price:13900,icon:'🍢'}]},
];
shops.push(
  {id:'rice-cloud',name:'구름밥상',category:'한식',icon:'🍚',rating:4.7,delivery:1500,time:'20~30분',badge:'집밥 인기',menus:[{id:'cloud-set',name:'제육 한상',description:'매콤한 제육과 계절 반찬',price:11900,icon:'🥘'},{id:'tofu',name:'순두부 정식',description:'보글보글 순두부와 공깃밥',price:9500,icon:'🍲'}]},
  {id:'seoul-pot',name:'서울 뚝배기',category:'한식',icon:'🥘',rating:4.8,delivery:2000,time:'25~35분',badge:'재주문 많음',menus:[{id:'beef-soup',name:'얼큰 소고기국밥',description:'진한 국물과 부드러운 소고기',price:11000,icon:'🍲'},{id:'soy-stew',name:'차돌 된장찌개',description:'구수한 된장과 차돌박이',price:10500,icon:'🥘'}]},
  {id:'green-kitchen',name:'초록 부엌',category:'한식',icon:'🥗',rating:4.6,delivery:1000,time:'20~30분',badge:'가벼운 한 끼',menus:[{id:'tofu-bowl',name:'두부 채소 덮밥',description:'구운 두부와 신선한 채소',price:9800,icon:'🥗'},{id:'mushroom',name:'버섯 불고기 비빔밥',description:'향긋한 버섯과 나물',price:10300,icon:'🍚'}]},
  {id:'golden-wing',name:'황금 날개',category:'치킨',icon:'🍗',rating:4.8,delivery:0,time:'30~40분',badge:'배달비 0원',menus:[{id:'gold-crisp',name:'황금 후라이드',description:'얇고 바삭한 시그니처 튀김옷',price:18900,icon:'🍗'},{id:'hot-gold',name:'불꽃 양념치킨',description:'달콤하고 매콤한 양념',price:19900,icon:'🔥'}]},
  {id:'oven-garden',name:'오븐 정원',category:'치킨',icon:'🍖',rating:4.7,delivery:1500,time:'35~45분',badge:'오븐 구이',menus:[{id:'herb',name:'허브 로스트 치킨',description:'허브 향을 입힌 담백한 구이',price:20900,icon:'🍖'},{id:'pepper',name:'블랙페퍼 윙',description:'알싸한 후추 풍미의 윙',price:17500,icon:'🍗'}]},
  {id:'picnic-snack',name:'소풍 분식',category:'분식',icon:'🍙',rating:4.8,delivery:1000,time:'15~25분',badge:'학생 인기',menus:[{id:'rose-tteok',name:'꾸덕 로제 떡볶이',description:'부드럽고 매콤한 로제 소스',price:7900,icon:'🌶️'},{id:'rice-roll',name:'참치 꼬마김밥',description:'한입에 쏙 들어가는 김밥',price:5500,icon:'🍙'}]},
  {id:'market-tteok',name:'시장 떡볶이집',category:'분식',icon:'🥟',rating:4.6,delivery:2000,time:'20~30분',badge:'옛날 감성',menus:[{id:'old-tteok',name:'옛날 쌀떡볶이',description:'매콤달콤한 쌀떡',price:6000,icon:'🌶️'},{id:'fried-set',name:'바삭 튀김 6종',description:'오징어·김말이·야채튀김',price:7500,icon:'🥟'}]},
  {id:'mellow-bean',name:'멜로우 빈',category:'카페',icon:'🫘',rating:4.9,delivery:0,time:'15~25분',badge:'원두 선택',menus:[{id:'flat',name:'플랫 화이트',description:'고소한 원두와 부드러운 우유',price:5200,icon:'☕'},{id:'cookie',name:'초코 청크 쿠키',description:'매장에서 구운 촉촉한 쿠키',price:3900,icon:'🍪'}]},
  {id:'peach-room',name:'복숭아 다락',category:'카페',icon:'🍑',rating:4.7,delivery:1200,time:'20~30분',badge:'시즌 메뉴',menus:[{id:'peach-tea',name:'백도 아이스티',description:'향긋한 백도 과육 아이스티',price:5800,icon:'🍑'},{id:'sand',name:'크림 샌드',description:'바삭한 쿠키와 우유 크림',price:4800,icon:'🍪'}]},
  {id:'hanoi-morning',name:'하노이의 아침빛',category:'아시안',icon:'🍜',rating:4.8,delivery:1800,time:'25~40분',badge:'쌀국수 인기',menus:[{id:'pho',name:'양지 쌀국수',description:'맑고 깊은 육수와 양지',price:11500,icon:'🍜'},{id:'spring',name:'새우 짜조',description:'바삭하게 튀긴 베트남식 롤',price:6900,icon:'🥟'}]},
  {id:'taipei-box',name:'타이베이 도시락',category:'아시안',icon:'🍱',rating:4.7,delivery:2000,time:'30~40분',badge:'든든한 한 끼',menus:[{id:'lu',name:'루러우판',description:'달큰하게 조린 돼지고기 덮밥',price:10900,icon:'🍱'},{id:'chicken-rice',name:'대만식 닭고기밥',description:'부드러운 닭고기와 파기름',price:11900,icon:'🍚'}]},
  {id:'night-ocean',name:'밤바다 포차',category:'야식',icon:'🦑',rating:4.7,delivery:2500,time:'35~50분',badge:'야식 추천',menus:[{id:'squid',name:'직화 오징어볶음',description:'불향 가득 매콤한 오징어',price:18900,icon:'🦑'},{id:'clam',name:'시원한 조개탕',description:'조개가 듬뿍 들어간 국물',price:16900,icon:'🥣'}]},
  {id:'moon-pizza',name:'달빛 피자방',category:'야식',icon:'🍕',rating:4.8,delivery:0,time:'30~45분',badge:'배달비 0원',menus:[{id:'moon-cheese',name:'달빛 치즈 피자',description:'네 가지 치즈가 듬뿍',price:19900,icon:'🍕'},{id:'pepperoni',name:'더블 페퍼로니',description:'짭조름한 페퍼로니를 두 배로',price:20900,icon:'🍕'}]},
  {id:'late-burger',name:'늦은밤 버거',category:'야식',icon:'🍔',rating:4.6,delivery:1500,time:'25~35분',badge:'새벽 운영',menus:[{id:'double',name:'더블 치즈 버거',description:'두 장의 패티와 진한 치즈',price:10900,icon:'🍔'},{id:'fries',name:'갈릭 감자튀김',description:'마늘 향 가득 바삭한 감자',price:5900,icon:'🍟'}]}
);
const menuLibrary:Record<string,MenuItem[]>={
  한식:[{id:'lib-k1',name:'돼지 김치찌개',description:'잘 익은 김치와 돼지고기가 푸짐하게',price:9900,icon:'🍲'},{id:'lib-k2',name:'차돌 된장찌개',description:'차돌박이를 넣어 구수하고 진하게',price:10500,icon:'🥘'},{id:'lib-k3',name:'매콤 제육덮밥',description:'불향을 입힌 제육과 따뜻한 밥',price:10900,icon:'🍚'},{id:'lib-k4',name:'소불고기 정식',description:'달큰한 소불고기와 오늘의 반찬',price:13900,icon:'🥩'},{id:'lib-k5',name:'육개장',description:'대파와 소고기를 푹 끓인 얼큰한 국물',price:11000,icon:'🍲'},{id:'lib-k6',name:'돌솥 비빔밥',description:'계절 나물과 고추장을 담은 한 그릇',price:10500,icon:'🍚'},{id:'lib-k7',name:'고등어구이 한상',description:'노릇하게 구운 고등어와 집밥 반찬',price:13500,icon:'🐟'},{id:'lib-k8',name:'계란말이',description:'도톰하고 부드러운 인기 곁들임',price:6500,icon:'🍳'},{id:'lib-k9',name:'공깃밥',description:'따뜻한 흰쌀밥',price:1000,icon:'🍚'}],
  치킨:[{id:'ch-fried',name:'후라이드 치킨',description:'겉은 바삭하고 속은 촉촉한 한 마리',price:18900,icon:'🍗'},{id:'ch-seasoned',name:'양념 치킨',description:'매콤달콤한 전통 양념 한 마리',price:19900,icon:'🍗'},{id:'ch-soy',name:'마늘 간장 치킨',description:'알싸한 마늘과 단짠 간장 소스',price:19900,icon:'🍗'},{id:'ch-half',name:'후라이드＋양념 반반',description:'두 가지 인기 맛을 한 번에',price:19900,icon:'🍗'},{id:'ch-boneless',name:'순살 후라이드',description:'먹기 편한 닭다리살 순살 치킨',price:19900,icon:'🍗'},{id:'ch-hot',name:'매운 양념 치킨',description:'화끈하고 달콤한 매운맛',price:20900,icon:'🌶️'},{id:'ch-wing',name:'윙·봉 16조각',description:'쫄깃한 날개와 봉만 골라 담은 메뉴',price:17900,icon:'🍗'},{id:'ch-tender',name:'치킨 텐더 10조각',description:'담백한 안심살로 만든 바삭 텐더',price:14900,icon:'🍗'},{id:'ch-cheese',name:'치즈볼 5개',description:'쫄깃한 반죽 속 고소한 치즈',price:4500,icon:'🧀'},{id:'ch-fries',name:'케이준 감자튀김',description:'짭조름하고 바삭한 사이드',price:4000,icon:'🍟'}],
  분식:[{id:'lib-s1',name:'국물 떡볶이',description:'쫄깃한 떡과 어묵이 듬뿍',price:6500,icon:'🌶️'},{id:'lib-s2',name:'로제 떡볶이',description:'부드럽고 꾸덕한 로제 소스',price:8500,icon:'🍝'},{id:'lib-s3',name:'찰순대',description:'쫀득한 순대와 소금·쌈장',price:6000,icon:'🍽️'},{id:'lib-s4',name:'모둠 튀김 6개',description:'김말이·오징어·야채튀김 구성',price:6500,icon:'🥟'},{id:'lib-s5',name:'참치 김밥',description:'참치와 신선한 채소가 듬뿍',price:5000,icon:'🍙'},{id:'lib-s6',name:'어묵탕',description:'꼬치 어묵과 따뜻한 국물',price:5500,icon:'🍢'},{id:'lib-s7',name:'쫄면',description:'매콤새콤 양념과 아삭한 채소',price:7500,icon:'🍜'},{id:'lib-s8',name:'분식 2인 세트',description:'떡볶이·순대·튀김·어묵 구성',price:18500,icon:'🍱'}],
  카페:[{id:'lib-c1',name:'아메리카노',description:'깔끔하고 진한 에스프레소',price:4200,icon:'☕'},{id:'lib-c2',name:'카페 라테',description:'고소한 우유와 에스프레소',price:5000,icon:'🥛'},{id:'lib-c3',name:'바닐라 라테',description:'달콤한 바닐라 향의 라테',price:5500,icon:'☕'},{id:'lib-c4',name:'콜드브루',description:'오랜 시간 추출해 부드럽고 깔끔하게',price:5200,icon:'🧊'},{id:'lib-c5',name:'자몽 에이드',description:'상큼한 자몽과 청량한 탄산',price:5800,icon:'🍊'},{id:'lib-c6',name:'초콜릿 라테',description:'진한 초콜릿과 부드러운 우유',price:5600,icon:'🍫'},{id:'lib-c7',name:'뉴욕 치즈케이크',description:'진하고 꾸덕한 치즈 풍미',price:6500,icon:'🍰'},{id:'lib-c8',name:'크루아상',description:'겹겹이 바삭한 버터 크루아상',price:4200,icon:'🥐'}],
  아시안:[{id:'lib-a1',name:'양지 쌀국수',description:'맑고 깊은 육수와 부드러운 양지',price:11500,icon:'🍜'},{id:'lib-a2',name:'새우 팟타이',description:'탱글한 새우와 새콤달콤한 볶음면',price:12900,icon:'🍜'},{id:'lib-a3',name:'나시고렝',description:'불향 가득한 동남아식 볶음밥',price:11900,icon:'🍚'},{id:'lib-a4',name:'똠얌꿍',description:'새우와 향신료의 새콤매콤한 국물',price:14900,icon:'🥣'},{id:'lib-a5',name:'분짜',description:'숯불고기와 쌀국수를 소스에 담가서',price:13500,icon:'🥗'},{id:'lib-a6',name:'짜조 4개',description:'바삭하게 튀긴 베트남식 롤',price:6900,icon:'🥟'},{id:'lib-a7',name:'카오팟',description:'고슬고슬한 태국식 볶음밥',price:10900,icon:'🍚'},{id:'lib-a8',name:'코코넛 커리',description:'부드러운 코코넛 향의 커리와 밥',price:12500,icon:'🍛'}],
  야식:[{id:'lib-n1',name:'마늘 보쌈',description:'부드러운 수육과 알싸한 마늘 소스',price:24900,icon:'🥩'},{id:'lib-n2',name:'불향 무뼈 닭발',description:'화끈한 불맛과 쫄깃한 식감',price:17900,icon:'🔥'},{id:'lib-n3',name:'직화 오돌뼈',description:'매콤한 오돌뼈와 주먹밥',price:18900,icon:'🌶️'},{id:'lib-n4',name:'얼큰 어묵탕',description:'꼬치 어묵이 푸짐한 따뜻한 국물',price:13900,icon:'🍢'},{id:'lib-n5',name:'치즈 피자',description:'고소한 치즈가 듬뿍 올라간 피자',price:19900,icon:'🍕'},{id:'lib-n6',name:'더블 치즈 버거',description:'두 장의 패티와 진한 치즈',price:10900,icon:'🍔'},{id:'lib-n7',name:'직화 오징어볶음',description:'불향 가득 매콤한 오징어',price:18900,icon:'🦑'},{id:'lib-n8',name:'날치알 주먹밥',description:'톡톡 터지는 날치알과 고소한 김가루',price:4500,icon:'🍙'}]
};
const menuSupplement:Record<string,MenuItem[]>={
  한식:[{id:'sup-k1',name:'갈비탕',description:'부드러운 갈비와 맑고 깊은 육수',price:14000,icon:'🍲'},{id:'sup-k2',name:'김치볶음밥',description:'잘 익은 김치로 볶아낸 든든한 한 그릇',price:9000,icon:'🍚'}],
  분식:[{id:'sup-s1',name:'라볶이',description:'라면사리와 떡을 함께 즐기는 메뉴',price:7500,icon:'🍜'},{id:'sup-s2',name:'고기만두 6개',description:'육즙 가득한 따뜻한 찐만두',price:6000,icon:'🥟'}],
  카페:[{id:'sup-c1',name:'카푸치노',description:'풍성한 우유 거품과 진한 에스프레소',price:5000,icon:'☕'},{id:'sup-c2',name:'레몬 티',description:'상큼한 레몬을 담은 향긋한 차',price:5200,icon:'🍋'}],
  아시안:[{id:'sup-a1',name:'소고기 볶음면',description:'채소와 소고기를 센 불에 볶은 면',price:12500,icon:'🍜'},{id:'sup-a2',name:'새우 볶음밥',description:'탱글한 새우와 고슬고슬한 밥',price:11900,icon:'🍤'}],
  야식:[{id:'sup-n1',name:'매콤 골뱅이무침',description:'아삭한 채소와 골뱅이, 소면 구성',price:18900,icon:'🥗'},{id:'sup-n2',name:'해물 김치전',description:'오징어와 김치를 넣어 바삭하게',price:14900,icon:'🥞'}]
};
const shopMenuOverrides:Record<string,MenuItem[]>={
  'oven-garden':[
    {id:'ov1',name:'허브 로스트 치킨',description:'허브 향을 입혀 담백하게 구운 한 마리',price:20900,icon:'🍖'},{id:'ov2',name:'갈릭 로스트 치킨',description:'마늘 풍미를 더한 오븐구이',price:21900,icon:'🍖'},{id:'ov3',name:'블랙페퍼 윙',description:'알싸한 후추 풍미의 오븐 윙',price:17500,icon:'🍗'},{id:'ov4',name:'매콤 바비큐 치킨',description:'매콤한 바비큐 소스를 입힌 구이',price:21900,icon:'🔥'},{id:'ov5',name:'순살 오븐 치킨',description:'먹기 편한 닭다리살 순살 구이',price:20900,icon:'🍗'},{id:'ov6',name:'오븐 치킨 반반',description:'허브와 갈릭 두 가지 맛',price:22900,icon:'🍖'},{id:'ov7',name:'구운 통감자',description:'오븐에 구운 포슬포슬한 감자',price:4500,icon:'🥔'},{id:'ov8',name:'콘치즈',description:'달콤한 옥수수와 고소한 치즈',price:5000,icon:'🌽'},{id:'ov9',name:'신선한 코울슬로',description:'아삭하고 산뜻한 양배추 샐러드',price:3500,icon:'🥗'},{id:'ov10',name:'제로 콜라 1.25L',description:'치킨과 함께 마시는 탄산음료',price:2500,icon:'🥤'}],
  'night-ocean':[
    {id:'sea1',name:'직화 오징어볶음',description:'불향 가득 매콤한 오징어',price:18900,icon:'🦑'},{id:'sea2',name:'시원한 조개탕',description:'조개가 듬뿍 들어간 맑은 국물',price:16900,icon:'🥣'},{id:'sea3',name:'모둠 해물찜',description:'오징어·새우·홍합을 매콤하게',price:29900,icon:'🦐'},{id:'sea4',name:'골뱅이 소면',description:'매콤새콤한 골뱅이무침과 소면',price:18900,icon:'🥗'},{id:'sea5',name:'해물 김치전',description:'오징어와 김치를 넣어 바삭하게',price:14900,icon:'🥞'},{id:'sea6',name:'버터구이 오징어',description:'고소한 버터 향의 통오징어 구이',price:15900,icon:'🦑'},{id:'sea7',name:'새우 소금구이',description:'탱글한 새우를 소금 위에 구워서',price:22900,icon:'🍤'},{id:'sea8',name:'홍합탕',description:'청양고추를 넣은 칼칼한 홍합 국물',price:14900,icon:'🥣'},{id:'sea9',name:'날치알 주먹밥',description:'날치알과 김가루를 넣어 고소하게',price:4500,icon:'🍙'},{id:'sea10',name:'우동사리',description:'해물 국물에 잘 어울리는 사리',price:2500,icon:'🍜'}],
  'moon-pizza':[
    {id:'pz1',name:'클래식 치즈 피자',description:'모짜렐라 치즈가 듬뿍',price:18900,icon:'🍕'},{id:'pz2',name:'더블 페퍼로니 피자',description:'짭조름한 페퍼로니를 두 배로',price:20900,icon:'🍕'},{id:'pz3',name:'고구마 무스 피자',description:'달콤한 고구마와 부드러운 치즈',price:21900,icon:'🍕'},{id:'pz4',name:'불고기 피자',description:'달큰한 불고기와 양파 토핑',price:22900,icon:'🍕'},{id:'pz5',name:'매콤 치킨 피자',description:'매콤한 치킨과 할라피뇨',price:22900,icon:'🍕'},{id:'pz6',name:'하와이안 피자',description:'햄과 파인애플의 달콤짭짤한 조합',price:21900,icon:'🍍'},{id:'pz7',name:'반반 피자',description:'원하는 두 가지 맛을 한 판에',price:23900,icon:'🍕'},{id:'pz8',name:'오븐 스파게티',description:'치즈를 듬뿍 올려 구운 토마토 파스타',price:8900,icon:'🍝'},{id:'pz9',name:'버팔로 윙 8조각',description:'매콤한 소스를 입힌 바삭한 윙',price:9900,icon:'🍗'},{id:'pz10',name:'갈릭디핑 소스',description:'피자와 잘 어울리는 고소한 소스',price:500,icon:'🧄'}],
  'late-burger':[
    {id:'bg1',name:'클래식 치즈 버거',description:'소고기 패티와 체더치즈',price:7900,icon:'🍔'},{id:'bg2',name:'더블 치즈 버거',description:'두 장의 패티와 진한 치즈',price:10900,icon:'🍔'},{id:'bg3',name:'베이컨 에그 버거',description:'베이컨과 계란을 더한 든든한 버거',price:9900,icon:'🍔'},{id:'bg4',name:'매콤 치킨 버거',description:'바삭한 닭다리살과 매콤 소스',price:8500,icon:'🍔'},{id:'bg5',name:'새우 버거',description:'통새우살 패티와 타르타르 소스',price:8500,icon:'🍤'},{id:'bg6',name:'머시룸 버거',description:'버섯과 양파를 볶아 올린 버거',price:9500,icon:'🍄'},{id:'bg7',name:'갈릭 감자튀김',description:'마늘 향 가득 바삭한 감자',price:5900,icon:'🍟'},{id:'bg8',name:'어니언링 8개',description:'달큰한 양파를 바삭하게 튀겨서',price:4500,icon:'🧅'},{id:'bg9',name:'치킨 너겟 6개',description:'한입 크기의 바삭한 치킨 너겟',price:4500,icon:'🍗'},{id:'bg10',name:'제로 콜라',description:'깔끔한 제로 탄산음료',price:2000,icon:'🥤'}]
};
shops.forEach(shop=>{const library=shopMenuOverrides[shop.id]??[...(menuLibrary[shop.category]??[]),...(menuSupplement[shop.category]??[])];const combined=shopMenuOverrides[shop.id]?library:[...shop.menus,...library.map(x=>({...x,id:`${shop.id}-${x.id}`}))];shop.menus=[...new Map(combined.map(menu=>[menu.name,menu])).values()].slice(0,10)});
const beverageMenus:Record<string,MenuItem[]>={
  한식:[{id:'drink-sikhye',name:'수제 식혜',description:'은은하게 달콤한 전통 음료',price:3000,icon:'🥤',section:'음료'},{id:'drink-cola',name:'콜라 500ml',description:'시원한 탄산음료',price:2500,icon:'🥤',section:'음료'},{id:'drink-zero',name:'제로 콜라 500ml',description:'당류 없이 깔끔한 탄산',price:2500,icon:'🥤',section:'음료'}],
  분식:[{id:'drink-coolpis',name:'복숭아 유산균 음료',description:'매운맛을 달래는 달콤한 음료',price:2000,icon:'🧃',section:'음료'},{id:'drink-cola',name:'콜라 500ml',description:'시원한 탄산음료',price:2500,icon:'🥤',section:'음료'},{id:'drink-zero',name:'제로 콜라 500ml',description:'당류 없이 깔끔한 탄산',price:2500,icon:'🥤',section:'음료'}],
  카페:[{id:'drink-water',name:'생수 500ml',description:'차갑게 준비한 생수',price:1500,icon:'💧',section:'음료'}],
  아시안:[{id:'drink-thai',name:'타이 밀크티',description:'홍차와 우유의 달콤하고 진한 풍미',price:4500,icon:'🧋',section:'음료'},{id:'drink-lychee',name:'리치 에이드',description:'향긋한 리치와 탄산',price:4500,icon:'🥤',section:'음료'},{id:'drink-zero',name:'제로 콜라 500ml',description:'당류 없이 깔끔한 탄산',price:2500,icon:'🥤',section:'음료'}],
  치킨:[{id:'drink-cola125',name:'콜라 1.25L',description:'치킨과 어울리는 시원한 탄산',price:3000,icon:'🥤',section:'음료·주류'},{id:'drink-zero125',name:'제로 콜라 1.25L',description:'당류 없이 깔끔한 대용량 탄산',price:3000,icon:'🥤',section:'음료·주류'},{id:'drink-beer500',name:'라거 맥주 500ml',description:'성인 메뉴 · 실제 판매가 아닌 가상 주문',price:4500,icon:'🍺',section:'음료·주류'},{id:'drink-nonalcohol',name:'무알코올 맥주 330ml',description:'가볍고 청량한 무알코올 음료',price:3500,icon:'🍺',section:'음료·주류'}],
  야식:[{id:'drink-cola',name:'콜라 500ml',description:'시원한 탄산음료',price:2500,icon:'🥤',section:'음료·주류'},{id:'drink-zero',name:'제로 콜라 500ml',description:'당류 없이 깔끔한 탄산',price:2500,icon:'🥤',section:'음료·주류'},{id:'drink-soju',name:'맑은 소주 360ml',description:'성인 메뉴 · 실제 판매가 아닌 가상 주문',price:5000,icon:'🍶',section:'음료·주류'},{id:'drink-beer',name:'라거 맥주 500ml',description:'성인 메뉴 · 실제 판매가 아닌 가상 주문',price:4500,icon:'🍺',section:'음료·주류'},{id:'drink-highball',name:'레몬 하이볼',description:'성인 메뉴 · 실제 판매가 아닌 가상 주문',price:7000,icon:'🥃',section:'음료·주류'}]
};
const drinkCalories=(name:string)=>/제로|생수/.test(name)?0:/소주/.test(name)?400:/하이볼/.test(name)?180:/무알코올/.test(name)?70:/맥주/.test(name)?215:/1\.25L/.test(name)?525:/콜라 500/.test(name)?210:/식혜/.test(name)?160:/유산균/.test(name)?120:/밀크티/.test(name)?250:/에이드/.test(name)?180:120;
shops.forEach(shop=>{shop.menus.push(...(beverageMenus[shop.category]??[]).map(x=>({...x,id:`${shop.id}-${x.id}`,calories:drinkCalories(x.name)})))});
const emptyData: AppData = { records: [], goals: [] };
const demoStories: Story[] = [
  {id:'demo-1',nickname:'주말엔 산책',title:'야식비를 모아 제주도에 다녀왔어요',body:'매번 배달앱을 켤 때 가상 장바구니에 먼저 담았어요. 10분만 기다려보니 생각보다 자주 마음이 지나갔고, 5개월 뒤 정말 여행을 떠났습니다.',goal:'제주도 여행',amount:620000,period:'5개월',tag:'여행',createdAt:'베타 후기',featured:true},
  {id:'demo-2',nickname:'라테는 집에서',title:'작은 커피값이 비상금이 됐어요',body:'매일 한 번의 선택을 기록했을 뿐인데 숫자로 보이니까 계속하고 싶어졌어요. 목표를 채운 날의 뿌듯함은 아직도 기억나요.',goal:'비상금 만들기',amount:300000,period:'3개월',tag:'비상금',createdAt:'베타 후기'},
];
const money = (n: number) => n.toLocaleString('ko-KR');
const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthKey = () => dateKey().slice(0, 7);
const getCategory = (id: string) => categories.find(c => c.id === id) ?? categories[6];
// 스프라이트 한 장에 음식 사진 20칸(5열 4행)이 들어 있다. 칸 번호로 잘라 쓴다.
// 0 김치찌개 / 1 소불고기 / 2 비빔밥 / 3 순두부 / 4 후라이드
// 5 양념치킨 / 6 순살+치즈볼 / 7 국물떡볶이 / 8 로제떡볶이+순대 / 9 김밥+어묵탕
// 10 아메리카노+크루아상 / 11 라테+치즈케이크 / 12 딸기케이크 / 13 쌀국수 / 14 팟타이
// 15 마라탕 / 16 보쌈 / 17 닭발+주먹밥 / 18 피자 / 19 버거+감자튀김
const PHOTO_COLUMNS = 5;
const PHOTO_ROWS = 4;
const PHOTO_COUNT = PHOTO_COLUMNS * PHOTO_ROWS;
const photoPools: Record<string, number[]> = { 한식:[0,1,2,3], 치킨:[4,5,6], 분식:[7,8,9], 카페:[10,11,12], 아시안:[13,14,15], 야식:[16,17,18,19], 기타:[19,10,7] };
const hashOf = (text: string) => [...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
const shopPhotoIndex = (shop: Shop) => { const pool = photoPools[shop.category] ?? [0]; return pool[hashOf(shop.id) % pool.length]; };
// 대표 사진 1장 + 곁들임 사진 2장. 반드시 같은 카테고리 사진만 쓴다.
// 사진 수가 모자라면 다른 음식을 끌어오지 않고, 같은 사진을 확대해서 다른 컷처럼 보이게 한다.
const shopPhotoSet = (shop: Shop): { index: number; zoom: number }[] => {
  const pool = photoPools[shop.category] ?? [0];
  const seed = hashOf(shop.id);
  return [0, 1, 2].map(slot => {
    const index = pool[(seed + slot) % pool.length];
    const repeated = slot > 0 && pool.length <= slot;
    return { index, zoom: repeated ? slot : 0 };
  });
};
const foodPhotoStyle=(index:number)=>({'--photo-x':`${(index%PHOTO_COLUMNS)*(100/(PHOTO_COLUMNS-1))}%`,'--photo-y':`${Math.floor(index/PHOTO_COLUMNS)*(100/(PHOTO_ROWS-1))}%`} as React.CSSProperties);
const reviewCount = (shop: Shop) => Math.round(shop.rating * 317) + (hashOf(shop.id) % 900);

export default function Home() {
  const [tab, setTab] = useState<Tab>('home');
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adInquiryOpen, setAdInquiryOpen] = useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [profile,setProfile]=useState<Profile>({authenticated:false});
  const [syncReady,setSyncReady]=useState(false);
  const [savings,setSavings]=useState<SavingsQueue>({account:null,pending:[],transferred:0});
  const [savingsMode,setSavingsMode]=useState<'account'|'transfer'|null>(null);
  const [communityStories, setCommunityStories] = useState<Story[]>(demoStories);
  const [success, setSuccess] = useState<RecordItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [historyDate, setHistoryDate] = useState(dateKey());
  const [isAdmin, setIsAdmin] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR, so persisted state must be hydrated in an effect (saved records and goals).
    try { const stored = localStorage.getItem('chamatta-data-v1'); if (stored) setData(JSON.parse(stored)); } catch { /* start clean */ }
    try { const stored = localStorage.getItem('chamatta-savings-v1'); if(stored)setSavings(JSON.parse(stored)); } catch { /* device-only account starts empty */ }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    try { if (!localStorage.getItem('chamatta-onboarded-v1')) setOnboarding(true); } catch { /* 저장소를 못 쓰면 건너뛴다 */ }
    setLoaded(true);
  }, []);
  useEffect(() => { fetch('/api/admin/stories').then(r => { if (r.ok) setIsAdmin(true); }).catch(() => undefined); }, []);
  useEffect(() => { if (loaded) localStorage.setItem('chamatta-data-v1', JSON.stringify(data)); }, [data, loaded]);
  useEffect(()=>{if(loaded)localStorage.setItem('chamatta-savings-v1',JSON.stringify(savings))},[savings,loaded]);
  useEffect(() => { fetch('/api/stories').then(r=>r.ok?r.json() as Promise<StoriesResponse>:Promise.reject()).then(payload=>setCommunityStories([...(payload.pending??[]),...(payload.stories??[]),...demoStories])).catch(()=>setCommunityStories([...(data.stories??[]),...demoStories])); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR, so persisted state must be hydrated in an effect (saved profile).
  useEffect(()=>{const local=localStorage.getItem('chamatta-local-profile');if(local){try{setProfile(JSON.parse(local));return}catch{localStorage.removeItem('chamatta-local-profile')}}fetch('/api/profile').then(r=>r.json() as Promise<Profile>).then(setProfile).catch(()=>undefined)},[]);
  useEffect(()=>{if(!loaded||!profile.authenticated)return;fetch('/api/data').then(r=>r.ok?r.json() as Promise<UserDataResponse>:Promise.reject()).then(async cloud=>{if(cloud.hasData)setData({records:cloud.records??[],goals:cloud.goals??[]});else if(data.records.length||data.goals.length)await fetch('/api/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({records:data.records,goals:data.goals})});setSyncReady(true)}).catch(()=>setSyncReady(false))},[loaded,profile.authenticated]);
  useEffect(()=>{if(!syncReady||!profile.authenticated)return;const timer=setTimeout(()=>fetch('/api/data',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({records:data.records,goals:data.goals})}).catch(()=>undefined),500);return()=>clearTimeout(timer)},[data.records,data.goals,syncReady,profile.authenticated]);

  const saved = data.records.filter(r => r.result === 'saved');
  const monthRecords = data.records.filter(r => r.date.startsWith(monthKey()));
  const monthSavedRecords = monthRecords.filter(r => r.result === 'saved');
  const monthSaved = monthSavedRecords.reduce((sum, r) => sum + r.amount, 0);
  const todaySaved = saved.filter(r => r.date === dateKey()).reduce((sum, r) => sum + r.amount, 0);
  const totalSaved = saved.reduce((sum, r) => sum + r.amount, 0);
  const defenseRate = monthRecords.length ? Math.round(monthSavedRecords.length / monthRecords.length * 100) : 0;
  const streak = useMemo(() => {
    const days = new Set(saved.map(r => r.date)); let count = 0; const cursor = new Date();
    if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(dateKey(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
    return count;
  }, [saved]);

  const addRecord = (record: Omit<RecordItem, 'id'>) => {
    const item = { ...record, id: crypto.randomUUID() };
    setData(prev => ({ ...prev, records: [item, ...prev.records] })); setRecordOpen(false);
    if (item.result === 'saved') setSuccess(item); else setTab('history');
  };
  const addGoal = (goal: Omit<Goal, 'id'>) => { setData(prev => ({ ...prev, goals: [...prev.goals, { ...goal, id: crypto.randomUUID() }] })); setGoalOpen(false); };
  const removeRecord = (id: string) => setData(prev => ({ ...prev, records: prev.records.filter(r => r.id !== id) }));

  return (
    <main className="app-shell">
      {tab !== 'market' && <header className="topbar">
        <button className="brand-button" onClick={() => setTab('home')} aria-label="홈으로"><span>ㅊ</span><div><strong>참았다!</strong><small>안 쓴 돈이 보이기 시작한다.</small></div></button>
        <div className="streak-pill">🔥 {streak}일</div>
      </header>}

      {tab === 'home' && <HomeView monthSaved={monthSaved} todaySaved={todaySaved} totalSaved={totalSaved} streak={streak} records={data.records} goals={data.goals} openRecord={() => setRecordOpen(true)} goMarket={() => setTab('market')} goHistory={() => setTab('history')} goGoals={() => setTab('goals')} />}
      {tab === 'market' && <MarketView cart={cart} setCart={setCart} stories={communityStories} openStory={() => setStoryOpen(true)} openAdInquiry={() => setAdInquiryOpen(true)} openSettings={() => setSettingsOpen(true)} finishOrder={(result, total, memo, calories) => { addRecord({ category:'배달', amount:total, memo, result, date:dateKey(), calories }); setCart([]); }} />}
      {tab === 'history' && <HistoryView records={data.records} selectedDate={historyDate} setSelectedDate={setHistoryDate} removeRecord={removeRecord} goStats={() => setTab('stats')} />}
      {tab === 'stats' && <StatsView records={monthRecords} savedAmount={monthSaved} rate={defenseRate} totalSaved={totalSaved} savings={savings} openSavings={(mode)=>setSavingsMode(mode)} goHistory={() => setTab('history')} />}
      {tab === 'goals' && <GoalsView goals={data.goals} totalSaved={totalSaved} profile={profile} savings={savings} isAdmin={isAdmin} openSavings={(mode)=>setSavingsMode(mode)} openProfile={()=>setProfileOpen(true)} openSettings={()=>setSettingsOpen(true)} openGoal={() => setGoalOpen(true)} openAdmin={() => setAdminOpen(true)} removeGoal={(id) => setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))} />}

      <nav className="bottom-nav" aria-label="주요 메뉴">
        <NavButton label="홈" icon="⌂" active={tab === 'home'} onClick={() => setTab('home')} />
        <NavButton label="상점" icon="⊞" active={tab === 'market'} onClick={() => setTab('market')} />
        <button className="nav-action" onClick={() => setRecordOpen(true)} aria-label="새 기록"><span>＋</span></button>
        <NavButton label="리포트" icon="▥" active={tab === 'stats' || tab === 'history'} onClick={() => setTab('stats')} />
        <NavButton label="마이" icon="◇" active={tab === 'goals'} onClick={() => setTab('goals')} />
      </nav>

      {recordOpen && <RecordModal onClose={() => setRecordOpen(false)} onSubmit={addRecord} />}
      {goalOpen && <GoalModal onClose={() => setGoalOpen(false)} onSubmit={addGoal} />}
      {storyOpen && <StoryModal onClose={() => setStoryOpen(false)} onSubmit={async (story) => { const optimistic:Story={...story,id:crypto.randomUUID(),createdAt:'방금 전',status:'pending'}; setCommunityStories(v=>[optimistic,...v]); setStoryOpen(false); try { const response=await fetch('/api/stories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(story)}); if(!response.ok) throw new Error(); } catch { setData(prev=>({...prev,stories:[optimistic,...(prev.stories??[])]})); } }} />}
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
      {adInquiryOpen && <AdInquiryModal onClose={() => setAdInquiryOpen(false)} />}
      {profileOpen && <ProfileModal profile={profile} onSaved={p=>{setProfile(p);setProfileOpen(false)}} onClose={()=>setProfileOpen(false)}/>} 
      {settingsOpen && <SettingsModal profile={profile} openProfile={()=>{setSettingsOpen(false);setProfileOpen(true)}} onClose={()=>setSettingsOpen(false)}/>} 
      {savingsMode&&<SavingsModal mode={savingsMode} value={savings} onChange={setSavings} onClose={()=>setSavingsMode(null)}/>} 
      {onboarding && <Onboarding onDone={() => { try { localStorage.setItem('chamatta-onboarded-v1', '1'); } catch { /* 저장소를 못 쓰면 다음에 다시 보여준다 */ } setOnboarding(false); }} />}
      {success && <SuccessModal record={success} total={totalSaved} streak={streak} onQueue={()=>{setSavings(v=>v.pending.some(p=>p.id===success.id)?v:{...v,pending:[...v.pending,{id:success.id,amount:success.amount,memo:success.memo||success.category,date:success.date}]});setSuccess(null);setSavingsMode(savings.account?'transfer':'account')}} onClose={() => setSuccess(null)} />}
    </main>
  );
}

const onboardingSteps = [
  { icon: '🛒', title: '사고 싶은 걸 장바구니에 담아요', text: '가상 상점에서 진짜 배달앱처럼 메뉴를 고릅니다. 상점·메뉴·별점은 모두 만들어낸 가상 정보예요.' },
  { icon: '🛡️', title: '결제 직전에 한 번 더 생각해요', text: '“가상 배달”을 시작하면 마음이 식는 동안 배달 여정이 진행돼요. 실제 결제도, 실제 배달도 일어나지 않습니다.' },
  { icon: '🏦', title: '참은 금액이 내 저축이 돼요', text: '지킨 돈은 기록·통계·목표로 쌓입니다. 실제 이체는 사용자가 직접 은행 앱에서 진행해요.' },
];

function Onboarding({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const last = index === onboardingSteps.length - 1;
  const step = onboardingSteps[index];
  return <div className="onboarding" role="dialog" aria-modal="true" aria-label="참았다! 사용 안내">
    <button className="onboarding-skip" onClick={onDone}>건너뛰기</button>
    <div className="onboarding-body">
      <span className="onboarding-icon">{step.icon}</span>
      <span className="eyebrow">참았다! 사용법 {index + 1}/{onboardingSteps.length}</span>
      <h2>{step.title}</h2>
      <p>{step.text}</p>
    </div>
    <div className="onboarding-dots">{onboardingSteps.map((s, i) => <i key={s.title} className={i === index ? 'active' : ''} />)}</div>
    <div className="onboarding-note">이 앱은 실제 음식 주문·배달·결제 서비스가 아닙니다.</div>
    <button className="onboarding-next" onClick={() => last ? onDone() : setIndex(i => i + 1)}>{last ? '시작하기' : '다음'}</button>
  </div>;
}

function NavButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) { return <button className={active ? 'active' : ''} onClick={onClick}><span>{icon}</span>{label}</button>; }

function HomeView({ monthSaved, todaySaved, totalSaved, streak, records, goals, openRecord, goMarket, goHistory, goGoals }: { monthSaved: number; todaySaved: number; totalSaved: number; streak: number; records: RecordItem[]; goals: Goal[]; openRecord: () => void; goMarket: () => void; goHistory: () => void; goGoals: () => void }) {
  const goal = goals[0]; const percent = goal ? Math.min(100, Math.round(totalSaved / goal.amount * 100)) : 0;
  return <div className="page home-page">
    <section className="hero-card">
      <div className="hero-copy"><span className="eyebrow">이번 달 방어 금액</span><h1>{money(monthSaved)}<small>원</small></h1><p>{monthSaved ? '좋아요. 작은 선택들이 모이고 있어요.' : '첫 소비 유혹을 막고 기록해보세요.'}</p></div>
      <div className="shield" aria-hidden="true"><span>✓</span></div>
      <div className="hero-bottom"><span>오늘 지킨 돈</span><b>{money(todaySaved)}원</b><span className="hero-divider" /><span>연속 방어</span><b>{streak}일</b></div>
    </section>
    <button className="primary-cta" onClick={openRecord}><span>＋</span><b>참았다!</b><small>방금 넘긴 소비 유혹 기록하기</small></button>
    <button className="market-entry" onClick={goMarket}><span>🛵</span><div><small>새로운 방어 훈련</small><b>가상 상점에서 주문해보기</b><em>결제 직전, 한 번 더 생각해요</em></div><i>›</i></button>
    {goal ? <button className="goal-card home-goal" onClick={goGoals}>
      <div className="goal-top"><div><span className="eyebrow">나의 첫 번째 목표</span><h2>{goal.emoji} {goal.name}</h2></div><b>{percent}%</b></div>
      <div className="progress"><i style={{ width: `${percent}%` }} /></div><div className="goal-numbers"><span><b>{money(totalSaved)}원</b> 지켰어요</span><span>목표 {money(goal.amount)}원</span></div>
    </button> : <button className="empty-goal" onClick={goGoals}><span>◎</span><div><b>지킨 돈에 목적지를 만들어볼까요?</b><small>여행, 비상금, 갖고 싶던 물건까지</small></div><i>›</i></button>}
    <section className="section-block"><div className="section-title"><h2>최근 기록</h2>{records.length > 0 && <button onClick={goHistory}>전체 보기</button>}</div>{records.length ? <RecordList records={records.slice(0, 4)} /> : <Empty icon="🌱" title="아직 기록이 없어요" text="오늘 참은 작은 소비부터 남겨보세요." action="첫 기록 남기기" onAction={openRecord} />}</section>
  </div>;
}

function MarketView({ cart, setCart, stories, openStory, openAdInquiry, openSettings, finishOrder }: { cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; stories: Story[]; openStory: () => void; openAdInquiry: () => void; openSettings: () => void; finishOrder: (result: Result, total: number, memo: string, calories?:number) => void }) {
  const [step, setStep] = useState<'list'|'shop'|'cart'|'checkout'>('list');
  const [filter, setFilter] = useState('전체');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<Shop | null>(null);
  const [payMethod, setPayMethod] = useState('간편결제');
  const [pace,setPace]=useState('천천히 생각');
  const [optionMenu,setOptionMenu]=useState<{menu:MenuItem;shop:Shop}|null>(null);
  const [journey,setJourney]=useState<{total:number;calories:number;memo:string}|null>(null);
  const [campaign,setCampaign]=useState<Campaign|null>(null);
  const [customMenus,setCustomMenus]=useState<MenuItem[]>([]);
  const [customMenuOpen,setCustomMenuOpen]=useState(false);
  useEffect(()=>{fetch('/api/ads').then(r=>r.json() as Promise<AdsResponse>).then(p=>setCampaign((p.campaigns??[]).find((x:Campaign)=>x.placement==='market')??null)).catch(()=>undefined)},[]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR, so persisted state must be hydrated in an effect (custom menus).
  useEffect(()=>{try{const x=localStorage.getItem('chamatta-custom-menus-v1');if(x)setCustomMenus(JSON.parse(x))}catch{}},[]);
  useEffect(()=>{localStorage.setItem('chamatta-custom-menus-v1',JSON.stringify(customMenus))},[customMenus]);
  const customShop:Shop={id:'my-menu-shop',name:'나만의 메뉴 상점',category:'기타',icon:'👩‍🍳',rating:5,delivery:0,time:'바로 체험',badge:'내가 등록',menus:customMenus};
  const allShops=customMenus.length?[customShop,...shops]:shops;
  const filtered = allShops.filter(s => (filter === '전체' || s.category === filter) && (!query.trim() || `${s.name} ${s.category} ${s.menus.map(m=>m.name).join(' ')}`.includes(query.trim())));
  const menuCount = allShops.reduce((sum, s) => sum + s.menus.length, 0);
  const popular = allShops.filter(s=>s.menus.length).slice(0,5).map((shop,index)=>({shop,menu:shop.menus[0],rank:index+1}));
  const itemTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = cart.length ? (allShops.find(s => s.id === cart[0].shopId)?.delivery ?? 0) : 0;
  const total = itemTotal + delivery;
  const totalCalories=cart.reduce((s,i)=>s+(i.calories??Math.round(i.price/14))*i.quantity,0);
  const add = (menu: MenuItem, shop: Shop) => setCart(prev => { const sameShop = prev.filter(i => i.shopId === shop.id); const found = sameShop.find(i => i.id === menu.id); return found ? sameShop.map(i => i.id === menu.id ? {...i,quantity:i.quantity+1}:i) : [...sameShop,{...menu,quantity:1,shopId:shop.id,shopName:shop.name}]; });
  const quantity = (id: string, delta: number) => setCart(prev => prev.map(i => i.id === id ? {...i,quantity:i.quantity+delta}:i).filter(i => i.quantity > 0));

  if (journey) return <DeliveryJourney amount={journey.total} calories={journey.calories} pace={pace} onComplete={()=>{finishOrder('saved',journey.total,journey.memo,journey.calories);setCart([]);setJourney(null);setSelected(null);setStep('list')}} onCancel={()=>setJourney(null)}/>;
  if (step === 'shop' && selected) return <div className="page market-page"><MarketHeader title={selected.name} back={() => setStep('list')} cartCount={cart.reduce((s,i)=>s+i.quantity,0)} openCart={() => setStep('cart')} /><section className="shop-hero"><span>{selected.icon}</span><div><small>{selected.category} · {selected.time}</small><h1>{selected.name}</h1><p>★ {selected.rating} · 배달비 {selected.delivery ? `${money(selected.delivery)}원` : '무료'}</p></div></section><div className="shop-notice">이곳의 상점과 주문은 모두 가상 체험입니다.</div><section className="menu-list"><h2>대표 메뉴</h2>{selected.menus.map((m,i) => <Fragment key={m.id}>{m.section&&selected.menus.findIndex(x=>x.section===m.section)===i&&<div className="menu-section-title"><span>🥤</span><div><h2>{m.section}</h2><small>주류는 성인용 가상 메뉴이며 실제 판매·결제되지 않아요.</small></div></div>}<article className="menu-card" data-option-profile={optionProfileForName(m.name).id}><div className="menu-copy"><h3>{m.name}</h3><p>{m.description}</p><small>🔥 약 {m.calories??Math.round(m.price/14)} kcal</small><b>{money(m.price)}원</b><button onClick={() => setOptionMenu({menu:m,shop:selected})}>옵션 선택 · 담기</button></div><span>{m.icon}</span></article></Fragment>)}</section>{optionMenu&&<MenuOptionsModal menu={optionMenu.menu} onClose={()=>setOptionMenu(null)} onAdd={item=>{add(item,optionMenu.shop);setOptionMenu(null)}}/>}{cart.length > 0 && <button className="floating-cart" onClick={() => setStep('cart')}><span>{cart.reduce((s,i)=>s+i.quantity,0)}</span><b>장바구니 보기</b><strong>{money(total)}원</strong></button>}</div>;

  if (step === 'cart') return <div className="page market-page"><MarketHeader title="장바구니" back={() => setStep(selected ? 'shop':'list')} cartCount={0} openCart={() => undefined} />{cart.length ? <><section className="cart-shop"><small>가상 상점</small><h2>{cart[0].shopName}</h2>{cart.map(i => <div className="cart-row" key={i.id}><span>{i.icon}</span><div><b>{i.name}</b><small>{money(i.price)}원</small></div><div className="quantity"><button onClick={() => quantity(i.id,-1)}>−</button><b>{i.quantity}</b><button onClick={() => quantity(i.id,1)}>＋</button></div></div>)}</section><section className="bill"><div><span>메뉴 금액</span><b>{money(itemTotal)}원</b></div><div><span>배달비</span><b>{delivery ? `${money(delivery)}원` : '무료'}</b></div><div className="bill-total"><span>총 주문금액</span><b>{money(total)}원</b></div></section><button className="checkout-button" onClick={() => setStep('checkout')}>{money(total)}원 주문하기</button></> : <Empty icon="🛒" title="장바구니가 비었어요" text="가상 상점에서 먹고 싶은 메뉴를 골라보세요." action="상점 둘러보기" onAction={() => setStep('list')} />}</div>;

  if (step === 'checkout') return <div className="page market-page"><MarketHeader title="모의 결제" back={() => setStep('cart')} cartCount={0} openCart={() => undefined} /><div className="simulation-banner"><span>i</span><p><b>실제 결제가 아니에요</b><br/>카드·계좌 정보는 입력하거나 저장하지 않습니다.</p></div><section className="checkout-card"><h2>주문 정보</h2><div><span>{cart[0]?.shopName}</span><b>{cart.reduce((s,i)=>s+i.quantity,0)}개 메뉴</b></div><div><span>예상 열량</span><b>약 {money(totalCalories)} kcal</b></div><div><span>결제 예정 금액</span><strong>{money(total)}원</strong></div></section><section className="payment-card"><h2>결제 수단 체험</h2>{['간편결제','신용·체크카드','현장 결제'].map(p => <button className={payMethod===p?'selected':''} onClick={() => setPayMethod(p)} key={p}><span>{p==='간편결제'?'⚡':p==='신용·체크카드'?'▣':'⌂'}</span><b>{p}</b><i>{payMethod===p?'●':'○'}</i></button>)}</section><section className="pace-card"><h2>마음을 식힐 시간을 골라요</h2>{['빠르게 정리','천천히 생각'].map(p=><button className={pace===p?'selected':''} key={p} onClick={()=>setPace(p)}><span>{p==='빠르게 정리'?'⚡':'🌿'}</span><div><b>{p}</b><small>{p==='빠르게 정리'?'짧은 가상 배달 체험':'조금 더 천천히 생각하기'}</small></div><i>{pace===p?'●':'○'}</i></button>)}</section><section className="decision-zone"><span>결제 직전 마지막 선택</span><h2>이 {money(total)}원, 정말 쓸까요?</h2><p>어떤 선택이든 기록하면 다음 판단이 쉬워져요.</p><button className="defend-order" onClick={() => setJourney({total,calories:totalCalories,memo:`${cart[0]?.shopName} 가상 주문`})}>🛡️ 가상 배달을 시작하고 참기</button><button className="buy-order" onClick={() => { finishOrder('spent',total,`${cart[0]?.shopName ?? '가상 상점'} 가상 주문`,totalCalories); setSelected(null); setStep('list'); }}>모의 결제 완료 · 결국 샀다</button></section></div>;

  return <div className="page market-page delivery-home">
    <div className="market-sticky"><header className="delivery-home-head"><div><button className="market-brand">참았다! 가상 상점</button></div><button className="head-settings" onClick={openSettings} aria-label="설정">⚙</button><button className="head-cart" onClick={() => setStep('cart')} aria-label="장바구니">🛒{cart.length > 0 && <i>{cart.reduce((s,i)=>s+i.quantity,0)}</i>}</button></header>
    <label className="food-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="상점이나 메뉴를 검색해보세요"/><button onClick={()=>setQuery('')} aria-label="검색어 지우기">{query?'×':'↵'}</button></label></div>
    <section className="category-bubbles">{shopCategories.map(c => {
      if (c === '전체') return <button className={filter===c?'selected':''} onClick={()=>setFilter(c)} key={c}><span className="category-photo collage">{[4,7,10,16].map(i=><i key={i} style={foodPhotoStyle(i)} />)}</span><b>{c}</b></button>;
      const sample = shops.find(s=>s.category===c);
      return <button className={filter===c?'selected':''} onClick={()=>setFilter(c)} key={c}><span className="category-photo" style={sample?foodPhotoStyle(shopPhotoIndex(sample)):undefined} /><b>{c}</b></button>;
    })}</section>
    <section className="delivery-promo"><div><span>첫 가상 주문 도전</span><h1>먹고 싶은 메뉴를 담고<br/>결제 직전 한 번 더 생각해요</h1><p>실제 결제 없이 절약 습관만 남아요</p></div><span>🛵</span></section>
    <section className="popular-section"><div className="popular-heading"><div><span>TODAY&apos;S POPULAR</span><h2>지금 많이 참는 메뉴</h2><p>가상 주문에서 가장 자주 선택된 메뉴예요.</p></div></div><div className="popular-scroll">{popular.map(({shop,menu,rank})=><button key={shop.id} onClick={()=>{setSelected(shop);setStep('shop')}}><span className="popular-photo" style={foodPhotoStyle(shopPhotoIndex(shop))}><i>{rank}</i></span><b>{menu.name}</b><small>{shop.name}</small><em>{money(menu.price)}원</em></button>)}</div></section>
    <section className="story-section"><div className="story-heading"><div><span>GOAL STORIES</span><h2>참은 사람들의 도착 후기</h2><p>진짜 목표를 이룬 순간을 나눠요.</p></div><button onClick={openStory}>후기 쓰기</button></div><div className="story-scroll">{stories.slice(0,4).map(s => <article className={s.featured?'story-card featured':'story-card'} key={s.id}><div><span>{s.status==='pending'?'⏳ 승인 대기':s.featured?'🏆 이달의 방어왕':`#${s.tag}`}</span><small>{s.createdAt}</small></div><h3>{s.title}</h3><p>“{s.body}”</p><footer><b>{s.nickname}</b><span>{s.goal} · {money(s.amount)}원 · {s.period}</span></footer></article>)}</div></section>
    <button className="sponsor-card" onMouseEnter={()=>campaign&&fetch('/api/ads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'event',campaignId:campaign.id,eventType:'view'})})} onClick={()=>{if(campaign){fetch('/api/ads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'event',campaignId:campaign.id,eventType:'click'})});window.open(campaign.linkUrl,'_blank','noopener,noreferrer')}else openAdInquiry();}}><span><em>{campaign?.label??'AD · 제휴 예시'}</em><b>{campaign?.title??'목표를 응원하는 브랜드 자리'}</b><small>{campaign?.description??'참았다!와 함께할 파트너를 기다립니다.'}</small></span><i>{campaign?'자세히 ›':'광고 문의 ›'}</i></button>
    <div className="list-heading"><div><h2>오늘은 어떤 배달을 안 시킬까요?</h2><small>{allShops.length}개 음식점 · {menuCount}개 메뉴를 가상으로 주문해보세요</small></div><button className="add-custom-menu" onClick={()=>setCustomMenuOpen(true)}>＋ 직접 추가</button></div>
    <section className="shop-list">{filtered.length ? filtered.map(s => { const photos = shopPhotoSet(s); return <article className="shop-card photo-card" key={s.id} onClick={() => {setSelected(s);setStep('shop')}}>
      <div className="shop-gallery">
        <span className="shop-photo main" style={foodPhotoStyle(photos[0].index)}>{s.badge && <em>{s.badge}</em>}<button className={favorites.includes(s.id)?'liked':''} onClick={e=>{e.stopPropagation();setFavorites(v=>v.includes(s.id)?v.filter(id=>id!==s.id):[...v,s.id])}} aria-label={`${s.name} 찜`}>{favorites.includes(s.id)?'♥':'♡'}</button></span>
        <span className={`shop-photo sub zoom-${photos[1].zoom}`} style={foodPhotoStyle(photos[1].index)} />
        <span className={`shop-photo sub zoom-${photos[2].zoom}`} style={foodPhotoStyle(photos[2].index)} />
      </div>
      <div className="shop-card-copy"><div><h2>{s.name}</h2><strong>{s.time}</strong></div><p><b>★ {s.rating}</b> · {money(reviewCount(s))} 리뷰 <i>›</i></p><footer><span>{s.category}</span><small>배달비 {s.delivery ? `${money(s.delivery)}원` : '무료'}</small></footer></div>
    </article>; }) : <Empty icon="🔎" title="검색 결과가 없어요" text="다른 음식이나 상점 이름을 검색해보세요." action="검색 초기화" onAction={()=>{setQuery('');setFilter('전체')}}/>}</section>
    {customMenuOpen&&<CustomMenuModal onClose={()=>setCustomMenuOpen(false)} onAdd={menu=>{setCustomMenus(v=>[menu,...v]);setCustomMenuOpen(false);setFilter('전체')}}/>}
  </div>;
}

function MarketHeader({ title, back, cartCount, openCart }: { title: string; back?: () => void; cartCount: number; openCart: () => void }) { return <header className="market-header">{back ? <button onClick={back} aria-label="뒤로">‹</button> : <span className="mini-logo">ㅊ</span>}<h1>{title}</h1><button className="cart-icon" onClick={openCart} aria-label="장바구니">🛒{cartCount > 0 && <i>{cartCount}</i>}</button></header>; }

function HistoryView({ records, selectedDate, setSelectedDate, removeRecord, goStats }: { records: RecordItem[]; selectedDate: string; setSelectedDate: (v: string) => void; removeRecord: (id: string) => void; goStats: () => void }) {
  const filtered = records.filter(r => r.date === selectedDate); const saved = filtered.filter(r => r.result === 'saved').reduce((s, r) => s + r.amount, 0);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { key: dateKey(d), day: ['일','월','화','수','목','금','토'][d.getDay()], num: d.getDate() }; });
  return <div className="page"><PageHeading eyebrow="기록 보관함" title="내역" subtitle="유혹 앞에서 했던 선택을 돌아봐요." />
    <div className="week-strip">{days.map(d => <button key={d.key} className={selectedDate === d.key ? 'selected' : ''} onClick={() => setSelectedDate(d.key)}><small>{d.day}</small><b>{d.num}</b>{records.some(r => r.date === d.key) && <i />}</button>)}</div>
    <label className="date-picker">날짜 직접 선택 <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></label>
    <section className="day-summary"><span>{selectedDate === dateKey() ? '오늘' : selectedDate} 지킨 돈</span><b>{money(saved)}원</b><small>{filtered.length}번의 선택</small></section>
    <section className="section-block history-list"><div className="section-title"><h2>선택 기록</h2></div>{filtered.length ? <RecordList records={filtered} removable onRemove={removeRecord} /> : <Empty icon="🫧" title="이날은 기록이 없어요" text="선택한 날짜에 남긴 기록이 없습니다." />}</section>
    <button className="page-jump" onClick={goStats}><span>▥</span><div><b>이번 달 리포트로 돌아가기</b><small>방어율과 카테고리별 통계 보기</small></div><i>›</i></button>
  </div>;
}

function StatsView({ records, savedAmount, rate, totalSaved, savings, openSavings, goHistory }: { records: RecordItem[]; savedAmount: number; rate: number; totalSaved: number; savings: SavingsQueue; openSavings: (m:'account'|'transfer')=>void; goHistory: () => void }) {
  const success = records.filter(r => r.result === 'saved').length; const failed = records.length - success;
  const pendingTotal = savings.pending.reduce((sum, p) => sum + p.amount, 0);
  // 지킨 돈 중 실제로 은행에 옮긴 비율. 두 금액은 더하는 값이 아니라 포함 관계다.
  const transferPercent = totalSaved ? Math.min(100, Math.round(savings.transferred / totalSaved * 100)) : 0;
  const rows = categories.map(c => { const items = records.filter(r => r.category === c.id); return { ...c, count: items.length, saved: items.filter(r => r.result === 'saved').reduce((s, r) => s + r.amount, 0) }; }).filter(r => r.count).sort((a, b) => b.saved - a.saved);
  const max = Math.max(...rows.map(r => r.saved), 1);
  return <div className="page"><PageHeading eyebrow={`${new Date().getMonth() + 1}월 리포트`} title="나의 방어력" subtitle="참은 선택이 어떤 변화를 만들었는지 확인해요." />
    <section className="stat-hero"><div className="rate-ring" style={{ '--rate': `${rate * 3.6}deg` } as React.CSSProperties}><span><b>{rate}%</b><small>방어율</small></span></div><div><span>이번 달 지킨 돈</span><h2>{money(savedAmount)}원</h2><p>{records.length ? `${records.length}번의 유혹 중 ${success}번을 지켰어요.` : '기록을 시작하면 분석이 쌓여요.'}</p></div></section>
    <div className="score-grid"><article><span>✓</span><div><small>참았다</small><b>{success}회</b></div></article><article className="lost"><span>↘</span><div><small>결국 샀다</small><b>{failed}회</b></div></article></div>
    <section className="section-block"><div className="section-title"><h2>실제 저축 전환</h2></div>
      <div className="transfer-card">
        <div className="transfer-top"><div><small>지금까지 지킨 돈</small><b>{money(totalSaved)}원</b></div><div className="right"><small>은행으로 옮긴 돈</small><b>{money(savings.transferred)}원</b></div></div>
        <div className="transfer-bar"><i style={{ width: `${transferPercent}%` }} /></div>
        <div className="transfer-legend"><span>지킨 돈의 {transferPercent}% 를 실제로 옮겼어요</span></div>
        {pendingTotal > 0
          ? <button className="transfer-cta" onClick={() => openSavings(savings.account ? 'transfer' : 'account')}>🏦 대기 중인 {money(pendingTotal)}원 옮기기</button>
          : <p className="transfer-hint">{savings.transferred ? '대기 중인 금액이 없어요. 다음 방어도 저축으로 이어가 보세요.' : '방어에 성공한 뒤 “진짜 저축하기”를 누르면 옮길 금액이 여기에 모여요.'}</p>}
      </div>
    </section>
    <section className="section-block category-stats"><div className="section-title"><h2>카테고리별 방어</h2></div>{rows.length ? rows.map(r => <div className="category-row" key={r.id}><span style={{ background: r.color }}>{r.icon}</span><div><div><b>{r.id}</b><small>{r.count}회</small></div><i><em style={{ width: `${r.saved / max * 100}%` }} /></i></div><strong>{money(r.saved)}원</strong></div>) : <Empty icon="📊" title="통계가 기다리고 있어요" text="한 번만 기록해도 분석이 시작됩니다." />}</section>
    <button className="page-jump" onClick={goHistory}><span>◷</span><div><b>날짜별 전체 내역 보기</b><small>하루하루 어떤 선택을 했는지 확인해요</small></div><i>›</i></button>
  </div>;
}

function GoalsView({ goals, totalSaved, profile, savings, isAdmin, openSavings, openProfile, openSettings, openGoal, openAdmin, removeGoal }: { goals: Goal[]; totalSaved: number; profile:Profile; savings:SavingsQueue; isAdmin:boolean; openSavings:(m:'account'|'transfer')=>void; openProfile:()=>void; openSettings:()=>void; openGoal: () => void; openAdmin: () => void; removeGoal: (id: string) => void }) {
  // 지킨 돈은 목표 순서대로 채워진다. 첫 목표를 다 채우면 남는 금액이 다음 목표로 넘어간다.
  let remaining = totalSaved;
  const allocations = goals.map(g => { const applied = Math.min(remaining, g.amount); remaining -= applied; return applied; });
  return <div className="page"><PageHeading eyebrow="돈의 목적지" title="목표" subtitle="안 쓴 돈을 내가 원하는 미래에 연결해요." />
    <button className="profile-entry" onClick={openProfile}><span>{profile.authenticated?'🙂':'👤'}</span><div><b>{profile.authenticated?(profile.nickname||'닉네임을 정해주세요'):'내 프로필 만들기'}</b><small>{profile.authenticated?(profile.email||'닉네임 수정하기'):'닉네임만 정하면 바로 시작해요'}</small></div><i>›</i></button>
    <section className="savings-wallet"><div><span>🏦</span><p><small>저축 대기함</small><b>{money(savings.pending.reduce((n,p)=>n+p.amount,0))}원</b><em>{savings.account?`${savings.account.bank} · ${savings.account.accountNumber.slice(-4)}`:'저축계좌를 설정해주세요'}</em></p></div><button onClick={()=>openSavings(savings.account?'transfer':'account')}>{savings.account?'저축하기':'계좌 설정'}</button><footer><span>직접 이체 완료</span><b>{money(savings.transferred)}원</b><button onClick={()=>openSavings('account')}>설정</button></footer></section>
    <button className="add-goal" onClick={openGoal}><span>＋</span><div><b>새 목표 만들기</b><small>목표는 여러 개 만들 수 있어요</small></div></button>
    <button className="page-jump" onClick={openSettings}><span>⚙</span><div><b>설정</b><small>테마 · 기록 백업 · 데이터 삭제 · 개인정보처리방침</small></div><i>›</i></button>
    {isAdmin && <button className="admin-entry" onClick={openAdmin}><span>⚙️</span><div><b>운영자 센터</b><small>후기 승인 · 숨김 · 이벤트 선정</small></div><i>›</i></button>}
    <section className="goal-stack">{goals.length ? goals.map((g, i) => { const applied = allocations[i]; const p = Math.min(100, Math.round(applied / g.amount * 100)); return <article className="full-goal" key={g.id}><button className="delete-goal" onClick={() => removeGoal(g.id)} aria-label={`${g.name} 삭제`}>×</button><div className="goal-emoji">{g.emoji}</div><span className="eyebrow">목표 {String(i + 1).padStart(2, '0')}</span><h2>{g.name}</h2><div className="goal-big"><b>{p}%</b><span>{money(applied)}원 / {money(g.amount)}원</span></div><div className="progress"><i style={{ width: `${p}%` }} /></div><p>{p >= 100 ? '목표 달성! 이제 다음 목적지를 정해볼까요?' : `앞으로 ${money(Math.max(0, g.amount - applied))}원만 더 지키면 도착해요.`}</p></article>; }) : <Empty icon="🏁" title="아직 정한 목표가 없어요" text="지키고 싶은 돈의 목적지를 만들어보세요." action="첫 목표 만들기" onAction={openGoal} />}</section><div className="legal-links"><a href="/privacy">개인정보처리방침</a><span>·</span><a href="mailto:gyun23456@gmail.com?subject=%EC%B0%B8%EC%95%98%EB%8B%A4!%20%EA%B3%84%EC%A0%95%C2%B7%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD">데이터 삭제 요청</a></div>
  </div>;
}

function AdminPanel({onClose}:{onClose:()=>void}) {
  const [stories,setStories]=useState<(Story&{reportCount?:number})[]>([]); const [loading,setLoading]=useState(true); const [denied,setDenied]=useState(false);
  const [inquiries,setInquiries]=useState<AdInquiry[]>([]); const [adStats,setAdStats]=useState<AdStat[]>([]); const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const load=()=>{setLoading(true);Promise.all([fetch('/api/admin/stories'),fetch('/api/admin/ads')]).then(async([a,b])=>{if(!a.ok||!b.ok)throw new Error();const [p,q]=await Promise.all([a.json() as Promise<AdminStoriesResponse>,b.json() as Promise<AdminAdsResponse>]);setStories(p.stories??[]);setInquiries(q.inquiries??[]);setAdStats(q.stats??[]);setCampaigns(q.campaigns??[])}).catch(()=>setDenied(true)).finally(()=>setLoading(false));};
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() flips the loading flag before fetching; that first setState is the point of the effect.
  useEffect(load,[]);
  const act=async(id:string,action:string)=>{await fetch('/api/admin/stories',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action})});load();};
  const adAct=async(id:string,status:string)=>{await fetch('/api/admin/ads',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});load();};
  const campaignAct=async(id:string,status:string)=>{await fetch('/api/admin/ads',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status,kind:'campaign'})});load()};
  return <div className="admin-screen"><header><button onClick={onClose}>‹</button><div><small>CHAMATTA CONTROL</small><h1>운영자 센터</h1></div><span>{stories.filter(s=>s.status==='pending').length+inquiries.filter(i=>i.status==='new').length}</span></header>{loading?<Empty icon="⏳" title="운영 정보를 불러오고 있어요" text="잠시만 기다려주세요."/>:denied?<Empty icon="🔒" title="운영자 전용 화면이에요" text="등록된 운영자 계정으로 로그인해주세요."/>:<><section className="admin-summary"><div><small>승인 대기</small><b>{stories.filter(s=>s.status==='pending').length}</b></div><div><small>광고 문의</small><b>{inquiries.filter(i=>i.status==='new').length}</b></div><div><small>광고 클릭</small><b>{adStats.filter(x=>x.eventType==='click').reduce((n,x)=>n+Number(x.count),0)}</b></div></section><CampaignCreator onCreated={load}/><h2 className="admin-section-title">광고 캠페인</h2><div className="admin-list">{campaigns.map(c=><article key={c.id}><div className="admin-story-top"><span className={c.status==='active'?'status-approved':'status-pending'}>{c.status==='active'?'노출 중':c.status==='paused'?'일시정지':'초안'}</span><small>{c.brand}</small></div><h2>{c.title}</h2><p>{c.startsAt?.slice(0,10)} ~ {c.endsAt?.slice(0,10)}<br/>{c.linkUrl}</p><footer><button className="approve" onClick={()=>campaignAct(c.id,'active')}>노출</button><button onClick={()=>campaignAct(c.id,'paused')}>정지</button></footer></article>)}</div><h2 className="admin-section-title">광고 문의</h2><div className="admin-list ad-admin-list">{inquiries.length?inquiries.map(i=><article key={i.id}><div className="admin-story-top"><span className={`status-${i.status==='new'?'pending':'approved'}`}>{i.status==='new'?'신규':i.status==='contacted'?'연락 완료':'종료'}</span><small>{i.createdAt}</small></div><h2>{i.brand}</h2><p>{i.contactName} · {i.email}<br/>{i.budget} · {i.placement}<br/>{i.message}</p><footer><button className="approve" onClick={()=>adAct(i.id,'contacted')}>연락 완료</button><button onClick={()=>adAct(i.id,'closed')}>종료</button></footer></article>):<Empty icon="📨" title="아직 광고 문의가 없어요" text="새 문의가 접수되면 이곳에 표시됩니다."/>}</div><h2 className="admin-section-title">후기 관리</h2><div className="admin-list">{stories.length?stories.map(s=><article key={s.id}><div className="admin-story-top"><span className={`status-${s.status}`}>{s.status==='pending'?'승인 대기':s.status==='approved'?'공개':'숨김'}</span>{s.featured&&<em>🏆 방어왕</em>}<small>신고 {s.reportCount??0}</small></div><h2>{s.title}</h2><p>{s.body}</p><div className="admin-meta"><b>{s.nickname}</b><span>{s.goal} · {money(s.amount)}원 · #{s.tag}</span></div><footer>{s.status!=='approved'&&<button className="approve" onClick={()=>act(s.id,'approve')}>공개 승인</button>}<button onClick={()=>act(s.id,s.featured?'unfeature':'feature')}>{s.featured?'추천 해제':'방어왕 선정'}</button>{s.status!=='hidden'&&<button className="hide" onClick={()=>act(s.id,'hide')}>숨기기</button>}</footer></article>):<Empty icon="📭" title="검토할 후기가 없어요" text="새 후기가 들어오면 이곳에 표시됩니다."/>}</div></>}</div>;
}

function CampaignCreator({onCreated}:{onCreated:()=>void}){const [x,setX]=useState(()=>{const today=dateKey(),later=new Date(Date.now()+30*86400000).toISOString().slice(0,10);return {brand:'',title:'',description:'',linkUrl:'https://',startsAt:today,endsAt:later,status:'draft'}});const submit=async(e:FormEvent)=>{e.preventDefault();const r=await fetch('/api/admin/ads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...x,startsAt:`${x.startsAt}T00:00:00.000Z`,endsAt:`${x.endsAt}T23:59:59.999Z`,placement:'market'})});if(r.ok){setX({...x,brand:'',title:'',description:'',linkUrl:'https://'});onCreated()}};return <form className="campaign-form" onSubmit={submit}><b>새 광고 등록</b><input required placeholder="브랜드명" value={x.brand} onChange={e=>setX({...x,brand:e.target.value})}/><input required placeholder="광고 제목" value={x.title} onChange={e=>setX({...x,title:e.target.value})}/><input placeholder="설명 문구" value={x.description} onChange={e=>setX({...x,description:e.target.value})}/><input required type="url" placeholder="https:// 연결 주소" value={x.linkUrl} onChange={e=>setX({...x,linkUrl:e.target.value})}/><div><input type="date" value={x.startsAt} onChange={e=>setX({...x,startsAt:e.target.value})}/><input type="date" value={x.endsAt} onChange={e=>setX({...x,endsAt:e.target.value})}/></div><button>초안 저장</button></form>}

function AdInquiryModal({onClose}:{onClose:()=>void}){const [sent,setSent]=useState(false);const [form,setForm]=useState({brand:'',contactName:'',email:'',budget:'미정',placement:'상점 목록',message:''});const submit=async(e:FormEvent)=>{e.preventDefault();const r=await fetch('/api/ads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});if(r.ok)setSent(true)};return <ModalShell title="참았다! 광고 문의" subtitle="사용자의 절약 경험을 해치지 않는 제휴만 함께합니다." onClose={onClose}>{sent?<div className="ad-thanks"><span>✓</span><h3>문의가 접수됐어요</h3><p>내용을 검토한 뒤 담당자가 연락드릴게요.</p><button onClick={onClose}>확인</button></div>:<form className="ad-inquiry-form" onSubmit={submit}><div className="ad-policy-note">모든 광고는 <b>광고·제휴</b>임을 명확히 표시합니다.</div><label><span>브랜드명</span><input required value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}/></label><div><label><span>담당자명</span><input required value={form.contactName} onChange={e=>setForm({...form,contactName:e.target.value})}/></label><label><span>이메일</span><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label></div><div><label><span>예산</span><select value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}><option>미정</option><option>100만원 이하</option><option>100~500만원</option><option>500만원 이상</option></select></label><label><span>희망 위치</span><select value={form.placement} onChange={e=>setForm({...form,placement:e.target.value})}><option>상점 목록</option><option>목표 화면</option><option>성공 결과</option><option>후기 영역</option><option>상담 후 결정</option></select></label></div><label><span>문의 내용</span><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="캠페인 기간과 목적을 알려주세요."/></label><button className="submit-button">광고 문의 보내기</button></form>}</ModalShell>}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) { return <header className="page-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></header>; }

function RecordList({ records, removable = false, onRemove }: { records: RecordItem[]; removable?: boolean; onRemove?: (id: string) => void }) { return <div className="record-list">{records.map(item => { const cat = getCategory(item.category); return <div className="record" key={item.id}><span className="record-icon" style={{ background: cat.color }}>{cat.icon}</span><div><b>{item.memo || item.category}</b><small>{item.category} · {item.date}</small></div><strong className={item.result === 'spent' ? 'spent' : ''}>{item.result === 'saved' ? '+' : '−'}{money(item.amount)}원</strong>{removable && <button className="remove-record" onClick={() => onRemove?.(item.id)} aria-label="기록 삭제">×</button>}</div>; })}</div>; }
function Empty({ icon, title, text, action, onAction }: { icon: string; title: string; text: string; action?: string; onAction?: () => void }) { return <div className="empty-state"><span>{icon}</span><b>{title}</b><p>{text}</p>{action && <button onClick={onAction}>{action}</button>}</div>; }

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal-sheet" role="dialog" aria-modal="true" aria-label={title}><div className="modal-handle" /><header><div><span>새로운 선택</span><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose} aria-label="닫기">×</button></header>{children}</section></div>; }

function RecordModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: Omit<RecordItem, 'id'>) => void }) {
  const [category, setCategory] = useState('배달'); const [amount, setAmount] = useState(''); const [memo, setMemo] = useState(''); const [result, setResult] = useState<Result>('saved'); const [date, setDate] = useState(dateKey());
  const submit = (e: FormEvent) => { e.preventDefault(); const value = Number(amount.replaceAll(',', '')); if (value > 0) onSubmit({ category, amount: value, memo: memo.trim(), result, date }); };
  return <ModalShell title="어떤 소비를 넘겼나요?" subtitle="참았든 샀든, 솔직하게 남기면 충분해요." onClose={onClose}><form onSubmit={submit} className="record-form">
    <fieldset><legend>카테고리</legend><div className="category-grid">{categories.map(c => <button type="button" className={category === c.id ? 'selected' : ''} key={c.id} onClick={() => setCategory(c.id)}><span style={{ background: c.color }}>{c.icon}</span><small>{c.id}</small></button>)}</div></fieldset>
    <label className="amount-field"><span>금액</span><div><input inputMode="numeric" autoFocus value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" required /><b>원</b></div></label>
    <div className="form-row"><label><span>메모 또는 상품명 <small>선택</small></span><input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 퇴근길 아이스 라테" maxLength={40} /></label><label><span>날짜</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label></div>
    <fieldset><legend>결과</legend><div className="result-toggle"><button type="button" className={result === 'saved' ? 'selected success-choice' : ''} onClick={() => setResult('saved')}><span>✓</span><div><b>참았다</b><small>돈을 지켰어요</small></div></button><button type="button" className={result === 'spent' ? 'selected spent-choice' : ''} onClick={() => setResult('spent')}><span>↘</span><div><b>결국 샀다</b><small>다음 선택을 위해 기록</small></div></button></div></fieldset>
    <button className="submit-button" disabled={!Number(amount)}>{result === 'saved' ? '이 선택, 방어 성공!' : '솔직하게 기록하기'}</button>
  </form></ModalShell>;
}

function GoalModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: Omit<Goal, 'id'>) => void }) {
  const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [emoji, setEmoji] = useState('✈️');
  const submit = (e: FormEvent) => { e.preventDefault(); const value = Number(amount); if (name.trim() && value > 0) onSubmit({ name: name.trim(), amount: value, emoji }); };
  return <ModalShell title="돈의 목적지를 정해요" subtitle="참을 때마다 목표에 한 걸음 가까워져요." onClose={onClose}><form onSubmit={submit} className="goal-form"><fieldset><legend>목표 아이콘</legend><div className="emoji-grid">{['✈️','🏡','🛟','💻','🎁','🌿'].map(e => <button type="button" key={e} className={emoji === e ? 'selected' : ''} onClick={() => setEmoji(e)}>{e}</button>)}</div></fieldset><label><span>목표 이름</span><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="예: 제주도 한 달 살기" required maxLength={30} /></label><label className="amount-field"><span>목표 금액</span><div><input inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" required /><b>원</b></div></label><button className="submit-button" disabled={!name.trim() || !Number(amount)}>목표 만들기</button></form></ModalShell>;
}

function StoryModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: Omit<Story,'id'|'createdAt'>) => void | Promise<void> }) {
  const [nickname,setNickname]=useState(''); const [title,setTitle]=useState(''); const [body,setBody]=useState(''); const [goal,setGoal]=useState(''); const [amount,setAmount]=useState(''); const [period,setPeriod]=useState(''); const [tag,setTag]=useState('여행');
  const submit=(e:FormEvent)=>{e.preventDefault();if(nickname.trim()&&title.trim()&&body.trim()&&goal.trim()&&Number(amount)>0)onSubmit({nickname:nickname.trim(),title:title.trim(),body:body.trim(),goal:goal.trim(),amount:Number(amount),period:period.trim()||'기간 비공개',tag,featured:false});};
  return <ModalShell title="나의 도착 후기를 들려주세요" subtitle="당신의 경험이 누군가의 다음 선택을 도와요." onClose={onClose}><form className="story-form" onSubmit={submit}><div className="story-event-note"><span>🎉</span><p><b>이벤트 활용 준비 완료</b><br/>작성한 후기는 추후 ‘이달의 방어왕’ 후보로 활용할 수 있어요.</p></div><div className="story-two"><label><span>닉네임</span><input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="예: 야식졸업생" required maxLength={16}/></label><label><span>걸린 기간</span><input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="예: 5개월" maxLength={12}/></label></div><label><span>후기 제목</span><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="예: 참은 야식비로 제주도에 갔어요" required maxLength={40}/></label><label><span>달성한 목표</span><input value={goal} onChange={e=>setGoal(e.target.value)} placeholder="예: 제주도 여행" required maxLength={24}/></label><label className="amount-field"><span>모은 금액</span><div><input inputMode="numeric" value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,''))} placeholder="0" required/><b>원</b></div></label><fieldset><legend>목표 태그</legend><div className="story-tags">{['여행','비상금','쇼핑','건강','취미'].map(t=><button type="button" className={tag===t?'selected':''} onClick={()=>setTag(t)} key={t}>#{t}</button>)}</div></fieldset><label><span>나의 이야기</span><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="어떻게 참았고, 목표를 이뤘을 때 어떤 기분이었는지 들려주세요." required maxLength={280}/><small>{body.length}/280</small></label><button className="submit-button" disabled={!nickname.trim()||!title.trim()||!body.trim()||!goal.trim()||!Number(amount)}>후기 등록하기</button></form></ModalShell>;
}

function SuccessModal({ record, total, streak, onQueue, onClose }: { record: RecordItem; total: number; streak: number; onQueue:()=>void; onClose: () => void }) { return <div className="success-screen" role="dialog" aria-modal="true"><div className="confetti">✦ <i>●</i> ✦ <em>◆</em> ✦</div><div className="success-shield"><span>✓</span></div><span className="success-label">방어 성공</span><h2>{money(record.amount)}원</h2><p>{record.memo || record.category}의 유혹을 넘겼어요.<br/>{record.calories?`예상 ${money(record.calories)} kcal도 함께 피했어요.`:'오늘의 선택이 미래의 나를 만들어요.'}</p><div className="success-stats"><div><small>누적 지킨 돈</small><b>{money(total)}원</b></div><i/><div><small>연속 방어</small><b>🔥 {streak}일</b></div></div><button className="queue-saving" onClick={onQueue}>🏦 이 금액, 진짜 저축하기</button><button className="success-later" onClick={onClose}>나중에 할게요</button></div>; }
