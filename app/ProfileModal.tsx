'use client';
import { FormEvent, useState } from 'react';

type Profile={authenticated:boolean;nickname?:string;email?:string};

const LOCAL_KEY='chamatta-local-profile';

export default function ProfileModal({profile,onSaved,onClose}:{profile:Profile;onSaved:(p:Profile)=>void;onClose:()=>void}){
  const [nickname,setNickname]=useState(profile.nickname??'');
  const [email,setEmail]=useState(profile.email??'');
  const [error,setError]=useState('');
  const [removing,setRemoving]=useState(false);
  const isLocal=typeof window!=='undefined'&&!!localStorage.getItem(LOCAL_KEY);

  // 아직 프로필이 없을 때: 닉네임만 정하면 바로 시작한다.
  if(!profile.authenticated){
    const create=(e:FormEvent)=>{
      e.preventDefault();
      const name=nickname.trim();
      if(name.length<2)return setError('닉네임을 2자 이상 입력해주세요.');
      const next:Profile={authenticated:true,nickname:name.slice(0,16),email:email.trim()||undefined};
      try{localStorage.setItem(LOCAL_KEY,JSON.stringify(next))}catch{return setError('이 브라우저에서는 프로필을 저장할 수 없어요.')}
      onSaved(next);
    };
    return <div className="modal-backdrop"><section className="modal-sheet profile-sheet">
      <header><div><span>CHAMATTA PROFILE</span><h2>내 프로필 만들기</h2><p>후기와 목표에 표시할 이름을 정해요.</p></div><button onClick={onClose} aria-label="닫기">×</button></header>
      <form className="profile-form" onSubmit={create}>
        <div className="profile-avatar">ㅊ</div>
        <label><span>닉네임 <small>필수</small></span><input autoFocus required minLength={2} maxLength={16} value={nickname} onChange={e=>{setNickname(e.target.value);setError('')}} placeholder="예: 야식졸업생"/></label>
        <label><span>이메일 <small>선택 · 문의나 이벤트 안내용</small></span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>
        {error&&<p>{error}</p>}
        <button className="submit-button" disabled={nickname.trim().length<2}>이 이름으로 시작하기</button>
        <div className="profile-storage-note">🔒 프로필과 절약 기록은 <b>이 기기에만</b> 저장돼요. 비밀번호는 받지 않으며, 앱을 삭제하면 기록도 함께 사라집니다.</div>
        <div className="soon-row"><span>💬</span><div><b>카카오로 계속하기</b><small>여러 기기에서 기록을 이어보는 기능이에요</small></div><i>준비 중</i></div>
        <button type="button" className="login-later" onClick={onClose}>프로필 없이 둘러보기</button>
      </form>
    </section></div>;
  }

  // 이미 프로필이 있을 때: 이름 수정과 삭제.
  const save=async(e:FormEvent)=>{
    e.preventDefault();
    const name=nickname.trim();
    if(name.length<2)return setError('닉네임을 2자 이상 입력해주세요.');
    if(isLocal){
      const next={...profile,nickname:name,email:email.trim()||undefined};
      try{localStorage.setItem(LOCAL_KEY,JSON.stringify(next))}catch{return setError('저장하지 못했어요.')}
      return onSaved(next);
    }
    try{
      const response=await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:name})});
      const payload=await response.json() as {ok?:boolean;nickname?:string;error?:string};
      if(!response.ok)return setError(payload.error??'저장하지 못했어요.');
      onSaved({...profile,nickname:payload.nickname});
    }catch{setError('네트워크 상태를 확인해주세요.')}
  };
  const removeProfile=()=>{try{localStorage.removeItem(LOCAL_KEY)}catch{/* 무시 */}onSaved({authenticated:false})};

  return <div className="modal-backdrop"><section className="modal-sheet profile-sheet">
    <header><div><span>MY PROFILE</span><h2>내 프로필</h2><p>후기와 목표에 표시할 이름이에요.</p></div><button onClick={onClose} aria-label="닫기">×</button></header>
    <form className="profile-form" onSubmit={save}>
      <div className="profile-avatar">🙂</div>
      {profile.email&&<small>{profile.email}</small>}
      <label><span>닉네임</span><input autoFocus minLength={2} maxLength={16} required value={nickname} onChange={e=>{setNickname(e.target.value);setError('')}} placeholder="2~16자"/></label>
      {isLocal&&<label><span>이메일 <small>선택</small></span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>}
      {error&&<p>{error}</p>}
      <button className="submit-button" disabled={nickname.trim().length<2}>프로필 저장</button>
      {isLocal&&<div className="profile-storage-note">🔒 이 프로필은 이 기기에만 저장돼 있어요.</div>}
      {removing
        ? <div className="profile-remove-confirm"><b>프로필을 지울까요?</b><p>이름과 이메일이 지워집니다. 절약 기록은 남아 있어요. 기록까지 지우려면 설정 &gt; 내 데이터 삭제를 이용하세요.</p><div><button type="button" onClick={()=>setRemoving(false)}>취소</button><button type="button" className="remove-go" onClick={removeProfile}>프로필 지우기</button></div></div>
        : <button type="button" className="login-later" onClick={()=>setRemoving(true)}>프로필 지우기</button>}
    </form>
  </section></div>;
}
