// next/link 대체품.
//
// 토스 번들은 Next 없이 순수 Vite 로 빌드하므로 next/link 를 해석할 수 없다.
// PolicyBody 가 그걸 하나 쓰는데, 화면 코드를 두 벌로 나누지 않으려고
// vite.toss.config.ts 에서 이 파일로 별칭을 걸었다.
//
// main.tsx 의 클릭 가로채기가 내부 이동을 처리하므로 평범한 <a> 로 충분하다.

import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  // next/link 가 받지만 여기선 쓰지 않는 것들. 넘어와도 DOM 으로 새지 않게 흡수한다.
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
};

export default function Link({ href, children, prefetch, replace, scroll, shallow, ...rest }: Props) {
  void prefetch; void replace; void scroll; void shallow;
  return <a href={href} {...rest}>{children}</a>;
}
