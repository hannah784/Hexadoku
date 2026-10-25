import { useSyncExternalStore } from 'react';

export type Route = 'home' | 'play' | 'about';

const parse = (hash: string): Route => {
  const path = hash.replace(/^#\/?/, '');
  return path === 'play' || path === 'about' ? path : 'home';
};

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

/** Tiny hash router: #/ , #/play , #/about. No dependency, works on any static host. */
export function useRoute(): Route {
  return parse(useSyncExternalStore(subscribe, () => window.location.hash, () => ''));
}
