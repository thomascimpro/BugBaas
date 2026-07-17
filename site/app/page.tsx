export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <div>
          <strong>BugBaas Web</strong>
          <span>The complete game for PC, iPhone and iPad</span>
        </div>
        <a href="/game/index.html" target="_blank" rel="noreferrer">
          Open fullscreen
        </a>
      </header>
      <iframe
        allow="clipboard-read; clipboard-write"
        className="game-frame"
        src="/game/index.html"
        title="BugBaas game"
      />
    </main>
  );
}
