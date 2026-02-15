export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg dark:bg-bg-dark px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-text-primary dark:text-text-primary-dark sm:text-6xl">
          Cluegrid
        </h1>
        <p className="mt-4 text-lg text-text-secondary dark:text-text-secondary-dark">
          A daily word puzzle. Coming soon.
        </p>
        <div className="mt-8 flex justify-center gap-1">
          {["C", "L", "U", "E", "S"].map((letter, i) => (
            <div
              key={i}
              className="flex h-14 w-14 items-center justify-center rounded border-2 border-text-secondary/20 text-grid-letter text-text-primary dark:border-text-secondary-dark/20 dark:text-text-primary-dark"
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
