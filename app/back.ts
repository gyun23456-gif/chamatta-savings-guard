'use client';
import { useEffect, useRef } from 'react';

// 뒤로가기로 닫을 수 있는 화면들의 스택.
//
// 이 앱은 주소로 화면을 옮기지 않는다. 탭·상점 단계·모달이 전부 상태값이라
// 토스 미니앱에서 시스템 뒤로가기를 누르면 돌아갈 곳이 없어 앱이 그냥 종료됐다
// (앱인토스 검토 반려 사유). 라우터로 갈아엎는 대신, 열려 있는 화면이 스스로
// "나를 닫는 방법"을 여기 올려두고 뒤로가기가 맨 위부터 하나씩 닫는다.
//
// 스택을 실제로 소비하는 곳은 toss/main.tsx 의 backEvent 뿐이다. 워커 웹에서는
// 등록만 되고 아무도 꺼내지 않으므로 동작이 달라지지 않는다.

type Layer = { close: () => void };

const stack: Layer[] = [];

/**
 * active 인 동안 이 화면을 뒤로가기 스택에 올린다.
 * 나중에 열린 화면이 위에 쌓이므로, 뒤로가기는 가장 최근에 연 것부터 닫는다.
 */
export function useBackLayer(active: boolean, close: () => void) {
  // close 는 렌더마다 새로 만들어지는 화살표 함수라, 스택에는 최신 것을 가리키는
  // 자리만 두고 등록·해제는 active 가 바뀔 때만 한다. 그래야 순서가 흔들리지 않는다.
  const latest = useRef(close);
  useEffect(() => { latest.current = close; });

  useEffect(() => {
    if (!active) return;
    const layer: Layer = { close: () => latest.current() };
    stack.push(layer);
    return () => {
      const i = stack.lastIndexOf(layer);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active]);
}

/** 맨 위 화면을 닫는다. 닫을 화면이 없었으면 false — 호출부가 앱을 닫는다. */
export function goBack(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.close();
  return true;
}
