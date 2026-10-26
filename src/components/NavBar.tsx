import { useEffect, useState } from 'react';
import type { Route } from '../hooks/useRoute';
import styles from '../styles/Pages.module.css';
import logo from '../assets/hexadoku-logo.png';
const LINKS = [{ route: 'home', href: '#/', label: 'Home' }, { route: 'play', href: '#/play', label: 'Play' }, { route: 'about', href: '#/about', label: 'About' }];
export function NavBar({ current }: { current: Route }) {
  const [preference, setPreference] = useState<string | null>(() => {
    try { const p = localStorage.getItem('hexadoku:theme'); return p === 'light' || p === 'dark' ? p : null; } catch { return null; }
  });
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = preference ?? (systemDark ? 'dark' : 'light');
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    query.addEventListener('change', update); return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'; setPreference(next);
    try { localStorage.setItem('hexadoku:theme', next); } catch { /* Theme still works without storage. */ }
  };
  return <header className={styles.nav}>
    <a href="#/" className={styles.brand} aria-label="Hexadoku home"><img src={logo} alt="Hexadoku" width="1033" height="241" /></a>
    <nav aria-label="Main">{LINKS.map(l => <a key={l.route} href={l.href} className={styles.navLink} aria-current={current === l.route ? 'page' : undefined}>{l.label}</a>)}
      <button onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
    </nav>
  </header>;
}
