export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="site-brand">
          <strong>BugBaas Web</strong>
          <span>Speel op pc, iPhone en iPad</span>
        </div>
        <a aria-label="Open BugBaas in volledig scherm" href="/game/index.html" target="_blank" rel="noreferrer">
          <span className="full-label">Open fullscreen</span>
          <span className="compact-label">Fullscreen</span>
        </a>
      </header>
      <iframe
        allow="clipboard-read; clipboard-write; fullscreen"
        allowFullScreen
        className="game-frame"
        loading="eager"
        src="/game/index.html"
        title="BugBaas game"
      />
    </main>
  );
}
