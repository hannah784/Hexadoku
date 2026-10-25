import type { Route } from '../hooks/useRoute';
import styles from '../styles/Pages.module.css';

const LINKS: ReadonlyArray<{ route: Route; href: string; label: string }> = [
  { route: 'home', href: '#/', label: 'Home' },
  { route: 'play', href: '#/play', label: 'Play' },
  { route: 'about', href: '#/about', label: 'About' },
];

export function NavBar({ current }: { current: Route }) {
  return (
    <header className={styles.nav}>
      <a href="#/" className={styles.brand}>Hexadoku</a>
      <nav aria-label="Main">
        {LINKS.map((l) => (
          <a
            key={l.route}
            href={l.href}
            className={styles.navLink}
            aria-current={current === l.route ? 'page' : undefined}
          >
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
