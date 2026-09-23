import SimulationCanvas from '@/components/simulation';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      {/* Cabeçalho */}
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          🌱 Plantae Evolution
        </h1>
        <p className="mt-2 text-text-muted">
          Simulação de autômato celular — ecossistema vegetal interativo
        </p>
      </header>

      {/* Canvas da Simulação */}
      <main>
        <SimulationCanvas />
      </main>
    </div>
  );
}
