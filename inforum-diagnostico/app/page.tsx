import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl">
      <div className="card p-8">
        <h1 className="text-3xl font-semibold mb-2">Inforum • Diagnóstico</h1>
        <p className="text-slate-600 mb-6">
          Realiza una radiografía rápida de tu software de gestión y descubre si estás listo para el siguiente nivel.
        </p>
        <Link href="/diagnostico" className="btn-primary">
          Abrir diagnóstico
        </Link>
      </div>
    </main>
  );
}
