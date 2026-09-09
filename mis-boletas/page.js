'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase, correlativo, fechaCorta } from '../../lib/supabaseClient';

export default function MisBoletas() {
  const [dni, setDni] = useState('');
  const [lista, setLista] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function buscar() {
    setError('');
    if (!/^\d{8}$/.test(dni.trim())) return setError('El DNI debe tener 8 dígitos.');
    setCargando(true);
    const { data, error: e } = await supabase
      .from('boletas')
      .select('*')
      .eq('dni', dni.trim())
      .order('numero', { ascending: false });
    setCargando(false);
    if (e) return setError('No se pudo consultar: ' + e.message);
    setLista(data || []);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <header className="border-b-2 border-tinta pb-5">
        <Link href="/" className="text-[15px] font-semibold text-trama">← Inicio</Link>
        <h1 className="mt-2 text-[30px] font-bold text-tinta">Mis boletas</h1>
        <p className="mt-2 text-slate-600">Escribe tu DNI para ver el estado de tu ropa.</p>
      </header>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="etiqueta" htmlFor="dni">DNI</label>
          <input id="dni" inputMode="numeric" maxLength={8} className="campo w-44 font-mono"
                 value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                 onKeyDown={(e) => e.key === 'Enter' && buscar()} />
        </div>
        <button onClick={buscar} disabled={cargando} className="boton">
          {cargando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {error && <p role="alert" className="mt-4 border-l-4 border-sello bg-white p-3 text-sello">{error}</p>}

      {lista && lista.length === 0 && (
        <div className="mt-8 marco p-6">
          <p className="font-semibold text-tinta">Todavía no hay boletas con ese DNI.</p>
          <Link href="/boleta" className="mt-3 inline-block font-semibold text-trama underline">
            Registrar mi primera boleta
          </Link>
        </div>
      )}

      {lista && lista.length > 0 && (
        <ul className="mt-8 space-y-3 pb-10">
          {lista.map((b) => (
            <li key={b.id} className="marco p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-lg font-semibold text-sello">Nº {correlativo(b.numero)}</p>
                <span className={`px-3 py-1 text-[13px] font-semibold ${
                  b.estado === 'validada' ? 'bg-tinta text-white' : 'border border-tinta text-tinta'
                }`}>
                  {b.estado === 'validada' ? 'Recogida por lavandería' : 'Esperando recojo'}
                </span>
              </div>
              <p className="mt-2 text-[15px] text-slate-700">
                {fechaCorta(b.fecha)} · {b.hospedaje}
                {b.habitacion ? ` — Hab. ${b.habitacion}` : ''} · {b.total_prendas} prendas
                {b.total_kilos ? ` · ${b.total_kilos} kg` : ''}
              </p>
              {b.obs_lavanderia && (
                <p className="mt-1 text-[15px] text-slate-600">
                  Nota de lavandería: {b.obs_lavanderia}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
