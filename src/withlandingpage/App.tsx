import { NavBar } from './components/NavBar';
import { useRoute } from './hooks/useRoute';
import Landing from './pages/Landing';
import About from './pages/About';
import Play from './pages/Play';
import styles from './styles/App.module.css';
import pageStyles from './styles/Pages.module.css';

export default function App() {
  const route = useRoute();
  return (
    <div className={styles.app}>
      <NavBar current={route} />
      <main className={route === 'play' ? undefined : pageStyles.page}>
        {route === 'home' && <Landing />}
        {route === 'about' && <About />}
        {route === 'play' && <Play />}
      </main>
      <footer className={pageStyles.footer}>Built with React, Vite and TypeScript.</footer>
    </div>
  );
}
