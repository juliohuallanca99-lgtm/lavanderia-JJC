import Link from 'next/link';

export default function Portal() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <header className="border-b-2 border-tinta pb-6">
        <p className="font-mono text-sm text-sello">CC0154 · Marcobre — Mina Justa</p>
        <h1 className="mt-2 text-[34px] leading-tight font-bold text-tinta">
          Boletas de lavandería
        </h1>
        <p className="mt-3 max-w-[62ch] text-slate-600">
          El mismo talonario de siempre, ahora en el celular. Cada boleta recibe su número
          apenas se registra, y queda cerrada cuando lavandería la recoge del hotel.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Link href="/boleta" className="marco block p-6 hover:bg-papel transition-colors">
          <h2 className="text-xl font-bold text-tinta">Enviar mi ropa</h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Llena tu boleta con tu DNI y las prendas que entregas. Al guardarla te damos
            el número para imprimir o mostrar en recepción.
          </p>
          <span className="mt-4 inline-block font-semibold text-trama">Llenar boleta</span>
        </Link>

        <Link href="/lavanderia" className="marco block p-6 hover:bg-papel transition-colors">
          <h2 className="text-xl font-bold text-tinta">Personal de lavandería</h2>
          <p className="mt-2 text-[15px] text-slate-600">
            Ingresa con tu usuario para revisar las boletas pendientes por hotel, contar
            las prendas, anotar los kilos y dar el visto bueno.
          </p>
          <span className="mt-4 inline-block font-semibold text-trama">Iniciar sesión</span>
        </Link>
      </div>

      <p className="mt-8 text-[15px] text-slate-600">
        ¿Ya enviaste tu ropa y quieres saber si fue recogida?{' '}
        <Link href="/mis-boletas" className="font-semibold text-trama underline">
          Consulta con tu DNI
        </Link>
        .
      </p>
    </main>
  );
}
