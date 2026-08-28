'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';

type Profile={authenticated:boolean;nickname?:string;email?:string};
type Theme='red'|'forest'|'orange';
/** 설정에서 읽기만 하는 에너지 상태. 조작은 에너지 시트에서 한다. */
type EnergyView={count:number;code:string;unlimited:boolean};
type Backup={app:string;version:number;exportedAt:string;data:Record<string,unknown>};
type Preview={backup:Backup;records:number;goals:number;nickname?:string};

const APP_VERSION='1.2.0';
const BACKUP_KEYS=['chamatta-data-v1','chamatta-savings-v1','chamatta-custom-menus-v1','chamatta-local-profile','chamatta-theme'];

const readStore=(key:string):unknown=>{
  try{const raw=localStorage.getItem(key);if(raw===null)return undefined;try{return JSON.parse(raw)}catch{return raw}}catch{return undefined}
};
const buildBackup=():Backup=>{
  const data:Record<string,unknown>={};
  BACKUP_KEYS.forEach(key=>{const value=readStore(key);if(value!==undefined)data[key]=value});
  return {app:'chamatta',version:1,exportedAt:new Date().toISOString(),data};
};
// 한글 파일명은 안드로이드 다운로드에서 확장자까지 사라지는 경우가 있어 영문으로 고정한다.
const backupFileName=()=>{const d=new Date();const p=(n:number)=>String(n).padStart(2,'0');return `chamatta-backup-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`;};
const describe=(backup:Backup):Preview=>{
  const app=backup.data['chamatta-data-v1'] as {records?:unknown[];goals?:unknown[]}|undefined;
  const profile=backup.data['chamatta-local-profile'] as {nickname?:string}|undefined;
  return {backup,records:app?.records?.length??0,goals:app?.goals?.length??0,nickname:profile?.nickname};
};
const DELETE_MAIL='mailto:gyun23456@gmail.com?subject=%5B%EC%B0%B8%EC%95%98%EB%8B%A4!%5D%20%EA%B3%84%EC%A0%95%C2%B7%EB%8D%B0%EC%9D%B4%ED%84%B0%20%EC%82%AD%EC%A0%9C%20%EC%9A%94%EC%B2%AD&body=%EA%B0%80%EC%9E%85%ED%95%9C%20%EC%9D%B4%EB%A9%94%EC%9D%BC%3A%20%0A%EC%82%AD%EC%A0%9C%EB%A5%BC%20%EC%9B%90%ED%95%98%EB%8A%94%20%ED%95%AD%EB%AA%A9%3A%20%EA%B3%84%EC%A0%95%20%EC%A0%84%EC%B2%B4%20%EC%82%AD%EC%A0%9C%0A';

export default function SettingsModal({profile,openProfile,onClose,energy,openEnergy,deliveryView,setDeliveryView}:{deliveryView:'map'|'classic';setDeliveryView:(v:'map'|'classic')=>void;energy:EnergyView|null;openEnergy:()=>void;profile:Profile;openProfile:()=>void;onClose:()=>void}){
  const [theme,setTheme]=useState<Theme>(()=>{
    if(typeof window==='undefined')return 'red';
    const saved=localStorage.getItem('chamatta-theme');
    return saved==='forest'||saved==='orange'?saved:'red';
  });
  const [wipeStep,setWipeStep]=useState<0|1>(0);
  const [wiped,setWiped]=useState(false);
  const [notice,setNotice]=useState('');
  const [preview,setPreview]=useState<Preview|null>(null);
  const fileInput=useRef<HTMLInputElement>(null);
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('chamatta-theme',theme)},[theme]);

  const exportBackup=()=>{
    setNotice('');
    try{
      const text=JSON.stringify(buildBackup(),null,2);
      const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
      const link=document.createElement('a');
      link.href=url;link.download=backupFileName();
      document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),4000);
      setNotice(`백업 파일 ${backupFileName()} 을 저장했어요. 휴대폰의 "다운로드" 폴더에서 확인할 수 있어요.`);
    }catch{setNotice('파일로 저장하지 못했어요. 아래 복사 버튼을 이용해주세요.');}
  };

  const copyBackup=async()=>{
    try{await navigator.clipboard.writeText(JSON.stringify(buildBackup()));setNotice('백업 내용을 복사했어요. 메모장이나 메일에 붙여넣어 보관하세요.');}
    catch{setNotice('복사하지 못했어요. 파일로 내보내기를 이용해주세요.');}
  };

  const pickFile=(event:ChangeEvent<HTMLInputElement>)=>{
    setNotice('');
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file)return;
    const reader=new FileReader();
    reader.onerror=()=>setNotice('파일을 읽지 못했어요.');
    reader.onload=()=>{
      try{
        const parsed=JSON.parse(String(reader.result)) as Backup;
        if(parsed?.app!=='chamatta'||typeof parsed.data!=='object'||parsed.data===null)throw new Error('형식이 다릅니다');
        setPreview(describe(parsed));
      }catch{setNotice('참았다! 백업 파일이 아니에요. 내보내기로 만든 파일을 선택해주세요.');}
    };
    reader.readAsText(file);
  };

  const applyBackup=()=>{
    if(!preview)return;
    try{
      BACKUP_KEYS.forEach(key=>localStorage.removeItem(key));
      Object.entries(preview.backup.data).forEach(([key,value])=>{
        if(!BACKUP_KEYS.includes(key))return;
        localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));
      });
    }catch{setPreview(null);return setNotice('불러오지 못했어요. 저장 공간을 확인해주세요.');}
    setPreview(null);
    setNotice('백업을 불러왔어요. 잠시 후 새로고침됩니다.');
    setTimeout(()=>location.reload(),900);
  };

  const wipeDevice=()=>{
    try{
      Object.keys(localStorage).filter(k=>k.startsWith('chamatta-')&&k!=='chamatta-theme').forEach(k=>localStorage.removeItem(k));
      if('caches' in window)caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>undefined);
    }catch{/* 저장소를 쓸 수 없는 브라우저는 그대로 둔다 */}
    setWiped(true);
    setTimeout(()=>location.reload(),900);
  };

  return <div className="modal-backdrop"><section className="modal-sheet settings-sheet"><header><div><span>MY SETTINGS</span><h2>설정</h2><p>참았다!를 내 방식에 맞게 사용해요.</p></div><button onClick={onClose}>×</button></header>

    <section className="settings-group"><h3>내 프로필</h3><p>후기와 목표에 표시할 이름을 정해요.</p><button className="settings-account" onClick={openProfile}><span>{profile.authenticated?'🙂':'👤'}</span><div><b>{profile.authenticated?(profile.nickname||'내 프로필'):'내 프로필 만들기'}</b><small>{profile.authenticated?(profile.email||'닉네임 수정하기'):'닉네임만 정하면 바로 시작'}</small></div><i>›</i></button></section>

    <section className="settings-group"><h3>언어</h3><p>현재 한국어를 지원하고 있어요.</p><button className="settings-choice selected"><span>🇰🇷</span><b>한국어</b><i>✓</i></button><button className="settings-choice disabled" disabled><span>🌐</span><b>다른 언어</b><small>준비 중</small></button></section>

    <section className="settings-group"><h3>테마</h3><p>앱의 대표 색상을 골라보세요.</p><div className="theme-grid"><button className={theme==='red'?'selected':''} onClick={()=>setTheme('red')}><span className="red-swatch"/><b>레드</b>{theme==='red'&&<i>✓</i>}</button><button className={theme==='orange'?'selected':''} onClick={()=>setTheme('orange')}><span className="orange-swatch"/><b>오렌지</b>{theme==='orange'&&<i>✓</i>}</button><button className={theme==='forest'?'selected':''} onClick={()=>setTheme('forest')}><span className="forest-swatch"/><b>포레스트</b>{theme==='forest'&&<i>✓</i>}</button></div></section>

    <section className="settings-group"><h3>배달 화면</h3><p>가상 배달이 오는 동안 보여줄 화면을 골라요.</p><div className="theme-grid"><button className={deliveryView==='map'?'selected':''} onClick={()=>setDeliveryView('map')}><span>🗺️</span><b>지도 배달</b>{deliveryView==='map'&&<i>✓</i>}</button><button className={deliveryView==='classic'?'selected':''} onClick={()=>setDeliveryView('classic')}><span>🛵</span><b>기존 맵</b>{deliveryView==='classic'&&<i>✓</i>}</button></div><p className="settings-fineprint">지도는 가상의 동네를 그린 그림이에요. 실제 위치를 쓰지 않고, 위치 권한도 요구하지 않습니다.</p></section>

    <section className="settings-group"><h3>가상 주문 에너지</h3><p>가상 주문 1번에 에너지 3개를 씁니다. 앱을 켠 날마다 3개씩 지급돼요.</p>
      <button className="settings-choice" onClick={openEnergy}><span>⚡</span><div><b>에너지 충전 · 추천 코드</b><small>{energy?(energy.unlimited?'무제한 이용 중':`현재 ${energy.count}개 · 내 코드 ${energy.code}`):'불러오는 중'}</small></div><i>›</i></button>
      <button className="settings-choice disabled" disabled><span>∞</span><div><b>무제한 에너지 &amp; 광고 제거</b><small>{energy?.unlimited?'구매 완료':'미구매 · 앱 스토어 버전에서 준비 중'}</small></div></button>
    </section>

    <section className="settings-group"><h3>기록 백업</h3><p>기록은 이 기기에만 저장돼요. 폰을 바꾸거나 앱을 다시 깔기 전에 꼭 내보내두세요.</p>
      <button className="settings-choice" onClick={exportBackup}><span>📤</span><div><b>백업 파일 내보내기</b><small>절약 기록·목표·프로필을 파일 하나로 저장</small></div><i>›</i></button>
      <button className="settings-choice" onClick={()=>fileInput.current?.click()}><span>📥</span><div><b>백업 파일 불러오기</b><small>저장해둔 파일로 기록을 되살려요</small></div><i>›</i></button>
      <input ref={fileInput} type="file" accept="application/json,.json" onChange={pickFile} hidden />
      <button className="backup-copy" onClick={copyBackup}>파일 저장이 안 되면 · 백업 내용 복사하기</button>
      {notice&&<div className="backup-notice">{notice}</div>}
      {preview&&<div className="backup-confirm">
        <b>이 백업을 불러올까요?</b>
        <p>절약 기록 {preview.records}개 · 목표 {preview.goals}개{preview.nickname?` · 닉네임 ${preview.nickname}`:''}<br/>내보낸 날짜 {preview.backup.exportedAt.slice(0,10)}</p>
        <p className="backup-warning">지금 이 기기에 있는 기록은 백업 내용으로 <b>덮어써집니다.</b></p>
        <div><button className="backup-cancel" onClick={()=>setPreview(null)}>취소</button><button className="backup-go" onClick={applyBackup}>불러오기</button></div>
      </div>}
    </section>

    <section className="settings-group"><h3>내 데이터 삭제</h3><p>언제든 직접 지울 수 있어요. 되돌릴 수 없습니다.</p>
      {wiped
        ? <div className="wipe-done">✓ 이 기기의 기록을 모두 삭제했어요. 잠시 후 새로고침됩니다.</div>
        : wipeStep===0
          ? <button className="settings-choice danger" onClick={()=>setWipeStep(1)}><span>🗑️</span><div><b>이 기기의 기록 전체 삭제</b><small>절약 기록·목표·계좌설정·장바구니</small></div><i>›</i></button>
          : <div className="wipe-confirm"><b>정말 삭제할까요?</b><p>절약 기록, 목표, 저장된 계좌 정보가 이 기기에서 모두 지워집니다. 복구할 수 없어요.</p><div><button className="wipe-cancel" onClick={()=>setWipeStep(0)}>취소</button><button className="wipe-go" onClick={wipeDevice}>모두 삭제</button></div></div>}
      <a className="settings-choice danger-link" href={DELETE_MAIL}><span>✉️</span><div><b>계정 전체 삭제 요청</b><small>서버에 저장된 프로필·후기까지 삭제</small></div><i>›</i></a>
    </section>

    <section className="settings-group compact"><h3>서비스 안내</h3>
      <div className="virtual-notice">이 앱의 상점·메뉴·주문·결제·배달은 <b>모두 가상</b>입니다. 실제 음식이 배달되거나 금액이 결제되지 않으며, 은행 이체는 사용자가 직접 은행 앱에서 진행합니다.</div>
      <a href="/privacy">개인정보처리방침 <span>›</span></a>
      <a href="mailto:gyun23456@gmail.com?subject=%EC%B0%B8%EC%95%98%EB%8B%A4!%20%EB%AC%B8%EC%9D%98">문의하기 <span>›</span></a>
      <p className="app-version">버전 {APP_VERSION}</p>
    </section>
  </section></div>;
}
