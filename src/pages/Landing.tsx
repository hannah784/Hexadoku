import styles from '../styles/Pages.module.css';

// One 4×4 box: every symbol 0–F appears exactly once. Blanks are the "puzzle".
const SAMPLE = ['0', '', '2', '3', '', '5', '', '7', '8', '9', '', 'B', 'C', '', 'E', ''];

const FEATURES = [
  { title: 'Instant solver', body: 'Stuck? The solver runs in a background thread, so the board never freezes while it thinks.' },
  { title: 'Saved as you go', body: 'Every move is stored in your browser. Close the tab and pick up where you left off.' },
  { title: 'See the maths', body: 'Each solve shows how many options the solver explored, next to the theory of why Sudoku is hard.' },
];

export default function Landing() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Sudoku with sixteen symbols.</h1>
          <p className={styles.lead}>
            Fill a 16×16 grid with 0–9 and A–F so that every row, column and 4×4 box holds each symbol once.
          </p>
          <div className={styles.actions}>
            <a href="#/play" className={`${styles.btn} ${styles.btnPrimary}`}>Play now</a>
            <a href="#/about" className={styles.btn}>How it works</a>
          </div>
        </div>

        <figure className={styles.sample}>
          <div className={styles.miniBoard} role="img" aria-label="A 4 by 4 box with some of the symbols 0 to F filled in">
            {SAMPLE.map((ch, i) => (
              <span key={i} className={ch ? styles.miniFixed : styles.miniEmpty}>{ch}</span>
            ))}
          </div>
          <figcaption>One of 16 boxes. It needs all of 0–F.</figcaption>
        </figure>
      </section>

      <section className={styles.features} aria-label="Features">
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.feature}>
            <h2>{f.title}</h2>
            <p>{f.body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
