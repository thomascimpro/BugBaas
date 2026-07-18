export default function Home() {
  return (
    <main className="site-shell">
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
