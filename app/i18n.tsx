'use client';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { HTML_LANG, Lang, translate } from './locales';

const KEY = 'chamatta-lang';

const isLang = (value: unknown): value is Lang =>
  value === 'ko' || value === 'en' || value === 'ja' || value === 'zh';

type Ctx = { lang: Lang; setLang: (next: Lang) => void; t: (ko: string) => string };

// 기본값은 한국어. 사전이 없으면 t() 가 원문을 그대로 돌려주므로,
// 프로바이더 밖에서 t() 를 불러도 화면은 한국어로 정상 동작한다.
const LangContext = createContext<Ctx>({ lang: 'ko', setLang: () => {}, t: ko => ko });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ko');

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch { /* 저장소가 막혀도 한국어로 간다 */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR, so the saved language must be read in an effect.
    if (isLang(saved)) setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(KEY, next); } catch { /* 이번 세션에만 적용된다 */ }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: (ko: string) => translate(lang, ko) }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** 문구 하나만 필요할 때. const t = useT(); t('홈') */
export const useT = () => useContext(LangContext).t;
