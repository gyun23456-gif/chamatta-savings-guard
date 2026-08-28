'use client';

import { useEffect, useState } from 'react';

type Profile={authenticated:boolean;nickname?:string;email?:string};

export default function SettingsModal({profile,openProfile,onClose}:{profile:Profile;openProfile:()=>void;onClose:()=>void}){
  const [theme,setTheme]=useState<'forest'|'coral'>(()=>typeof window==='undefined'?'forest':(localStorage.getItem('chamatta-theme')==='coral'?'coral':'forest'));
  useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('chamatta-theme',theme)},[theme]);
  return <div className="modal-backdrop"><section className="modal-sheet settings-sheet"><header><div><span>MY SETTINGS</span><h2>설정</h2><p>참았다!를 내 방식에 맞게 사용해요.</p></div><button onClick={onClose}>×</button></header>
    <section className="settings-group"><h3>계정 및 백업</h3><p>절약 기록과 목표를 내 프로필에 연결해요.</p><button className="settings-account" onClick={openProfile}><span>{profile.authenticated?'🙂':'🔐'}</span><div><b>{profile.authenticated?(profile.nickname||'내 프로필'):'로그인·회원가입'}</b><small>{profile.authenticated?profile.email:'카카오 또는 이메일로 간편하게 시작'}</small></div><i>›</i></button></section>
    <section className="settings-group"><h3>언어</h3><p>현재 한국어를 지원하고 있어요.</p><button className="settings-choice selected"><span>🇰🇷</span><b>한국어</b><i>✓</i></button><button className="settings-choice disabled" disabled><span>🌐</span><b>다른 언어</b><small>준비 중</small></button></section>
    <section className="settings-group"><h3>테마</h3><p>앱의 대표 색상을 골라보세요.</p><div className="theme-grid"><button className={theme==='forest'?'selected':''} onClick={()=>setTheme('forest')}><span className="forest-swatch"/><b>포레스트</b>{theme==='forest'&&<i>✓</i>}</button><button className={theme==='coral'?'selected':''} onClick={()=>setTheme('coral')}><span className="coral-swatch"/><b>코랄</b>{theme==='coral'&&<i>✓</i>}</button></div></section>
    <section className="settings-group compact"><h3>서비스 안내</h3><a href="/privacy">개인정보처리방침 <span>›</span></a><a href="mailto:gyun23456@gmail.com?subject=%EC%B0%B8%EC%95%98%EB%8B%A4!%20%EB%AC%B8%EC%9D%98">문의하기 <span>›</span></a></section>
  </section></div>;
}
